import "server-only";
import { db } from "@/server/db/client";
import { auditLog } from "@/server/db/schema";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  target: string;
  result: "ok" | "fail" | "denied";
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
};

export async function log(entry: AuditInput): Promise<void> {
  await db.insert(auditLog).values({
    actorId: entry.actorId ?? null,
    action: entry.action,
    target: entry.target,
    result: entry.result,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    meta: entry.meta ?? {},
  });
}
