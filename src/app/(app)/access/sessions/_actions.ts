"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { assert } from "@/server/auth/rbac";
import { log } from "@/server/auth/audit";
import {
  revokeAllSessions,
  revokeSessionById,
} from "@/server/repositories/access.repo";

type Result = { ok: true } | { ok: false; error: string };

export async function revokeSessionAction(sessionId: string): Promise<Result> {
  try {
    await assert("sessions.update");
    const session = await auth();
    const actorId = session?.user?.id ?? null;
    await revokeSessionById(sessionId);
    await log({
      actorId,
      action: "sessions.revoke",
      target: sessionId,
      result: "ok",
    });
    revalidatePath("/access/sessions");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function revokeAllSessionsAction(): Promise<Result> {
  try {
    await assert("sessions.delete");
    const session = await auth();
    const actorId = session?.user?.id ?? null;
    await revokeAllSessions();
    await log({
      actorId,
      action: "sessions.revoke_all",
      target: "*",
      result: "ok",
    });
    revalidatePath("/access/sessions");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
