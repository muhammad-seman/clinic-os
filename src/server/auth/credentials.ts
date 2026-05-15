import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export type Verified = { id: string; email: string; name: string; sid?: string };

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

  return { id: row.id, email: row.email, name: row.name };
}
