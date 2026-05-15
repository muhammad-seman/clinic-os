import "server-only";
import { insertBooking } from "@/server/repositories/booking.repo";
import { createBookingSchema } from "@/lib/validation/booking";
import { log as audit } from "@/server/auth/audit";

export async function createBooking(actorId: string, input: unknown) {
  const data = createBookingSchema.parse(input);
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
