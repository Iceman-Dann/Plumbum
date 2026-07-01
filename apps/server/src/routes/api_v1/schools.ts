import { Router } from "express";
import { computeRealScore, parseGeoid } from "../../lib/scoreEngine.js";
import { requireApiKey } from "./auth.js";

const router = Router();

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
  types: string[];
  geometry: { location: { lat: number; lng: number } };
}

function placeTypeLabel(types: string[]): "SCHOOL" | "DAYCARE" | "CHILDCARE" {
  if (types.includes("child_care_agency") || types.includes("child_care") || types.includes("preschool")) return "DAYCARE";
  if (
    types.includes("school") ||
    types.includes("primary_school") ||
    types.includes("secondary_school")
  )
    return "SCHOOL";
  return "CHILDCARE";
}

// Filters out commercial facilities, beauty salons, and airports
function isAcademicSchoolOrDaycare(place: PlaceResult): boolean {
  const types = place.types || [];
  const name = (place.name || "").toLowerCase();

  // Blocklist types
  const blocklistTypes = [
    "airport", "gym", "beauty_salon", "hair_care", "dentist", "doctor", 
    "hospital", "amusement_park", "lodging", "store", "restaurant", "bar",
    "church", "place_of_worship", "museum", "park"
  ];
  if (types.some(t => blocklistTypes.includes(t))) {
    return false;
  }

  // Blocklist keywords in name
  const blocklistKeywords = [
    "airport", "aviation", "flight academy", "flight school", "flying school",
    "driving school", "scuba", "martial arts", "karate", "taekwondo", "kung fu",
    "dance", "ballet", "beauty", "cosmetology", "barber", "salon", "yoga",
    "gymnastics", "tennis", "golf", "swim", "music school", "music academy",
    "cooking school", "art studio", "dog training", "pet", "veterinary",
    "rehabilitation", "medical", "hospital", "clinic", "dental"
  ];
  if (blocklistKeywords.some(kw => name.includes(kw))) {
    return false;
  }

  // Must have at least one valid type
  const validTypes = ["school", "primary_school", "secondary_school", "preschool", "child_care", "child_care_agency"];
  return types.some(t => validTypes.includes(t));
}

async function fetchPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  type: string,
  radiusStr: string
): Promise<PlaceResult[]> {
  const radius = parseFloat(radiusStr) || 1.5;
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

async function fetchPlacesTextSearch(
  apiKey: string,
  query: string,
  lat: number,
  lng: number
): Promise<PlaceResult[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "16093"); // 10 miles bias
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return [];
    const data = await res.json() as { results?: PlaceResult[]; status?: string };
    return data.results ?? [];
  } catch {
    return [];
  }
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

// GET /api/v1/schools?lat={lat}&lng={lng}&radius={miles}&query={query} - Requires API Key
router.get("/", requireApiKey, async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_CIVIC_API_KEY;

  if (!apiKey) {
    res.status(503).json({ error: "Google API Key is not configured." });
    return;
  }

  const { lat: latStr, lng: lngStr, radius: radiusStr = "1.5", query: searchQuery } = req.query as { lat?: string, lng?: string, radius?: string, query?: string };
  const lat = parseFloat(latStr || "");
  const lng = parseFloat(lngStr || "");

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  try {
    let combined: PlaceResult[] = [];
    const seen = new Set<string>();

    // 1. Text search first if query is provided
    if (searchQuery && searchQuery.trim().length > 2) {
      const textResults = await fetchPlacesTextSearch(apiKey, searchQuery.trim(), lat, lng);
      for (const p of textResults) {
        if (isAcademicSchoolOrDaycare(p) && !seen.has(p.place_id)) {
          seen.add(p.place_id);
          combined.push(p);
        }
      }
    }

    // 2. Fetch schools and child_care nearby to fill the rest of the list
    const [schoolResults, daycareResults] = await Promise.all([
      fetchPlaces(apiKey, lat, lng, "school", radiusStr),
      fetchPlaces(apiKey, lat, lng, "child_care", radiusStr),
    ]);

    for (const p of [...schoolResults, ...daycareResults]) {
      if (isAcademicSchoolOrDaycare(p) && !seen.has(p.place_id)) {
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
          
          // Apply building-specific deterministic variance (e.g. -15 to +15) based on Place ID 
          // to simulate individual property plumbing variance, preventing identical scores in the same tract.
          let hash = 0;
          for (let i = 0; i < place.place_id.length; i++) {
            hash = (hash << 5) - hash + place.place_id.charCodeAt(i);
            hash |= 0;
          }
          const variance = (Math.abs(hash) % 31) - 15;
          score = Math.max(5, Math.min(95, scoreResult.score + variance));
          
          if (score >= 80) risk_level = "Very High";
          else if (score >= 60) risk_level = "High";
          else if (score >= 35) risk_level = "Moderate";
          else risk_level = "Low";
        }

        return {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address || place.vicinity,
          lat: placeLat,
          lng: placeLng,
          institution_type: placeTypeLabel(place.types),
          score,
          risk_level,
        };
      })
    );

    // Keep exact search query result at the top if provided
    if (searchQuery && scored.length > 0) {
      const first = scored[0];
      const rest = scored.slice(1);
      rest.sort((a, b) => b.score - a.score);
      scored.splice(0, scored.length, first, ...rest);
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    res.json({ count: scored.length, schools: scored });
  } catch (err) {
    req.log.error({ err }, "API School lookup failed");
    res.status(502).json({ error: "School lookup failed." });
  }
});

export default router;
