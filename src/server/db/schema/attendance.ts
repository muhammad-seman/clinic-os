import { boolean, doublePrecision, index, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    distanceM: integer("distance_m").notNull(),
    inRange: boolean("in_range").notNull(),
  },
  (t) => ({ userIdx: index("attendance_user_idx").on(t.userId, t.recordedAt) }),
);

export type Attendance = typeof attendance.$inferSelect;
