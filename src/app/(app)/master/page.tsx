import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import {
  listServices,
  listCategoriesWithCount,
  listPackages,
  listEmployees,
  listMaterials,
  listTaskRoles,
} from "@/server/repositories/master.repo";
import { MasterView } from "./_view.client";

export default async function Page() {
  await assert("master.view");
  const [services, categories, packages, roles, employees, materials] =
    await Promise.all([
      listServices(),
      listCategoriesWithCount(),
      listPackages(),
      listTaskRoles(),
      listEmployees(),
      listMaterials(),
    ]);
  const empSerial = employees.map((e) => ({
    ...e,
    joinedAt: e.joinedAt.toISOString(),
  }));
  return (
    <>
      <Topbar title="Master Data" crumb="Sistem" />
      <MasterView
        services={services}
        categories={categories}
        packages={packages}
        roles={roles}
        employees={empSerial}
        materials={materials}
      />
    </>
  );
}
