/**
 * Demo seed — data contoh untuk lingkungan development.
 *
 * Yang di-seed (idempotent, skip jika sudah ada):
 *   - 2 user demo (owner, admin) dengan password sederhana
 *   - Kategori, jasa, paket
 *   - Karyawan & peran tindakan (task roles)
 *
 * BUKAN untuk production. Akan refuse jika NODE_ENV=production.
 *
 *   npm run db:seed-demo
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";
import argon2 from "argon2";
import * as schema from "./schema";
import {
  categories,
  employees,
  packageServices,
  packages,
  roles,
  services,
  taskRoles,
  users,
} from "./schema";

if (process.env.NODE_ENV === "production") {
  console.error("✖ seed-demo dilarang di production.");
  process.exit(1);
}

type DemoUser = {
  email: string;
  name: string;
  roleSlug: "owner" | "admin";
  password: string;
};

const DEMO_USERS: DemoUser[] = [
  { email: "owner@klinik.local", name: "Owner Demo", roleSlug: "owner", password: "owner123" },
  { email: "admin@klinik.local", name: "Admin Demo", roleSlug: "admin", password: "admin123" },
];

async function seedDemoUsers(db: ReturnType<typeof drizzle<typeof schema>>) {
  const roleRows = await db.select({ id: roles.id, slug: roles.slug }).from(roles);
  const roleBySlug = new Map(roleRows.map((r) => [r.slug, r.id]));

  for (const u of DEMO_USERS) {
    const roleId = roleBySlug.get(u.roleSlug);
    if (!roleId) {
      console.warn(`⚠️  role "${u.roleSlug}" belum ada — jalankan db:seed dulu`);
      continue;
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing) {
      console.log(`↻ user demo: ${u.email}`);
      continue;
    }
    const passwordHash = await argon2.hash(u.password);
    await db.insert(users).values({
      email: u.email,
      name: u.name,
      passwordHash,
      roleId,
      status: "active",
    });
    console.log(`+ user demo: ${u.email} / ${u.password}`);
  }
}

async function seedCategoriesAndServices(db: ReturnType<typeof drizzle<typeof schema>>) {
  const cats = await db
    .insert(categories)
    .values([
      { name: "Facial" },
      { name: "Laser" },
      { name: "Body Treatment" },
      { name: "Injectable" },
    ])
    .onConflictDoNothing()
    .returning({ id: categories.id, name: categories.name });

  const existing = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const idByName = new Map([...cats, ...existing].map((c) => [c.name, c.id]));

  await db
    .insert(services)
    .values([
      { categoryId: idByName.get("Facial") ?? null, name: "Facial Glow", priceCents: 350000n, durationMin: 45 },
      { categoryId: idByName.get("Facial") ?? null, name: "Acne Facial", priceCents: 425000n, durationMin: 60 },
      { categoryId: idByName.get("Laser") ?? null, name: "Laser Pico Toning", priceCents: 1200000n, durationMin: 30 },
      { categoryId: idByName.get("Laser") ?? null, name: "Laser Hair Removal", priceCents: 950000n, durationMin: 45 },
      { categoryId: idByName.get("Body Treatment") ?? null, name: "Body Slimming", priceCents: 1500000n, durationMin: 90 },
      { categoryId: idByName.get("Injectable") ?? null, name: "Botox Forehead", priceCents: 3500000n, durationMin: 30 },
      { categoryId: idByName.get("Injectable") ?? null, name: "Filler Nasolabial", priceCents: 5500000n, durationMin: 45 },
    ])
    .onConflictDoNothing();
}

async function seedPackages(db: ReturnType<typeof drizzle<typeof schema>>) {
  const [pkgRow] = await db
    .insert(packages)
    .values({ name: "Bridal Glow x4", priceCents: 1200000n })
    .onConflictDoNothing()
    .returning({ id: packages.id });

  if (!pkgRow) return;

  const svc = await db.select({ id: services.id, name: services.name }).from(services);
  const facial = svc.find((s) => s.name === "Facial Glow");
  const acne = svc.find((s) => s.name === "Acne Facial");
  if (facial && acne) {
    await db
      .insert(packageServices)
      .values([
        { packageId: pkgRow.id, serviceId: facial.id },
        { packageId: pkgRow.id, serviceId: acne.id },
      ])
      .onConflictDoNothing();
  }
}

async function seedEmployees(db: ReturnType<typeof drizzle<typeof schema>>) {
  await db
    .insert(employees)
    .values([
      { name: "dr. Anindya Putri", type: "doctor", phone: "0812-3456-7001" },
      { name: "dr. Bayu Pratama", type: "doctor", phone: "0812-3456-7002" },
      { name: "Sari Lestari", type: "therapist", phone: "0812-3456-7003" },
      { name: "Wulan Anggraini", type: "therapist", phone: "0812-3456-7004" },
      { name: "Risma Andini", type: "receptionist", phone: "0812-3456-7005" },
    ])
    .onConflictDoNothing();
}

async function seedTaskRoles(db: ReturnType<typeof drizzle<typeof schema>>) {
  await db
    .insert(taskRoles)
    .values([
      { slug: "dokter-tindakan", label: "Dokter Tindakan", forType: "doctor" },
      { slug: "asisten-dokter", label: "Asisten Dokter", forType: "staff" },
      { slug: "beautician", label: "Beautician", forType: "staff" },
      { slug: "pencuci-rambut", label: "Pencuci Rambut", forType: "staff" },
    ])
    .onConflictDoNothing();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak di-set.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log("→ demo users");
    await seedDemoUsers(db);
    console.log("→ kategori & jasa");
    await seedCategoriesAndServices(db);
    console.log("→ paket promo");
    await seedPackages(db);
    console.log("→ karyawan");
    await seedEmployees(db);
    console.log("→ peran tindakan");
    await seedTaskRoles(db);

    const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(services);
    console.log(`✔ Demo seed selesai. Total services: ${row?.c ?? 0}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✖ Demo seed gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
