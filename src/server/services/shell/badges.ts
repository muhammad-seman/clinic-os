import "server-only";
import { and, gt, gte, lt, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings } from "@/server/db/schema";

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
    .where(and(gt(bookings.remainingCents, sql`0`), ne(bookings.status, "cancelled")));

  return {
    calendar: todayRow?.n ?? 0,
    piutang: piutangRow?.n ?? 0,
  };
}

export type SidebarBadges = Awaited<ReturnType<typeof fetchSidebarBadges>>;
