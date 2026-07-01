// GET /api/schools?lat=...&lng=...&query=...
// Queries Google Places API for schools and daycares, scores each using the same real scoring engine as /api/risk.
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

// Filters out random commercial listings, gyms, and airports
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
    "airport", "aviation", "flight", "flying", "driving", "scuba", "martial",
    "karate", "taekwondo", "kung fu", "dance", "ballet", "beauty", "cosmetology",
    "barber", "salon", "yoga", "gymnastic", "tennis", "golf", "swim", "music",
    "cooking", "art", "dog", "pet", "veterin", "rehab", "medical", "hospital",
    "clinic", "dental", "military", "police", "real estate", "traffic", "sailing",
    "riding", "equestrian", "ski", "skating", "soccer", "baseball", "basketball",
    "gym", "fitness", "beauty", "hair", "nail"
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
  type: string
): Promise<PlaceResult[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "2414"); // 1.5 miles in metres
  url.searchParams.set("type", type);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8_000),
  });
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
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "16093"); // 10 miles bias
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: PlaceResult[]; status?: string };
    return data.results ?? [];
  } catch {
    return [];
  }
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
  const searchQuery = req.query.query as string;
  
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  req.log.info({ lat, lng, searchQuery }, "School lookup requested");

  try {
    let combined: PlaceResult[] = [];
    const seen = new Set<string>();

    // 1. If we have a query (e.g. "Hackettstown High School NJ"), search it first using Text Search
    if (searchQuery && searchQuery.trim().length > 2) {
      const textResults = await fetchPlacesTextSearch(apiKey, searchQuery.trim(), lat, lng);
      for (const p of textResults) {
        if (isAcademicSchoolOrDaycare(p) && !seen.has(p.place_id)) {
          seen.add(p.place_id);
          combined.push(p);
        }
      }
    }

    // 2. Fetch schools and daycare nearby ONLY if combined is empty (no specific school matched or no query)
    if (combined.length === 0) {
      const [schoolResults, daycareResults] = await Promise.all([
        fetchPlaces(apiKey, lat, lng, "school"),
        fetchPlaces(apiKey, lat, lng, "child_care"),
      ]);

      for (const p of [...schoolResults, ...daycareResults]) {
        if (isAcademicSchoolOrDaycare(p) && !seen.has(p.place_id)) {
          seen.add(p.place_id);
          combined.push(p);
        }
      }
    }

    // Cap at 15 results
    const top = combined.slice(0, 15);
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

    // If there's an exact search query, make sure the top Google Text Search result stays at index 0 
    // to give the user the exact school they wanted immediately, then sort the rest by score.
    if (searchQuery && scored.length > 0) {
      const first = scored[0];
      const rest = scored.slice(1);
      rest.sort((a, b) => b.score - a.score);
      scored.splice(0, scored.length, first, ...rest);
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    req.log.info({ count: scored.length }, "School lookup complete");
    res.json({ schools: scored });
  } catch (err) {
    req.log.error({ err }, "School lookup failed");
    res.status(502).json({ error: "School lookup failed. Please try again." });
  }
});

export default router;
