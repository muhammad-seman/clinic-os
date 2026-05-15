import "server-only";
import { and, desc, eq, gte, inArray, lt, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  bookingAssignments,
  bookings,
  employees,
  feePayments,
  taskRoles,
} from "@/server/db/schema";
import { log as audit } from "@/server/auth/audit";

export type Period = "week" | "month" | "quarter";

export function rangeFor(period: Period, now = new Date()): { start: Date; end: Date; key: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === "week") {
    const day = now.getDay(); // 0..6, Sunday=0
    const diff = (day + 6) % 7; // Monday=0
    const start = new Date(y, m, now.getDate() - diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const key = `${start.getFullYear()}-W${String(Math.ceil(((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(start.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, "0")}`;
    return { start, end, key };
  }
  if (period === "quarter") {
    const qStart = Math.floor(m / 3) * 3;
    const start = new Date(y, qStart, 1);
    const end = new Date(y, qStart + 3, 1);
    const key = `${y}-Q${Math.floor(m / 3) + 1}`;
    return { start, end, key };
  }
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  const key = `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start, end, key };
}

export async function fetchFeeStats(period: Period) {
  const { start, end, key } = rangeFor(period);

  const rows = await db
    .select({
      empId: bookingAssignments.employeeId,
      empName: employees.name,
      empPhone: employees.phone,
      empType: employees.type,
      roleId: bookingAssignments.roleId,
      roleName: taskRoles.label,
      feeCents: bookingAssignments.feeCents,
      bookingWhen: bookings.scheduledAt,
      bookingStatus: bookings.status,
    })
    .from(bookingAssignments)
    .innerJoin(bookings, eq(bookings.id, bookingAssignments.bookingId))
    .innerJoin(employees, eq(employees.id, bookingAssignments.employeeId))
    .leftJoin(taskRoles, eq(taskRoles.id, bookingAssignments.roleId))
    .where(
      and(
        gte(bookings.scheduledAt, start),
        lt(bookings.scheduledAt, end),
        or(eq(bookings.status, "done"), eq(bookings.status, "in_progress")),
      ),
    );

  type Stat = {
    empId: string;
    name: string;
    phone: string | null;
    type: string;
    total: bigint;
    count: number;
    last: Date | null;
    byRole: Record<string, bigint>;
  };
  const map = new Map<string, Stat>();
  for (const r of rows) {
    let s = map.get(r.empId);
    if (!s) {
      s = {
        empId: r.empId,
        name: r.empName,
        phone: r.empPhone,
        type: r.empType,
        total: 0n,
        count: 0,
        last: null,
        byRole: {},
      };
      map.set(r.empId, s);
    }
    s.total += r.feeCents;
    s.count += 1;
    if (!s.last || r.bookingWhen > s.last) s.last = r.bookingWhen;
    const k = r.roleName ?? "?";
    s.byRole[k] = (s.byRole[k] ?? 0n) + r.feeCents;
  }

  const ids = [...map.keys()];
  const payments = ids.length
    ? await db
        .select({ employeeId: feePayments.employeeId, amountCents: feePayments.amountCents, paidAt: feePayments.paidAt })
        .from(feePayments)
        .where(and(eq(feePayments.period, key), inArray(feePayments.employeeId, ids)))
    : [];
  const paidSet = new Map(payments.map((p) => [p.employeeId, p]));

  const stats = [...map.values()]
    .map((s) => {
      const paid = paidSet.get(s.empId);
      return {
        empId: s.empId,
        name: s.name,
        phone: s.phone,
        type: s.type,
        total: s.total.toString(),
        count: s.count,
        last: s.last?.toISOString() ?? null,
        byRole: Object.fromEntries(
          Object.entries(s.byRole).map(([k, v]) => [k, v.toString()]),
        ),
        paid: paid
          ? { amount: paid.amountCents.toString(), paidAt: paid.paidAt.toISOString() }
          : null,
      };
    })
    .sort((a, b) => (BigInt(b.total) > BigInt(a.total) ? 1 : -1));

  return { period, key, periodLabel: `${start.toISOString().slice(0, 10)} … ${new Date(end.getTime() - 1).toISOString().slice(0, 10)}`, stats };
}

export async function markFeePaid(
  actorId: string,
  input: { employeeId: string; period: string; amountCents: bigint },
) {
  const existing = await db
    .select({ id: feePayments.id })
    .from(feePayments)
    .where(and(eq(feePayments.employeeId, input.employeeId), eq(feePayments.period, input.period)))
    .limit(1);
  if (existing.length) {
    await audit({
      actorId,
      action: "fee.paid.duplicate",
      target: input.employeeId,
      result: "fail",
      meta: { period: input.period },
    });
    throw new Error("Fee untuk periode ini sudah ditandai dibayar");
  }
  const [row] = await db
    .insert(feePayments)
    .values({
      employeeId: input.employeeId,
      period: input.period,
      amountCents: input.amountCents,
    })
    .returning();
  await audit({
    actorId,
    action: "fee.paid",
    target: input.employeeId,
    result: "ok",
    meta: { period: input.period, amount: input.amountCents.toString() },
  });
  return row;
}

export async function unmarkFeePaid(actorId: string, input: { employeeId: string; period: string }) {
  const deleted = await db
    .delete(feePayments)
    .where(and(eq(feePayments.employeeId, input.employeeId), eq(feePayments.period, input.period)))
    .returning();
  await audit({
    actorId,
    action: "fee.paid.revert",
    target: input.employeeId,
    result: deleted.length ? "ok" : "fail",
    meta: { period: input.period },
  });
  return deleted[0] ?? null;
}

export async function fetchFeeHistory(limit = 20) {
  return db
    .select({
      id: feePayments.id,
      employeeId: feePayments.employeeId,
      name: employees.name,
      period: feePayments.period,
      amountCents: feePayments.amountCents,
      paidAt: feePayments.paidAt,
    })
    .from(feePayments)
    .innerJoin(employees, eq(employees.id, feePayments.employeeId))
    .orderBy(desc(feePayments.paidAt))
    .limit(limit);
}

