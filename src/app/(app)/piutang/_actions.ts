"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { settleBooking } from "@/server/services/booking/settle";

export async function settleRemainingAction(
  id: string,
  amountCents: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("piutang.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await settleBooking(actorId, { id, amountCents });
    revalidatePath("/piutang");
    revalidatePath("/bookings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
