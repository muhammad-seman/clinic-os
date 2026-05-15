import { sql } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const feePayments = pgTable(
  "fee_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    amountCents: bigint("amount_cents", { mode: "bigint" }).notNull().default(sql`0`),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
  },
  (t) => ({
    uniq: uniqueIndex("fee_payments_emp_period_uniq").on(t.employeeId, t.period),
    periodIdx: index("fee_payments_period_idx").on(t.period),
  }),
);

export type FeePayment = typeof feePayments.$inferSelect;
