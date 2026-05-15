import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listEmployees } from "@/server/repositories/master.repo";
import { EmployeesView } from "./_view.client";

export default async function Page() {
  await assert("master.view");
  const items = await listEmployees();
  return (
    <>
      <Topbar title="Master Data · Karyawan" crumb="Sistem" />
      <EmployeesView items={items} />
    </>
  );
}
