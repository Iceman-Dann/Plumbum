// GET /api/representatives?address=...
//
// US pipeline:
//   Primary: whoismyrepresentative.com (free, no API key, zip-based)
//   Fallback: GovTrack API (free, no API key, coordinates-based)
//
// Canada pipeline:
//   Represent by Open North (free, no API key, lat/lng-based)
//   https://represent.opennorth.ca/api/
//   Returns Federal MPs + Provincial MPPs/MLAs + Municipal councillors

import { Router } from "express";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RepresentativeOut {
  name: string;
  title: string;
  party: string;
  email: string | null;
  url: string | null;
  photoUrl: string | null;
}

interface WimrMember {
  name: string;
  party: string;
  state: string;
  district: string; // empty string for senators
  link: string;
}

interface WimrResponse {
  results: WimrMember[];
}

interface GovTrackRole {
  party: string;
  district: number | null;
  role_type: string;
  description: string;
  website: string;
  person: {
    firstname: string;
    lastname: string;
    nickname: string;
  };
}

interface GovTrackResponse {
  objects: GovTrackRole[];
}

/** Represent (Open North) — Canadian representative from API response */
interface RepresentOpenNorthRep {
  name: string;
  elected_office: string;   // "MP", "MLA", "MPP", "MNA", "Mayor", "Councillor", etc.
  district_name: string;
  party_name?: string;
  email?: string;
  url?: string;
  photo_url?: string;
}

interface RepresentOpenNorthResponse {
  objects: RepresentOpenNorthRep[];
  meta: { total_count: number; next: string | null };
}

// ---------------------------------------------------------------------------
// State FIPS → abbreviation
// ---------------------------------------------------------------------------

const STATE_FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pull a 5-digit US zip from an address string only when it sits at or near
 * the end (after a comma or space), avoiding false matches on street numbers.
 */
function extractZip(address: string): string | null {
  const match = address.match(/(?:,|\s)(\d{5})(?:-\d{4})?[\s]*$/);
  return match ? match[1] : null;
}

/** Geocode via Census locations API → coordinates + matched zip. */
async function geocodeCensus(
  address: string,
): Promise<{ lat: number; lng: number; zip: string | null } | null> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
  );
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = await res.json() as {
      result: {
        addressMatches: Array<{
          matchedAddress: string;
          coordinates: { x: number; y: number };
        }>;
      };
    };
    const match = data.result?.addressMatches?.[0];
    if (!match) return null;
    return {
      lat: match.coordinates.y,
      lng: match.coordinates.x,
      zip: extractZip(match.matchedAddress),
    };
  } catch {
    return null;
  }
}

/** Geocode via Nominatim (OpenStreetMap) — handles city/county/region queries
 *  that the Census geocoder rejects (no street number required). */
async function geocodeNominatim(
  address: string,
): Promise<{ lat: number; lng: number; zip: string | null; country: "us" | "ca" } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  // Allow both US and Canada
  url.searchParams.set("countrycodes", "us,ca");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Plumbum/1.0 (lead-pipe-risk; contact@plumbum.app)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data || data.length === 0) return null;
    const displayName = data[0].display_name.toLowerCase();
    const country: "us" | "ca" =
      displayName.endsWith(", canada") || displayName.includes(", canada,") ? "ca" : "us";
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), zip: null, country };
  } catch {
    return null;
  }
}

/** Try Census geocoder first (US only), fall back to Nominatim. */
async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number; zip: string | null; country: "us" | "ca" } | null> {
  const census = await geocodeCensus(address);
  if (census) return { ...census, country: "us" };
  return geocodeNominatim(address);
}

/**
 * Resolve lat/lng to a congressional district via Census geographies API.
 * Returns { state: "NY", district: 12 } or null.
 */
async function getCongressionalDistrict(
  lat: number,
  lng: number,
): Promise<{ state: string; district: number } | null> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/geographies/coordinates",
  );
  url.searchParams.set("x", lng.toString());
  url.searchParams.set("y", lat.toString());
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("layers", "119th Congressional Districts");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = await res.json() as {
      result: {
        geographies: Record<string, Array<{ GEOID: string }>>;
      };
    };

    // Layer name varies by congress number — match any "Congressional Districts" key.
    const geos = data.result?.geographies ?? {};
    const cdKey = Object.keys(geos).find((k) => k.includes("Congressional Districts"));
    if (!cdKey) return null;

    const items = geos[cdKey];
    if (!items || items.length === 0) return null;

    // GEOID format: 2-char state FIPS + remaining digits = district number.
    const geoid = items[0].GEOID; // e.g. "3612" → NY-12
    const stateFips = geoid.slice(0, 2);
    const districtNum = parseInt(geoid.slice(2), 10);
    const state = STATE_FIPS[stateFips];

    if (!state || isNaN(districtNum)) return null;
    return { state, district: districtNum };
  } catch {
    return null;
  }
}

