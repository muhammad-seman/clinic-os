import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, services, packages } from "@/server/db/schema";

export async function fetchWeekEvents(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      clientName: bookings.clientName,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      serviceName: services.name,
      packageName: packages.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(and(gte(bookings.scheduledAt, weekStart), lt(bookings.scheduledAt, weekEnd)))
    .orderBy(asc(bookings.scheduledAt));

  return rows.map((r) => ({ ...r, scheduledAt: r.scheduledAt.toISOString() }));
}
