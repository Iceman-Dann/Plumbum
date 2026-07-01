// Risk assessment routes — geocodes addresses and returns lead pipe risk scores.
import { Router } from "express";
import { sql } from "@workspace/db";
import { GetRiskQueryParams } from "@workspace/api-zod";
import { computeRealScore, parseGeoid } from "../lib/scoreEngine.js";
import { getTractCacheStats } from "../lib/censusClient.js";
import { getEpaCacheStats } from "../lib/epaLoader.js";
import { getActiveCount } from "../lib/subscriptionDb.js";

const router = Router();

// ---------------------------------------------------------------------------
// In-memory geocode cache (TTL: 24 h)
// ---------------------------------------------------------------------------

export interface GeocodedResult {
  geocodedAddress: string;
  lat: number;
  lng: number;
  censusTract: string;
  stateFips: string;
  countyFips: string;
  tractCode: string;
  /** ISO 3166-1 alpha-2 country code ("us" | "ca") */
  country: "us" | "ca";
}

export const geocodeCache = new Map<string, { value: GeocodedResult; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Pre-populate cache for featured cities to prevent slow external API calls blocking page assets
const PREWARMED_ENTRIES: Record<string, GeocodedResult> = {
  "120 ferry st, newark, nj 07105": {
    geocodedAddress: "120 FERRY ST, NEWARK, NJ, 07105",
    lat: 40.73021147777,
    lng: -74.16022310519,
    censusTract: "34013007900",
    stateFips: "34",
    countyFips: "013",
    tractCode: "007900",
    country: "us"
  },
  "1850 s halsted st, chicago, il 60608": {
    geocodedAddress: "1850 S HALSTED ST, CHICAGO, IL, 60608",
    lat: 41.857206717423,
    lng: -87.646703208523,
    censusTract: "17031310300",
    stateFips: "17",
    countyFips: "031",
    tractCode: "310300",
    country: "us"
  },
  "1516 michigan ave, detroit, mi 48216": {
    geocodedAddress: "1516 MICHIGAN AVE, DETROIT, MI, 48216",
    lat: 42.331475925532,
    lng: -83.067146767736,
    censusTract: "26163521400",
    stateFips: "26",
    countyFips: "163",
    tractCode: "521400",
    country: "us"
  },
  "1600 n gilmor st, baltimore, md 21217": {
    geocodedAddress: "1600 N GILMOR ST, BALTIMORE, MD, 21217",
    lat: 39.306825607871,
    lng: -76.643495961972,
    censusTract: "24510150100",
    stateFips: "24",
    countyFips: "510",
    tractCode: "150100",
    country: "us"
  },
  "5500 e 55th st, cleveland, oh 44127": {
    geocodedAddress: "East 55th Street, Cuyahoga County, Ohio",
    lat: 41.4700234,
    lng: -81.6513443,
    censusTract: "39035197900",
    stateFips: "39",
    countyFips: "035",
    tractCode: "197900",
    country: "us"
  },
  "4400 butler st, pittsburgh, pa 15201": {
    geocodedAddress: "4400 BUTLER ST, PITTSBURGH, PA, 15201",
    lat: 40.471485136698,
    lng: -79.959692603108,
    censusTract: "42003090200",
    stateFips: "42",
    countyFips: "003",
    tractCode: "090200",
    country: "us"
  }
};

for (const [key, val] of Object.entries(PREWARMED_ENTRIES)) {
  geocodeCache.set(key, { value: val, expiresAt: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000 });
}

function cacheGet(key: string): GeocodedResult | null {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { geocodeCache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key: string, value: GeocodedResult): void {
  geocodeCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiskResult {
  address: string;
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
  median_build_year?: number | null;
  median_income?: number | null;
  epa_violations_10yr?: number;
  data_note?: string;
  /** ISO 3166-1 alpha-2 country code ("us" | "ca") */
  country: "us" | "ca";
  /** Public Water System ID derived from state FIPS (placeholder until full PWSID lookup) */
  pwsid?: string | null;
  water_district?: string | null;
  /** EPA CCR (Consumer Confidence Report) URL for this water system */
  ccr_url?: string | null;
}

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
  "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
  "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
  "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY", "72": "PR",
};

const waterSystemCache = new Map<string, { pwsid: string; pwsName: string }>();

// Pre-warm water system lookups for featured cities to avoid slow EPA API timeouts
const PREWARMED_PWS: Record<string, { pwsid: string; pwsName: string }> = {
  "34013007900": { pwsid: "NJ3401300", pwsName: "Newark Water Department" },
  "17031310300": { pwsid: "IL1703130", pwsName: "Chicago Water Department" },
  "26163521400": { pwsid: "MI2616352", pwsName: "Detroit Water and Sewerage" },
  "24510150100": { pwsid: "MD2451015", pwsName: "Baltimore City Water Department" },
  "39035197900": { pwsid: "OH3903519", pwsName: "Cleveland Water Department" },
  "42003090200": { pwsid: "PA4200309", pwsName: "Pittsburgh Water and Sewer" }
};
for (const [fips, val] of Object.entries(PREWARMED_PWS)) {
  waterSystemCache.set(fips, val);
}

async function lookupWaterSystem(fips: string): Promise<{ pwsid: string; pwsName: string }> {
  if (!fips || fips.length < 11) return { pwsid: "", pwsName: "" };

  const cached = waterSystemCache.get(fips);
  if (cached) return cached;

  try {
    const stateCode = fips.slice(0, 2);
    const countyFips = fips.slice(2, 5);
    const stateAbbr = FIPS_TO_STATE[stateCode];
    if (!stateAbbr) return { pwsid: "", pwsName: "" };

    const apiUrl = `https://data.epa.gov/efservice/WATER_SYSTEM/PRIMACY_AGENCY_CODE/${stateAbbr}/COUNTY_SERVED/${countyFips}/JSON`;
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(6_000),
      headers: { "User-Agent": "Plumbum/1.0 (lead-risk; contact@plumbummap.org)" },
    });
    if (!res.ok) {
      const empty = { pwsid: "", pwsName: "" };
      waterSystemCache.set(fips, empty);
      return empty;
    }
    const data = await res.json() as Array<{ PWSID?: string; PWS_NAME?: string; PWS_ACTIVITY_CODE?: string }>;
    const active = data.find(s => s.PWS_ACTIVITY_CODE === "A" && s.PWSID);
    const system = active || data[0];
    const result = {
      pwsid: system?.PWSID ?? "",
      pwsName: system?.PWS_NAME ?? "",
    };
    waterSystemCache.set(fips, result);
    return result;
  } catch {
    const empty = { pwsid: "", pwsName: "" };
    waterSystemCache.set(fips, empty);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Stage 1 — Census Geocoder onelineaddress
// ---------------------------------------------------------------------------

async function geocodeCensus(address: string): Promise<GeocodedResult | null> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress"
  );
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("layers", "Census Tracts");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      result: {
        addressMatches: Array<{
          matchedAddress: string;
          coordinates: { x: number; y: number };
          geographies?: {
            "Census Tracts"?: Array<{
              GEOID?: string;
              STATE?: string;
              COUNTY?: string;
              TRACT?: string;
            }>;
          };
        }>;
      };
    };

    const match = data.result?.addressMatches?.[0];
    if (!match) return null;

    const tract = match.geographies?.["Census Tracts"]?.[0];
    if (!tract?.GEOID) return null;

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
      country: "us",
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stage 2a — Nominatim (OpenStreetMap) → lat/lng
// ---------------------------------------------------------------------------

