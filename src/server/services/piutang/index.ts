import "server-only";
import { and, asc, eq, gt, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, services, packages } from "@/server/db/schema";

export async function fetchPiutang() {
  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      clientName: bookings.clientName,
      scheduledAt: bookings.scheduledAt,
      dueAt: bookings.dueAt,
      payment: bookings.payment,
      paidCents: bookings.paidCents,
      remainingCents: bookings.remainingCents,
      serviceName: services.name,
      packageName: packages.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(
      and(
        // Setiap booking dengan sisa > 0 dan tidak dibatalkan = piutang
        gt(bookings.remainingCents, sql`0`),
        ne(bookings.status, "cancelled"),
      ),
    )
    .orderBy(asc(bookings.dueAt), asc(bookings.scheduledAt));

  return rows.map((r) => ({
    ...r,
    scheduledAt: r.scheduledAt.toISOString(),
    dueAt: r.dueAt?.toISOString() ?? null,
    paidCents: r.paidCents.toString(),
    remainingCents: r.remainingCents.toString(),
  }));
}
