"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { recordAttendance } from "@/server/services/attendance";

const schema = z.object({
  lat: z.number(),
  lng: z.number(),
  targetUserId: z.string().uuid().optional(),
});

export async function recordAttendanceAction(
  input: { lat: number; lng: number; targetUserId?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("attendance.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = schema.parse(input);
    // Hanya boleh proxy kalau punya permission khusus.
    if (data.targetUserId && data.targetUserId !== actorId) {
      await assert("attendance.proxy");
    }
    await recordAttendance(actorId, data);
    revalidatePath("/attendance");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
