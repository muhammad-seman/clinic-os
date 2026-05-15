"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { markFeePaid, unmarkFeePaid } from "@/server/services/fee";

const markSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().min(1).max(16),
  amountCents: z.string().regex(/^\d+$/),
});

const unmarkSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().min(1).max(16),
});

export async function markFeePaidAction(
  input: { employeeId: string; period: string; amountCents: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("fee.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = markSchema.parse(input);
    if (BigInt(data.amountCents) <= 0n) return { ok: false, error: "Nominal harus > 0" };
    await markFeePaid(actorId, {
      employeeId: data.employeeId,
      period: data.period,
      amountCents: BigInt(data.amountCents),
    });
    revalidatePath("/fee");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function unmarkFeePaidAction(
  input: { employeeId: string; period: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("fee.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = unmarkSchema.parse(input);
    const row = await unmarkFeePaid(actorId, data);
    if (!row) return { ok: false, error: "Tidak ada catatan pembayaran untuk dibatalkan" };
    revalidatePath("/fee");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
