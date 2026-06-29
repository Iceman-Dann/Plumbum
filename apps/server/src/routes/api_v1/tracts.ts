import { Router } from "express";
import { computeRealScore } from "../../lib/scoreEngine.js";

const router = Router();

// GET /api/v1/tract/:fips - Public, No API key needed
router.get("/:fips", async (req, res) => {
  const { fips } = req.params;

  if (!fips || fips.length !== 11) {
    res.status(400).json({ error: "fips parameter must be an 11-digit string" });
    return;
  }

  try {
    const stateFips = fips.substring(0, 2);
    const countyFips = fips.substring(2, 5);
    const tractCode = fips.substring(5, 11);

    const scoreResult = await computeRealScore({
      stateFips,
      countyFips,
      tractCode,
      geoid: fips,
    });

    res.json({
      fips,
      score: scoreResult.score,
      risk_level: scoreResult.risk_level,
      factors: scoreResult.factors,
      data_sources: scoreResult.data_sources,
      median_income: scoreResult.median_income,
      epa_violations_10yr: scoreResult.epa_violations_10yr,
      pct_pre1986: scoreResult.pct_pre1986,
    });
  } catch (err) {
    req.log.error({ err }, "API Tract evaluation failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
