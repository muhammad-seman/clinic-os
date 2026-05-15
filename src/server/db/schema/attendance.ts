import { boolean, doublePrecision, index, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    distanceM: integer("distance_m").notNull(),
    inRange: boolean("in_range").notNull(),
  },
  (t) => ({ empIdx: index("attendance_emp_idx").on(t.employeeId, t.recordedAt) }),
);

export type Attendance = typeof attendance.$inferSelect;
