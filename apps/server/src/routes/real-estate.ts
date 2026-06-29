// Real estate URL scanner — extracts property addresses from Zillow, Redfin,
// Trulia, and Realtor.com listings, then runs them through the risk engine.
import { Router } from "express";
import { parse as parseHtml } from "node-html-parser";
import { computeRealScore, parseGeoid } from "../lib/scoreEngine.js";

const router = Router();

// ---------------------------------------------------------------------------
// 24-hour in-memory cache keyed by listing URL
// ---------------------------------------------------------------------------

interface CachedListing {
  value: RealEstateResult;
  expiresAt: number;
}

const listingCache = new Map<string, CachedListing>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheGet(url: string): RealEstateResult | null {
  const entry = listingCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { listingCache.delete(url); return null; }
  return entry.value;
}

function cacheSet(url: string, value: RealEstateResult): void {
  listingCache.set(url, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeocodedResult {
  geocodedAddress: string;
  lat: number;
  lng: number;
  censusTract: string;
  stateFips: string;
  countyFips: string;
  tractCode: string;
}

export interface RealEstateResult {
  url: string;
  extracted_address: string;
  geocoded_address: string;
  score: number;
  risk_level: "Low" | "Moderate" | "High" | "Very High";
  factors: Array<{
    name: string;
    score: number;
    max: number;
    detail: string;
    severity: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
  }>;
  lat: number;
  lng: number;
  census_tract: string;
  tract_fips: string;
  data_sources: string[];
  used_fallback?: boolean;
  pct_pre1986?: number | null;
  median_income?: number | null;
  epa_violations_10yr?: number;
  data_note?: string;
  country: "us" | "ca";
}

// ---------------------------------------------------------------------------
// Supported domains
// ---------------------------------------------------------------------------

type SupportedPlatform = "zillow" | "redfin" | "trulia" | "realtor";

function detectPlatform(url: string): SupportedPlatform | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname === "zillow.com" || hostname.endsWith(".zillow.com")) return "zillow";
    if (hostname === "redfin.com" || hostname.endsWith(".redfin.com")) return "redfin";
    if (hostname === "trulia.com" || hostname.endsWith(".trulia.com")) return "trulia";
    if (hostname === "realtor.com" || hostname.endsWith(".realtor.com")) return "realtor";
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// URL-slug address extraction (no HTTP request needed)
// ---------------------------------------------------------------------------

/**
 * Zillow encodes the full address in the URL path:
 *   /homedetails/124-Vassar-Ave-Newark-NJ-07112/38709443_zpid/
 * We extract the slug segment and convert hyphens to spaces, then
 * strip the trailing zpid segment.
 */
function extractAddressFromZillowUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    // Match /homedetails/<slug>/<zpid>_zpid/ pattern
    const match = pathname.match(/\/homedetails\/([^/]+)\/\d+_zpid/);
    if (!match) return null;
    const slug = match[1];
    // slug looks like: 124-Vassar-Ave-Newark-NJ-07112
    // Split on hyphens, detecting the state abbreviation (2 uppercase letters) and zip
    const parts = slug.split("-");
    // Find the index of the 5-digit zip (last numeric segment)
    const zipIdx = parts.reduceRight((found, p, i) => {
      if (found === -1 && /^\d{5}$/.test(p)) return i;
      return found;
    }, -1);
    // Rebuild as "Street, City, ST Zip" grouping
    // Everything before the state abbreviation segment is street + city
    // State is 2 uppercase letters just before the zip
    if (zipIdx >= 2) {
      const stateIdx = zipIdx - 1;
      const zip = parts[zipIdx];
      const state = parts[stateIdx].toUpperCase();
      // City is the segment(s) just before state — but we don't know exactly where
      // street ends and city begins. Join everything before state and zip as
      // a simple space-joined string; the geocoder handles it fine.
      const streetAndCity = parts.slice(0, stateIdx).join(" ");
      return `${streetAndCity}, ${state} ${zip}`;
    }
    // Fallback: just humanize the whole slug
    return parts.join(" ");
  } catch {
    return null;
  }
}

/**
 * Realtor.com encodes the address in the URL:
 *   /realestateandhomes-detail/124-Vassar-Ave_Newark_NJ_07112_M12345-67890
 */
function extractAddressFromRealtorUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\/realestateandhomes-detail\/([^/]+)/);
    if (!match) return null;
    // Remove trailing _M<id> part
    const slug = match[1].replace(/_M[\d-]+$/, "");
    // Slug format: 124-Vassar-Ave_Newark_NJ_07112
    return slug.replace(/-/g, " ").replace(/_/g, ", ");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML fetcher with browser-like headers
