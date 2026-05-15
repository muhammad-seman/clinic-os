import "server-only";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  auditLog,
  rolePermissions,
  roles,
  sessions,
  users,
} from "@/server/db/schema";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  status: "active" | "pending" | "locked" | "disabled";
  totpEnabled: boolean;
  roleSlug: string;
  joined: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
};

export async function listUsers(): Promise<UserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      status: users.status,
      totpEnabled: users.totpEnabled,
      roleSlug: roles.slug,
      joined: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      lastLoginIp: sql<string | null>`${users.lastLoginIp}::text`,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .orderBy(desc(users.createdAt));
  return rows.map((r) => ({
    ...r,
    joined: r.joined.toISOString(),
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
  }));
}

export async function listRolesWithPerms(opts: { systemOnly?: boolean } = {}): Promise<{
  roles: { id: string; slug: string; label: string; isSystem: boolean }[];
  matrix: Record<string, string[]>;
}> {
  const rs = await db
    .select()
    .from(roles)
    .where(opts.systemOnly ? eq(roles.isSystem, true) : undefined)
    .orderBy(roles.label);
  const rps = await db.select().from(rolePermissions);
  const matrix: Record<string, string[]> = {};
  const byId: Record<string, string> = {};
  rs.forEach((r) => {
    byId[r.id] = r.slug;
    matrix[r.slug] = [];
  });
  rps.forEach((rp) => {
    const slug = byId[rp.roleId];
    if (slug) matrix[slug]!.push(rp.permissionKey);
  });
  return {
    roles: rs.map((r) => ({
      id: r.id,
      slug: r.slug,
      label: r.label,
      isSystem: r.isSystem,
    })),
    matrix,
  };
}

export async function setRolePermissions(roleSlug: string, keys: string[]) {
  const [r] = await db.select({ id: roles.id }).from(roles).where(eq(roles.slug, roleSlug)).limit(1);
  if (!r) throw new Error("role not found");
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, r.id));
  if (keys.length > 0) {
    await db
      .insert(rolePermissions)
      .values(keys.map((k) => ({ roleId: r.id, permissionKey: k })))
      .onConflictDoNothing();
  }
}

export type AuditRow = {
  id: string;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  target: string;
  result: "ok" | "fail" | "denied";
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, unknown>;
};

export async function listAudit(opts: {
  sinceDays?: number;
  actorId?: string | null;
  result?: "ok" | "fail" | "denied" | null;
  limit?: number;
}): Promise<AuditRow[]> {
  const conditions = [];
  if (opts.sinceDays && opts.sinceDays < 99999) {
    const cutoff = new Date(Date.now() - opts.sinceDays * 86400_000);
    conditions.push(gte(auditLog.occurredAt, cutoff));
  }
  if (opts.actorId) conditions.push(eq(auditLog.actorId, opts.actorId));
  if (opts.result) conditions.push(eq(auditLog.result, opts.result));

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLog.id,
      occurredAt: auditLog.occurredAt,
      actorId: auditLog.actorId,
      actorName: users.name,
      actorRole: roles.slug,
      action: auditLog.action,
      target: auditLog.target,
      result: auditLog.result,
      ip: sql<string | null>`${auditLog.ip}::text`,
      userAgent: auditLog.userAgent,
      meta: auditLog.meta,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(where)
    .orderBy(desc(auditLog.occurredAt))
    .limit(opts.limit ?? 200);

  return rows.map((r) => ({
    id: r.id.toString(),
    occurredAt: r.occurredAt.toISOString(),
    actorId: r.actorId,
    actorName: r.actorName,
    actorRole: r.actorRole,
    action: r.action,
    target: r.target,
    result: r.result,
    ip: r.ip,
    userAgent: r.userAgent,
    meta: (r.meta ?? {}) as Record<string, unknown>,
  }));
}

export type SessionRow = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  device: string;
  ip: string | null;
  city: string | null;
  geoFlag: string | null;
  startedAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export async function listActiveSessions(): Promise<SessionRow[]> {
  const rows = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      userName: users.name,
      userRole: roles.slug,
      device: sessions.deviceLabel,
      ip: sql<string | null>`${sessions.ip}::text`,
      city: sessions.city,
      geoFlag: sessions.geoFlag,
      startedAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(isNull(sessions.revokedAt))
    .orderBy(desc(sessions.lastSeenAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userRole: r.userRole,
    device: r.device ?? "—",
    ip: r.ip,
    city: r.city,
    geoFlag: r.geoFlag,
    startedAt: r.startedAt.toISOString(),
    lastSeenAt: r.lastSeenAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }));
}

export async function revokeSessionById(id: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, id));
}

export async function revokeAllSessions() {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(isNull(sessions.revokedAt));
}

export async function revokeSessionsForUser(userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function updateUserPatch(
  id: string,
  patch: { roleSlug?: string; totpEnabled?: boolean; status?: UserRow["status"] },
): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.totpEnabled !== undefined) update.totpEnabled = patch.totpEnabled;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.roleSlug) {
    const [r] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, patch.roleSlug))
      .limit(1);
    if (!r) throw new Error("role not found");
    update.roleId = r.id;
  }
  await db.update(users).set(update).where(eq(users.id, id));
}

export async function inviteUser(input: {
  name: string;
  email: string;
  roleSlug: string;
  totpRequired: boolean;
}): Promise<string> {
  const [r] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, input.roleSlug))
    .limit(1);
  if (!r) throw new Error("role not found");
  const [u] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      roleId: r.id,
      status: "pending",
      totpEnabled: input.totpRequired,
    })
    .returning({ id: users.id });
  return u!.id;
}

