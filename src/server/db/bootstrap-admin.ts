import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import * as schema from "./schema";
import { roles, users } from "./schema";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@klinik.id";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const name = process.env.ADMIN_NAME ?? "Admin Klinik";

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "superadmin"))
    .limit(1);
  if (!role) throw new Error("superadmin role missing — run db:seed first");

  const passwordHash = await argon2.hash(password);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, status: "active", roleId: role.id })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user ${email}`);
  } else {
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      roleId: role.id,
      status: "active",
    });
    console.log(`Created superadmin ${email}`);
  }
  console.log(`Login: ${email} / ${password}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
