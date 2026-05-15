import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  module: text("module").notNull(),
  label: text("label").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionKey] }) }),
);

export type Permission = typeof permissions.$inferSelect;
