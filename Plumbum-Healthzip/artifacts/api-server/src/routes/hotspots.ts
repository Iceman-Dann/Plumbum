// GET /api/hotspots  — census tracts with >5 searches in past 30 days
// GET /api/hotspots/csv — CSV download of the same data
import { Router } from "express";
import { desc, gte, sql } from "drizzle-orm";

const router = Router();

const THRESHOLD = 5; // minimum searches to appear as a hotspot
const DAYS = 30;

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
}

async function queryHotspots() {
  if (!process.env.DATABASE_URL) return null;

  const { getDb, searchesTable } = await import("@workspace/db");
  const db = getDb();

  const rows = await db
    .select({
      fips: searchesTable.fips,
      search_count: sql<number>`cast(count(*) as integer)`,
      avg_score: sql<number>`cast(avg(${searchesTable.score}) as integer)`,
      lat: sql<number>`avg(${searchesTable.lat})`,
      lng: sql<number>`avg(${searchesTable.lng})`,
      city: sql<string>`max(${searchesTable.city})`,
    })
    .from(searchesTable)
    .where(gte(searchesTable.created_at, thirtyDaysAgo()))
    .groupBy(searchesTable.fips)
    .having(sql`count(*) > ${THRESHOLD}`)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  return rows.map((row, i) => ({
    rank: i + 1,
    fips: row.fips,
    city: row.city ?? `Tract ${row.fips}`,
    search_count: row.search_count,
    avg_score: row.avg_score,
    lat: row.lat,
    lng: row.lng,
  }));
}

// ---------------------------------------------------------------------------
// GET /api/hotspots
// ---------------------------------------------------------------------------

router.get("/hotspots", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({
      error: "Database not configured. Add DATABASE_URL to your environment to enable hotspot tracking.",
      hotspots: [],
    });
    return;
  }

  try {
    const hotspots = await queryHotspots();
    req.log.info({ count: hotspots?.length ?? 0 }, "Hotspots query complete");
    res.json({ hotspots: hotspots ?? [], total_searches_30d: null });
  } catch (err) {
    req.log.error({ err }, "Hotspots query failed");
    res.status(502).json({ error: "Failed to load hotspot data.", hotspots: [] });
  }
});

// ---------------------------------------------------------------------------
// GET /api/hotspots/csv
// ---------------------------------------------------------------------------

router.get("/hotspots/csv", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).send("Database not configured.");
    return;
  }

  try {
    const hotspots = await queryHotspots();
    if (!hotspots) { res.status(503).send("Database not configured."); return; }

    const header = "rank,fips,city,search_count_30d,avg_risk_score,lat,lng\n";
    const rows = hotspots
      .map(h =>
        [h.rank, h.fips, `"${(h.city ?? "").replace(/"/g, '""')}"`, h.search_count, h.avg_score, h.lat.toFixed(5), h.lng.toFixed(5)].join(",")
      )
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="plumbum-hotspots-${today}.csv"`);
    res.send(header + rows);
  } catch (err) {
    req.log.error({ err }, "Hotspots CSV failed");
    res.status(502).send("Failed to generate CSV.");
  }
});

export default router;
