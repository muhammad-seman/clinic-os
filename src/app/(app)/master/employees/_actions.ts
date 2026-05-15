"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { createEmployeeSvc } from "@/server/services/master";

export async function createEmployeeAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("master.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await createEmployeeSvc(actorId, {
      name: formData.get("name"),
      type: formData.get("type"),
      phone: formData.get("phone") || null,
    });
    revalidatePath("/master/employees");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
