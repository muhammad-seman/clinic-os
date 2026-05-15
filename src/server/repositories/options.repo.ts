import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { services, employees } from "../db/schema";

export async function listServiceOptions() {
  const rows = await db
    .select({ id: services.id, name: services.name, priceCents: services.priceCents })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(services.name);
  return rows.map((r) => ({ ...r, priceCents: r.priceCents.toString() }));
}

export async function listDoctorOptions() {
  return await db
    .select({ id: employees.id, name: employees.name, type: employees.type })
    .from(employees)
    .where(eq(employees.active, true))
    .orderBy(employees.name);
}
