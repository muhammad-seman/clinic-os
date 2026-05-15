"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { TabLink } from "./_shared.client";
import { CategoryDrawer, ServiceDrawer, ServicesTab } from "./_tab-services.client";
import { EmployeeDrawer, EmployeesTab } from "./_tab-employees.client";
import { PackageDrawer, PackagesTab } from "./_tab-packages.client";
import { RolesTab, TaskRoleDrawer } from "./_tab-roles.client";
import type {
  Category,
  Data,
  Employee,
  Package,
  Service,
  Tab,
  TabCounts,
  TaskRole,
} from "./_types";

type DrawerState =
  | null
  | { kind: "service"; row?: Service }
  | { kind: "category"; row?: Category }
  | { kind: "package"; row?: Package }
  | { kind: "employee"; row?: Employee }
  | { kind: "taskRole"; row?: TaskRole };

export function MasterView({
  tab,
  counts,
  data,
}: {
  tab: Tab;
  counts: TabCounts;
  data: Data;
}) {
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const addLabel: Record<Tab, { label: string; kind: NonNullable<DrawerState>["kind"] } | null> = {
    services: { label: "Jasa", kind: "service" },
    packages: { label: "Paket", kind: "package" },
    roles: { label: "Peran Tindakan", kind: "taskRole" },
    employees: { label: "Karyawan", kind: "employee" },
  };
  const add = addLabel[tab];

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Master Data</h2>
          <p>Data referensial yang dipanggil oleh transaksi · Superadmin &amp; Admin</p>
        </div>
        {add && (
          <button className="btn primary" onClick={() => setDrawer({ kind: add.kind })}>
            <Icon name="plus" size={13} /> Tambah {add.label}
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        <TabLink tab="services" current={tab} count={counts.services}>
          Kategori &amp; Jasa
        </TabLink>
        <TabLink tab="packages" current={tab} count={counts.packages}>
          Paket Promo
        </TabLink>
        <TabLink tab="roles" current={tab} count={counts.roles}>
          Peran
        </TabLink>
        <TabLink tab="employees" current={tab} count={counts.employees}>
          Karyawan
        </TabLink>
      </div>

      {tab === "services" && (
        <ServicesTab
          services={data.services ?? []}
          categories={data.categories ?? []}
          onAddCategory={() => setDrawer({ kind: "category" })}
          onAddService={() => setDrawer({ kind: "service" })}
          onEditCategory={(row) => setDrawer({ kind: "category", row })}
          onEditService={(row) => setDrawer({ kind: "service", row })}
        />
      )}
      {tab === "packages" && (
        <PackagesTab
          packages={data.packages ?? []}
          onEdit={(row) => setDrawer({ kind: "package", row })}
        />
      )}
      {tab === "roles" && (
        <RolesTab
          roles={data.roles ?? []}
          onEdit={(row) => setDrawer({ kind: "taskRole", row })}
        />
      )}
      {tab === "employees" && (
        <EmployeesTab
          employees={data.employees ?? []}
          onEdit={(row) => setDrawer({ kind: "employee", row })}
        />
      )}
      {drawer?.kind === "service" && (
        <ServiceDrawer
          categories={data.categories ?? []}
          row={drawer.row}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.kind === "category" && (
        <CategoryDrawer row={drawer.row} onClose={() => setDrawer(null)} />
      )}
      {drawer?.kind === "package" && (
        <PackageDrawer
          services={data.services ?? []}
          row={drawer.row}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.kind === "employee" && (
        <EmployeeDrawer row={drawer.row} onClose={() => setDrawer(null)} />
      )}
      {drawer?.kind === "taskRole" && (
        <TaskRoleDrawer row={drawer.row} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}
