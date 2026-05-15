import "server-only";
import { asc, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, packageServices, services } from "@/server/db/schema";

export type CustomerRow = {
  name: string;
  phone: string | null;
  total: string;
  count: number;
  servicesCount: number;
  last: string | null;
};

export type AprioriRow = {
  a: string;
  aName: string;
  b: string;
  bName: string;
  support: number;
  conf: number;
  lift: number;
};

export async function fetchInsight() {
  const allBookings = await db
    .select({
      id: bookings.id,
      client: bookings.clientName,
      phone: bookings.clientPhone,
      when: bookings.scheduledAt,
      status: bookings.status,
      paidCents: bookings.paidCents,
      remainingCents: bookings.remainingCents,
      serviceId: bookings.serviceId,
      packageId: bookings.packageId,
    })
    .from(bookings)
    .where(ne(bookings.status, "cancelled"))
    .orderBy(asc(bookings.scheduledAt));

  const allServices = await db
    .select({ id: services.id, name: services.name })
    .from(services);
  const serviceName = new Map(allServices.map((s) => [s.id, s.name]));

  const pkgServices = await db
    .select({ packageId: packageServices.packageId, serviceId: packageServices.serviceId })
    .from(packageServices);
  const pkgMap = new Map<string, string[]>();
  for (const r of pkgServices) {
    const cur = pkgMap.get(r.packageId) ?? [];
    cur.push(r.serviceId);
    pkgMap.set(r.packageId, cur);
  }

  function itemsOf(b: { serviceId: string | null; packageId: string | null }): string[] {
    if (b.packageId) return pkgMap.get(b.packageId) ?? [];
    if (b.serviceId) return [b.serviceId];
    return [];
  }

  type Acc = {
    name: string;
    phone: string | null;
    total: bigint;
    count: number;
    services: Set<string>;
    last: Date | null;
  };
  const byClient = new Map<string, Acc>();
  for (const b of allBookings) {
    const k = `${b.client}::${b.phone ?? ""}`;
    let a = byClient.get(k);
    if (!a) {
      a = { name: b.client, phone: b.phone, total: 0n, count: 0, services: new Set(), last: null };
      byClient.set(k, a);
    }
    a.total += b.paidCents + b.remainingCents;
    a.count += 1;
    itemsOf(b).forEach((s) => a!.services.add(s));
    if (!a.last || b.when > a.last) a.last = b.when;
  }

  const customers: CustomerRow[] = [...byClient.values()].map((c) => ({
    name: c.name,
    phone: c.phone,
    total: c.total.toString(),
    count: c.count,
    servicesCount: c.services.size,
    last: c.last?.toISOString() ?? null,
  }));

  // Apriori: per-client basket (union all services across bookings)
  const baskets = new Map<string, Set<string>>();
  for (const b of allBookings) {
    const k = `${b.client}::${b.phone ?? ""}`;
    let s = baskets.get(k);
    if (!s) {
      s = new Set();
      baskets.set(k, s);
    }
    itemsOf(b).forEach((id) => s!.add(id));
  }
  const txs = [...baskets.values()].map((s) => [...s]).filter((arr) => arr.length > 0);
  const total = txs.length;
  const singles: Record<string, number> = {};
  const pairs: Record<string, number> = {};
  for (const t of txs) {
    for (const a of t) singles[a] = (singles[a] ?? 0) + 1;
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const [a, b] = [t[i], t[j]].sort();
        const k = `${a}::${b}`;
        pairs[k] = (pairs[k] ?? 0) + 1;
      }
    }
  }
  const rules: AprioriRow[] = [];
  for (const [k, count] of Object.entries(pairs)) {
    const parts = k.split("::");
    const a = parts[0]!;
    const b = parts[1]!;
    if (!total) continue;
    const sup = count / total;
    const pA = (singles[a] ?? 0) / total;
    const pB = (singles[b] ?? 0) / total;
    const denom = pA * pB || 1;
    rules.push({
      a,
      aName: serviceName.get(a) ?? a,
      b,
      bName: serviceName.get(b) ?? b,
      support: sup,
      conf: count / (singles[a] || 1),
      lift: sup / denom,
    });
    rules.push({
      a: b,
      aName: serviceName.get(b) ?? b,
      b: a,
      bName: serviceName.get(a) ?? a,
      support: sup,
      conf: count / (singles[b] || 1),
      lift: sup / denom,
    });
  }

  return {
    customers,
    rules,
    transactions: total,
  };
}

