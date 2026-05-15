import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listServices, listCategories } from "@/server/repositories/master.repo";
import { ServicesView } from "./_view.client";

export default async function Page() {
  await assert("master.view");
  const [items, cats] = await Promise.all([listServices(), listCategories()]);
  return (
    <>
      <Topbar title="Master Data · Layanan" crumb="Sistem" />
      <ServicesView items={items} categories={cats} />
    </>
  );
}
