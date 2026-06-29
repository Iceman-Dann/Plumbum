import { pgTable, serial, varchar, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchesTable = pgTable("searches", {
  id: serial("id").primaryKey(),
  fips: varchar("fips", { length: 11 }).notNull(),
  score: integer("score").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  country: varchar("country", { length: 2 }).notNull().default('us'),
  city: varchar("city", { length: 100 }),
  session_id: varchar("session_id", { length: 36 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSearchSchema = createInsertSchema(searchesTable).omit({ id: true, created_at: true });
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searchesTable.$inferSelect;
