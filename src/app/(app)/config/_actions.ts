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
      radius: z.number().int().min(1),
    })
    .optional(),
  thresholds: z
    .object({
      aprioriSupport: z.number().min(0).max(1),
      aprioriConfidence: z.number().min(0).max(1),
    })
    .optional(),
  hours: z
    .object({
      openHour: z.number().int().min(0).max(23),
      closeHour: z.number().int().min(1).max(24),
    })
    .refine((v) => v.closeHour > v.openHour, "closeHour harus lebih besar dari openHour")
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
      ...(data.hours ? { hours: data.hours } : {}),
    });
    revalidatePath("/config");
    revalidatePath("/attendance");
    revalidatePath("/calendar");
    revalidatePath("/bookings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
