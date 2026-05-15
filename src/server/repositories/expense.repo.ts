import "server-only";
import { and, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { expenses } from "../db/schema";

export type ExpenseCategory =
  | "operasional"
  | "bahan"
  | "gaji"
  | "sewa"
  | "marketing"
  | "utilitas"
  | "lainnya";

export type ExpenseMethod = "cash" | "transfer" | "qris" | "lainnya";

export async function listExpenses(opts: {
  q?: string | undefined;
  category?: ExpenseCategory | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  limit?: number | undefined;
}) {
  const where = and(
    opts.q ? ilike(expenses.description, `%${opts.q}%`) : undefined,
    opts.category ? eq(expenses.category, opts.category) : undefined,
    opts.from ? gte(expenses.occurredAt, opts.from) : undefined,
    opts.to ? lt(expenses.occurredAt, opts.to) : undefined,
  );
  const rows = await db
    .select()
    .from(expenses)
    .where(where)
    .orderBy(desc(expenses.occurredAt))
    .limit(opts.limit ?? 200);
  return rows.map((r) => ({
    ...r,
    amountCents: r.amountCents.toString(),
    occurredAt: r.occurredAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function insertExpense(input: {
  category: ExpenseCategory;
  description: string;
  amountCents: bigint;
  paymentMethod: ExpenseMethod;
  occurredAt: Date;
  createdBy?: string | null;
}) {
  const [row] = await db
    .insert(expenses)
    .values({
      category: input.category,
      description: input.description,
      amountCents: input.amountCents,
      paymentMethod: input.paymentMethod,
      occurredAt: input.occurredAt,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  return row;
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function sumExpensesBetween(from: Date, to: Date) {
  const [row] = await db
    .select({
      sum: sql<string>`COALESCE(SUM(${expenses.amountCents}),0)::text`,
    })
    .from(expenses)
    .where(and(gte(expenses.occurredAt, from), lt(expenses.occurredAt, to)));
  return BigInt(row?.sum ?? "0");
}

export async function sumExpensesByCategoryBetween(from: Date, to: Date) {
  const rows = await db
    .select({
      category: expenses.category,
      sum: sql<string>`COALESCE(SUM(${expenses.amountCents}),0)::text`,
    })
    .from(expenses)
    .where(and(gte(expenses.occurredAt, from), lt(expenses.occurredAt, to)))
    .groupBy(expenses.category);
  return rows;
}
