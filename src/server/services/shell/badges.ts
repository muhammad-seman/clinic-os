import "server-only";
import { and, eq, gte, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings, materials } from "@/server/db/schema";

export async function fetchSidebarBadges() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [todayRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(gte(bookings.scheduledAt, start), lt(bookings.scheduledAt, end)));

  const [piutangRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(or(eq(bookings.payment, "dp"), eq(bookings.payment, "termin")));

  const [lowRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(materials)
    .where(lte(materials.stock, materials.minStock));

  return {
    calendar: todayRow?.n ?? 0,
    piutang: piutangRow?.n ?? 0,
    stock: lowRow?.n ?? 0,
  };
}

export type SidebarBadges = Awaited<ReturnType<typeof fetchSidebarBadges>>;
