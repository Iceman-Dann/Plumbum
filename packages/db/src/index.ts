// Lazy DB singleton — does NOT throw at import time if DATABASE_URL is missing.
// Call getDb() only when you actually need the database; it will throw then
// if DATABASE_URL is not set, giving you a clear error at call-time.
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_KEY must be set to use the Supabase client."
    );
  }
  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }
  if (!_db) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export function getPool(): pg.Pool {
  getDb(); // ensures pool is initialised
  return _pool!;
}

export * from "./schema";
export { sql, eq, desc, and, or, gte, lte, like, relations } from "drizzle-orm";
