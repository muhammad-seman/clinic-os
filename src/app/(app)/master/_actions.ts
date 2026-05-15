"use server";

import { revalidatePath } from "next/cache";
import { assert } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import {
  createServiceSvc,
  createEmployeeSvc,
  createCategorySvc,
  createPackageSvc,
  updateServiceSvc,
  deleteServiceSvc,
  updateCategorySvc,
  deleteCategorySvc,
  updatePackageSvc,
  deletePackageSvc,
  updateEmployeeSvc,
  deleteEmployeeSvc,
  createTaskRoleSvc,
  updateTaskRoleSvc,
  deleteTaskRoleSvc,
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

async function withActor<T>(
  perm: string,
  fn: (actorId: string) => Promise<T>,
): Promise<Result> {
  try {
    await assert(perm);
    const aid = await actor();
    if (!aid) return { ok: false, error: "unauthorized" };
    await fn(aid);
    revalidatePath("/master");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateServiceAction(formData: FormData): Promise<Result> {
  return withActor("master.update", (aid) =>
    updateServiceSvc(aid, {
      id: formData.get("id"),
      name: formData.get("name"),
      categoryId: formData.get("categoryId") || null,
      priceCents: formData.get("priceCents"),
      durationMin: formData.get("durationMin") || 30,
      active: formData.get("active") === "true" || formData.get("active") === "on",
    }),
  );
}

export async function deleteServiceAction(id: string): Promise<Result> {
  return withActor("master.delete", (aid) => deleteServiceSvc(aid, { id }));
}

export async function updateCategoryAction(formData: FormData): Promise<Result> {
  return withActor("master.update", (aid) =>
    updateCategorySvc(aid, { id: formData.get("id"), name: formData.get("name") }),
  );
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  return withActor("master.delete", (aid) => deleteCategorySvc(aid, { id }));
}

export async function updatePackageAction(formData: FormData): Promise<Result> {
  return withActor("master.update", (aid) =>
    updatePackageSvc(aid, {
      id: formData.get("id"),
      name: formData.get("name"),
      priceCents: formData.get("priceCents"),
      serviceIds: formData.getAll("serviceIds"),
      active: formData.get("active") === "true" || formData.get("active") === "on",
    }),
  );
}

export async function deletePackageAction(id: string): Promise<Result> {
  return withActor("master.delete", (aid) => deletePackageSvc(aid, { id }));
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

export async function updateEmployeeAction(formData: FormData): Promise<Result> {
  return withActor("master.update", (aid) =>
    updateEmployeeSvc(aid, {
      id: formData.get("id"),
      name: formData.get("name"),
      type: formData.get("type"),
      phone: formData.get("phone") || null,
      active: formData.get("active") === "true" || formData.get("active") === "on",
    }),
  );
}

export async function deleteEmployeeAction(id: string): Promise<Result> {
  return withActor("master.delete", (aid) => deleteEmployeeSvc(aid, { id }));
}

export async function createTaskRoleAction(formData: FormData): Promise<Result> {
  return withActor("master.create", (aid) =>
    createTaskRoleSvc(aid, {
      label: formData.get("label"),
      forType: formData.get("forType") || "staff",
    }),
  );
}

export async function updateTaskRoleAction(formData: FormData): Promise<Result> {
  return withActor("master.update", (aid) =>
    updateTaskRoleSvc(aid, {
      id: formData.get("id"),
      label: formData.get("label"),
      forType: formData.get("forType") || "staff",
      active: formData.get("active") === "true" || formData.get("active") === "on",
    }),
  );
}

export async function deleteTaskRoleAction(id: string): Promise<Result> {
  return withActor("master.delete", (aid) => deleteTaskRoleSvc(aid, { id }));
}
