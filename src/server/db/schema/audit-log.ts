import { bigserial, index, inet, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    target: text("target").notNull(),
    result: text("result", { enum: ["ok", "fail", "denied"] }).notNull(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    meta: jsonb("meta").notNull().default({}),
  },
  (t) => ({
    actorIdx: index("audit_actor_idx").on(t.actorId, t.occurredAt),
    actionIdx: index("audit_action_idx").on(t.action, t.occurredAt),
  }),
);

export type AuditEntry = typeof auditLog.$inferSelect;
