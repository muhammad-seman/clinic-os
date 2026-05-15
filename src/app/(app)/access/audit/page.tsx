import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listAudit, listUsers } from "@/server/repositories/access.repo";
import { AuditView } from "./_view.client";

export default async function Page() {
  await assert("audit.view");
  const [events, users] = await Promise.all([
    listAudit({ sinceDays: 99999, limit: 500 }),
    listUsers(),
  ]);
  const actors = users.map((u) => ({ id: u.id, name: u.name, roleSlug: u.roleSlug }));
  return (
    <>
      <Topbar title="Audit Log" crumb="Akses & Keamanan" />
      <AuditView events={events} actors={actors} />
    </>
  );
}