/** Format a GovTrack role into the shared RepresentativeOut shape. */
function mapGovTrackRole(role: GovTrackRole): RepresentativeOut {
  const { firstname, lastname, nickname } = role.person;
  const name = nickname ? `${nickname} ${lastname}` : `${firstname} ${lastname}`;

  // description examples:
  //   "Representative for New York's 12th congressional district"
  //   "Senior Senator for New York"
  //   "Junior Senator for New York"
  const title = role.description
    .replace(/^Representative for/, "U.S. Representative for")
    .replace(/^(Senior|Junior) Senator for/, "U.S. $1 Senator for");

  return {
    name,
    title,
    party: role.party,
    email: null,
    url: role.website || null,
    photoUrl: null,
  };
}

/**
 * Full GovTrack fallback: geocode → congressional district → House + Senate.
 * Returns null if any step in the pipeline fails.
 */
async function fetchViaGovTrack(
  address: string,
  log: { info: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
): Promise<RepresentativeOut[] | null> {
  const geo = await geocodeAddress(address);
  if (!geo) {
    log.error({ address }, "GovTrack fallback: Census geocoding failed");
    return null;
  }

  const cd = await getCongressionalDistrict(geo.lat, geo.lng);
  if (!cd) {
    log.error({ lat: geo.lat, lng: geo.lng }, "GovTrack fallback: congressional district lookup failed");
    return null;
  }

  log.info({ state: cd.state, district: cd.district }, "GovTrack fallback: resolved congressional district");

  const [houseRes, senateRes] = await Promise.all([
    fetch(
      `https://www.govtrack.us/api/v2/role?current=true&state=${cd.state}&district=${cd.district}&role_type=representative&format=json`,
      { signal: AbortSignal.timeout(8_000) },
    ),
    fetch(
      `https://www.govtrack.us/api/v2/role?current=true&state=${cd.state}&role_type=senator&format=json`,
      { signal: AbortSignal.timeout(8_000) },
    ),
  ]);

  const reps: RepresentativeOut[] = [];

  if (houseRes.ok) {
    const data = await houseRes.json() as GovTrackResponse;
    reps.push(...(data.objects ?? []).map(mapGovTrackRole));
  }

  if (senateRes.ok) {
    const data = await senateRes.json() as GovTrackResponse;
    reps.push(...(data.objects ?? []).map(mapGovTrackRole));
  }

  return reps.length > 0 ? reps : null;
}

/** Map a whoismyrepresentative.com member to RepresentativeOut. */
function mapWimrMember(m: WimrMember): RepresentativeOut {
  const isSenator = !m.district || m.district.trim() === "";
  const title = isSenator
    ? `U.S. Senator (${m.state})`
    : `U.S. Representative, District ${m.district} (${m.state})`;
  return {
    name: m.name,
    title,
    party: m.party,
    email: null,
    url: m.link || null,
    photoUrl: null,
  };
}

// ---------------------------------------------------------------------------
// Canada — Represent by Open North
// https://represent.opennorth.ca/api/
// ---------------------------------------------------------------------------

/** Map a Represent Open North rep to the shared RepresentativeOut shape. */
function mapRepresentRep(rep: RepresentOpenNorthRep): RepresentativeOut {
  return {
    name: rep.name,
    title: `${rep.elected_office} — ${rep.district_name}`,
    party: rep.party_name || "Independent",
    email: rep.email || null,
    url: rep.url || null,
    photoUrl: rep.photo_url || null,
  };
}

/**
 * Fetch Canadian representatives via Represent (Open North) using coordinates.
 * Uses lat/lng — the most accurate method (never changes, matches single boundary).
 * Returns up to 10 reps (Federal + Provincial + Municipal).
 */
async function fetchViaRepresent(
  lat: number,
  lng: number,
  log: { info: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
): Promise<RepresentativeOut[] | null> {
  const url = new URL("https://represent.opennorth.ca/representatives/");
  url.searchParams.set("point", `${lat},${lng}`);
  url.searchParams.set("limit", "20");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Plumbum/1.0 (lead-pipe-risk; contact@plumbum.app)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      log.error({ status: res.status }, "Represent API returned non-OK");
      return null;
    }

    const data = await res.json() as RepresentOpenNorthResponse;
    const reps = (data.objects ?? []).map(mapRepresentRep);

    // Sort order: Federal MPs first, then Provincial, then Municipal
    const order = ["MP", "Senator", "MLA", "MPP", "MNA", "MHA", "MNS"];
    reps.sort((a, b) => {
      const rankA = order.findIndex(o => a.title.startsWith(o));
      const rankB = order.findIndex(o => b.title.startsWith(o));
      return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
    });

    log.info({ count: reps.length, lat, lng }, "Represent API lookup complete");
    return reps.length > 0 ? reps : null;
  } catch (err) {
    log.error({ err }, "Represent API fetch failed");
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

router.get("/representatives", async (req, res) => {
  const address = req.query.address;
  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "address query parameter is required" });
    return;
  }

  req.log.info({ address }, "Representative lookup requested");

  try {
    // ── Step 0: detect country — Canadian addresses use Represent API ─────────
    const geo = await geocodeAddress(address);
    if (geo?.country === "ca") {
      req.log.info({ address, lat: geo.lat, lng: geo.lng }, "Canadian address — querying Represent Open North");
      const reps = await fetchViaRepresent(geo.lat, geo.lng, req.log);
      if (reps && reps.length > 0) {
        req.log.info({ count: reps.length, source: "represent" }, "Represent lookup complete");
        res.json({ representatives: reps, country: "ca" });
      } else {
        req.log.info({ address }, "Represent returned no reps");
        res.json({ representatives: [], country: "ca" });
      }
      return;
    }

    // ── Step 1: resolve zip (best-effort; not required) ───────────────────
    let zip = extractZip(address);
    if (!zip) {
      zip = geo?.zip ?? null;
    }

    // ── Step 2: primary lookup via whoismyrepresentative.com (zip-based) ──
    if (zip) {
      const wimrUrl = `https://whoismyrepresentative.com/getall_mems.php?zip=${encodeURIComponent(zip)}&output=json`;
      const wimrRes = await fetch(wimrUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });

      if (wimrRes.ok) {
        // API returns XML (e.g. <result message='No Data Found' />) for unknown
        // zips even when output=json is requested — parse as text first.
        const raw = await wimrRes.text();
        const isJson = raw.trimStart().startsWith("{") || raw.trimStart().startsWith("[");

        if (isJson) {
          const data = JSON.parse(raw) as WimrResponse;
          const members = data.results ?? [];

          if (members.length > 0) {
            const representatives = members.map(mapWimrMember);
            req.log.info({ count: representatives.length, zip, source: "wimr" }, "Representative lookup complete");
            res.json({ representatives, country: "us" });
            return;
          }
          req.log.info({ zip }, "whoismyrepresentative.com returned empty — trying GovTrack fallback");
        } else {
          req.log.info({ zip, raw: raw.slice(0, 120) }, "whoismyrepresentative.com returned non-JSON — trying GovTrack fallback");
        }
      } else {
        req.log.error({ status: wimrRes.status, zip }, "whoismyrepresentative.com HTTP error — trying GovTrack fallback");
      }
    } else {
      req.log.info({ address }, "No zip resolved — skipping whoismyrepresentative.com, trying GovTrack directly");
    }

    // ── Step 3: fallback via GovTrack (coordinate-based, no zip needed) ───
    const reps = await fetchViaGovTrack(address, req.log);

    if (reps && reps.length > 0) {
      req.log.info({ count: reps.length, source: "govtrack" }, "Representative lookup complete");
      res.json({ representatives: reps, country: "us" });
      return;
    }

    // All sources exhausted — return empty list rather than an error.
    req.log.info({ address, zip }, "No representatives found from any source");
    res.json({ representatives: [], country: "us" });
  } catch (err) {
    req.log.error({ err }, "Representative lookup failed");
    res.status(502).json({ error: "Representative lookup failed. Please try again." });
  }
});

export default router;
