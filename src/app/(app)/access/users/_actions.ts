"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { assert } from "@/server/auth/rbac";
import { log } from "@/server/auth/audit";
import {
  bulkUpdateUserStatus,
  createUser,
  deleteUsers,
  revokeSessionsForUser,
  updateUserPatch,
  type UserRow,
} from "@/server/repositories/access.repo";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function actorId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  return session.user.id;
}

export async function updateUserAction(
  userId: string,
  patch: { roleSlug?: string; status?: UserRow["status"] },
): Promise<Result> {
  try {
    await assert("users.update");
    const a = await actorId();
    await updateUserPatch(userId, patch);
    await log({ actorId: a, action: "users.update", target: userId, result: "ok", meta: patch });
    revalidatePath("/access/users");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function addUserAction(input: {
  name: string;
  email: string;
  roleSlug: string;
  password: string;
}): Promise<Result<{ id: string }>> {
  try {
    await assert("users.create");
    const a = await actorId();
    if (!input.email || !input.name || !input.password) {
      return { ok: false, error: "Nama, email dan password wajib diisi" };
    }
    if (input.password.length < 8) {
      return { ok: false, error: "Password minimal 8 karakter" };
    }
    const id = await createUser(input);
    await log({
      actorId: a,
      action: "users.create",
      target: id,
      result: "ok",
      meta: { email: input.email, role: input.roleSlug },
    });
    revalidatePath("/access/users");
    revalidatePath("/access/audit");
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function deleteUsersAction(ids: string[]): Promise<Result> {
  try {
    await assert("users.update");
    const a = await actorId();
    if (ids.length === 0) return { ok: true };
    await deleteUsers(ids);
    await log({
      actorId: a,
      action: "users.update",
      target: ids.join(","),
      result: "ok",
      meta: { op: "delete", count: ids.length },
    });
    revalidatePath("/access/users");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function bulkUpdateUsersStatusAction(
  ids: string[],
  status: UserRow["status"],
): Promise<Result> {
  try {
    await assert("users.update");
    const a = await actorId();
    if (ids.length === 0) return { ok: true };
    await bulkUpdateUserStatus(ids, status);
    await log({
      actorId: a,
      action: "users.update",
      target: ids.join(","),
      result: "ok",
      meta: { op: "bulk_status", status, count: ids.length },
    });
    revalidatePath("/access/users");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function revokeUserSessionsAction(
  userId: string,
): Promise<Result<{ count: number }>> {
  try {
    await assert("sessions.update");
    const a = await actorId();
    const count = await revokeSessionsForUser(userId);
    await log({
      actorId: a,
      action: "sessions.revoke",
      target: userId,
      result: "ok",
      meta: { count },
    });
    revalidatePath("/access/sessions");
    revalidatePath("/access/audit");
    return { ok: true, data: { count } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