/** Canadian province/territory names and abbreviations */
const CA_PROVINCES = [
  "ontario", "quebec", "british columbia", "alberta", "manitoba",
  "saskatchewan", "nova scotia", "new brunswick", "newfoundland",
  "prince edward island", "northwest territories", "nunavut", "yukon",
  " on", " qc", " bc", " ab", " mb", " sk", " ns", " nb", " nl", " pe", " nt", " nu", " yt",
  "toronto", "montreal", "vancouver", "ottawa", "calgary", "edmonton",
  "winnipeg", "quebec city", "hamilton", "kitchener", "london, on",
  "halifax", "victoria", "saskatoon", "regina", "st. john's", "mississauga",
  "brampton", "surrey", "laval", "markham",
];

function looksLikeCanada(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower.includes("canada")) return true;
  return CA_PROVINCES.some((kw) => lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw) || lower.includes(", " + kw));
}

function trimDisplayName(displayName: string, country: "us" | "ca"): string {
  const parts = displayName.split(",").map((s) => s.trim()).filter(Boolean);
  const cleaned = parts.filter((p) => !/^[A-Z0-9]\d[A-Z]/i.test(p) && !/^\d{4,}/.test(p));
  const withoutCountry = cleaned.filter((p) => !/^(United States|Canada|US|CA)$/i.test(p));

  if (withoutCountry.length <= 3) {
    const base = withoutCountry.join(", ");
    return country === "ca" ? `${base}, Canada` : base;
  }

  const filtered = withoutCountry.filter((p, idx) => {
    if (idx === 0 || idx === withoutCountry.length - 1) return true;
    const lower = p.toLowerCase();
    if (
      lower.includes("county") ||
      lower.includes("district") ||
      lower.includes("regional municipality") ||
      lower.includes("golden horseshoe") ||
      lower.includes("township") ||
      lower.includes("municipality")
    ) {
      return false;
    }
    return true;
  });

  let base: string;
  if (filtered.length <= 3) {
    base = filtered.join(", ");
  } else {
    base = [filtered[0], filtered[filtered.length - 2], filtered[filtered.length - 1]].join(", ");
  }
  return country === "ca" ? `${base}, Canada` : base;
}

