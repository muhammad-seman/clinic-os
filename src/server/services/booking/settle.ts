import "server-only";
import { applyPayment, insertBookingPayment } from "@/server/repositories/booking.repo";
import { settleBookingSchema } from "@/lib/validation/booking";
import { log as audit } from "@/server/auth/audit";

export async function settleBooking(actorId: string, input: unknown) {
  const data = settleBookingSchema.parse(input);
  // Record this installment in the history table for traceability.
  await insertBookingPayment({
    bookingId: data.id,
    amountCents: data.amountCents,
    method: data.method,
    note: data.note ?? null,
    recordedBy: actorId,
  });
  const [row] = await applyPayment(data.id, data.amountCents);
  await audit({
    actorId,
    action: "booking.settle",
    target: data.id,
    result: row ? "ok" : "fail",
    meta: { amountCents: data.amountCents.toString(), method: data.method },
  });
  return row;
}
