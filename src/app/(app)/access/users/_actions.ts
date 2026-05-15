"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { assert } from "@/server/auth/rbac";
import { log } from "@/server/auth/audit";
import {
  inviteUser,
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
  patch: { roleSlug?: string; totpEnabled?: boolean; status?: UserRow["status"] },
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

export async function inviteUserAction(input: {
  name: string;
  email: string;
  roleSlug: string;
  totpRequired: boolean;
}): Promise<Result<{ id: string }>> {
  try {
    await assert("users.create");
    const a = await actorId();
    const id = await inviteUser(input);
    await log({
      actorId: a,
      action: "users.invite",
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

export async function revokeUserSessionsAction(userId: string): Promise<Result> {
  try {
    await assert("sessions.update");
    const a = await actorId();
    await revokeSessionsForUser(userId);
    await log({ actorId: a, action: "sessions.revoke", target: userId, result: "ok" });
    revalidatePath("/access/sessions");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
