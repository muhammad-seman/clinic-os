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
};

/**
 * Jam operasional klinik dalam zona WITA (Asia/Makassar).
 * openHour inklusif (0..23), closeHour eksklusif (1..24).
 * Contoh: openHour=9, closeHour=21 → klinik buka 09:00 sampai 21:00.
 */
export type OperatingHoursConfig = {
  openHour: number;
  closeHour: number;
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
};

const DEFAULT_HOURS: OperatingHoursConfig = {
  openHour: 9,
  closeHour: 21,
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
  } catch (e) {
    // surface DB issues (e.g. missing table) instead of silently masking them
    console.error(`[system-config] readKey("${key}") failed:`, e);
    return fallback;
  }
}

export async function getClinicConfig(): Promise<ClinicConfig> {
  return readKey<ClinicConfig>("clinic", DEFAULT_CLINIC);
}

export async function getThresholds(): Promise<ThresholdConfig> {
  return readKey<ThresholdConfig>("thresholds", DEFAULT_THRESHOLDS);
}

export async function getOperatingHours(): Promise<OperatingHoursConfig> {
  const cfg = await readKey<OperatingHoursConfig>("hours", DEFAULT_HOURS);
  // Clamp & sanity check
  const open = Math.max(0, Math.min(23, Math.floor(cfg.openHour)));
  const close = Math.max(open + 1, Math.min(24, Math.floor(cfg.closeHour)));
  return { openHour: open, closeHour: close };
}

export async function saveSystemConfig(
  actorId: string,
  patch: {
    clinic?: Partial<ClinicConfig>;
    thresholds?: Partial<ThresholdConfig>;
    hours?: Partial<OperatingHoursConfig>;
  },
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
  if (patch.hours) {
    const current = await getOperatingHours();
    const next: OperatingHoursConfig = { ...current, ...patch.hours };
    await db
      .insert(systemConfig)
      .values({ key: "hours", value: next, updatedAt: new Date() })
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
