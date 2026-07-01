/**
 * Landlord Accountability database layer supporting both SQLite (local) and Supabase (cloud).
 */
import { getDb } from "./subscriptionDb.js";
import { getSupabaseClient } from "@workspace/db";

const hasSupabase = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

function isMissingSupabaseTableError(err: unknown): boolean {
  const text = [
    err instanceof Error ? err.message : "",
    typeof err === "object" && err !== null
      ? [
          "message" in err && typeof err.message === "string" ? err.message : "",
          "details" in err && typeof err.details === "string" ? err.details : "",
          "hint" in err && typeof err.hint === "string" ? err.hint : "",
          "code" in err && typeof err.code === "string" ? err.code : "",
        ].join(" ")
      : "",
    String(err),
  ]
    .join(" ")
    .toLowerCase();

  return /could not find the table|relation .* does not exist|pgrst205|42p01|undefined table/i.test(text);
}

// ── Schema Initialization (for local SQLite) ─────────────────────────────────

function seedFoundingNotices(_db: ReturnType<typeof getDb>): void {
  // Keep the accountability registry empty unless a real notice is submitted.
}

export function initLandlordSchema(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS landlord_notices (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      property_address       TEXT    NOT NULL,
      property_address_hash  TEXT    NOT NULL UNIQUE,
      risk_score             INTEGER NOT NULL,
      landlord_name          TEXT,
      management_company     TEXT,
      notice_date            TEXT    NOT NULL,
      landlord_response      TEXT    NOT NULL, -- PENDING / AGREED_TO_TEST / TESTED_NEGATIVE / TESTED_POSITIVE / REFUSED / NO_RESPONSE
      response_date          TEXT,
      submitter_anonymous_id TEXT    NOT NULL,
      verified               INTEGER NOT NULL DEFAULT 0,
      created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      notes                  TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_landlord_notices_address_hash
      ON landlord_notices (property_address_hash);

    CREATE INDEX IF NOT EXISTS idx_landlord_notices_response
      ON landlord_notices (landlord_response);
  `);
  seedFoundingNotices(db);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LandlordNotice {
  id: number;
  property_address: string;
  property_address_hash: string;
  risk_score: number;
  landlord_name: string | null;
  management_company: string | null;
  notice_date: string;
  landlord_response: "PENDING" | "AGREED_TO_TEST" | "TESTED_NEGATIVE" | "TESTED_POSITIVE" | "REFUSED" | "NO_RESPONSE";
  response_date: string | null;
  submitter_anonymous_id: string;
  verified: number;
  created_at: string;
  notes: string | null;
}

export interface NewLandlordNotice {
  property_address: string;
  property_address_hash: string;
  risk_score: number;
  landlord_name?: string;
  management_company?: string;
  notice_date: string;
  landlord_response: string;
  response_date?: string;
  submitter_anonymous_id: string;
  notes?: string;
}

// Initialize schema if using SQLite
initLandlordSchema();

// ── Queries ───────────────────────────────────────────────────────────────────

/** Insert or update a landlord notice (upsert on address hash match). */
export async function insertOrUpdateNotice(notice: NewLandlordNotice): Promise<number> {
  if (hasSupabase()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("landlord_notices")
        .upsert({
          property_address: notice.property_address,
          property_address_hash: notice.property_address_hash,
          risk_score: notice.risk_score,
          landlord_name: notice.landlord_name || null,
          management_company: notice.management_company || null,
          notice_date: notice.notice_date,
          landlord_response: notice.landlord_response.toUpperCase(),
          response_date: notice.response_date || null,
          submitter_anonymous_id: notice.submitter_anonymous_id,
          notes: notice.notes || null,
          created_at: new Date().toISOString(),
        }, {
          onConflict: "property_address_hash"
        })
        .select();

      if (error) throw error;
      return data?.[0]?.id ?? 0;
    } catch (err) {
      console.warn("Supabase landlord notices unavailable; using SQLite fallback.", err);
    }
  }

  // SQLite fallback
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO landlord_notices (
      property_address, property_address_hash, risk_score, landlord_name,
      management_company, notice_date, landlord_response, response_date,
      submitter_anonymous_id, notes
    ) VALUES (
      @property_address, @property_address_hash, @risk_score, @landlord_name,
      @management_company, @notice_date, @landlord_response, @response_date,
      @submitter_anonymous_id, @notes
    )
    ON CONFLICT(property_address_hash) DO UPDATE SET
      landlord_response = excluded.landlord_response,
      response_date = excluded.response_date,
      notice_date = excluded.notice_date,
      landlord_name = COALESCE(excluded.landlord_name, landlord_notices.landlord_name),
      management_company = COALESCE(excluded.management_company, landlord_notices.management_company),
      notes = COALESCE(excluded.notes, landlord_notices.notes),
      created_at = datetime('now')
  `);
  const result = stmt.run({
    property_address: notice.property_address,
    property_address_hash: notice.property_address_hash,
    risk_score: notice.risk_score,
    landlord_name: notice.landlord_name || null,
    management_company: notice.management_company || null,
    notice_date: notice.notice_date,
    landlord_response: notice.landlord_response,
    response_date: notice.response_date || null,
    submitter_anonymous_id: notice.submitter_anonymous_id,
    notes: notice.notes || null,
  });
  return result.lastInsertRowid as number;
}

