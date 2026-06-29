import { Router } from "express";
import { getViolationsForState } from "../../lib/epaLoader.js";
import { requireApiKey } from "./auth.js";

const router = Router();

const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06",
  CO: "08", CT: "09", DE: "10", DC: "11", FL: "12",
  GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
  IA: "19", KS: "20", KY: "21", LA: "22", ME: "23",
  MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33",
  NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38",
  OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49",
  VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
  WY: "56", PR: "72",
};

// GET /api/v1/data/violations?state={state} - Requires API Key
router.get("/", requireApiKey, (req, res) => {
  const { state } = req.query;

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "state query parameter is required (e.g., 'NY' or '36')" });
    return;
  }

  const upper = state.trim().toUpperCase();
  const fips = STATE_ABBR_TO_FIPS[upper] || (/^\d{2}$/.test(upper) ? upper : null);

  if (!fips) {
    res.status(400).json({ error: "Invalid state code or abbreviation" });
    return;
  }

  const violations = getViolationsForState(fips);

  res.json({
    state: upper,
    fips,
    count: violations.length,
    violations,
  });
});

export default router;
