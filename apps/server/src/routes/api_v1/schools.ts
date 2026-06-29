import { Router } from "express";
import { computeRealScore, parseGeoid } from "../../lib/scoreEngine.js";
import { requireApiKey } from "./auth.js";

const router = Router();

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
  type: string,
  radiusStr: string
): Promise<PlaceResult[]> {
  const radius = parseFloat(radiusStr) || 1;
  const radiusMeters = Math.min(Math.round(radius * 1609.34), 50000); // cap at ~31 miles
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radiusMeters.toString());
  url.searchParams.set("type", type);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return [];

  const data = await res.json() as { results?: PlaceResult[]; status?: string };
  return data.results ?? [];
}

async function censusFromLatLng(lat: number, lng: number): Promise<string> {
  try {
    const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
    url.searchParams.set("x", lng.toString());
    url.searchParams.set("y", lat.toString());
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("vintage", "Current_Current");
    url.searchParams.set("layers", "Census Tracts");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;

    const data = await res.json() as any;
    return (
      data.result?.geographies?.["Census Tracts"]?.[0]?.GEOID ??
      `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`
    );
  } catch {
    return `fallback_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;
  }
}

// GET /api/v1/schools?lat={lat}&lng={lng}&radius={miles} - Requires API Key
router.get("/", requireApiKey, async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_CIVIC_API_KEY;

  if (!apiKey) {
    res.status(503).json({ error: "Google API Key is not configured." });
    return;
  }

  const { lat: latStr, lng: lngStr, radius: radiusStr = "1" } = req.query as { lat?: string, lng?: string, radius?: string };
  const lat = parseFloat(latStr || "");
  const lng = parseFloat(lngStr || "");

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  try {
    const [schoolResults, daycareResults] = await Promise.all([
      fetchPlaces(apiKey, lat, lng, "school", radiusStr),
      fetchPlaces(apiKey, lat, lng, "child_care_agency", radiusStr),
    ]);

    const seen = new Set<string>();
    const combined: PlaceResult[] = [];
    for (const p of [...schoolResults, ...daycareResults]) {
      if (!seen.has(p.place_id)) {
        seen.add(p.place_id);
        combined.push(p);
      }
    }

    const top = combined.slice(0, 50); // API limit
    const scored = await Promise.all(
      top.map(async (place) => {
        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        const fips = await censusFromLatLng(placeLat, placeLng);
        let score = 0;
        let risk_level = "Low";

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

    scored.sort((a, b) => b.score - a.score);
    res.json({ count: scored.length, schools: scored });
  } catch (err) {
    req.log.error({ err }, "API School lookup failed");
    res.status(502).json({ error: "School lookup failed." });
  }
});

export default router;
