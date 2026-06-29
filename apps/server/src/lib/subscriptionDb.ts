/**
 * SQLite subscription database using better-sqlite3.
 * Database file: apps/server/data/plumbum_subscriptions.db
 *
 * Schema:
 *   subscriptions — one row per active email+address pair
 */
import Database from "better-sqlite3";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

// ── DB path ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(): string {
  let dir = __dirname;
  while (dir && dir !== dirname(dir)) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = dirname(dir);
  }
  return process.cwd();
}

import { existsSync } from "node:fs";

const PROJECT_ROOT = findProjectRoot();
const DATA_DIR     = join(PROJECT_ROOT, "apps", "server", "data");
const DB_PATH      = join(DATA_DIR, "plumbum_subscriptions.db");

// Ensure the data directory exists
mkdirSync(DATA_DIR, { recursive: true });

// ── Open database ─────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  createSchema(_db);
  return _db;
}

// ── Schema ───────────────────────────────────────────────────────────────────

function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      email_enc        TEXT    NOT NULL,
      pwsid            TEXT    NOT NULL DEFAULT '',
      fips             TEXT    NOT NULL DEFAULT '',
      address_hash     TEXT    NOT NULL,
      risk_score       INTEGER NOT NULL DEFAULT 0,
      subscribed_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      last_notified_at TEXT,
      active           INTEGER NOT NULL DEFAULT 1,
      unsub_token      TEXT    NOT NULL UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_pwsid
      ON subscriptions (pwsid) WHERE active = 1;

    CREATE INDEX IF NOT EXISTS idx_subscriptions_fips
      ON subscriptions (fips) WHERE active = 1;

    CREATE INDEX IF NOT EXISTS idx_subscriptions_unsub_token
      ON subscriptions (unsub_token);
  `);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Subscription {
  id: number;
  email_enc: string;
  pwsid: string;
  fips: string;
  address_hash: string;
  risk_score: number;
  subscribed_at: string;
  last_notified_at: string | null;
  active: number;
  unsub_token: string;
}

export interface NewSubscription {
  email_enc: string;
  pwsid: string;
  fips: string;
  address_hash: string;
  risk_score: number;
  unsub_token: string;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Insert a new subscription. Returns the inserted row's id. */
export function insertSubscription(sub: NewSubscription): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO subscriptions (email_enc, pwsid, fips, address_hash, risk_score, unsub_token)
    VALUES (@email_enc, @pwsid, @fips, @address_hash, @risk_score, @unsub_token)
  `);
  const result = stmt.run(sub);
  return result.lastInsertRowid as number;
}

/** Check if an address hash is already subscribed and active. */
export function isAlreadySubscribed(addressHash: string): boolean {
  const db = getDb();
  const row = db.prepare(
    "SELECT id FROM subscriptions WHERE address_hash = ? AND active = 1 LIMIT 1"
  ).get(addressHash);
  return !!row;
}

/** Deactivate a subscription by its unsubscribe token. Returns true if found. */
export function unsubscribeByToken(token: string): boolean {
  const db = getDb();
  const result = db.prepare(
    "UPDATE subscriptions SET active = 0 WHERE unsub_token = ? AND active = 1"
  ).run(token);
  return result.changes > 0;
}

/** Count all active subscriptions. Used by the homepage stats strip. */
export function getActiveCount(): number {
  const db = getDb();
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM subscriptions WHERE active = 1"
  ).get() as { count: number };
  return row.count;
}

/** Get all active subscriptions for a given PWSID. Used by monitor script. */
export function getSubscriptionsByPwsid(pwsid: string): Subscription[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM subscriptions WHERE pwsid = ? AND active = 1"
  ).all(pwsid) as Subscription[];
}

/** Get all active subscriptions. Used by monitor script for full sweep. */
export function getAllActiveSubscriptions(): Subscription[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM subscriptions WHERE active = 1"
  ).all() as Subscription[];
}

/** Update last_notified_at for a subscription id. */
export function markNotified(id: number): void {
  const db = getDb();
  db.prepare(
    "UPDATE subscriptions SET last_notified_at = datetime('now') WHERE id = ?"
  ).run(id);
}
