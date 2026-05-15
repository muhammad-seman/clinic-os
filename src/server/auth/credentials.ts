import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";

export type Verified = { id: string; email: string; name: string; sid?: string };

const SESSION_TTL_DAYS = 30;

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<Verified | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!row || !row.passwordHash) return null;
  if (row.status !== "active" && row.status !== "pending") return null;

  const argon2 = await import("argon2");
  const ok = await argon2.verify(row.passwordHash, password);
  if (!ok) return null;

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const [s] = await db
    .insert(sessions)
    .values({
      userId: row.id,
      tokenHash,
      expiresAt,
      deviceLabel: "Web",
    })
    .returning({ id: sessions.id });

  return { id: row.id, email: row.email, name: row.name, sid: s!.id };
}
