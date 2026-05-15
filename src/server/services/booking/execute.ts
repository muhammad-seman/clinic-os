import "server-only";
import { z } from "zod";
import {
  replaceBookingAssignments,
  updateBookingStatus,
  getBookingDetail,
} from "@/server/repositories/booking.repo";
import { log as audit } from "@/server/auth/audit";

const assignmentSchema = z.object({
  roleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  feeCents: z.coerce.bigint().nonnegative(),
});

const executeSchema = z.object({
  id: z.string().uuid(),
  assignments: z.array(assignmentSchema),
  nextStatus: z.enum(["in_progress", "done"]).optional(),
});

export async function saveBookingExecution(actorId: string, input: unknown) {
  const data = executeSchema.parse(input);
  await replaceBookingAssignments(data.id, data.assignments);
  await audit({
    actorId,
    action: "booking.execute.save",
    target: data.id,
    result: "ok",
    meta: { assignments: data.assignments.length },
  });
}

export async function finalizeBookingExecution(actorId: string, input: unknown) {
  const data = executeSchema.parse(input);
  const prev = await getBookingDetail(data.id);
  if (!prev) throw new Error("booking not found");

  await replaceBookingAssignments(data.id, data.assignments);

  // Auto state-machine: scheduled → in_progress → done.
  // Caller can override via nextStatus.
  let nextStatus: "in_progress" | "done" | null = null;
  if (data.nextStatus) {
    nextStatus = data.nextStatus;
  } else if (prev.status === "scheduled") {
    nextStatus = "in_progress";
  } else if (prev.status === "in_progress") {
    nextStatus = "done";
  }

  if (nextStatus && nextStatus !== prev.status) {
    await updateBookingStatus(data.id, nextStatus);
  }

  await audit({
    actorId,
    action: nextStatus === "done" ? "booking.execute.complete" : "booking.execute.start",
    target: data.id,
    result: "ok",
    meta: { assignments: data.assignments.length, nextStatus },
  });

  return { nextStatus };
}
