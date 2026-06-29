import { Router } from "express";
import { computeRealScore } from "../lib/scoreEngine.js";

const router = Router();

// Bounding box half-size in degrees (approx 9km x 7km total dimensions)
const BOX_HALF_SIZE = 0.04;

interface TigerwebFeature {
  type: "Feature";
  properties: {
    GEOID: string;
    NAME: string;
    score?: number;
    risk_level?: string;
  };
  geometry: any;
}

interface TigerwebFeatureCollection {
  type: "FeatureCollection";
  features: TigerwebFeature[];
}

router.get("/neighborhood", async (req, res) => {
  const { lat: latQuery, lng: lngQuery } = req.query;

  if (!latQuery || !lngQuery) {
    res.status(400).json({ error: "lat and lng query parameters are required" });
    return;
  }

  const lat = parseFloat(String(latQuery));
  const lng = parseFloat(String(lngQuery));

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng must be valid numbers" });
    return;
  }

  // Calculate bounding box around the center coordinate
  const xmin = lng - BOX_HALF_SIZE;
  const ymin = lat - BOX_HALF_SIZE;
  const xmax = lng + BOX_HALF_SIZE;
  const ymax = lat + BOX_HALF_SIZE;

  // Construct US Census TIGERweb MapServer Query URL
  const queryUrl = new URL("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0/query");
  queryUrl.searchParams.set("where", "1=1");
  queryUrl.searchParams.set("geometry", `${xmin},${ymin},${xmax},${ymax}`);
  queryUrl.searchParams.set("geometryType", "esriGeometryEnvelope");
  queryUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  queryUrl.searchParams.set("inSR", "4326");
  queryUrl.searchParams.set("outSR", "4326");
  queryUrl.searchParams.set("f", "geojson");
  queryUrl.searchParams.set("outFields", "GEOID,NAME");

  try {
    req.log.info({ lat, lng }, "Fetching neighborhood census tract shapes from TIGERweb");
    const tigerwebRes = await fetch(queryUrl.toString(), { signal: AbortSignal.timeout(12000) });
    
    if (!tigerwebRes.ok) {
      throw new Error(`TIGERweb server responded with status: ${tigerwebRes.status}`);
    }

    const geojson = (await tigerwebRes.json()) as TigerwebFeatureCollection;

    if (!geojson.features || geojson.features.length === 0) {
      req.log.warn("No census tracts returned from TIGERweb query, returning empty collection");
      res.json({ type: "FeatureCollection", features: [] });
      return;
    }

    req.log.info({ count: geojson.features.length }, "Calculating risk scores for tracts in parallel");

    // Concurrently calculate risk scores for all retrieved census tracts
    const promises = geojson.features.map(async (feature) => {
      const geoid = feature.properties.GEOID;
      if (!geoid || geoid.length < 11) {
        feature.properties.score = 45;
        feature.properties.risk_level = "Moderate";
        return;
      }

      const stateFips = geoid.slice(0, 2);
      const countyFips = geoid.slice(2, 5);
      const tractCode = geoid.slice(5, 11);

      try {
        const scoreResult = await computeRealScore({
          stateFips,
          countyFips,
          tractCode,
          geoid,
        });
        feature.properties.score = scoreResult.score;
        feature.properties.risk_level = scoreResult.risk_level;
      } catch (err) {
        req.log.error({ err, geoid }, "Failed to calculate risk score for census tract");
        feature.properties.score = 45;
        feature.properties.risk_level = "Moderate";
      }
    });

    await Promise.all(promises);

    res.json(geojson);
  } catch (err: any) {
    req.log.error({ err, lat, lng }, "Failed to load neighborhood tract shapes");
    res.status(500).json({ error: "Failed to retrieve neighborhood map data from Census Bureau." });
  }
});

export default router;
