import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { auth } from "./config";
import { db } from "@/server/db/client";
import { rolePermissions, roles, sessions, users } from "@/server/db/schema";
import type { RoleSnapshot } from "@/lib/rbac/check";

export class ForbiddenError extends Error {
  status = 403;
}
export class UnauthorizedError extends Error {
  status = 401;
}

type Serializable = { slug: string; permissions: string[] };

async function loadRoleForUser(userId: string): Promise<Serializable | null> {
  const [u] = await db.select({ roleId: users.roleId }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  const [r] = await db.select({ slug: roles.slug }).from(roles).where(eq(roles.id, u.roleId)).limit(1);
  if (!r) return null;
  const perms = await db
    .select({ key: rolePermissions.permissionKey })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, u.roleId));
  return { slug: r.slug, permissions: perms.map((p) => p.key) };
}

async function isSessionValid(sid: string): Promise<boolean> {
  const [s] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sid), isNull(sessions.revokedAt)))
    .limit(1);
  return !!s;
}

export async function currentRole(): Promise<RoleSnapshot | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  const sid = (session as { sid?: string }).sid;
  if (sid && !(await isSessionValid(sid))) return null;
  const cached = unstable_cache(
    () => loadRoleForUser(uid),
    ["rbac:v2", uid],
    { revalidate: 60, tags: [`rbac:${uid}`] },
  );
  const data = await cached();
  if (!data) return null;
  return { slug: data.slug, permissions: new Set(data.permissions) };
}

export async function assert(key: string): Promise<RoleSnapshot> {
  const role = await currentRole();
  if (!role) throw new UnauthorizedError("not signed in");
  if (!role.permissions.has(key)) throw new ForbiddenError(`missing permission: ${key}`);
  return role;
}