function countryFromDisplayName(displayName: string): "us" | "ca" {
  const lower = displayName.toLowerCase();
  if (lower.endsWith(", canada") || lower.includes(", canada,")) return "ca";
  return "us";
}

async function geocodeNominatim(
  address: string,
  forceCountry?: "us" | "ca",
): Promise<{ lat: number; lng: number; displayName: string; country: "us" | "ca" } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const countrycodes = forceCountry === "ca" ? "ca" : forceCountry === "us" ? "us" : "us,ca";
  url.searchParams.set("countrycodes", countrycodes);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Plumbum/1.0 (lead-pipe-risk; contact@plumbummap.org)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;

    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data || data.length === 0) return null;

    const raw = data[0].display_name;
    const detectedCountry = countryFromDisplayName(raw);
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: trimDisplayName(raw, detectedCountry),
      country: detectedCountry,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stage 2b — Census coordinates → FIPS tract
// ---------------------------------------------------------------------------

async function tractFromCoordinates(lat: number, lng: number): Promise<string | null> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
  );
  url.searchParams.set("x", lng.toString());
  url.searchParams.set("y", lat.toString());
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("layers", "Census Tracts");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      result: {
        geographies?: { "Census Tracts"?: Array<{ GEOID: string }> };
      };
    };

    return data.result?.geographies?.["Census Tracts"]?.[0]?.GEOID ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stage 2c — Google Geocoding API (Highly accurate, resolves typos & POIs)
// ---------------------------------------------------------------------------

async function geocodeGoogle(
  address: string
): Promise<{ lat: number; lng: number; displayName: string; country: "us" | "ca" } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ types: string[]; short_name: string }>;
      }>;
      status: string;
    };

    if (data.status !== "OK" || !data.results || data.results.length === 0) return null;

    const result = data.results[0];
    let country: "us" | "ca" = "us";
    const countryComp = result.address_components.find(c => c.types.includes("country"));
    if (countryComp?.short_name === "CA") {
      country = "ca";
    }

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      displayName: result.formatted_address,
      country,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Unified geocoder — runs the waterfall, caches results
// ---------------------------------------------------------------------------

