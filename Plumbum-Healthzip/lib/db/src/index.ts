// Lazy DB singleton — does NOT throw at import time if DATABASE_URL is missing.
// Call getDb() only when you actually need the database; it will throw then
// if DATABASE_URL is not set, giving you a clear error at call-time.
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

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
