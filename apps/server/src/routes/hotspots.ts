// GET /api/hotspots  — census tracts with >5 searches in past 30 days
// GET /api/hotspots/csv — CSV download of the same data
import { Router } from "express";
import { desc, eq, gte, and, sql } from "@workspace/db";

const router = Router();

const THRESHOLD = 5; // minimum searches to appear as a hotspot
const DAYS = 30;

const hasDb = () => !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]");
const hasSupabase = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
}

async function queryHotspots(country: string = "us") {
  if (!hasDb() && !hasSupabase()) return null;

  if (hasDb()) {
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
      .where(
        and(
          gte(searchesTable.created_at, thirtyDaysAgo()),
          eq(searchesTable.country, country)
        )
      )
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
  } else if (hasSupabase()) {
    const { getSupabaseClient } = await import("@workspace/db");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("searches")
      .select("fips, score, lat, lng, city, created_at, country")
      .eq("country", country)
      .gte("created_at", thirtyDaysAgo().toISOString());
      
    if (error) throw error;
    
    const groups: { [fips: string]: { fips: string; scoreSum: number; latSum: number; lngSum: number; count: number; city: string | null } } = {};
    for (const r of data || []) {
      if (!groups[r.fips]) {
        groups[r.fips] = { fips: r.fips, scoreSum: 0, latSum: 0, lngSum: 0, count: 0, city: null };
      }
      const g = groups[r.fips];
      g.count += 1;
      g.scoreSum += r.score || 0;
      g.latSum += r.lat || 0;
      g.lngSum += r.lng || 0;
      if (r.city) g.city = r.city;
    }
    
    return Object.values(groups)
      .filter(g => g.count > THRESHOLD)
      .map(g => ({
        fips: g.fips,
        search_count: g.count,
        avg_score: Math.round(g.scoreSum / g.count),
        lat: g.latSum / g.count,
        lng: g.lngSum / g.count,
        city: g.city,
      }))
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 50)
      .map((row, i) => ({
        rank: i + 1,
        fips: row.fips,
        city: row.city ?? `Tract ${row.fips}`,
        search_count: row.search_count,
        avg_score: row.avg_score,
        lat: row.lat,
        lng: row.lng,
      }));
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/hotspots
// ---------------------------------------------------------------------------

router.get("/hotspots", async (req, res) => {
  const country = (req.query.country as string) || "us";
  if (!hasDb() && !hasSupabase()) {
    res.status(503).json({
      error: "Database not configured. Add DATABASE_URL or SUPABASE_URL to your environment to enable hotspot tracking.",
      hotspots: [],
    });
    return;
  }

  try {
    const hotspots = await queryHotspots(country);
    req.log.info({ count: hotspots?.length ?? 0, country }, "Hotspots query complete");
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
  const country = (req.query.country as string) || "us";
  if (!hasDb() && !hasSupabase()) {
    res.status(503).send("Database not configured.");
    return;
  }

  try {
    const hotspots = await queryHotspots(country);
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
