"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { recordAttendance } from "@/server/services/attendance";

const schema = z.object({
  employeeId: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
});

export async function recordAttendanceAction(
  input: { employeeId: string; lat: number; lng: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("attendance.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = schema.parse(input);
    await recordAttendance(actorId, data);
    revalidatePath("/attendance");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
