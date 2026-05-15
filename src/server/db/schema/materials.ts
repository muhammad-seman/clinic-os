import { bigint, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  costCents: bigint("cost_cents", { mode: "bigint" }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Material = typeof materials.$inferSelect;
