import { bigint, boolean, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { services } from "./services";

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  priceCents: bigint("price_cents", { mode: "bigint" }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const packageServices = pgTable(
  "package_services",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.packageId, t.serviceId] }) }),
);

export type Package = typeof packages.$inferSelect;
