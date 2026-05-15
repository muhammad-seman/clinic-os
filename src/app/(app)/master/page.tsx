import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import {
  listServices,
  listCategoriesWithCount,
  listPackages,
  listEmployees,
  listTaskRoles,
} from "@/server/repositories/master.repo";
import { MasterView } from "./_view.client";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { services, packages, taskRoles, employees } from "@/server/db/schema";

const TABS = ["services", "packages", "roles", "employees"] as const;
type Tab = (typeof TABS)[number];

async function getCounts() {
  const [s] = await db.select({ c: sql<number>`count(*)::int` }).from(services);
  const [p] = await db.select({ c: sql<number>`count(*)::int` }).from(packages);
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(taskRoles);
  const [e] = await db.select({ c: sql<number>`count(*)::int` }).from(employees);
  return {
    services: s?.c ?? 0,
    packages: p?.c ?? 0,
    roles: r?.c ?? 0,
    employees: e?.c ?? 0,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await assert("master.view");
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "services";

  const counts = await getCounts();

  let data: Parameters<typeof MasterView>[0]["data"] = {};

  if (tab === "services") {
    const [s, c] = await Promise.all([listServices(), listCategoriesWithCount()]);
    data = { services: s, categories: c };
  } else if (tab === "packages") {
    const [p, s] = await Promise.all([listPackages(), listServices()]);
    data = { packages: p, services: s };
  } else if (tab === "roles") {
    data = { roles: await listTaskRoles() };
  } else if (tab === "employees") {
    const emp = await listEmployees();
    data = {
      employees: emp.map((e) => ({ ...e, joinedAt: e.joinedAt.toISOString() })),
    };
  }

  return (
    <>
      <Topbar title="Master Data" crumb="Sistem" />
      <MasterView tab={tab} counts={counts} data={data} />
    </>
  );
}
