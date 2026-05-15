import "server-only";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import {
  services,
  categories,
  employees,
  packages,
  packageServices,
  taskRoles,
  bookingAssignments,
} from "../db/schema";
import type { z } from "zod";
import type {
  createServiceSchema,
  createEmployeeSchema,
  createCategorySchema,
  createPackageSchema,
  updateServiceSchema,
  updateCategorySchema,
  updatePackageSchema,
  updateEmployeeSchema,
} from "@/lib/validation/master";

export async function listServices() {
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      priceCents: services.priceCents,
      durationMin: services.durationMin,
      active: services.active,
      categoryName: categories.name,
    })
    .from(services)
    .leftJoin(categories, eq(categories.id, services.categoryId))
    .orderBy(desc(services.createdAt));
  return rows.map((r) => ({ ...r, priceCents: r.priceCents.toString() }));
}

export async function insertService(input: z.infer<typeof createServiceSchema>) {
  const [row] = await db
    .insert(services)
    .values({
      name: input.name,
      categoryId: input.categoryId ?? null,
      priceCents: input.priceCents,
      durationMin: input.durationMin,
    })
    .returning({ id: services.id });
  return row!;
}

export async function listCategories() {
  return await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(categories.name);
}

export async function listEmployees() {
  return await db
    .select({
      id: employees.id,
      name: employees.name,
      type: employees.type,
      phone: employees.phone,
      active: employees.active,
      joinedAt: employees.joinedAt,
    })
    .from(employees)
    .orderBy(employees.name);
}

export async function insertEmployee(input: z.infer<typeof createEmployeeSchema>) {
  const [row] = await db
    .insert(employees)
    .values({ name: input.name, type: input.type, phone: input.phone ?? null })
    .returning({ id: employees.id });
  return row!;
}

export async function listCategoriesWithCount() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      serviceCount: sql<number>`count(${services.id})::int`,
    })
    .from(categories)
    .leftJoin(services, eq(services.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);
  return rows;
}

export async function insertCategory(input: z.infer<typeof createCategorySchema>) {
  const [row] = await db
    .insert(categories)
    .values({ name: input.name })
    .returning({ id: categories.id });
  return row!;
}

export async function listPackages() {
  const pkgs = await db
    .select({
      id: packages.id,
      name: packages.name,
      priceCents: packages.priceCents,
      active: packages.active,
    })
    .from(packages)
    .orderBy(packages.name);
  if (pkgs.length === 0) return [];
  const items = await db
    .select({
      packageId: packageServices.packageId,
      serviceId: services.id,
      serviceName: services.name,
      servicePrice: services.priceCents,
    })
    .from(packageServices)
    .innerJoin(services, eq(services.id, packageServices.serviceId));
  return pkgs.map((p) => ({
    ...p,
    priceCents: p.priceCents.toString(),
    services: items
      .filter((i) => i.packageId === p.id)
      .map((i) => ({
        id: i.serviceId,
        name: i.serviceName,
        priceCents: i.servicePrice.toString(),
      })),
  }));
}

export async function insertPackage(input: z.infer<typeof createPackageSchema>) {
  return await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(packages)
      .values({ name: input.name, priceCents: input.priceCents })
      .returning({ id: packages.id });
    if (!row) throw new Error("insert failed");
    await tx
      .insert(packageServices)
      .values(input.serviceIds.map((sid) => ({ packageId: row.id, serviceId: sid })));
    return row;
  });
}

export async function listTaskRoles() {
  const rows = await db
    .select({
      id: taskRoles.id,
      slug: taskRoles.slug,
      label: taskRoles.label,
      forType: taskRoles.forType,
      active: taskRoles.active,
      usage: sql<number>`count(${bookingAssignments.bookingId})::int`,
    })
    .from(taskRoles)
    .leftJoin(bookingAssignments, eq(bookingAssignments.roleId, taskRoles.id))
    .groupBy(taskRoles.id)
    .orderBy(taskRoles.label);
  return rows;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function insertTaskRole(input: {
  label: string;
  forType: "doctor" | "staff";
}): Promise<{ id: string }> {
  const base = slugify(input.label) || "peran";
  let slug = base;
  let attempt = 0;
  // ensure uniqueness with small retry on conflict
  // (small table; collisions rare)
  while (attempt < 5) {
    try {
      const [row] = await db
        .insert(taskRoles)
        .values({ slug, label: input.label, forType: input.forType })
        .returning({ id: taskRoles.id });
      if (!row) throw new Error("insert failed");
      return row;
    } catch (e) {
      attempt += 1;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      if (attempt >= 5) throw e;
    }
  }
  throw new Error("unreachable");
}

export async function updateTaskRole(
  id: string,
  patch: { label?: string; forType?: "doctor" | "staff"; active?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.label !== undefined) set.label = patch.label;
  if (patch.forType !== undefined) set.forType = patch.forType;
  if (patch.active !== undefined) set.active = patch.active;
  if (Object.keys(set).length === 0) return;
  await db.update(taskRoles).set(set).where(eq(taskRoles.id, id));
}

export async function deleteTaskRole(id: string): Promise<void> {
  await db.delete(taskRoles).where(eq(taskRoles.id, id));
}

export async function updateService(input: z.infer<typeof updateServiceSchema>) {
  await db
    .update(services)
    .set({
      name: input.name,
      categoryId: input.categoryId ?? null,
      priceCents: input.priceCents,
      durationMin: input.durationMin,
      active: input.active,
    })
    .where(eq(services.id, input.id));
}

export async function deleteService(id: string) {
  await db.delete(services).where(eq(services.id, id));
}

export async function updateCategory(input: z.infer<typeof updateCategorySchema>) {
  await db.update(categories).set({ name: input.name }).where(eq(categories.id, input.id));
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function updatePackage(input: z.infer<typeof updatePackageSchema>) {
  await db.transaction(async (tx) => {
    await tx
      .update(packages)
      .set({ name: input.name, priceCents: input.priceCents, active: input.active })
      .where(eq(packages.id, input.id));
    await tx.delete(packageServices).where(eq(packageServices.packageId, input.id));
    await tx
      .insert(packageServices)
      .values(input.serviceIds.map((sid) => ({ packageId: input.id, serviceId: sid })));
  });
}

export async function deletePackage(id: string) {
  await db.delete(packages).where(eq(packages.id, id));
}

export async function updateEmployee(input: z.infer<typeof updateEmployeeSchema>) {
  await db
    .update(employees)
    .set({ name: input.name, type: input.type, phone: input.phone ?? null, active: input.active })
    .where(eq(employees.id, input.id));
}

export async function deleteEmployee(id: string) {
  await db.delete(employees).where(eq(employees.id, id));
}

