import "server-only";
import { insertBooking } from "@/server/repositories/booking.repo";
import { createBookingSchema } from "@/lib/validation/booking";
import { getOperatingHours } from "@/server/services/system-config";
import { log as audit } from "@/server/auth/audit";

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

export async function createBooking(actorId: string, input: unknown) {
  const data = createBookingSchema.parse(input);

  // Enforce jam operasional (config).
  const hours = await getOperatingHours();
  const shifted = new Date(data.scheduledAt.getTime() + WITA_OFFSET_MS);
  const h = shifted.getUTCHours();
  if (h < hours.openHour || h >= hours.closeHour) {
    throw new Error(
      `Jadwal di luar jam operasional klinik (${String(hours.openHour).padStart(2, "0")}:00 – ${String(hours.closeHour).padStart(2, "0")}:00 WITA)`,
    );
  }

  const row = await insertBooking(data);
  await audit({
    actorId,
    action: "booking.create",
    target: row.code,
    result: "ok",
    meta: { id: row.id, clientName: data.clientName },
  });
  return row;
}
