import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listRolesWithPerms } from "@/server/repositories/access.repo";
import { PERM_CATALOG } from "@/lib/permissions";
import { RolesView } from "./_view.client";

export default async function Page() {
  await assert("roles.view");
  const data = await listRolesWithPerms({ systemOnly: true });
  return (
    <>
      <Topbar title="Peran & Izin" crumb="Akses & Keamanan" />
      <RolesView roles={data.roles} matrix={data.matrix} catalog={PERM_CATALOG} />
    </>
  );
}
