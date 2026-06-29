// POST  /api/test-results          — submit a community water test result
// GET   /api/test-results?fips=... — aggregated results for a census tract
// GET   /api/test-results/stats    — global dataset stats
// GET   /api/test-results/download — full anonymized CSV download
import { Router } from "express";
import { eq, sql } from "@workspace/db";

const router = Router();

const hasDb = () => !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]");
const hasSupabase = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

// ---------------------------------------------------------------------------
// GET /api/test-results/stats — global aggregated stats
// ---------------------------------------------------------------------------

router.get("/test-results/stats", async (req, res) => {
  if (!hasDb() && !hasSupabase()) {
    res.json({ total_tests: 0, tracts_covered: 0, avg_ppb: null, pct_above_action: null, no_db: true });
    return;
  }
  try {
    if (hasDb()) {
      const { getDb, testResultsTable } = await import("@workspace/db");
      const db = getDb();

      const [totals] = await db
        .select({
          total_tests: sql<number>`cast(count(*) as integer)`,
          tracts_covered: sql<number>`cast(count(distinct ${testResultsTable.fips}) as integer)`,
          avg_ppb: sql<number>`round(avg(${testResultsTable.lead_ppb})::numeric, 2)`,
          count_action: sql<number>`cast(sum(case when ${testResultsTable.result_category} = 'ACTION_REQUIRED' then 1 else 0 end) as integer)`,
        })
        .from(testResultsTable);

      const pct_above_action =
        totals.total_tests > 0
          ? Math.round((totals.count_action / totals.total_tests) * 100)
          : 0;

      res.json({
        total_tests: totals.total_tests,
        tracts_covered: totals.tracts_covered,
        avg_ppb: totals.avg_ppb,
        pct_above_action,
        no_db: false,
      });
    } else {
      const { getSupabaseClient } = await import("@workspace/db");
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from("test_results")
        .select("lead_ppb, fips, result_category");
      
      if (error) throw error;
      
      const total_tests = data?.length ?? 0;
      const uniqueTracts = new Set(data?.map(r => r.fips));
      const tracts_covered = uniqueTracts.size;
      const sum_ppb = data?.reduce((acc, r) => acc + (r.lead_ppb || 0), 0) ?? 0;
      const avg_ppb = total_tests > 0 ? Math.round((sum_ppb / total_tests) * 100) / 100 : null;
      const count_action = data?.filter(r => r.result_category === 'ACTION_REQUIRED').length ?? 0;
      const pct_above_action = total_tests > 0 ? Math.round((count_action / total_tests) * 100) : 0;
      
      res.json({
        total_tests,
        tracts_covered,
        avg_ppb,
        pct_above_action,
        no_db: false,
      });
    }
  } catch (err) {
    req.log.error({ err }, "Test results stats failed");
    res.status(502).json({ error: "Failed to load stats." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/test-results/download — CSV export
// ---------------------------------------------------------------------------

router.get("/test-results/download", async (req, res) => {
  if (!hasDb() && !hasSupabase()) {
    res.status(503).send("Database not configured.");
    return;
  }
  try {
    if (hasDb()) {
      const { getDb, testResultsTable } = await import("@workspace/db");
      const db = getDb();

      const rows = await db
        .select({
          fips: testResultsTable.fips,
          test_date: testResultsTable.test_date,
          lead_ppb: testResultsTable.lead_ppb,
          test_kit_brand: testResultsTable.test_kit_brand,
          result_category: testResultsTable.result_category,
          created_at: testResultsTable.created_at,
        })
        .from(testResultsTable)
        .orderBy(testResultsTable.created_at);

      const header = "fips,test_date,lead_ppb,test_kit_brand,result_category,submitted_at\n";
      const body = rows
        .map(r =>
          [
            r.fips,
            r.test_date,
            r.lead_ppb,
            r.test_kit_brand ? `"${r.test_kit_brand.replace(/"/g, '""')}"` : "",
            r.result_category,
            r.created_at.toISOString(),
          ].join(",")
        )
        .join("\n");

      const today = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="plumbum-water-tests-${today}.csv"`);
      res.send(header + body);
    } else {
      const { getSupabaseClient } = await import("@workspace/db");
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from("test_results")
        .select("fips, test_date, lead_ppb, test_kit_brand, result_category, created_at")
        .order("created_at");
        
      if (error) throw error;
      
      const header = "fips,test_date,lead_ppb,test_kit_brand,result_category,submitted_at\n";
      const body = (data || [])
        .map(r =>
          [
            r.fips,
            r.test_date,
            r.lead_ppb,
            r.test_kit_brand ? `"${r.test_kit_brand.replace(/"/g, '""')}"` : "",
            r.result_category,
            new Date(r.created_at).toISOString(),
          ].join(",")
        )
        .join("\n");

      const today = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="plumbum-water-tests-${today}.csv"`);
      res.send(header + body);
    }
  } catch (err) {
    req.log.error({ err }, "Test results CSV failed");
    res.status(502).send("Failed to generate CSV.");
  }
});

// ---------------------------------------------------------------------------
// GET /api/test-results?fips=... — tract-level aggregated results
// ---------------------------------------------------------------------------

router.get("/test-results", async (req, res) => {
  const fips = req.query.fips as string;

  if (!fips) {
    res.status(400).json({ error: "fips query parameter is required" });
    return;
  }

  if (!hasDb() && !hasSupabase()) {
    res.json({ fips, count: 0, avg_ppb: null, max_ppb: null, distribution: { action_required: 0, elevated: 0, safe: 0 }, latest_date: null, no_db: true });
    return;
  }

  try {
    if (hasDb()) {
      const { getDb, testResultsTable } = await import("@workspace/db");
      const db = getDb();

      const [agg] = await db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
          avg_ppb: sql<number>`round(avg(${testResultsTable.lead_ppb})::numeric, 1)`,
          max_ppb: sql<number>`max(${testResultsTable.lead_ppb})`,
          count_action: sql<number>`cast(sum(case when ${testResultsTable.result_category} = 'ACTION_REQUIRED' then 1 else 0 end) as integer)`,
          count_elevated: sql<number>`cast(sum(case when ${testResultsTable.result_category} = 'ELEVATED' then 1 else 0 end) as integer)`,
          count_safe: sql<number>`cast(sum(case when ${testResultsTable.result_category} = 'SAFE' then 1 else 0 end) as integer)`,
          latest_date: sql<string>`max(${testResultsTable.test_date})`,
        })
        .from(testResultsTable)
        .where(eq(testResultsTable.fips, fips));

      res.json({
        fips,
        count: agg?.total ?? 0,
        avg_ppb: agg?.avg_ppb ?? null,
        max_ppb: agg?.max_ppb ?? null,
        distribution: {
          action_required: agg?.count_action ?? 0,
          elevated: agg?.count_elevated ?? 0,
          safe: agg?.count_safe ?? 0,
        },
        latest_date: agg?.latest_date ?? null,
        no_db: false,
      });
    } else {
      const { getSupabaseClient } = await import("@workspace/db");
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from("test_results")
        .select("lead_ppb, result_category, test_date")
        .eq("fips", fips);
        
      if (error) throw error;
      
      const total = data?.length ?? 0;
      const sum_ppb = data?.reduce((acc, r) => acc + (r.lead_ppb || 0), 0) ?? 0;
      const avg_ppb = total > 0 ? Math.round((sum_ppb / total) * 10) / 10 : null;
      const max_ppb = total > 0 ? Math.max(...data.map(r => r.lead_ppb || 0)) : null;
      const count_action = data?.filter(r => r.result_category === 'ACTION_REQUIRED').length ?? 0;
      const count_elevated = data?.filter(r => r.result_category === 'ELEVATED').length ?? 0;
      const count_safe = data?.filter(r => r.result_category === 'SAFE').length ?? 0;
      const latest_date = total > 0 ? data.map(r => r.test_date).sort().pop() : null;

      res.json({
        fips,
        count: total,
        avg_ppb,
        max_ppb,
        distribution: {
          action_required: count_action,
          elevated: count_elevated,
          safe: count_safe,
        },
        latest_date,
        no_db: false,
      });
    }
  } catch (err) {
    req.log.error({ err }, "Test results query failed");
    res.status(502).json({ error: "Failed to load test results." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/test-results — submit a result
// ---------------------------------------------------------------------------

router.post("/test-results", async (req, res) => {
  const { fips, test_date, lead_ppb, test_kit_brand, notes, certified } = req.body as {
    fips: string;
    test_date: string;
    lead_ppb: number;
    test_kit_brand?: string;
    notes?: string;
    certified: boolean;
  };

  if (!fips || !test_date || lead_ppb == null || !certified) {
    res.status(400).json({ error: "fips, test_date, lead_ppb, and certified are required." });
    return;
  }

  if (typeof lead_ppb !== "number" || lead_ppb < 0 || lead_ppb > 1000) {
    res.status(400).json({ error: "lead_ppb must be a number between 0 and 1000." });
    return;
  }

  if (!hasDb() && !hasSupabase()) {
    res.status(503).json({ error: "Database not configured. Cannot save test results." });
    return;
  }

  try {
    const { getDb, testResultsTable, categorize } = await import("@workspace/db");
    const result_category = categorize(lead_ppb);

    if (hasDb()) {
      const db = getDb();
      const [inserted] = await db
        .insert(testResultsTable)
        .values({
          session_id: crypto.randomUUID(),
          fips,
          test_date,
          lead_ppb,
          test_kit_brand: test_kit_brand || null,
          result_category,
          notes: notes || null,
        })
        .returning({ id: testResultsTable.id, result_category: testResultsTable.result_category });

      req.log.info({ fips, lead_ppb, result_category }, "Test result submitted via Drizzle");
      res.status(201).json({ success: true, result_category, id: inserted.id });
    } else {
      const { getSupabaseClient } = await import("@workspace/db");
      const supabase = getSupabaseClient();
      const session_id = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("test_results")
        .insert({
          session_id,
          fips,
          test_date,
          lead_ppb,
          test_kit_brand: test_kit_brand || null,
          result_category,
          notes: notes || null,
        })
        .select("id")
        .single();
        
      if (error) throw error;
      
      req.log.info({ fips, lead_ppb, result_category }, "Test result submitted via Supabase JS Client");
      res.status(201).json({ success: true, result_category, id: data.id });
    }
  } catch (err) {
    req.log.error({ err }, "Test result submission failed");
    res.status(502).json({ error: "Failed to save result. Please try again." });
  }
});

export default router;
