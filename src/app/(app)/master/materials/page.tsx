import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listMaterials } from "@/server/repositories/master.repo";
import { MaterialsView } from "./_view.client";

export default async function Page() {
  await assert("master.view");
  const items = await listMaterials();
  return (
    <>
      <Topbar title="Master Data · Bahan & Stok" crumb="Sistem" />
      <MaterialsView items={items} />
    </>
  );
}
