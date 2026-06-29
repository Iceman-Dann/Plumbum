import { Router } from "express";
import crypto from "crypto";
import { GetRiskQueryParams } from "@workspace/api-zod";
import { geocodeAddress } from "../risk.js";
import { computeRealScore } from "../../lib/scoreEngine.js";
import { requireApiKey } from "./auth.js";

const router = Router();

// GET /api/v1/risk?address={address} - Public, No API key needed
router.get("/", async (req, res) => {
  const parsed = GetRiskQueryParams.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "address query parameter is required" });
    return;
  }

  const { address } = parsed.data;

  try {
    const geocoded = await geocodeAddress(address);
    if (!geocoded || geocoded.country === "ca") {
      res.status(404).json({ error: "Address not found or not in US." });
      return;
    }

    const scoreResult = await computeRealScore({
      stateFips: geocoded.stateFips,
      countyFips: geocoded.countyFips,
      tractCode: geocoded.tractCode,
      geoid: geocoded.censusTract,
    });

    const result = {
      address,
      geocoded_address: geocoded.geocodedAddress,
      score: scoreResult.score,
      risk_level: scoreResult.risk_level,
      factors: scoreResult.factors,
      lat: geocoded.lat,
      lng: geocoded.lng,
      census_tract: geocoded.censusTract,
      tract_fips: scoreResult.tract_fips,
    };

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "API Risk evaluation failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/v1/risk/batch - Requires API Key
router.post("/batch", requireApiKey, async (req, res) => {
  const { addresses } = req.body;

  if (!Array.isArray(addresses) || addresses.length === 0 || addresses.length > 50) {
    res.status(400).json({ error: "addresses must be an array of up to 50 address strings" });
    return;
  }

  const batch_id = crypto.randomUUID();
  const results = [];

  for (const address of addresses) {
    try {
      const geocoded = await geocodeAddress(address);
      if (!geocoded || geocoded.country === "ca") {
        results.push({ address, error: "Address not found or not in US" });
        continue;
      }

      const scoreResult = await computeRealScore({
        stateFips: geocoded.stateFips,
        countyFips: geocoded.countyFips,
        tractCode: geocoded.tractCode,
        geoid: geocoded.censusTract,
      });

      results.push({
        address,
        geocoded_address: geocoded.geocodedAddress,
        score: scoreResult.score,
        risk_level: scoreResult.risk_level,
        lat: geocoded.lat,
        lng: geocoded.lng,
        census_tract: geocoded.censusTract,
      });
    } catch (err) {
      results.push({ address, error: "Failed to process" });
    }
  }

  res.json({ batch_id, results });
});

export default router;
