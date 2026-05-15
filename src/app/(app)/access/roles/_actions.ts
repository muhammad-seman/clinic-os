"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { assert } from "@/server/auth/rbac";
import { log } from "@/server/auth/audit";
import { setRolePermissions } from "@/server/repositories/access.repo";

export async function saveRoleMatrixAction(
  matrix: Record<string, string[]>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assert("roles.update");
    const session = await auth();
    const actorId = session?.user?.id ?? null;
    for (const [slug, keys] of Object.entries(matrix)) {
      if (slug === "superadmin") continue;
      await setRolePermissions(slug, keys);
      await log({
        actorId,
        action: "roles.update",
        target: `role:${slug}`,
        result: "ok",
        meta: { count: keys.length },
      });
    }
    revalidatePath("/access/roles");
    revalidatePath("/access/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "gagal" };
  }
}
