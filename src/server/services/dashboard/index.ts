import "server-only";
import { and, asc, desc, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, services, packages, employees, materials } from "@/server/db/schema";

export async function fetchDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [kpiRow] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${bookings.paidCents}),0)::text`,
      receivable: sql<string>`COALESCE(SUM(${bookings.remainingCents}),0)::text`,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(bookings)
    .where(and(gte(bookings.scheduledAt, monthStart), lt(bookings.scheduledAt, monthEnd)));

  const upcoming = await db
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
    .where(and(gte(bookings.scheduledAt, now), ne(bookings.status, "cancelled")))
    .orderBy(asc(bookings.scheduledAt))
    .limit(5);

  const lowStock = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      stock: materials.stock,
      minStock: materials.minStock,
    })
    .from(materials)
    .where(lte(materials.stock, materials.minStock))
    .orderBy(asc(materials.stock))
    .limit(5);

  const topByNominal = await db
    .select({
      name: bookings.clientName,
      phone: bookings.clientPhone,
      total: sql<string>`SUM(${bookings.paidCents})::text`,
      visits: sql<number>`COUNT(*)::int`,
    })
    .from(bookings)
    .groupBy(bookings.clientName, bookings.clientPhone)
    .orderBy(desc(sql`SUM(${bookings.paidCents})`))
    .limit(5);

  const employeeCount = await db.select({ n: sql<number>`COUNT(*)::int` }).from(employees);

  return {
    kpi: {
      revenue: kpiRow?.revenue ?? "0",
      receivable: kpiRow?.receivable ?? "0",
      totalBookings: kpiRow?.total ?? 0,
      employees: employeeCount[0]?.n ?? 0,
    },
    upcoming: upcoming.map((b) => ({
      ...b,
      scheduledAt: b.scheduledAt.toISOString(),
    })),
    lowStock,
    topByNominal,
  };
}