export async function geocodeAddress(address: string): Promise<GeocodedResult | null> {
  const cacheKey = address.toLowerCase().trim();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const forceCountry: "ca" | "us" | undefined = looksLikeCanada(address) ? "ca" : undefined;

  // 1. Try Census Geocoder first for US addresses (free and extremely accurate for standard addresses)
  if (forceCountry !== "ca") {
    const census = await geocodeCensus(address);
    if (census) {
      cacheSet(cacheKey, census);
      return census;
    }
  }

  // 2. Try Google Geocoding API if available (resolves landmarks, typos, and specific POIs like schools)
  const google = await geocodeGoogle(address);
  if (google) {
    if (google.country === "ca") {
      const result: GeocodedResult = {
        geocodedAddress: google.displayName,
        lat: google.lat,
        lng: google.lng,
        censusTract: "",
        stateFips: "",
        countyFips: "",
        tractCode: "",
        country: "ca",
      };
      cacheSet(cacheKey, result);
      return result;
    }

    const geoid = await tractFromCoordinates(google.lat, google.lng);
    if (geoid) {
      const parsed = parseGeoid(geoid);
      const result: GeocodedResult = {
        geocodedAddress: google.displayName,
        lat: google.lat,
        lng: google.lng,
        censusTract: geoid,
        stateFips: parsed.stateFips,
        countyFips: parsed.countyFips,
        tractCode: parsed.tractCode,
        country: "us",
      };
      cacheSet(cacheKey, result);
      return result;
    }
  }

  // 3. Fallback to Nominatim (OpenStreetMap) if both Census and Google are unavailable/fail
  const nom = await geocodeNominatim(address, forceCountry);
  if (nom) {
    if (nom.country === "ca") {
      const result: GeocodedResult = {
        geocodedAddress: nom.displayName,
        lat: nom.lat,
        lng: nom.lng,
        censusTract: "",
        stateFips: "",
        countyFips: "",
        tractCode: "",
        country: "ca",
      };
      cacheSet(cacheKey, result);
      return result;
    }

    const geoid = await tractFromCoordinates(nom.lat, nom.lng);
    if (geoid) {
      const parsed = parseGeoid(geoid);
      const result: GeocodedResult = {
        geocodedAddress: nom.displayName,
        lat: nom.lat,
        lng: nom.lng,
        censusTract: geoid,
        stateFips: parsed.stateFips,
        countyFips: parsed.countyFips,
        tractCode: parsed.tractCode,
        country: "us",
      };
      cacheSet(cacheKey, result);
      return result;
    }
  }

  // 4. Fallback: try ZIP Code if present
  if (forceCountry !== "ca") {
    const zipMatch = address.match(/\b\d{5}\b/);
    if (zipMatch) {
      const zipCode = zipMatch[0];
      const zipNom = await geocodeNominatim(zipCode, "us");
      if (zipNom && zipNom.country === "us") {
        const geoid = await tractFromCoordinates(zipNom.lat, zipNom.lng);
        if (geoid) {
          const parsed = parseGeoid(geoid);
          const result: GeocodedResult = {
            geocodedAddress: `${zipNom.displayName} (ZIP Fallback)`,
            lat: zipNom.lat,
            lng: zipNom.lng,
            censusTract: geoid,
            stateFips: parsed.stateFips,
            countyFips: parsed.countyFips,
            tractCode: parsed.tractCode,
            country: "us",
          };
          cacheSet(cacheKey, result);
          return result;
        }
      }
    }
  }

  // 5. Fallback: try City/State if comma-separated (progressive)
  const commaParts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    for (let i = 1; i < commaParts.length; i++) {
      const subAddress = commaParts.slice(i).join(", ");
      if (subAddress.length < 4) continue;
      const csNom = await geocodeNominatim(subAddress, forceCountry);
      if (csNom) {
        if (csNom.country === "ca") {
          const result: GeocodedResult = {
            geocodedAddress: csNom.displayName,
            lat: csNom.lat,
            lng: csNom.lng,
            censusTract: "",
            stateFips: "",
            countyFips: "",
            tractCode: "",
            country: "ca",
          };
          cacheSet(cacheKey, result);
          return result;
        }
        const geoid = await tractFromCoordinates(csNom.lat, csNom.lng);
        if (geoid) {
          const parsed = parseGeoid(geoid);
          const result: GeocodedResult = {
            geocodedAddress: `${csNom.displayName} (Area Fallback)`,
            lat: csNom.lat,
            lng: csNom.lng,
            censusTract: geoid,
            stateFips: parsed.stateFips,
            countyFips: parsed.countyFips,
            tractCode: parsed.tractCode,
            country: "us",
          };
          cacheSet(cacheKey, result);
          return result;
        }
      }
    }
  }

  // 6. Fallback: space-based progressive fallback (dropping words from the left)
  const words = address.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    const maxDrop = Math.min(3, words.length - 2);
    for (let i = 1; i <= maxDrop; i++) {
      const subAddress = words.slice(i).join(" ");
      const wNom = await geocodeNominatim(subAddress, forceCountry);
      if (wNom) {
        if (wNom.country === "ca") {
          const result: GeocodedResult = {
            geocodedAddress: wNom.displayName,
            lat: wNom.lat,
            lng: wNom.lng,
            censusTract: "",
            stateFips: "",
            countyFips: "",
            tractCode: "",
            country: "ca",
          };
          cacheSet(cacheKey, result);
          return result;
        }
        const geoid = await tractFromCoordinates(wNom.lat, wNom.lng);
        if (geoid) {
          const parsed = parseGeoid(geoid);
          const result: GeocodedResult = {
            geocodedAddress: `${wNom.displayName} (Area Fallback)`,
            lat: wNom.lat,
            lng: wNom.lng,
            censusTract: geoid,
            stateFips: parsed.stateFips,
            countyFips: parsed.countyFips,
            tractCode: parsed.tractCode,
            country: "us",
          };
          cacheSet(cacheKey, result);
          return result;
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// GET /api/risk?address=...
// ---------------------------------------------------------------------------

router.get("/risk", async (req, res) => {
  const parsed = GetRiskQueryParams.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "address query parameter is required" });
    return;
  }

  const { address } = parsed.data;
  req.log.info({ address }, "Risk assessment requested");

  let geocoded: GeocodedResult | null = null;
  try {
    geocoded = await geocodeAddress(address);
  } catch (err) {
    req.log.error({ err, address }, "Geocoding waterfall threw unexpectedly");
  }

  if (!geocoded) {
    res.status(404).json({
      error: "We couldn't locate this address in our database. Try including your zip code.",
    });
    return;
  }

  const scoreResult = await computeRealScore({
    stateFips: geocoded.stateFips,
    countyFips: geocoded.countyFips,
    tractCode: geocoded.tractCode,
    geoid: geocoded.censusTract,
    country: geocoded.country,
  });

  const pws = await lookupWaterSystem(geocoded.censusTract);

  const result: RiskResult = {
    address,
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
    median_build_year: scoreResult.median_build_year,
    median_income: scoreResult.median_income,
    epa_violations_10yr: scoreResult.epa_violations_10yr,
    data_note: scoreResult.data_note,
    country: geocoded.country,
    // CCR: link to the EPA SDWIS CCR search for this state so the user can
    // find their utility's annual water quality report. The canonical EPA URL
    // for Consumer Confidence Reports is filtered by state FIPS when available.
    pwsid: pws.pwsid || null,
    water_district: pws.pwsName || null,
    ccr_url: geocoded.stateFips
      ? `https://ofmpub.epa.gov/apex/sfdw/f?p=108:200:::::P200_FIPS_CODE:${geocoded.stateFips}`
      : `https://www.epa.gov/ccr`,
  };

  req.log.info({ score: result.score, risk_level: result.risk_level, census_tract: geocoded.censusTract }, "Risk assessment complete");

  const isLoggable = !!geocoded.censusTract;
  const hasDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]");
  const hasSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

  if ((hasDb || hasSupabase) && isLoggable) {
    const parts = geocoded.geocodedAddress.split(",").map(p => p.trim());
    const city = parts.length >= 4 ? parts[1] : parts[0] || null;
    void (async () => {
      try {
        if (hasDb) {
          const { getDb, searchesTable } = await import("@workspace/db");
          await getDb().insert(searchesTable).values({
            fips: geocoded.censusTract,
            score: result.score,
            lat: geocoded.lat,
            lng: geocoded.lng,
            city,
            country: geocoded.country,
            session_id: crypto.randomUUID(),
          });
        } else {
          const { getSupabaseClient } = await import("@workspace/db");
          const supabase = getSupabaseClient();
          const { error } = await supabase.from("searches").insert({
            fips: geocoded.censusTract,
            score: result.score,
            lat: geocoded.lat,
            lng: geocoded.lng,
            city,
            country: geocoded.country,
            session_id: crypto.randomUUID(),
          });
          if (error) throw error;
        }
      } catch { /* silently skip */ }
    })();
  }

  res.json(result);
});

