import { sql } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category", {
      enum: ["operasional", "bahan", "gaji", "sewa", "marketing", "utilitas", "lainnya"],
    })
      .notNull()
      .default("lainnya"),
    description: text("description").notNull(),
    amountCents: bigint("amount_cents", { mode: "bigint" }).notNull().default(sql`0`),
    paymentMethod: text("payment_method", {
      enum: ["cash", "transfer", "qris", "lainnya"],
    })
      .notNull()
      .default("cash"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    occurredIdx: index("expenses_occurred_idx").on(t.occurredAt),
    categoryIdx: index("expenses_category_idx").on(t.category),
  }),
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
