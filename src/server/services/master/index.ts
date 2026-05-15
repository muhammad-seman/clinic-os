import "server-only";
import {
  createServiceSchema,
  createEmployeeSchema,
  createMaterialSchema,
  adjustStockSchema,
} from "@/lib/validation/master";
import {
  insertService,
  insertEmployee,
  insertMaterial,
  adjustMaterialStock,
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
