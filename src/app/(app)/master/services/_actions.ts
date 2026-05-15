"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { createServiceSvc } from "@/server/services/master";

export async function createServiceAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("master.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await createServiceSvc(actorId, {
      name: formData.get("name"),
      categoryId: formData.get("categoryId") || null,
      priceCents: formData.get("priceCents"),
      durationMin: formData.get("durationMin") || 30,
    });
    revalidatePath("/master/services");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
