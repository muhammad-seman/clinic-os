import "server-only";
import { and, asc, desc, eq, gte, isNotNull, lt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, materials, packages, services } from "@/server/db/schema";

export type TomorrowBooking = {
  id: string;
  code: string;
  client: string;
  when: string;
  label: string;
};

export type LowStock = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  min: number;
};

export type Overdue = {
  id: string;
  code: string;
  client: string;
  remaining: string;
  dueAt: string;
};

export async function fetchNotifBundle() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const tomorrow = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      client: bookings.clientName,
      when: bookings.scheduledAt,
      serviceName: services.name,
      packageName: packages.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(
      and(
        gte(bookings.scheduledAt, start),
        lt(bookings.scheduledAt, end),
        ne(bookings.status, "cancelled"),
      ),
    )
    .orderBy(asc(bookings.scheduledAt))
    .limit(20);

  const lowStock = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      stock: materials.stock,
      min: materials.minStock,
    })
    .from(materials)
    .where(lte(materials.stock, materials.minStock))
    .orderBy(asc(materials.stock));

  const now = new Date();
  const overdue = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      client: bookings.clientName,
      remaining: bookings.remainingCents,
      dueAt: bookings.dueAt,
    })
    .from(bookings)
    .where(
      and(
        isNotNull(bookings.dueAt),
        lt(bookings.dueAt, now),
        sql`${bookings.remainingCents} > 0`,
        ne(bookings.status, "cancelled"),
      ),
    )
    .orderBy(desc(bookings.dueAt))
    .limit(20);

  return {
    tomorrow: tomorrow.map<TomorrowBooking>((b) => ({
      id: b.id,
      code: b.code,
      client: b.client,
      when: b.when.toISOString(),
      label: b.packageName ?? b.serviceName ?? "—",
    })),
    lowStock,
    overdue: overdue
      .filter((b) => b.dueAt)
      .map<Overdue>((b) => ({
        id: b.id,
        code: b.code,
        client: b.client,
        remaining: b.remaining.toString(),
        dueAt: b.dueAt!.toISOString(),
      })),
  };
}
