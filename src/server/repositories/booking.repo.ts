import "server-only";
import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  bookings,
  services,
  packages,
  employees,
  bookingAssignments,
  taskRoles,
  clients,
  bookingPayments,
} from "../db/schema";
import { getOrCreateClient } from "./client.repo";
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
  const paymentClause =
    f.payment === "outstanding"
      ? or(eq(bookings.payment, "dp"), eq(bookings.payment, "termin"))
      : f.payment
        ? eq(bookings.payment, f.payment)
        : undefined;
  const where = and(
    f.status ? eq(bookings.status, f.status) : undefined,
    paymentClause,
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

export async function getBookingDetail(id: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      payment: bookings.payment,
      paidCents: bookings.paidCents,
      remainingCents: bookings.remainingCents,
      notes: bookings.notes,
      serviceId: bookings.serviceId,
      packageId: bookings.packageId,
      doctorId: bookings.doctorId,
      serviceName: services.name,
      servicePrice: services.priceCents,
      packageName: packages.name,
      packagePrice: packages.priceCents,
      doctorName: employees.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .leftJoin(employees, eq(employees.id, bookings.doctorId))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return null;

  const assignmentsRows = await db
    .select({
      roleId: bookingAssignments.roleId,
      roleLabel: taskRoles.label,
      roleSlug: taskRoles.slug,
      employeeId: bookingAssignments.employeeId,
      employeeName: employees.name,
      employeeType: employees.type,
      feeCents: bookingAssignments.feeCents,
    })
    .from(bookingAssignments)
    .innerJoin(taskRoles, eq(taskRoles.id, bookingAssignments.roleId))
    .innerJoin(employees, eq(employees.id, bookingAssignments.employeeId))
    .where(eq(bookingAssignments.bookingId, id));

  const price = row.packagePrice ?? row.servicePrice ?? 0n;

  return {
    id: row.id,
    code: row.code,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    payment: row.payment,
    paidCents: row.paidCents.toString(),
    remainingCents: row.remainingCents.toString(),
    notes: row.notes,
    serviceId: row.serviceId,
    packageId: row.packageId,
    doctorId: row.doctorId,
    serviceName: row.serviceName,
    packageName: row.packageName,
    doctorName: row.doctorName,
    priceCents: price.toString(),
    assignments: assignmentsRows.map((a) => ({
      roleId: a.roleId,
      roleLabel: a.roleLabel,
      roleSlug: a.roleSlug,
      employeeId: a.employeeId,
      employeeName: a.employeeName,
      employeeType: a.employeeType,
      feeCents: a.feeCents.toString(),
    })),
  };
}

export async function replaceBookingAssignments(
  bookingId: string,
  rows: { roleId: string; employeeId: string; feeCents: bigint }[],
) {
  await db.delete(bookingAssignments).where(eq(bookingAssignments.bookingId, bookingId));
  if (rows.length === 0) return;
  await db.insert(bookingAssignments).values(
    rows.map((r) => ({
      bookingId,
      roleId: r.roleId,
      employeeId: r.employeeId,
      feeCents: r.feeCents,
    })),
  );
}

export async function listEmployeesForAssign() {
  return await db
    .select({
      id: employees.id,
      name: employees.name,
      type: employees.type,
      active: employees.active,
    })
    .from(employees)
    .where(eq(employees.active, true))
    .orderBy(employees.name);
}

export async function listAllRoles() {
  return await db
    .select({
      id: taskRoles.id,
      slug: taskRoles.slug,
      label: taskRoles.label,
      forType: taskRoles.forType,
    })
    .from(taskRoles)
    .where(eq(taskRoles.active, true))
    .orderBy(taskRoles.label);
}

export async function insertBooking(input: CreateBookingInput): Promise<{ id: string; code: string }> {
  const code = `BK-${Date.now().toString(36).toUpperCase()}`;

  // Pre-compute remainingCents from the linked service/package price so payments work out of the box.
  let priceCents: bigint = 0n;
  if (input.packageId) {
    const [p] = await db
      .select({ priceCents: packages.priceCents })
      .from(packages)
      .where(eq(packages.id, input.packageId))
      .limit(1);
    if (p) priceCents = p.priceCents;
  } else if (input.serviceId) {
    const [s] = await db
      .select({ priceCents: services.priceCents })
      .from(services)
      .where(eq(services.id, input.serviceId))
      .limit(1);
    if (s) priceCents = s.priceCents;
  }

  // Resolve client - either pre-existing (clientId given) or find/create by phone.
  let clientId: string | null = input.clientId ?? null;
  let clientName: string = input.clientName;
  let clientPhone: string | null = input.clientPhone ?? null;
  if (clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (c) {
      clientName = c.name;
      clientPhone = c.phone.startsWith("noPhone-") ? null : c.phone;
    } else {
      clientId = null;
    }
  }
  if (!clientId) {
    const c = await getOrCreateClient({ name: clientName, phone: clientPhone });
    clientId = c.id;
    clientName = c.name;
    if (!c.phone.startsWith("noPhone-")) clientPhone = c.phone;
  }

  const [row] = await db
    .insert(bookings)
    .values({
      code,
      clientId,
      clientName,
      clientPhone,
      serviceId: input.serviceId ?? null,
      packageId: input.packageId ?? null,
      doctorId: input.doctorId ?? null,
      scheduledAt: input.scheduledAt,
      notes: input.notes ?? null,
      remainingCents: priceCents,
    })
    .returning({ id: bookings.id, code: bookings.code });
  if (!row) throw new Error("insert booking failed");
  return row;
}

export async function getBookingCounts(q: string | undefined) {
  const term = q?.trim();
  const where = term
    ? or(ilike(bookings.clientName, `%${term}%`), ilike(bookings.code, `%${term}%`))
    : undefined;

  const [row] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      scheduled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'scheduled' THEN 1 ELSE 0 END)::int`,
      inProgress: sql<number>`SUM(CASE WHEN ${bookings.status} = 'in_progress' THEN 1 ELSE 0 END)::int`,
      done: sql<number>`SUM(CASE WHEN ${bookings.status} = 'done' THEN 1 ELSE 0 END)::int`,
      cancelled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END)::int`,
      outstanding: sql<number>`SUM(CASE WHEN ${bookings.payment} IN ('dp','termin') THEN 1 ELSE 0 END)::int`,
    })
    .from(bookings)
    .where(where);
  return {
    total: row?.total ?? 0,
    scheduled: row?.scheduled ?? 0,
    in_progress: row?.inProgress ?? 0,
    done: row?.done ?? 0,
    cancelled: row?.cancelled ?? 0,
    outstanding: row?.outstanding ?? 0,
  };
}

