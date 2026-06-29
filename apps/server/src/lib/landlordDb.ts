/**
 * Landlord Accountability database layer using better-sqlite3.
 * Reuses the database connection from subscriptionDb.ts
 */
import { getDb } from "./subscriptionDb.js";

// ── Schema Initialization ───────────────────────────────────────────────────

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
      landlord_response      TEXT    NOT NULL, -- enum: PENDING / AGREED_TO_TEST / TESTED_NEGATIVE / TESTED_POSITIVE / REFUSED / NO_RESPONSE
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

// Ensure schema is created on import
initLandlordSchema();

// ── Queries ───────────────────────────────────────────────────────────────────

/** Insert or update a landlord notice (upsert on address hash match). */
export function insertOrUpdateNotice(notice: NewLandlordNotice): number {
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
export function searchNotices(query: string, sortBy: "recent" | "urgent"): LandlordNotice[] {
  const db = getDb();
  let sql = "SELECT * FROM landlord_notices";
  const params: any[] = [];

  if (query && query.trim()) {
    const q = `%${query.trim().toLowerCase()}%`;
    sql += ` WHERE 
      LOWER(property_address) LIKE ? OR 
      LOWER(landlord_name) LIKE ? OR 
      LOWER(management_company) LIKE ?`;
    params.push(q, q, q);
  }

  if (sortBy === "urgent") {
    // Sort Refused + High risk score to top, followed by other status codes and risk scores
    sql += ` ORDER BY 
      CASE WHEN landlord_response = 'REFUSED' THEN 1 ELSE 0 END DESC,
      risk_score DESC,
      notice_date DESC`;
  } else {
    // default: recent
    sql += " ORDER BY notice_date DESC, created_at DESC";
  }

  return db.prepare(sql).all(params) as LandlordNotice[];
}

/** Get unresolved high-risk properties (Most Urgent tab for journalists) */
export function getUrgentNotices(): LandlordNotice[] {
  const db = getDb();
  // Criteria:
  // - risk_score > 80
  // - notice_date <= 30 days ago
  // - response is NO_RESPONSE, PENDING, or REFUSED
  const sql = `
    SELECT * FROM landlord_notices
    WHERE risk_score > 80
      AND notice_date <= date('now', '-30 days')
      AND landlord_response IN ('PENDING', 'NO_RESPONSE', 'REFUSED')
    ORDER BY risk_score DESC, notice_date DESC
  `;
  return db.prepare(sql).all() as LandlordNotice[];
}

/** Get summary statistics for the strip above search results */
export interface AccountabilityStats {
  total: number;
  noResponsePct: number;
  agreedToTestPct: number;
  refusedPct: number;
}

export function getAccountabilityStats(): AccountabilityStats {
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
