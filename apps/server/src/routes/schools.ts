// GET /api/schools?lat=...&lng=...
// Queries Google Places API for schools and daycares within 1 mile, then
// scores each using the same real scoring engine as /api/risk.
import { Router } from "express";
import { computeRealScore, parseGeoid } from "../lib/scoreEngine.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  types: string[];
  geometry: { location: { lat: number; lng: number } };
}

function placeTypeLabel(types: string[]): "SCHOOL" | "DAYCARE" | "CHILDCARE" {
  if (types.includes("child_care_agency")) return "DAYCARE";
  if (
    types.includes("school") ||
    types.includes("primary_school") ||
    types.includes("secondary_school")
  )
    return "SCHOOL";
  return "CHILDCARE";
}

async function fetchPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  type: string
): Promise<PlaceResult[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "1609"); // 1 mile in metres
  url.searchParams.set("type", type);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];

  const data = await res.json() as { results?: PlaceResult[]; status?: string };
  return data.results ?? [];
}

async function censusFromLatLng(lat: number, lng: number): Promise<string> {
  try {
    const url = new URL(
      "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
    );
    url.searchParams.set("x", lng.toString());
    url.searchParams.set("y", lat.toString());
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("vintage", "Current_Current");
    url.searchParams.set("layers", "Census Tracts");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;

    const data = await res.json() as {
      result?: { geographies?: { "Census Tracts"?: Array<{ GEOID: string }> } };
    };
    return (
      data.result?.geographies?.["Census Tracts"]?.[0]?.GEOID ??
      `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`
    );
  } catch {
    return `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;
  }
}

// ---------------------------------------------------------------------------
// GET /api/schools
// ---------------------------------------------------------------------------

router.get("/schools", async (req, res) => {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_CIVIC_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error:
        "GOOGLE_PLACES_API_KEY is not configured. Add it to your environment secrets to enable school lookup.",
    });
    return;
  }

  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  req.log.info({ lat, lng }, "School lookup requested");

  try {
    // Fetch schools and child_care_agency in parallel
    const [schoolResults, daycareResults] = await Promise.all([
      fetchPlaces(apiKey, lat, lng, "school"),
      fetchPlaces(apiKey, lat, lng, "child_care_agency"),
    ]);

    // Deduplicate by place_id, prefer school entry
    const seen = new Set<string>();
    const combined: PlaceResult[] = [];
    for (const p of [...schoolResults, ...daycareResults]) {
      if (!seen.has(p.place_id)) {
        seen.add(p.place_id);
        combined.push(p);
      }
    }

    // Cap at 12 results and score each in parallel
    const top = combined.slice(0, 12);
    const scored = await Promise.all(
      top.map(async (place) => {
        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        const fips = await censusFromLatLng(placeLat, placeLng);
        let score = 0;
        let risk_level: "Low" | "Moderate" | "High" | "Very High" = "Low";

        if (/^\d{11}$/.test(fips)) {
          const parsed = parseGeoid(fips);
          const scoreResult = await computeRealScore({
            stateFips: parsed.stateFips,
            countyFips: parsed.countyFips,
            tractCode: parsed.tractCode,
            geoid: fips,
          });
          score = scoreResult.score;
          risk_level = scoreResult.risk_level;
        }

        return {
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity,
          lat: placeLat,
          lng: placeLng,
          institution_type: placeTypeLabel(place.types),
          score,
          risk_level,
        };
      })
    );

    // Sort: high risk first
    scored.sort((a, b) => b.score - a.score);

    req.log.info({ count: scored.length }, "School lookup complete");
    res.json({ schools: scored });
  } catch (err) {
    req.log.error({ err }, "School lookup failed");
    res.status(502).json({ error: "School lookup failed. Please try again." });
  }
});

export default router;
