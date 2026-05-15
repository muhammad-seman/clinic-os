"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import {
  createServiceSvc,
  createEmployeeSvc,
  createMaterialSvc,
  adjustStockSvc,
  createCategorySvc,
  createPackageSvc,
} from "@/server/services/master";

type Result = { ok: true } | { ok: false; error: string };

async function actor(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function fail(e: unknown): Result {
  return { ok: false, error: e instanceof Error ? e.message : "gagal" };
}

export async function createServiceAction(formData: FormData): Promise<Result> {
  try {
    await assert("master.create");
    const id = await actor();
    if (!id) return { ok: false, error: "unauthorized" };
    await createServiceSvc(id, {
      name: formData.get("name"),
      categoryId: formData.get("categoryId") || null,
      priceCents: formData.get("priceCents"),
      durationMin: formData.get("durationMin") || 30,
    });
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createCategoryAction(formData: FormData): Promise<Result> {
  try {
    await assert("master.create");
    const id = await actor();
    if (!id) return { ok: false, error: "unauthorized" };
    await createCategorySvc(id, { name: formData.get("name") });
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createPackageAction(formData: FormData): Promise<Result> {
  try {
    await assert("master.create");
    const id = await actor();
    if (!id) return { ok: false, error: "unauthorized" };
    await createPackageSvc(id, {
      name: formData.get("name"),
      priceCents: formData.get("priceCents"),
      serviceIds: formData.getAll("serviceIds"),
    });
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createEmployeeAction(formData: FormData): Promise<Result> {
  try {
    await assert("master.create");
    const id = await actor();
    if (!id) return { ok: false, error: "unauthorized" };
    await createEmployeeSvc(id, {
      name: formData.get("name"),
      type: formData.get("type"),
      phone: formData.get("phone") || null,
    });
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createMaterialAction(formData: FormData): Promise<Result> {
  try {
    await assert("master.create");
    const id = await actor();
    if (!id) return { ok: false, error: "unauthorized" };
    await createMaterialSvc(id, {
      name: formData.get("name"),
      unit: formData.get("unit"),
      costCents: formData.get("costCents"),
      stock: formData.get("stock") || 0,
      minStock: formData.get("minStock") || 0,
    });
    revalidatePath("/master");
    revalidatePath("/stock");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adjustStockAction(
  id: string,
  delta: number,
): Promise<Result> {
  try {
    await assert("stock.update");
    const aid = await actor();
    if (!aid) return { ok: false, error: "unauthorized" };
    await adjustStockSvc(aid, { id, delta });
    revalidatePath("/master");
    revalidatePath("/stock");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
