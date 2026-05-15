import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Task roles = roles for booking execution (e.g. "Pencuci Rambut", "Asisten Dokter").
// Distinct from `roles` (account roles like superadmin/admin/staff).
export const taskRoles = pgTable("task_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  forType: text("for_type", { enum: ["doctor", "staff"] }).notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TaskRole = typeof taskRoles.$inferSelect;
export type NewTaskRole = typeof taskRoles.$inferInsert;