// ---------------------------------------------------------------------------

async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ---------------------------------------------------------------------------
// Per-platform address extractors
// ---------------------------------------------------------------------------

function parseJsonLd(html: ReturnType<typeof parseHtml>): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const scripts = html.querySelectorAll("script[type='application/ld+json']");
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s.text);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch { /* skip malformed */ }
  }
  return results;
}

function findAddressInJsonLd(ld: Record<string, unknown>[]): string | null {
  const targetTypes = ["SingleFamilyResidence", "Apartment", "House", "RealEstateListing", "Place"];
  for (const item of ld) {
    const type = item["@type"];
    if (!type) continue;
    const typeStr = Array.isArray(type) ? type.join(",") : String(type);
    if (targetTypes.some(t => typeStr.includes(t))) {
      // Try top-level address fields
      const addr = item["streetAddress"] ?? item["address"];
      if (typeof addr === "string" && addr.trim()) return addr.trim();
      if (addr && typeof addr === "object") {
        const a = addr as Record<string, unknown>;
        const parts = [
          a["streetAddress"],
          a["addressLocality"],
          a["addressRegion"],
          a["postalCode"],
        ].filter(Boolean);
        if (parts.length >= 2) return parts.join(", ");
      }
    }
    // Recurse into nested objects (e.g., graph items)
    for (const v of Object.values(item)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = findAddressInJsonLd([v as Record<string, unknown>]);
        if (nested) return nested;
      }
    }
  }
  return null;
}

/** Clean a raw address string extracted from meta tags. */
function cleanAddress(raw: string): string {
  // Remove trailing pipe-delimited suffixes like "| Zillow" or "| Realtor.com"
  return raw.split("|")[0].split(" - ")[0].trim();
}

/** Try to extract an address-like string from an og:title or description. */
function extractAddressFromTitle(title: string): string | null {
  // Real estate titles typically start with the address before a comma/dash/pipe
  // e.g. "123 Main St, Chicago, IL 60601 | Redfin"
  const cleaned = cleanAddress(title);
  // Heuristic: must contain a number at the start (street number)
  if (/^\d+\s+\S+/.test(cleaned)) return cleaned;
  return null;
}

