import "server-only";
import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { bookings, services, packages, employees } from "../db/schema";
import type { BookingFilter, CreateBookingInput } from "@/lib/validation/booking";

const cols = {
  id: bookings.id,
  code: bookings.code,
  clientName: bookings.clientName,
  clientPhone: bookings.clientPhone,
  scheduledAt: bookings.scheduledAt,
  status: bookings.status,
  payment: bookings.payment,
  paidCents: bookings.paidCents,
  remainingCents: bookings.remainingCents,
  serviceName: services.name,
  packageName: packages.name,
  doctorName: employees.name,
  createdAt: bookings.createdAt,
};

export async function listBookings(f: BookingFilter) {
  const where = and(
    f.status ? eq(bookings.status, f.status) : undefined,
    f.q
      ? or(ilike(bookings.clientName, `%${f.q}%`), ilike(bookings.code, `%${f.q}%`))
      : undefined,
    f.cursor ? lt(bookings.createdAt, new Date(f.cursor)) : undefined,
  );

  const rows = await db
    .select(cols)
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .leftJoin(employees, eq(employees.id, bookings.doctorId))
    .where(where)
    .orderBy(desc(bookings.createdAt))
    .limit(f.limit + 1);

  const hasMore = rows.length > f.limit;
  const items = hasMore ? rows.slice(0, f.limit) : rows;
  const last = items[items.length - 1];
  return {
    items: items.map((r) => ({
      ...r,
      paidCents: r.paidCents.toString(),
      remainingCents: r.remainingCents.toString(),
    })),
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
  };
}

export async function getBooking(id: string) {
  const [row] = await db.select(cols).from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .leftJoin(employees, eq(employees.id, bookings.doctorId))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    paidCents: row.paidCents.toString(),
    remainingCents: row.remainingCents.toString(),
  };
}

export async function insertBooking(input: CreateBookingInput): Promise<{ id: string; code: string }> {
  const code = `BK-${Date.now().toString(36).toUpperCase()}`;
  const [row] = await db
    .insert(bookings)
    .values({
      code,
      clientName: input.clientName,
      clientPhone: input.clientPhone ?? null,
      serviceId: input.serviceId ?? null,
      packageId: input.packageId ?? null,
      doctorId: input.doctorId ?? null,
      scheduledAt: input.scheduledAt,
      notes: input.notes ?? null,
    })
    .returning({ id: bookings.id, code: bookings.code });
  if (!row) throw new Error("insert booking failed");
  return row;
}

export async function applyPayment(id: string, amountCents: bigint) {
  return await db
    .update(bookings)
    .set({
      paidCents: sql`${bookings.paidCents} + ${amountCents}`,
      remainingCents: sql`GREATEST(${bookings.remainingCents} - ${amountCents}, 0)`,
    })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, paidCents: bookings.paidCents, remainingCents: bookings.remainingCents });
}