export async function insertBookingPayment(input: {
  bookingId: string;
  amountCents: bigint;
  method?: "cash" | "transfer" | "qris" | "lainnya";
  note?: string | null;
  recordedBy?: string | null;
}) {
  const [row] = await db
    .insert(bookingPayments)
    .values({
      bookingId: input.bookingId,
      amountCents: input.amountCents,
      method: input.method ?? "cash",
      note: input.note ?? null,
      recordedBy: input.recordedBy ?? null,
    })
    .returning();
  return row;
}

export async function listBookingPayments(bookingId: string) {
  const rows = await db
    .select()
    .from(bookingPayments)
    .where(eq(bookingPayments.bookingId, bookingId))
    .orderBy(desc(bookingPayments.paidAt));
  return rows.map((r) => ({
    ...r,
    amountCents: r.amountCents.toString(),
    paidAt: r.paidAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function applyPayment(id: string, amountCents: bigint) {
  return await db
    .update(bookings)
    .set({
      paidCents: sql`${bookings.paidCents} + ${amountCents}`,
      remainingCents: sql`GREATEST(${bookings.remainingCents} - ${amountCents}, 0)`,
      // payment-state machine:
      //   no balance left and any amount paid → paid
      //   already had a partial payment → termin (multiple partial bills)
      //   first partial payment → dp
      payment: sql`CASE
        WHEN GREATEST(${bookings.remainingCents} - ${amountCents}, 0) = 0 AND (${bookings.paidCents} + ${amountCents}) > 0 THEN 'paid'
        WHEN ${bookings.payment} IN ('dp','termin') THEN 'termin'
        WHEN (${bookings.paidCents} + ${amountCents}) > 0 THEN 'dp'
        ELSE ${bookings.payment}
      END`,
    })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, paidCents: bookings.paidCents, remainingCents: bookings.remainingCents });
}

export async function updateBookingStatus(
  id: string,
  status: "scheduled" | "in_progress" | "done" | "cancelled" | "no_show",
) {
  return await db
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, status: bookings.status });
}
