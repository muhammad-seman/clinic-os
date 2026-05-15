import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { roles, permissions, rolePermissions } from "./schema";
import { PERM_CATALOG, ROLE_DEFAULT_MODULES, SYSTEM_ROLES } from "@/lib/permissions";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db
    .insert(permissions)
    .values(PERM_CATALOG.map((p) => ({ key: p.key, module: p.module, label: p.label })))
    .onConflictDoNothing();

  for (const [slug, def] of Object.entries(SYSTEM_ROLES)) {
    const [row] = await db
      .insert(roles)
      .values({ slug, label: def.label, isSystem: true })
      .onConflictDoNothing()
      .returning({ id: roles.id });
    if (!row) continue;
    const allowed = ROLE_DEFAULT_MODULES[slug as keyof typeof SYSTEM_ROLES];
    const keys = PERM_CATALOG.filter((p) => allowed.includes(p.module as never)).map((p) => p.key);
    if (keys.length === 0) continue;
    await db
      .insert(rolePermissions)
      .values(keys.map((k) => ({ roleId: row.id, permissionKey: k })))
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