function extractAddress(platform: SupportedPlatform, html: ReturnType<typeof parseHtml>): string | null {
  const ld = parseJsonLd(html);

  if (platform === "zillow") {
    // Priority 1: JSON-LD
    const fromLd = findAddressInJsonLd(ld);
    if (fromLd) return fromLd;
    // Priority 2: og:description (Zillow puts the address there)
    const ogDesc = html.querySelector("meta[property='og:description']")?.getAttribute("content");
    if (ogDesc) {
      const addr = extractAddressFromTitle(ogDesc);
      if (addr) return addr;
    }
    // Priority 3: meta description
    const desc = html.querySelector("meta[name='description']")?.getAttribute("content");
    if (desc) {
      const addr = extractAddressFromTitle(desc);
      if (addr) return addr;
    }
    // Priority 4: og:title
    const ogTitle = html.querySelector("meta[property='og:title']")?.getAttribute("content");
    if (ogTitle) return extractAddressFromTitle(ogTitle);
    return null;
  }

  if (platform === "redfin") {
    // Priority 1: og:title which is formatted as "Address - City, ST | Redfin"
    const ogTitle = html.querySelector("meta[property='og:title']")?.getAttribute("content");
    if (ogTitle) {
      const addr = extractAddressFromTitle(ogTitle);
      if (addr) return addr;
    }
    // Priority 2: JSON-LD
    return findAddressInJsonLd(ld);
  }

  if (platform === "trulia") {
    // Priority 1: JSON-LD SingleFamilyResidence
    const fromLd = findAddressInJsonLd(ld);
    if (fromLd) return fromLd;
    // Priority 2: og:title
    const ogTitle = html.querySelector("meta[property='og:title']")?.getAttribute("content");
    if (ogTitle) return extractAddressFromTitle(ogTitle);
    return null;
  }

  if (platform === "realtor") {
    // Priority 1: JSON-LD SingleFamilyResidence / Apartment
    const fromLd = findAddressInJsonLd(ld);
    if (fromLd) return fromLd;
    // Priority 2: og:title
    const ogTitle = html.querySelector("meta[property='og:title']")?.getAttribute("content");
    if (ogTitle) return extractAddressFromTitle(ogTitle);
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Geocoding (mirrors the logic in risk.ts)
// ---------------------------------------------------------------------------

async function geocodeAddress(address: string): Promise<GeocodedResult | null> {
  // Stage 1 — Nominatim
  try {
    const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
    nomUrl.searchParams.set("q", address);
    nomUrl.searchParams.set("format", "json");
    nomUrl.searchParams.set("limit", "1");
    nomUrl.searchParams.set("countrycodes", "us");

    const nomRes = await fetch(nomUrl.toString(), {
      headers: { "User-Agent": "Plumbum/1.0 (lead-pipe-risk; contact@plumbum.app)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (nomData.length > 0) {
        const lat = parseFloat(nomData[0].lat);
        const lng = parseFloat(nomData[0].lon);

        // Get tract from coordinates
        const tractUrl = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
        tractUrl.searchParams.set("x", lng.toString());
        tractUrl.searchParams.set("y", lat.toString());
        tractUrl.searchParams.set("benchmark", "Public_AR_Current");
        tractUrl.searchParams.set("vintage", "Current_Current");
        tractUrl.searchParams.set("layers", "Census Tracts");
        tractUrl.searchParams.set("format", "json");

        const tractRes = await fetch(tractUrl.toString(), { signal: AbortSignal.timeout(8_000) });
        if (tractRes.ok) {
          const tractData = await tractRes.json() as {
            result: { geographies?: { "Census Tracts"?: Array<{ GEOID: string }> } };
          };
          const geoid = tractData.result?.geographies?.["Census Tracts"]?.[0]?.GEOID;
          if (geoid) {
            const parsed = parseGeoid(geoid);
            // Build display address from nominatim display_name
            const parts = nomData[0].display_name.split(",").map(s => s.trim()).filter(Boolean);
            const withoutCountry = parts.filter(p => !/^(United States|US)$/i.test(p));
            const displayAddr = withoutCountry.slice(0, 3).join(", ");
            return {
              geocodedAddress: displayAddr || address,
              lat, lng,
              censusTract: geoid,
              stateFips: parsed.stateFips,
              countyFips: parsed.countyFips,
              tractCode: parsed.tractCode,
            };
          }
        }
      }
    }
  } catch { /* fall through */ }

  // Stage 2 — Census geocoder
  try {
    const censusUrl = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
    censusUrl.searchParams.set("address", address);
    censusUrl.searchParams.set("benchmark", "Public_AR_Current");
    censusUrl.searchParams.set("vintage", "Current_Current");
    censusUrl.searchParams.set("layers", "Census Tracts");
    censusUrl.searchParams.set("format", "json");

    const censusRes = await fetch(censusUrl.toString(), { signal: AbortSignal.timeout(8_000) });
    if (censusRes.ok) {
      const data = await censusRes.json() as {
        result: {
          addressMatches: Array<{
            matchedAddress: string;
            coordinates: { x: number; y: number };
            geographies?: { "Census Tracts"?: Array<{ GEOID?: string; STATE?: string; COUNTY?: string; TRACT?: string }> };
          }>;
        };
      };

      const match = data.result?.addressMatches?.[0];
      if (match) {
        const tract = match.geographies?.["Census Tracts"]?.[0];
        if (tract?.GEOID) {
          const geoid = tract.GEOID;
          const stateFips = tract.STATE ?? geoid.slice(0, 2);
          const countyFips = tract.COUNTY ?? geoid.slice(2, 5);
          const tractCode = tract.TRACT ?? geoid.slice(5, 11);
          return {
            geocodedAddress: match.matchedAddress,
            lat: match.coordinates.y,
            lng: match.coordinates.x,
            censusTract: geoid,
            stateFips,
            countyFips,
            tractCode,
          };
        }
      }
    }
  } catch { /* failed */ }

  return null;
}

// ---------------------------------------------------------------------------
// POST /api/real-estate
// ---------------------------------------------------------------------------

router.post("/real-estate", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const normalizedUrl = url.trim();

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    res.status(400).json({ error: "Please enter a valid URL starting with http:// or https://" });
    return;
  }

  const platform = detectPlatform(normalizedUrl);
  if (!platform) {
    res.status(400).json({
      error: "Unsupported listing site. Please paste a URL from Zillow, Redfin, Trulia, or Realtor.com.",
    });
    return;
  }

  req.log.info({ url: normalizedUrl, platform }, "Real estate listing scan requested");

  // Check cache
  const cached = cacheGet(normalizedUrl);
  if (cached) {
    req.log.info({ url: normalizedUrl }, "Real estate result served from cache");
    res.json(cached);
    return;
  }

  // ---------------------------------------------------------------------------
  // Stage 1: Try to extract address directly from the URL slug (no HTTP needed)
  // ---------------------------------------------------------------------------
  let urlSlugAddress: string | null = null;
  if (platform === "zillow") {
    urlSlugAddress = extractAddressFromZillowUrl(normalizedUrl);
    if (urlSlugAddress) {
      req.log.info({ urlSlugAddress }, "Address extracted from Zillow URL slug — skipping HTTP fetch");
    }
  } else if (platform === "realtor") {
    urlSlugAddress = extractAddressFromRealtorUrl(normalizedUrl);
    if (urlSlugAddress) {
      req.log.info({ urlSlugAddress }, "Address extracted from Realtor.com URL slug — skipping HTTP fetch");
    }
  }

  // If we got an address from the URL, skip HTML fetching entirely
  if (urlSlugAddress) {
    const geocoded = await geocodeAddress(urlSlugAddress);
    if (!geocoded) {
      res.status(404).json({
        error: `Found address "${urlSlugAddress}" but couldn't locate it in our database. Try searching for it directly using the address bar.`,
      });
      return;
    }
    const scoreResult = await computeRealScore({
      stateFips: geocoded.stateFips,
      countyFips: geocoded.countyFips,
      tractCode: geocoded.tractCode,
      geoid: geocoded.censusTract,
    });
    const result: RealEstateResult = {
      url: normalizedUrl,
      extracted_address: urlSlugAddress,
      geocoded_address: geocoded.geocodedAddress,
      score: scoreResult.score,
      risk_level: scoreResult.risk_level,
      factors: scoreResult.factors,
      lat: geocoded.lat,
      lng: geocoded.lng,
      census_tract: geocoded.censusTract,
      tract_fips: scoreResult.tract_fips,
      data_sources: scoreResult.data_sources,
      used_fallback: scoreResult.used_fallback,
      pct_pre1986: scoreResult.pct_pre1986,
      median_income: scoreResult.median_income,
      epa_violations_10yr: scoreResult.epa_violations_10yr,
      data_note: scoreResult.data_note,
      country: "us",
    };
    cacheSet(normalizedUrl, result);
    req.log.info({ score: result.score, risk_level: result.risk_level }, "Real estate risk assessment complete (URL slug path)");
    res.json(result);
    return;
  }

  // ---------------------------------------------------------------------------
  // Stage 2: Fetch listing HTML (Redfin, Trulia, and Zillow slug-miss fallback)
  // ---------------------------------------------------------------------------
  let html: ReturnType<typeof parseHtml>;
  try {
    const rawHtml = await fetchListingHtml(normalizedUrl);
    html = parseHtml(rawHtml);
  } catch (err) {
    req.log.warn({ err, url: normalizedUrl }, "Failed to fetch listing page");
    res.status(502).json({
      error: "Could not load this listing page. The site may be blocking automated access — try copying the address from the listing and pasting it into the address search bar.",
    });
    return;
  }

  // Extract address
  const extractedAddress = extractAddress(platform, html);
  if (!extractedAddress) {
    req.log.warn({ url: normalizedUrl, platform }, "Could not extract address from listing");
    res.status(422).json({
      error:
        "Could not extract address from this listing. The site may be blocking automated access — try copying the address manually and using the address search.",
    });
    return;
  }

  req.log.info({ extractedAddress, platform }, "Address extracted from listing");

  // Geocode + risk score
  const geocoded = await geocodeAddress(extractedAddress);
  if (!geocoded) {
    res.status(404).json({
      error: `Found address "${extractedAddress}" but couldn't locate it in our database. Try searching for it directly using the address bar.`,
    });
    return;
  }

  const scoreResult = await computeRealScore({
    stateFips: geocoded.stateFips,
    countyFips: geocoded.countyFips,
    tractCode: geocoded.tractCode,
    geoid: geocoded.censusTract,
  });

  const result: RealEstateResult = {
    url: normalizedUrl,
    extracted_address: extractedAddress,
    geocoded_address: geocoded.geocodedAddress,
    score: scoreResult.score,
    risk_level: scoreResult.risk_level,
    factors: scoreResult.factors,
    lat: geocoded.lat,
    lng: geocoded.lng,
    census_tract: geocoded.censusTract,
    tract_fips: scoreResult.tract_fips,
    data_sources: scoreResult.data_sources,
    used_fallback: scoreResult.used_fallback,
    pct_pre1986: scoreResult.pct_pre1986,
    median_income: scoreResult.median_income,
    epa_violations_10yr: scoreResult.epa_violations_10yr,
    data_note: scoreResult.data_note,
    country: "us",
  };

  cacheSet(normalizedUrl, result);

  req.log.info(
    { score: result.score, risk_level: result.risk_level, extractedAddress },
    "Real estate risk assessment complete",
  );

  res.json(result);
});

export default router;
