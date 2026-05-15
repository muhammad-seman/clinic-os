import "server-only";
import { z } from "zod";
import {
  deleteExpense as repoDelete,
  insertExpense,
  listExpenses,
  sumExpensesBetween,
  sumExpensesByCategoryBetween,
} from "@/server/repositories/expense.repo";
import { log as audit } from "@/server/auth/audit";

const expenseCategory = z.enum([
  "operasional",
  "bahan",
  "gaji",
  "sewa",
  "marketing",
  "utilitas",
  "lainnya",
]);
const expenseMethod = z.enum(["cash", "transfer", "qris", "lainnya"]);

const createSchema = z.object({
  category: expenseCategory,
  description: z.string().min(1).max(280),
  amountCents: z.coerce.bigint().positive(),
  paymentMethod: expenseMethod.default("cash"),
  occurredAt: z.coerce.date(),
});

const listSchema = z.object({
  q: z.string().optional(),
  category: expenseCategory.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export async function createExpense(actorId: string, input: unknown) {
  const data = createSchema.parse(input);
  const row = await insertExpense({
    category: data.category,
    description: data.description,
    amountCents: data.amountCents,
    paymentMethod: data.paymentMethod,
    occurredAt: data.occurredAt,
    createdBy: actorId,
  });
  await audit({
    actorId,
    action: "expenses.create",
    target: row?.id ?? "",
    result: row ? "ok" : "fail",
    meta: { amountCents: data.amountCents.toString(), category: data.category },
  });
  return row;
}

export async function deleteExpense(actorId: string, id: string) {
  await repoDelete(id);
  await audit({ actorId, action: "expenses.delete", target: id, result: "ok" });
}

export async function fetchExpenses(input: unknown) {
  const data = listSchema.parse(input);
  return await listExpenses(data);
}

export { sumExpensesBetween, sumExpensesByCategoryBetween };
