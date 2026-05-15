/**
 * Truncate seluruh data transaksional & master, sisakan hanya:
 *   - users, roles, permissions, role_permissions
 *   - system_config
 *
 * Gunakan untuk reset lingkungan testing tanpa harus rebuild seluruh DB.
 *
 *   npm run db:truncate
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("⚠️  Akan menghapus data berikut:");
  console.log("   bookings, booking_assignments, booking_payments,");
  console.log("   clients, expenses, attendance, fee_payments,");
  console.log("   services, packages, package_services, categories,");
  console.log("   employees, task_roles, audit_log, sessions");
  console.log("");
  console.log("✅ Dipertahankan:");
  console.log("   users, roles, permissions, role_permissions, system_config");
  console.log("");

  // Urutan tabel: dependent dulu, lalu parent. CASCADE meng-handle FK.
  // RESTART IDENTITY tidak relevan (pakai uuid), tapi sertakan untuk konsistensi.
  await db.execute(sql`
    TRUNCATE TABLE
      audit_log,
      attendance,
      fee_payments,
      booking_payments,
      booking_assignments,
      bookings,
      expenses,
      clients,
      package_services,
      packages,
      services,
      categories,
      employees,
      task_roles,
      sessions
    RESTART IDENTITY CASCADE
  `);

  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM users)           AS users,
      (SELECT count(*) FROM roles)           AS roles,
      (SELECT count(*) FROM permissions)     AS permissions,
      (SELECT count(*) FROM role_permissions) AS role_permissions,
      (SELECT count(*) FROM system_config)   AS system_config,
      (SELECT count(*) FROM bookings)        AS bookings,
      (SELECT count(*) FROM clients)         AS clients,
      (SELECT count(*) FROM services)        AS services,
      (SELECT count(*) FROM employees)       AS employees,
      (SELECT count(*) FROM expenses)        AS expenses,
      (SELECT count(*) FROM audit_log)       AS audit_log
  `);

  console.log("Counts setelah truncate:", counts.rows[0]);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
