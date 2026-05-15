import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { systemConfig } from "@/server/db/schema";
import { log as audit } from "@/server/auth/audit";

export type ClinicConfig = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  timezone: string;
};

export type ThresholdConfig = {
  aprioriSupport: number;
  aprioriConfidence: number;
  lowStockMultiplier: number;
};

const DEFAULT_CLINIC: ClinicConfig = {
  name: "NS Aesthetic — Cab. Makassar",
  address: "Jl. Boulevard Raya No. 18, Panakkukang, Makassar",
  lat: -5.13821,
  lng: 119.42378,
  radius: 80,
  timezone: "Asia/Makassar (WITA)",
};

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  aprioriSupport: 0.1,
  aprioriConfidence: 0.6,
  lowStockMultiplier: 1.0,
};

async function readKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const [row] = await db
      .select({ value: systemConfig.value })
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);
    if (!row) return fallback;
    return { ...fallback, ...(row.value as object) } as T;
  } catch {
    return fallback;
  }
}

export async function getClinicConfig(): Promise<ClinicConfig> {
  return readKey<ClinicConfig>("clinic", DEFAULT_CLINIC);
}

export async function getThresholds(): Promise<ThresholdConfig> {
  return readKey<ThresholdConfig>("thresholds", DEFAULT_THRESHOLDS);
}

export async function saveSystemConfig(
  actorId: string,
  patch: { clinic?: Partial<ClinicConfig>; thresholds?: Partial<ThresholdConfig> },
) {
  if (patch.clinic) {
    const current = await getClinicConfig();
    const next: ClinicConfig = { ...current, ...patch.clinic };
    await db
      .insert(systemConfig)
      .values({ key: "clinic", value: next, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: next, updatedAt: new Date() },
      });
  }
  if (patch.thresholds) {
    const current = await getThresholds();
    const next: ThresholdConfig = { ...current, ...patch.thresholds };
    await db
      .insert(systemConfig)
      .values({ key: "thresholds", value: next, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: next, updatedAt: new Date() },
      });
  }
  await audit({
    actorId,
    action: "config.update",
    target: "system",
    result: "ok",
    meta: { keys: Object.keys(patch) },
  });
}
