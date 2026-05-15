import { index, inet, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    deviceLabel: text("device_label"),
    city: text("city"),
    geoFlag: text("geo_flag"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    lastSeenIdx: index("sessions_last_seen_idx").on(t.lastSeenAt),
  }),
);

export type Session = typeof sessions.$inferSelect;
