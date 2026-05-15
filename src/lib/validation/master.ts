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

export const createMaterialSchema = z.object({
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(20),
  costCents: z.coerce.bigint().nonnegative(),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
});

export const adjustStockSchema = z.object({
  id: z.string().uuid(),
  delta: z.coerce.number().int(),
});
