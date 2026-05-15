"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { adjustStockSvc } from "@/server/services/master";

const adjustSchema = z.object({
  id: z.string().uuid(),
  delta: z.coerce.number().int(),
});

export async function adjustStockAction(
  input: { id: string; delta: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("stock.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = adjustSchema.parse(input);
    if (data.delta === 0) return { ok: false, error: "Delta tidak boleh 0" };
    await adjustStockSvc(actorId, data);
    revalidatePath("/stock");
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
