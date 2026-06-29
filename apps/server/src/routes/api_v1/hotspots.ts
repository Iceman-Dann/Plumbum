import { Router } from "express";
import { desc, eq, gte, and, sql, like } from "@workspace/db";
import { getDb, searchesTable, getSupabaseClient } from "@workspace/db";

const router = Router();
const THRESHOLD = 5; // minimum searches to appear as a hotspot
const DAYS = 30;

const hasDb = () => !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]");
const hasSupabase = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
}

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

// GET /api/v1/hotspots?state={state_code} - Public, no API key needed
router.get("/", async (req, res) => {
  const { state } = req.query;

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "state query parameter is required" });
    return;
  }

  const upper = state.trim().toUpperCase();
  const stateFips = STATE_ABBR_TO_FIPS[upper] || (/^\d{2}$/.test(upper) ? upper : null);

  if (!stateFips) {
    res.status(400).json({ error: "Invalid state code or abbreviation" });
    return;
  }

  if (!hasDb() && !hasSupabase()) {
    res.status(503).json({ error: "Database not configured." });
    return;
  }

  try {
    if (hasDb()) {
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
            eq(searchesTable.country, "us"),
            like(searchesTable.fips, `${stateFips}%`)
          )
        )
        .groupBy(searchesTable.fips)
        .having(sql`count(*) >= ${THRESHOLD}`)
        .orderBy(desc(sql`count(*)`))
        .limit(20);

      const hotspots = rows.map((row, i) => ({
        rank: i + 1,
        fips: row.fips,
        city: row.city ?? `Tract ${row.fips}`,
        search_count: row.search_count,
        avg_score: row.avg_score,
        lat: row.lat,
        lng: row.lng,
      }));

      res.json({ state: upper, fips: stateFips, hotspots });
    } else {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("searches")
        .select("fips, score, lat, lng, city, created_at")
        .eq("country", "us")
        .like("fips", `${stateFips}%`)
        .gte("created_at", thirtyDaysAgo().toISOString());
        
      if (error) throw error;
      
      const groups: any = {};
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
      
      const hotspots = Object.values(groups)
        .filter((g: any) => g.count >= THRESHOLD)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 20)
        .map((g: any, i) => ({
          rank: i + 1,
          fips: g.fips,
          search_count: g.count,
          avg_score: Math.round(g.scoreSum / g.count),
          lat: g.latSum / g.count,
          lng: g.lngSum / g.count,
          city: g.city,
        }));

      res.json({ state: upper, fips: stateFips, hotspots });
    }
  } catch (err) {
    req.log.error({ err }, "API Hotspots query failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
