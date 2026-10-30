// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  number: text("number").notNull().unique(), proposals: text("proposals").notNull(),
  createdAt: text("created_at").notNull(),
});
export const votes = sqliteTable("votes", {
  id: text("id").primaryKey(), voterHash: text("voter_hash").notNull().unique(),
  candidateId: text("candidate_id").references(() => candidates.id),
  createdAt: text("created_at").notNull(),
});
export const election = sqliteTable("election", {
  id: integer("id").primaryKey(),
  phase: text("phase").notNull().default("registration"),
  round: integer("round").notNull().default(1),
  version: integer("version").notNull().default(0),
  finalists: text("finalists").notNull().default("[]"),
});
export const ballots = sqliteTable("ballots", {
  id: text("id").primaryKey(),
  voterHash: text("voter_hash").notNull(),
  voterName: text("voter_name"),
  round: integer("round").notNull(),
  candidateId: text("candidate_id").references(() => candidates.id),
  createdAt: text("created_at").notNull(),
}, table => [uniqueIndex("ballots_voter_round_unique").on(table.voterHash, table.round)]);
