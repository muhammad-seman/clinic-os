import "server-only";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookingMaterials, bookings, materials } from "@/server/db/schema";

export async function fetchStockOverview() {
  const mats = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      stock: materials.stock,
      minStock: materials.minStock,
      costCents: materials.costCents,
      updatedAt: materials.updatedAt,
    })
    .from(materials)
    .orderBy(asc(materials.name));

  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const log = await db
    .select({
      bookingId: bookings.id,
      bookingCode: bookings.code,
      clientName: bookings.clientName,
      when: bookings.scheduledAt,
      matId: bookingMaterials.materialId,
      qty: bookingMaterials.qty,
      matName: materials.name,
      matUnit: materials.unit,
    })
    .from(bookingMaterials)
    .innerJoin(bookings, eq(bookings.id, bookingMaterials.bookingId))
    .innerJoin(materials, eq(materials.id, bookingMaterials.materialId))
    .where(gte(bookings.scheduledAt, thirty))
    .orderBy(desc(bookings.scheduledAt))
    .limit(20);

  const [usageRow] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(bookingMaterials)
    .innerJoin(bookings, eq(bookings.id, bookingMaterials.bookingId))
    .where(gte(bookings.scheduledAt, thirty));

  const totalValue = mats.reduce((a, m) => a + m.costCents * BigInt(m.stock), 0n);
  const available = mats.filter((m) => m.stock > 0).length;
  const low = mats.filter((m) => m.stock <= m.minStock).length;

  return {
    materials: mats.map((m) => ({
      ...m,
      costCents: m.costCents.toString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    log: log.map((l) => ({
      ...l,
      when: l.when.toISOString(),
    })),
    kpi: {
      totalItems: mats.length,
      available,
      totalValue: totalValue.toString(),
      low,
      usage30: usageRow?.n ?? 0,
    },
  };
}

