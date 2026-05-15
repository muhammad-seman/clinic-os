import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1).max(120),
  categoryId: z.string().uuid().optional().nullable(),
  priceCents: z.coerce.bigint().nonnegative(),
  durationMin: z.coerce.number().int().min(5).max(600).default(30),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(40),
  phone: z.string().max(40).optional().nullable(),
});

export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  categoryId: z.string().uuid().optional().nullable(),
  priceCents: z.coerce.bigint().nonnegative(),
  durationMin: z.coerce.number().int().min(5).max(600),
  active: z.coerce.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
});

export const updatePackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  priceCents: z.coerce.bigint().nonnegative(),
  serviceIds: z.array(z.string().uuid()).min(2),
  active: z.coerce.boolean().optional().default(true),
});

export const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(40),
  phone: z.string().max(40).optional().nullable(),
  active: z.coerce.boolean().optional().default(true),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const createTaskRoleSchema = z.object({
  label: z.string().min(1).max(80),
  forType: z.enum(["doctor", "staff"]).default("staff"),
});

export const updateTaskRoleSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(80),
  forType: z.enum(["doctor", "staff"]),
  active: z.coerce.boolean().optional().default(true),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
});

export const createPackageSchema = z.object({
  name: z.string().min(1).max(120),
  priceCents: z.coerce.bigint().nonnegative(),
  serviceIds: z.array(z.string().uuid()).min(2),
});
