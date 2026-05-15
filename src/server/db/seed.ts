/**
 * Production seed — idempotent first-run bootstrap.
 *
 * Yang di-seed:
 *   - permissions (katalog izin)
 *   - roles sistem (superadmin, owner, admin)
 *   - role_permissions (default modul per role)
 *   - 1 user superadmin (dari env)
 *
 * Tidak menyentuh data transaksional/master. Aman dijalankan ulang.
 *
 * Env wajib:
 *   SEED_SUPERADMIN_EMAIL
 *   SEED_SUPERADMIN_PASSWORD
 * Env opsional:
 *   SEED_SUPERADMIN_NAME (default: "Superadmin")
 *
 *   npm run db:seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import argon2 from "argon2";
import * as schema from "./schema";
import { permissions, rolePermissions, roles, users } from "./schema";
import {
  PERM_CATALOG,
  ROLE_DEFAULT_MODULES,
  ROLE_PERMISSION_DENY,
  SYSTEM_ROLES,
  type SystemRole,
} from "@/lib/permissions";

const IS_PROD = process.env.NODE_ENV === "production";

function readSuperadminConfig() {
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim();
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  const name = process.env.SEED_SUPERADMIN_NAME?.trim() || "Superadmin";

  if (!email || !password) {
    if (IS_PROD) {
      throw new Error(
        "SEED_SUPERADMIN_EMAIL dan SEED_SUPERADMIN_PASSWORD wajib di-set di production.",
      );
    }
    console.warn(
      "⚠️  SEED_SUPERADMIN_EMAIL/PASSWORD tidak di-set — fallback ke default dev (jangan dipakai di prod).",
    );
    return {
      email: email || "superadmin@klinik.local",
      password: password || "ChangeMe!123",
      name,
    };
  }
  if (password.length < 8) {
    throw new Error("SEED_SUPERADMIN_PASSWORD minimal 8 karakter.");
  }
  return { email, password, name };
}

async function seedPermissions(db: ReturnType<typeof drizzle<typeof schema>>) {
  const catalogKeys = PERM_CATALOG.map((p) => p.key);

  await db
    .insert(permissions)
    .values(PERM_CATALOG.map((p) => ({ key: p.key, module: p.module, label: p.label })))
    .onConflictDoNothing();

  // Bersihkan permissions yang tidak ada di katalog saat ini (mis. modul yang sudah dihapus).
  // role_permissions punya FK ON DELETE CASCADE — assignment terkait ikut terhapus.
  const removed = await db
    .delete(permissions)
    .where(notInArray(permissions.key, catalogKeys))
    .returning({ key: permissions.key });
  if (removed.length > 0) {
    console.log(`  ! menghapus ${removed.length} permission stale:`, removed.map((r) => r.key).join(", "));
  }
}

async function seedRolesAndAssignments(db: ReturnType<typeof drizzle<typeof schema>>) {
  for (const [slug, def] of Object.entries(SYSTEM_ROLES)) {
    await db
      .insert(roles)
      .values({ slug, label: def.label, isSystem: true })
      .onConflictDoNothing();

    const [row] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, slug))
      .limit(1);
    if (!row) continue;

    const allowed = ROLE_DEFAULT_MODULES[slug as SystemRole];
    const denied = new Set(ROLE_PERMISSION_DENY[slug as SystemRole] ?? []);
    const keys = PERM_CATALOG.filter((p) => allowed.includes(p.module as never))
      .map((p) => p.key)
      .filter((k) => !denied.has(k));

    if (keys.length > 0) {
      await db
        .insert(rolePermissions)
        .values(keys.map((k) => ({ roleId: row.id, permissionKey: k })))
        .onConflictDoNothing();
    }
    if (denied.size > 0) {
      await db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, row.id),
            inArray(rolePermissions.permissionKey, [...denied]),
          ),
        );
    }
  }
}

async function seedSuperadminUser(
  db: ReturnType<typeof drizzle<typeof schema>>,
  cfg: { email: string; password: string; name: string },
) {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "superadmin"))
    .limit(1);
  if (!role) throw new Error("Role superadmin tidak ditemukan setelah seeding.");

  const passwordHash = await argon2.hash(cfg.password);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, cfg.email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ roleId: role.id, status: "active" })
      .where(eq(users.id, existing.id));
    console.log(`↻ superadmin sudah ada: ${cfg.email} (status di-reset ke active, password tidak diubah)`);
    return;
  }

  await db.insert(users).values({
    email: cfg.email,
    name: cfg.name,
    passwordHash,
    roleId: role.id,
    status: "active",
  });
  console.log(`+ superadmin dibuat: ${cfg.email}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak di-set.");
  }
  const cfg = readSuperadminConfig();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log("→ seed permissions");
    await seedPermissions(db);
    console.log("→ seed system roles + role_permissions");
    await seedRolesAndAssignments(db);
    console.log("→ seed superadmin");
    await seedSuperadminUser(db, cfg);
    console.log("✔ Seed selesai.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✖ Seed gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
