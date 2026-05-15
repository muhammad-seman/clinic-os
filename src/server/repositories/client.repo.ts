import "server-only";
import { and, asc, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { clients, bookings } from "../db/schema";

function normPhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const t = p.trim();
  return t === "" ? null : t;
}

export async function findClientByPhone(phone: string) {
  const norm = normPhone(phone);
  if (!norm) return null;
  const [row] = await db
    .select()
    .from(clients)
    .where(eq(clients.phone, norm))
    .limit(1);
  return row ?? null;
}

export class ClientPhoneConflictError extends Error {
  constructor(public existingName: string, public phone: string) {
    super(
      `Nomor telepon ${phone} sudah terdaftar atas nama "${existingName}". Pilih klien tersebut dari pencarian, atau gunakan nomor lain.`,
    );
    this.name = "ClientPhoneConflictError";
  }
}

/**
 * Mode "reuse" (default false): jika phone sudah terdaftar → throw conflict error.
 *   Dipakai ketika user mengisi data klien baru — kita TIDAK boleh menimpa nama
 *   pemilik nomor yang sudah ada.
 * Mode "reuse" true: pakai existing client kalau phone match, tanpa mengubah nama.
 *   Dipakai oleh alur internal kalau memang ingin attach booking ke klien existing
 *   tanpa lewat ClientSearchSelect.
 */
export async function getOrCreateClient(input: {
  name: string;
  phone: string | null;
  notes?: string | null;
  reuseIfPhoneExists?: boolean;
}) {
  const phone = normPhone(input.phone);
  if (phone) {
    const existing = await findClientByPhone(phone);
    if (existing) {
      if (input.reuseIfPhoneExists) return existing;
      throw new ClientPhoneConflictError(existing.name, phone);
    }
  }
  // Klien tanpa nomor telepon: tidak dideduplikasi (boleh ada banyak "Walk-in").
  // Untuk mematuhi unique constraint, generate sentinel phone.
  const insertPhone = phone ?? `noPhone-${crypto.randomUUID()}`;
  const [row] = await db
    .insert(clients)
    .values({
      name: input.name,
      phone: insertPhone,
      notes: input.notes ?? null,
    })
    .returning();
  if (!row) throw new Error("create client failed");
  return row;
}

export async function searchClients(q: string, limit = 20) {
  const term = q.trim();
  if (term === "") {
    return await db
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .orderBy(desc(clients.createdAt))
      .limit(limit);
  }
  return await db
    .select({ id: clients.id, name: clients.name, phone: clients.phone })
    .from(clients)
    .where(or(ilike(clients.name, `%${term}%`), ilike(clients.phone, `%${term}%`)))
    .orderBy(asc(clients.name))
    .limit(limit);
}

export async function getClient(id: string) {
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return row ?? null;
}

export async function listClientsPaged(opts: { q?: string | undefined; limit?: number | undefined; offset?: number | undefined }) {
  const term = opts.q?.trim() ?? "";
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const where = term
    ? or(ilike(clients.name, `%${term}%`), ilike(clients.phone, `%${term}%`))
    : undefined;
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      notes: clients.notes,
      createdAt: clients.createdAt,
      bookingsCount: sql<number>`(SELECT COUNT(*)::int FROM ${bookings} WHERE ${bookings.clientId} = ${clients.id})`,
    })
    .from(clients)
    .where(where)
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

/**
 * One-shot backfill: migrate distinct (phone,name) pairs from bookings into clients,
 * then link bookings.client_id. Idempotent.
 */
export async function migrateClientsFromBookings(): Promise<{ created: number; linked: number }> {
  let created = 0;
  let linked = 0;

  // Distinct phones first (these are the easy case).
  const phoneRows = await db
    .selectDistinct({
      phone: bookings.clientPhone,
      name: bookings.clientName,
    })
    .from(bookings)
    .where(and(isNotNull(bookings.clientPhone), sql`${bookings.clientPhone} <> ''`));

  for (const r of phoneRows) {
    if (!r.phone) continue;
    const phone = r.phone.trim();
    if (!phone) continue;
    const existing = await findClientByPhone(phone);
    if (!existing) {
      await db
        .insert(clients)
        .values({ name: r.name, phone })
        .onConflictDoNothing();
      created += 1;
    }
    const updated = await db
      .update(bookings)
      .set({ clientId: sql`(SELECT id FROM ${clients} WHERE phone = ${phone} LIMIT 1)` })
      .where(and(eq(bookings.clientPhone, phone), sql`${bookings.clientId} IS NULL`))
      .returning({ id: bookings.id });
    linked += updated.length;
  }

  return { created, linked };
}
