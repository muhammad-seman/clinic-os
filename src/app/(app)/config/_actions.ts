"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { saveSystemConfig } from "@/server/services/system-config";

const schema = z.object({
  clinic: z
    .object({
      name: z.string().min(1).max(200),
      address: z.string().min(1).max(400),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().int().min(10).max(2000),
    })
    .optional(),
  thresholds: z
    .object({
      aprioriSupport: z.number().min(0).max(1),
      aprioriConfidence: z.number().min(0).max(1),
      lowStockMultiplier: z.number().min(0.1).max(5),
    })
    .optional(),
});

export async function saveConfigAction(
  input: z.infer<typeof schema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("config.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    const data = schema.parse(input);
    await saveSystemConfig(actorId, {
      ...(data.clinic ? { clinic: data.clinic } : {}),
      ...(data.thresholds ? { thresholds: data.thresholds } : {}),
    });
    revalidatePath("/config");
    revalidatePath("/attendance");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