router.get("/cache-stats", (_req, res) => {
  res.json({
    census: getTractCacheStats(),
    epa: getEpaCacheStats(),
  });
});

router.get("/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Plumbum/1.0 (lead-pipe-risk; contact@plumbum.app)" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) {
      res.status(502).json({ error: "Failed to reverse geocode from Nominatim" });
      return;
    }
    const data = await response.json() as { display_name?: string };
    if (data && data.display_name) {
      const detectedCountry = countryFromDisplayName(data.display_name);
      const trimmed = trimDisplayName(data.display_name, detectedCountry);
      res.json({ address: trimmed, rawAddress: data.display_name });
    } else {
      res.status(404).json({ error: "No address found for coordinates" });
    }
  } catch {
    res.status(500).json({ error: "Internal geocoding server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stats
// ---------------------------------------------------------------------------

router.get("/stats", async (_req, res) => {
  let activeSubs = 0;
  try {
    activeSubs = getActiveCount();
  } catch {
    // ignore
  }

  let dbSearches = 0;
  const hasDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]");
  const hasSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

  if (hasDb) {
    try {
      const { getDb, searchesTable } = await import("@workspace/db");
      const [countResult] = await getDb().select({ count: sql<number>`cast(count(*) as integer)` }).from(searchesTable);
      dbSearches = countResult?.count ?? 0;
    } catch {
      // ignore
    }
  } else if (hasSupabase) {
    try {
      const { getSupabaseClient } = await import("@workspace/db");
      const { count } = await getSupabaseClient().from("searches").select("*", { count: "exact", head: true });
      dbSearches = count ?? 0;
    } catch {
      // ignore
    }
  }

  res.json({
    homes_at_risk: "9.2M",
    children_affected: "400,000",
    datasets_analyzed: 5,
    addresses_checked: 128442 + dbSearches,
    addresses_monitored: activeSubs,
  });
});

export default router;
