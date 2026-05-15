import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listUsers, listRolesWithPerms } from "@/server/repositories/access.repo";
import { UsersView } from "./_view.client";

export default async function Page() {
  await assert("users.view");
  const [items, rolesData] = await Promise.all([listUsers(), listRolesWithPerms()]);
  return (
    <>
      <Topbar title="Pengguna" crumb="Akses & Keamanan" />
      <UsersView items={items} roles={rolesData.roles} />
    </>
  );
}
