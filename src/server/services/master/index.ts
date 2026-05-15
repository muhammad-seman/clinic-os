import "server-only";
import {
  createServiceSchema,
  createEmployeeSchema,
  createCategorySchema,
  createPackageSchema,
  updateServiceSchema,
  updateCategorySchema,
  updatePackageSchema,
  updateEmployeeSchema,
  createTaskRoleSchema,
  updateTaskRoleSchema,
  idSchema,
} from "@/lib/validation/master";
import {
  insertService,
  insertEmployee,
  insertCategory,
  insertPackage,
  updateService,
  deleteService,
  updateCategory,
  deleteCategory,
  updatePackage,
  deletePackage,
  updateEmployee,
  deleteEmployee,
  insertTaskRole,
  updateTaskRole,
  deleteTaskRole,
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

export async function updateServiceSvc(actorId: string, input: unknown) {
  const data = updateServiceSchema.parse(input);
  await updateService(data);
  await audit({ actorId, action: "master.service.update", target: data.id, result: "ok" });
}

export async function deleteServiceSvc(actorId: string, input: unknown) {
  const data = idSchema.parse(input);
  await deleteService(data.id);
  await audit({ actorId, action: "master.service.delete", target: data.id, result: "ok" });
}

export async function updateCategorySvc(actorId: string, input: unknown) {
  const data = updateCategorySchema.parse(input);
  await updateCategory(data);
  await audit({ actorId, action: "master.category.update", target: data.id, result: "ok" });
}

export async function deleteCategorySvc(actorId: string, input: unknown) {
  const data = idSchema.parse(input);
  await deleteCategory(data.id);
  await audit({ actorId, action: "master.category.delete", target: data.id, result: "ok" });
}

export async function updatePackageSvc(actorId: string, input: unknown) {
  const data = updatePackageSchema.parse(input);
  await updatePackage(data);
  await audit({ actorId, action: "master.package.update", target: data.id, result: "ok" });
}

export async function deletePackageSvc(actorId: string, input: unknown) {
  const data = idSchema.parse(input);
  await deletePackage(data.id);
  await audit({ actorId, action: "master.package.delete", target: data.id, result: "ok" });
}

export async function updateEmployeeSvc(actorId: string, input: unknown) {
  const data = updateEmployeeSchema.parse(input);
  await updateEmployee(data);
  await audit({ actorId, action: "master.employee.update", target: data.id, result: "ok" });
}

export async function deleteEmployeeSvc(actorId: string, input: unknown) {
  const data = idSchema.parse(input);
  await deleteEmployee(data.id);
  await audit({ actorId, action: "master.employee.delete", target: data.id, result: "ok" });
}

export async function createTaskRoleSvc(actorId: string, input: unknown) {
  const data = createTaskRoleSchema.parse(input);
  const row = await insertTaskRole(data);
  await audit({ actorId, action: "master.taskrole.create", target: row.id, result: "ok", meta: { label: data.label } });
  return row;
}

export async function updateTaskRoleSvc(actorId: string, input: unknown) {
  const data = updateTaskRoleSchema.parse(input);
  await updateTaskRole(data.id, { label: data.label, forType: data.forType, active: data.active });
  await audit({ actorId, action: "master.taskrole.update", target: data.id, result: "ok" });
}

export async function deleteTaskRoleSvc(actorId: string, input: unknown) {
  const data = idSchema.parse(input);
  await deleteTaskRole(data.id);
  await audit({ actorId, action: "master.taskrole.delete", target: data.id, result: "ok" });
}