/** Search the database with filter and sort options */
export async function searchNotices(query: string, sortBy: "recent" | "urgent"): Promise<LandlordNotice[]> {
  if (hasSupabase()) {
    try {
      const supabase = getSupabaseClient();
      let queryBuilder = supabase.from("landlord_notices").select("*");
      
      if (query && query.trim()) {
        const q = `%${query.trim().toLowerCase()}%`;
        queryBuilder = queryBuilder.or(`property_address.ilike.${q},landlord_name.ilike.${q},management_company.ilike.${q}`);
      }
      
      const { data, error } = await queryBuilder;
      if (error) throw error;

      const notices = (data || []) as LandlordNotice[];

      if (sortBy === "urgent") {
        return notices.sort((a, b) => {
          const aRefused = a.landlord_response === 'REFUSED' ? 1 : 0;
          const bRefused = b.landlord_response === 'REFUSED' ? 1 : 0;
          if (aRefused !== bRefused) return bRefused - aRefused;
          if (a.risk_score !== b.risk_score) return b.risk_score - a.risk_score;
          return new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime();
        });
      } else {
        return notices.sort((a, b) => {
          const noticeDateDiff = new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime();
          if (noticeDateDiff !== 0) return noticeDateDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }
    } catch (err) {
      console.warn("Supabase landlord notices unavailable; using SQLite fallback.", err);
    }
  }

  // SQLite fallback
  const db = getDb();
  let sqlStr = "SELECT * FROM landlord_notices";
  const params: any[] = [];

  if (query && query.trim()) {
    const q = `%${query.trim().toLowerCase()}%`;
    sqlStr += ` WHERE 
      LOWER(property_address) LIKE ? OR 
      LOWER(landlord_name) LIKE ? OR 
      LOWER(management_company) LIKE ?`;
    params.push(q, q, q);
  }

  if (sortBy === "urgent") {
    sqlStr += ` ORDER BY 
      CASE WHEN landlord_response = 'REFUSED' THEN 1 ELSE 0 END DESC,
      risk_score DESC,
      notice_date DESC`;
  } else {
    sqlStr += " ORDER BY notice_date DESC, created_at DESC";
  }

  return db.prepare(sqlStr).all(params) as LandlordNotice[];
}

/** Get unresolved high-risk properties (Most Urgent tab for journalists) */
export async function getUrgentNotices(): Promise<LandlordNotice[]> {
  if (hasSupabase()) {
    try {
      const supabase = getSupabaseClient();
      const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("landlord_notices")
        .select("*")
        .gt("risk_score", 80)
        .lte("notice_date", thirtyDaysAgoStr)
        .in("landlord_response", ["PENDING", "NO_RESPONSE", "REFUSED"])
        .order("risk_score", { ascending: false })
        .order("notice_date", { ascending: false });

      if (error) throw error;
      return (data || []) as LandlordNotice[];
    } catch (err) {
      console.warn("Supabase landlord notices unavailable; using SQLite fallback.", err);
    }
  }

  // SQLite fallback
  const db = getDb();
  const sqlStr = `
    SELECT * FROM landlord_notices
    WHERE risk_score > 80
      AND notice_date <= date('now', '-30 days')
      AND landlord_response IN ('PENDING', 'NO_RESPONSE', 'REFUSED')
    ORDER BY risk_score DESC, notice_date DESC
  `;
  return db.prepare(sqlStr).all() as LandlordNotice[];
}

/** Get summary statistics for the strip above search results */
export interface AccountabilityStats {
  total: number;
  noResponsePct: number;
  agreedToTestPct: number;
  refusedPct: number;
}

export async function getAccountabilityStats(): Promise<AccountabilityStats> {
  if (hasSupabase()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("landlord_notices")
        .select("landlord_response");

      if (error) throw error;

      const total = data?.length ?? 0;
      if (total === 0) {
        return { total: 0, noResponsePct: 0, agreedToTestPct: 0, refusedPct: 0 };
      }
      
      let no_resp = 0;
      let agreed = 0;
      let refused = 0;
      for (const r of data || []) {
        if (r.landlord_response === "NO_RESPONSE") no_resp++;
        else if (r.landlord_response === "AGREED_TO_TEST") agreed++;
        else if (r.landlord_response === "REFUSED") refused++;
      }
      
      return {
        total,
        noResponsePct: Math.round((no_resp / total) * 100),
        agreedToTestPct: Math.round((agreed / total) * 100),
        refusedPct: Math.round((refused / total) * 100),
      };
    } catch (err) {
      console.warn("Supabase landlord notices unavailable; using SQLite fallback.", err);
    }
  }

  // SQLite fallback
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN landlord_response = 'NO_RESPONSE' THEN 1 ELSE 0 END) as no_resp,
      SUM(CASE WHEN landlord_response = 'AGREED_TO_TEST' THEN 1 ELSE 0 END) as agreed,
      SUM(CASE WHEN landlord_response = 'REFUSED' THEN 1 ELSE 0 END) as refused
    FROM landlord_notices
  `).get() as { total: number; no_resp: number; agreed: number; refused: number };

  if (!row || row.total === 0) {
    return { total: 0, noResponsePct: 0, agreedToTestPct: 0, refusedPct: 0 };
  }

  return {
    total: row.total,
    noResponsePct: Math.round((row.no_resp / row.total) * 100),
    agreedToTestPct: Math.round((row.agreed / row.total) * 100),
    refusedPct: Math.round((row.refused / row.total) * 100),
  };
}
