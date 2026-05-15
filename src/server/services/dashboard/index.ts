import "server-only";
import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  bookingMaterials,
  bookings,
  materials,
  packageServices,
  packages,
  services,
} from "@/server/db/schema";

export type Period = "day" | "week" | "month" | "year";

export type ChartPoint = { label: string; rev: string; profit: string };

export type Pattern = {
  a: string;
  aName: string;
  b: string;
  bName: string;
  support: number;
  conf: number;
};

function bucketsFor(period: Period, now = new Date()) {
  const out: { start: Date; end: Date; label: string }[] = [];
  if (period === "day") {
    // 12 hourly buckets ending now
    const baseHour = new Date(now);
    baseHour.setMinutes(0, 0, 0);
    for (let i = 11; i >= 0; i--) {
      const start = new Date(baseHour);
      start.setHours(baseHour.getHours() - i);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      out.push({ start, end, label: `${String(start.getHours()).padStart(2, "0")}:00` });
    }
    return out;
  }
  if (period === "week") {
    // 8 weekly buckets, Monday-start
    const dow = (now.getDay() + 6) % 7;
    const thisMonday = new Date(now);
    thisMonday.setHours(0, 0, 0, 0);
    thisMonday.setDate(thisMonday.getDate() - dow);
    for (let i = 7; i >= 0; i--) {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      out.push({ start, end, label: `W${8 - i}` });
    }
    return out;
  }
  if (period === "year") {
    for (let i = 5; i >= 0; i--) {
      const y = now.getFullYear() - i;
      out.push({ start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), label: String(y) });
    }
    return out;
  }
  // month: 8 monthly buckets
  const fmt = new Intl.DateTimeFormat("id-ID", { month: "short" });
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ start, end, label: fmt.format(start) });
  }
  return out;
}

