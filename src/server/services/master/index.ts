import "server-only";
import {
  createServiceSchema,
  createEmployeeSchema,
  createMaterialSchema,
  adjustStockSchema,
  createCategorySchema,
  createPackageSchema,
} from "@/lib/validation/master";
import {
  insertService,
  insertEmployee,
  insertMaterial,
  adjustMaterialStock,
  insertCategory,
  insertPackage,
} from "@/server/repositories/master.repo";
import { log as audit } from "@/server/auth/audit";

export async function createServiceSvc(actorId: string, input: unknown) {
  const data = createServiceSchema.parse(input);
  const row = await insertService(data);
  await audit({ actorId, action: "master.service.create", target: row.id, result: "ok", meta: { name: data.name } });
  return row;
}

export async function createEmployeeSvc(actorId: string, input: unknown) {
  const data = createEmployeeSchema.parse(input);
  const row = await insertEmployee(data);
  await audit({ actorId, action: "master.employee.create", target: row.id, result: "ok", meta: { name: data.name } });
  return row;
}

export async function createMaterialSvc(actorId: string, input: unknown) {
  const data = createMaterialSchema.parse(input);
  const row = await insertMaterial(data);
  await audit({ actorId, action: "master.material.create", target: row.id, result: "ok", meta: { name: data.name } });
  return row;
}

export async function createCategorySvc(actorId: string, input: unknown) {
  const data = createCategorySchema.parse(input);
  const row = await insertCategory(data);
  await audit({ actorId, action: "master.category.create", target: row.id, result: "ok", meta: { name: data.name } });
  return row;
}

export async function createPackageSvc(actorId: string, input: unknown) {
  const data = createPackageSchema.parse(input);
  const row = await insertPackage(data);
  await audit({ actorId, action: "master.package.create", target: row.id, result: "ok", meta: { name: data.name } });
  return row;
}

export async function adjustStockSvc(actorId: string, input: unknown) {
  const data = adjustStockSchema.parse(input);
  const row = await adjustMaterialStock(data.id, data.delta);
  await audit({
    actorId,
    action: "stock.adjust",
    target: data.id,
    result: row ? "ok" : "fail",
    meta: { delta: data.delta },
  });
  return row;
}
