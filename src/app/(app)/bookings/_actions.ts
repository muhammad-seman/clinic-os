"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { createBooking } from "@/server/services/booking/create";
import { settleBooking } from "@/server/services/booking/settle";
import { setBookingStatus } from "@/server/services/booking/status";

export async function createBookingAction(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await assert("bookings.create");
    const session = await auth();
    const actorId = session?.user?.id ?? null;
    if (!actorId) return { ok: false, error: "unauthorized" };

    const row = await createBooking(actorId, {
      clientName: formData.get("clientName"),
      clientPhone: formData.get("clientPhone") || null,
      scheduledAt: formData.get("scheduledAt"),
      serviceId: formData.get("serviceId") || null,
      doctorId: formData.get("doctorId") || null,
      notes: formData.get("notes") || null,
    });
    revalidatePath("/bookings");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function settleBookingAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("bookings.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await settleBooking(actorId, {
      id: formData.get("id"),
      amountCents: formData.get("amountCents"),
    });
    revalidatePath("/bookings");
    revalidatePath("/piutang");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function settleBookingJsonAction(input: {
  id: string;
  amountCents: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("bookings.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await settleBooking(actorId, {
      id: input.id,
      amountCents: input.amountCents,
    });
    revalidatePath("/bookings");
    revalidatePath("/piutang");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function setBookingStatusAction(input: {
  id: string;
  status: "scheduled" | "in_progress" | "done" | "cancelled" | "no_show";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("bookings.update");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await setBookingStatus(actorId, input);
    revalidatePath("/bookings");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
