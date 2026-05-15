import { boolean, index, inet, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: text("status", { enum: ["active", "pending", "locked", "disabled"] })
      .notNull()
      .default("pending"),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    failedAttempts: smallint("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: inet("last_login_ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roleIdx: index("users_role_idx").on(t.roleId),
    statusIdx: index("users_status_idx").on(t.status),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
