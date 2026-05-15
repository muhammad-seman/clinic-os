import { sql } from "drizzle-orm";
import { bigint, index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { services } from "./services";
import { packages } from "./packages";
import { employees } from "./employees";
import { taskRoles } from "./task-roles";
import { clients } from "./clients";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name").notNull(),
    clientPhone: text("client_phone"),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "set null" }),
    doctorId: uuid("doctor_id").references(() => employees.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status", {
      enum: ["scheduled", "in_progress", "done", "cancelled", "no_show"],
    })
      .notNull()
      .default("scheduled"),
    payment: text("payment", { enum: ["unpaid", "dp", "termin", "paid"] })
      .notNull()
      .default("unpaid"),
    paidCents: bigint("paid_cents", { mode: "bigint" }).notNull().default(sql`0`),
    remainingCents: bigint("remaining_cents", { mode: "bigint" }).notNull().default(sql`0`),
    dueAt: timestamp("due_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scheduledIdx: index("bookings_scheduled_idx").on(t.scheduledAt),
    statusIdx: index("bookings_status_idx").on(t.status),
  }),
);

export const bookingAssignments = pgTable(
  "booking_assignments",
  {
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => taskRoles.id),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    feeCents: bigint("fee_cents", { mode: "bigint" }).notNull().default(sql`0`),
  },
  (t) => ({ pk: primaryKey({ columns: [t.bookingId, t.roleId, t.employeeId] }) }),
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
