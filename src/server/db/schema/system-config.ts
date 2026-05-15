import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
