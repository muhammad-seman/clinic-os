import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import {
  categories,
  services,
  packages,
  packageServices,
  employees,
  materials,
  bookings,
  roles,
} from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db
    .delete(roles)
    .where(sql`slug in ('dokter','terapis') and is_system = false`);

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

  const byName = (n: string) => cats.find((c) => c.name === n)?.id ?? null;

  await db
    .insert(services)
    .values([
      { categoryId: byName("Facial"), name: "Facial Glow", priceCents: 350000n, durationMin: 45 },
      { categoryId: byName("Facial"), name: "Acne Facial", priceCents: 425000n, durationMin: 60 },
      { categoryId: byName("Laser"), name: "Laser Pico Toning", priceCents: 1200000n, durationMin: 30 },
      { categoryId: byName("Laser"), name: "Laser Hair Removal", priceCents: 950000n, durationMin: 45 },
      { categoryId: byName("Body Treatment"), name: "Body Slimming", priceCents: 1500000n, durationMin: 90 },
      { categoryId: byName("Injectable"), name: "Botox Forehead", priceCents: 3500000n, durationMin: 30 },
      { categoryId: byName("Injectable"), name: "Filler Nasolabial", priceCents: 5500000n, durationMin: 45 },
    ])
    .onConflictDoNothing();

  const [pkgRow] = await db
    .insert(packages)
    .values({ name: "Bridal Glow x4", priceCents: 1200000n })
    .onConflictDoNothing()
    .returning({ id: packages.id });

  if (pkgRow) {
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

  await db
    .insert(employees)
    .values([
      { name: "dr. Anindya Putri", type: "Dokter", phone: "0812-3456-7001" },
      { name: "dr. Bayu Pratama", type: "Dokter", phone: "0812-3456-7002" },
      { name: "Sari Lestari", type: "Terapis", phone: "0812-3456-7003" },
      { name: "Wulan Anggraini", type: "Terapis", phone: "0812-3456-7004" },
      { name: "Risma Andini", type: "Resepsionis", phone: "0812-3456-7005" },
    ])
    .onConflictDoNothing();

  await db
    .insert(materials)
    .values([
      { name: "Serum Vitamin C", unit: "btl", costCents: 85000n, stock: 12, minStock: 5 },
      { name: "Masker Lembar", unit: "pcs", costCents: 12000n, stock: 80, minStock: 30 },
      { name: "Jarum 30G", unit: "pcs", costCents: 8500n, stock: 3, minStock: 20 },
      { name: "Toner Hidrasi", unit: "btl", costCents: 65000n, stock: 18, minStock: 6 },
      { name: "Gel Konduktor Laser", unit: "btl", costCents: 110000n, stock: 4, minStock: 8 },
    ])
    .onConflictDoNothing();

  const doctors = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(eq(employees.type, "Dokter"));
  const allSvc = await db.select({ id: services.id, name: services.name, priceCents: services.priceCents }).from(services);

  const sampleClients = [
    "Anita Pratiwi", "Bunga Rachma", "Citra Wulandari", "Dewi Saraswati",
    "Eka Putri", "Fitri Handayani", "Gita Maharani", "Hana Saputri",
  ];
  const statuses = ["scheduled", "in_progress", "done", "scheduled", "done"] as const;
  const payments = ["unpaid", "dp", "paid", "termin", "paid"] as const;

  for (let i = 0; i < sampleClients.length; i++) {
    const svc = allSvc[i % allSvc.length];
    const doc = doctors[i % Math.max(doctors.length, 1)];
    if (!svc) continue;
    const status = statuses[i % statuses.length]!;
    const payment = payments[i % payments.length]!;
    const dayOffset = i - 2;
    const sched = new Date();
    sched.setDate(sched.getDate() + dayOffset);
    sched.setHours(10 + (i % 6), 0, 0, 0);
    const paid =
      payment === "paid" ? svc.priceCents : payment === "dp" ? svc.priceCents / 2n : 0n;
    await db
      .insert(bookings)
      .values({
        code: `BK-${(Date.now() + i).toString(36).toUpperCase()}`,
        clientName: sampleClients[i]!,
        clientPhone: `0812-9000-${(1000 + i).toString().padStart(4, "0")}`,
        serviceId: svc.id,
        doctorId: doc?.id ?? null,
        scheduledAt: sched,
        status,
        payment,
        paidCents: paid,
        remainingCents: svc.priceCents - paid,
      })
      .onConflictDoNothing();
  }

  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM categories) AS categories,
      (SELECT count(*) FROM services)   AS services,
      (SELECT count(*) FROM packages)   AS packages,
      (SELECT count(*) FROM employees)  AS employees,
      (SELECT count(*) FROM materials)  AS materials,
      (SELECT count(*) FROM bookings)   AS bookings
  `);
  console.log("Demo seed done:", counts.rows[0]);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
