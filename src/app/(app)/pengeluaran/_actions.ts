"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { createExpense, deleteExpense } from "@/server/services/expense";

export async function createExpenseAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("expenses.create");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };

    // Convert "Rp" input (free-form) into cents; the form expects a plain number in rupiah.
    const amountInput = String(formData.get("amount") ?? "").replace(/[^0-9]/g, "");
    await createExpense(actorId, {
      category: formData.get("category"),
      description: formData.get("description"),
      amountCents: amountInput,
      paymentMethod: formData.get("paymentMethod") || "cash",
      occurredAt: formData.get("occurredAt"),
    });
    revalidatePath("/pengeluaran");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}

export async function deleteExpenseAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("expenses.delete");
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) return { ok: false, error: "unauthorized" };
    await deleteExpense(actorId, id);
    revalidatePath("/pengeluaran");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
