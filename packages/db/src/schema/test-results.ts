import { pgTable, serial, varchar, doublePrecision, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  session_id: varchar("session_id", { length: 36 }).notNull(),
  fips: varchar("fips", { length: 11 }).notNull(),
  test_date: date("test_date").notNull(),
  lead_ppb: doublePrecision("lead_ppb").notNull(),
  test_kit_brand: varchar("test_kit_brand", { length: 200 }),
  result_category: varchar("result_category", { length: 20 }).notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({
  id: true,
  created_at: true,
  session_id: true,
  result_category: true,
});

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;

export function categorize(ppb: number): "ACTION_REQUIRED" | "ELEVATED" | "SAFE" {
  if (ppb >= 15) return "ACTION_REQUIRED";
  if (ppb >= 5) return "ELEVATED";
  return "SAFE";
}
