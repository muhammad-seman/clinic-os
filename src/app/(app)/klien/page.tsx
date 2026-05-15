import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { PAGE_META } from "@/components/shell/nav";
import { listClientsPaged } from "@/server/repositories/client.repo";
import { ClientsView } from "./_view.client";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await assert("clients.view");
  const { q } = await searchParams;
  const rows = await listClientsPaged({ q, limit: 200 });
  const meta = PAGE_META.clients ?? { title: "Daftar Klien", crumb: "Operasional" };
  return (
    <>
      <Topbar title={meta.title} crumb={meta.crumb} />
      <ClientsView
        initialRows={rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
        initialQuery={q ?? ""}
      />
    </>
  );
}
