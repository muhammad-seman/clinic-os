import "server-only";
import { and, gte, isNotNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings } from "@/server/db/schema";

export async function fetchNotifCount(): Promise<number> {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const now = new Date();

  const [tomorrow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        gte(bookings.scheduledAt, start),
        lt(bookings.scheduledAt, end),
        ne(bookings.status, "cancelled"),
      ),
    );

  const [overdue] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        isNotNull(bookings.dueAt),
        lt(bookings.dueAt, now),
        sql`${bookings.remainingCents} > 0`,
        ne(bookings.status, "cancelled"),
      ),
    );

  return (tomorrow?.n ?? 0) + (overdue?.n ?? 0);
}
