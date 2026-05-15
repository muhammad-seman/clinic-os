import { z } from "zod";

export const bookingFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "done", "cancelled", "no_show"]).optional(),
  cursor: z.string().nullish(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const createBookingSchema = z.object({
  clientName: z.string().min(1).max(120),
  clientPhone: z.string().max(40).optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  packageId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  scheduledAt: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
});

export const settleBookingSchema = z.object({
  id: z.string().uuid(),
  amountCents: z.coerce.bigint().positive(),
});

export type BookingFilter = z.infer<typeof bookingFilterSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
