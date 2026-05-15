import "server-only";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import { services, categories, employees, materials } from "../db/schema";
import type { z } from "zod";
import type {
  createServiceSchema,
  createEmployeeSchema,
  createMaterialSchema,
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

export async function listMaterials() {
  const rows = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      costCents: materials.costCents,
      stock: materials.stock,
      minStock: materials.minStock,
    })
    .from(materials)
    .orderBy(materials.name);
  return rows.map((r) => ({ ...r, costCents: r.costCents.toString() }));
}

export async function insertMaterial(input: z.infer<typeof createMaterialSchema>) {
  const [row] = await db
    .insert(materials)
    .values({
      name: input.name,
      unit: input.unit,
      costCents: input.costCents,
      stock: input.stock,
      minStock: input.minStock,
    })
    .returning({ id: materials.id });
  return row!;
}

export async function adjustMaterialStock(id: string, delta: number) {
  const [row] = await db
    .update(materials)
    .set({
      stock: sql`GREATEST(${materials.stock} + ${delta}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id))
    .returning({ id: materials.id, stock: materials.stock });
  return row;
}
