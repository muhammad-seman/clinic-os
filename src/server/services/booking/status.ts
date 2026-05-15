import "server-only";
import { z } from "zod";
import { updateBookingStatus } from "@/server/repositories/booking.repo";
import { log as audit } from "@/server/auth/audit";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "in_progress", "done", "cancelled", "no_show"]),
});

export async function setBookingStatus(actorId: string, input: unknown) {
  const data = schema.parse(input);
  const [row] = await updateBookingStatus(data.id, data.status);
  await audit({
    actorId,
    action: "booking.status",
    target: data.id,
    result: row ? "ok" : "fail",
    meta: { status: data.status },
  });
  return row;
}