export async function fetchDashboard(period: Period = "month") {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const buckets = bucketsFor(period, now);
  const windowStart = buckets[0]!.start;
  const windowEnd = buckets[buckets.length - 1]!.end;

  // Bookings within window for chart
  const rangeBookings = await db
    .select({
      id: bookings.id,
      scheduledAt: bookings.scheduledAt,
      paidCents: bookings.paidCents,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.scheduledAt, windowStart),
        lt(bookings.scheduledAt, windowEnd),
        ne(bookings.status, "cancelled"),
      ),
    );

  const ids = rangeBookings.map((b) => b.id);
  const costs = ids.length
    ? await db
        .select({
          bookingId: bookingMaterials.bookingId,
          cost: sql<string>`COALESCE(SUM(${bookingMaterials.qty} * ${materials.costCents}),0)::text`,
        })
        .from(bookingMaterials)
        .innerJoin(materials, eq(materials.id, bookingMaterials.materialId))
        .where(inArray(bookingMaterials.bookingId, ids))
        .groupBy(bookingMaterials.bookingId)
    : [];
  const costMap = new Map(costs.map((c) => [c.bookingId, BigInt(c.cost)]));

  const chart: ChartPoint[] = buckets.map((b) => {
    let rev = 0n;
    let cogs = 0n;
    for (const bk of rangeBookings) {
      if (bk.scheduledAt >= b.start && bk.scheduledAt < b.end) {
        rev += bk.paidCents;
        cogs += costMap.get(bk.id) ?? 0n;
      }
    }
    return { label: b.label, rev: rev.toString(), profit: (rev - cogs).toString() };
  });

  // Monthly KPIs
  const [kpiRow] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${bookings.paidCents}),0)::text`,
      receivable: sql<string>`COALESCE(SUM(${bookings.remainingCents}),0)::text`,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(bookings)
    .where(and(gte(bookings.scheduledAt, monthStart), lt(bookings.scheduledAt, monthEnd)));

  // Profit this month
  const monthIds = await db
    .select({ id: bookings.id, paidCents: bookings.paidCents })
    .from(bookings)
    .where(and(gte(bookings.scheduledAt, monthStart), lt(bookings.scheduledAt, monthEnd), ne(bookings.status, "cancelled")));
  let monthRev = 0n;
  for (const m of monthIds) monthRev += m.paidCents;
  const monthIdsArr = monthIds.map((m) => m.id);
  const monthCosts = monthIdsArr.length
    ? await db
        .select({
          cost: sql<string>`COALESCE(SUM(${bookingMaterials.qty} * ${materials.costCents}),0)::text`,
        })
        .from(bookingMaterials)
        .innerJoin(materials, eq(materials.id, bookingMaterials.materialId))
        .where(inArray(bookingMaterials.bookingId, monthIdsArr))
    : [{ cost: "0" }];
  const monthCogs = BigInt(monthCosts[0]?.cost ?? "0");
  const profitCents = (monthRev - monthCogs).toString();

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
    .where(sql`${materials.stock} <= ${materials.minStock}`)
    .orderBy(asc(materials.stock))
    .limit(4);

  // Top customers nominal & frekuensi
  const topRows = await db
    .select({
      name: bookings.clientName,
      phone: bookings.clientPhone,
      total: sql<string>`COALESCE(SUM(${bookings.paidCents} + ${bookings.remainingCents}),0)::text`,
      visits: sql<number>`COUNT(*)::int`,
    })
    .from(bookings)
    .where(ne(bookings.status, "cancelled"))
    .groupBy(bookings.clientName, bookings.clientPhone);

  const topByNominal = [...topRows]
    .sort((a, b) => (BigInt(b.total) > BigInt(a.total) ? 1 : -1))
    .slice(0, 5);
  const topByFreq = [...topRows]
    .sort((a, b) => b.visits - a.visits || (BigInt(b.total) > BigInt(a.total) ? 1 : -1))
    .slice(0, 5);

  // Apriori preview
  const allBookings = await db
    .select({
      client: bookings.clientName,
      phone: bookings.clientPhone,
      serviceId: bookings.serviceId,
      packageId: bookings.packageId,
    })
    .from(bookings)
    .where(ne(bookings.status, "cancelled"));

  const allServices = await db.select({ id: services.id, name: services.name }).from(services);
  const svcName = new Map(allServices.map((s) => [s.id, s.name]));
  const pkgRows = await db
    .select({ packageId: packageServices.packageId, serviceId: packageServices.serviceId })
    .from(packageServices);
  const pkgMap = new Map<string, string[]>();
  for (const r of pkgRows) {
    const cur = pkgMap.get(r.packageId) ?? [];
    cur.push(r.serviceId);
    pkgMap.set(r.packageId, cur);
  }
  const baskets = new Map<string, Set<string>>();
  for (const b of allBookings) {
    const k = `${b.client}::${b.phone ?? ""}`;
    let s = baskets.get(k);
    if (!s) {
      s = new Set();
      baskets.set(k, s);
    }
    if (b.packageId) (pkgMap.get(b.packageId) ?? []).forEach((id) => s!.add(id));
    else if (b.serviceId) s.add(b.serviceId);
  }
  const txs = [...baskets.values()].map((s) => [...s]).filter((arr) => arr.length > 0);
  const total = txs.length;
  const singles: Record<string, number> = {};
  const pairs: Record<string, number> = {};
  for (const t of txs) {
    for (const a of t) singles[a] = (singles[a] ?? 0) + 1;
    for (let i = 0; i < t.length; i++)
      for (let j = i + 1; j < t.length; j++) {
        const [a, b] = [t[i]!, t[j]!].sort();
        const k = `${a}::${b}`;
        pairs[k] = (pairs[k] ?? 0) + 1;
      }
  }
  const patterns: Pattern[] = [];
  for (const [k, count] of Object.entries(pairs)) {
    if (!total) break;
    const [a, b] = k.split("::") as [string, string];
    const sup = count / total;
    patterns.push({
      a,
      aName: svcName.get(a) ?? a,
      b,
      bName: svcName.get(b) ?? b,
      support: sup,
      conf: count / (singles[a] || 1),
    });
    patterns.push({
      a: b,
      aName: svcName.get(b) ?? b,
      b: a,
      bName: svcName.get(a) ?? a,
      support: sup,
      conf: count / (singles[b] || 1),
    });
  }
  const aprioriPreview = patterns
    .filter((p) => p.support >= 0.1 && p.conf >= 0.6)
    .sort((x, y) => y.conf - x.conf)
    .slice(0, 5);

  // Compare last month for chg
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [lastMonth] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${bookings.paidCents}),0)::text`,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(bookings)
    .where(and(gte(bookings.scheduledAt, lastMonthStart), lt(bookings.scheduledAt, monthStart)));

  const revPct =
    lastMonth && BigInt(lastMonth.revenue) > 0n
      ? Math.round(
          (Number(BigInt(kpiRow?.revenue ?? "0") - BigInt(lastMonth.revenue)) /
            Number(BigInt(lastMonth.revenue))) *
            100,
        )
      : null;
  const totalDelta = (kpiRow?.total ?? 0) - (lastMonth?.total ?? 0);

  const overdueCount = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(
      and(
        sql`${bookings.dueAt} IS NOT NULL`,
        lt(bookings.dueAt, new Date(now.getTime() + 7 * 86400e3)),
        sql`${bookings.remainingCents} > 0`,
      ),
    );

  return {
    period,
    chart,
    kpi: {
      revenue: kpiRow?.revenue ?? "0",
      profit: profitCents,
      margin:
        BigInt(kpiRow?.revenue ?? "0") > 0n
          ? Math.round((Number(BigInt(profitCents)) / Number(BigInt(kpiRow?.revenue ?? "1"))) * 100)
          : 0,
      receivable: kpiRow?.receivable ?? "0",
      totalBookings: kpiRow?.total ?? 0,
      revPct,
      totalDelta,
      dueSoon: overdueCount[0]?.n ?? 0,
    },
    upcoming: upcoming.map((b) => ({ ...b, scheduledAt: b.scheduledAt.toISOString() })),
    lowStock,
    topByNominal,
    topByFreq,
    aprioriPreview,
  };
}

