// GET /api/representatives?address=...
// Calls the Google Civic Information API and flattens the office/official graph
// into a plain list of representatives. Returns 503 when the API key is absent.
import { Router } from "express";

const router = Router();

interface CivicOffice {
  name: string;
  levels?: string[];
  roles?: string[];
  officialIndices: number[];
}

interface CivicOfficial {
  name: string;
  party?: string;
  emails?: string[];
  urls?: string[];
  photoUrl?: string;
}

interface CivicResponse {
  offices: CivicOffice[];
  officials: CivicOfficial[];
}

// Only surface federal and state-level offices — skip county, city, judicial.
const ALLOWED_LEVELS = new Set(["country", "administrativeArea1"]);

// Roles we want to surface in the UI (legislators + governor).
const ALLOWED_ROLES = new Set([
  "legislatorUpperBody",
  "legislatorLowerBody",
  "headOfGovernment",
  "deputyHeadOfGovernment",
]);

router.get("/representatives", async (req, res) => {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error: "GOOGLE_CIVIC_API_KEY is not configured. Add it to your environment secrets to enable representative lookup.",
    });
    return;
  }

  const address = req.query.address;
  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "address query parameter is required" });
    return;
  }

  req.log.info({ address }, "Representative lookup requested");

  try {
    const url = new URL("https://civicinfo.googleapis.com/civicinfo/v2/representatives");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("address", address);
    url.searchParams.set("levels", "country");
    url.searchParams.append("levels", "administrativeArea1");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ status: response.status, err }, "Civic API error");
      const isNotEnabled = response.status === 404 || response.status === 403;
      res.status(502).json({
        error: isNotEnabled
          ? "Google Civic Information API is not enabled. Go to console.cloud.google.com → APIs & Services → Enable APIs → search 'Civic Information API' → Enable it for your project, then try again."
          : "Could not retrieve representatives from Google Civic API.",
      });
      return;
    }

    const data = await response.json() as CivicResponse;

    // Flatten: for each office, emit one entry per official it covers.
    const representatives: Array<{
      name: string;
      title: string;
      party: string;
      email: string | null;
      url: string | null;
      photoUrl: string | null;
    }> = [];

    for (const office of data.offices ?? []) {
      // Filter by level and role
      const levelOk = office.levels?.some(l => ALLOWED_LEVELS.has(l)) ?? false;
      const roleOk = office.roles?.some(r => ALLOWED_ROLES.has(r)) ?? false;
      if (!levelOk || !roleOk) continue;

      for (const idx of office.officialIndices ?? []) {
        const official = data.officials?.[idx];
        if (!official) continue;

        representatives.push({
          name: official.name,
          title: office.name,
          party: official.party ?? "Unknown",
          email: official.emails?.[0] ?? null,
          url: official.urls?.[0] ?? null,
          photoUrl: official.photoUrl ?? null,
        });
      }
    }

    req.log.info({ count: representatives.length }, "Representative lookup complete");
    res.json({ representatives });
  } catch (err) {
    req.log.error({ err }, "Representative lookup failed");
    res.status(502).json({ error: "Representative lookup failed. Please try again." });
  }
});

export default router;
