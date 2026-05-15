import { sql } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { users } from "./users";

export const bookingPayments = pgTable(
  "booking_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    amountCents: bigint("amount_cents", { mode: "bigint" }).notNull().default(sql`0`),
    method: text("method", { enum: ["cash", "transfer", "qris", "lainnya"] })
      .notNull()
      .default("cash"),
    note: text("note"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index("booking_payments_booking_idx").on(t.bookingId),
    paidIdx: index("booking_payments_paid_idx").on(t.paidAt),
  }),
);

export type BookingPayment = typeof bookingPayments.$inferSelect;
export type NewBookingPayment = typeof bookingPayments.$inferInsert;
