"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { createMaterialSvc, adjustStockSvc } from "@/server/services/master";

export async function createMaterialAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("master.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await createMaterialSvc(actorId, {
      name: formData.get("name"),
      unit: formData.get("unit"),
      costCents: formData.get("costCents"),
      stock: formData.get("stock") || 0,
      minStock: formData.get("minStock") || 0,
    });
    revalidatePath("/master/materials");
    revalidatePath("/stock");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function adjustStockAction(
  id: string,
  delta: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("stock.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await adjustStockSvc(actorId, { id, delta });
    revalidatePath("/master/materials");
    revalidatePath("/stock");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
