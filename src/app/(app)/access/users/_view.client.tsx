"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { KpiSmall, RolePill, StatusPill, initials, relTime, roleDef } from "../_shared";
import { bulkUpdateUsersStatusAction, deleteUsersAction } from "./_actions";
import { AddUserDrawer } from "./_add-drawer.client";
import { ConfirmDialog } from "./_confirm.client";
import { UserDrawer } from "./_drawer.client";
import { exportUsersCsv } from "./_export";
import { Pagination } from "./_pagination.client";
import { RowMenu } from "./_row-menu.client";
import { BulkBar, UsersToolbar } from "./_toolbar.client";
import type { BulkAction, RoleOpt, UserRow } from "./_types";

export function UsersView({ items, roles }: { items: UserRow[]; roles: RoleOpt[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bulkPending, startBulk] = useTransition();
  const [confirm, setConfirm] = useState<null | { action: BulkAction; ids: string[] }>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const q = query.toLowerCase();
  const filtered = items.filter((u) => {
    if (roleFilter !== "all" && u.roleSlug !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (q && !(u.name + u.email).toLowerCase().includes(q)) return false;
    return true;
  });

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter, pageSize]);

  useEffect(() => {
    const valid = new Set(filtered.map((u) => u.id));
    setChecked((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => valid.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
    // depend on filter inputs, not the derived array reference (which changes each render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const allChecked = pageRows.length > 0 && pageRows.every((u) => checked.has(u.id));
  const someChecked = !allChecked && pageRows.some((u) => checked.has(u.id));

  const toggleAllOnPage = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allChecked) pageRows.forEach((u) => next.delete(u.id));
      else pageRows.forEach((u) => next.add(u.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setChecked(new Set());

  const stats = {
    total: items.length,
    active: items.filter((u) => u.status === "active").length,
    pending: items.filter((u) => u.status === "pending").length,
    locked: items.filter((u) => u.status === "locked").length,
  };
  const pct = (n: number) =>
    stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

  const handleExport = () => {
    exportUsersCsv(filtered, roles);
    setToast(`Mengekspor ${filtered.length} baris`);
  };

  const runBulk = (action: BulkAction, ids: string[]) => {
    startBulk(async () => {
      let res: { ok: true } | { ok: false; error: string };
      if (action === "delete") res = await deleteUsersAction(ids);
      else if (action === "disable") res = await bulkUpdateUsersStatusAction(ids, "disabled");
      else res = await bulkUpdateUsersStatusAction(ids, "locked");
      if (res.ok) {
        setToast(
          action === "delete"
            ? `${ids.length} pengguna dihapus`
            : action === "disable"
              ? `${ids.length} pengguna dinonaktifkan`
              : `${ids.length} pengguna dikunci`,
        );
        clearSelection();
        router.refresh();
      } else setToast(res.error);
      setConfirm(null);
    });
  };

  const selectedIds = Array.from(checked);

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Pengguna</h2>
          <p>{stats.total} akun · kelola peran & kredensial</p>
        </div>
        <div className="hstack">
          <button className="btn" onClick={handleExport}>
            <Icon name="download" size={13} /> Ekspor CSV
          </button>
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={13} /> Tambah Pengguna
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiSmall icon="users" label="Total Akun" value={stats.total} hint="Termasuk non-aktif" />
        <KpiSmall
          icon="check"
          label="Aktif"
          value={stats.active}
          hint={`${pct(stats.active)}% dari total`}
          tone="sage"
        />
        <KpiSmall
          icon="mail"
          label="Tertunda"
          value={stats.pending}
          hint="Belum aktif"
          tone="gold"
        />
        <KpiSmall
          icon="lock"
          label="Terkunci"
          value={stats.locked}
          hint={`${pct(stats.locked)}% dari total`}
          tone="navy"
        />
      </div>

      <div className="card">
        <UsersToolbar
          query={query}
          onQuery={setQuery}
          roleFilter={roleFilter}
          onRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          roles={roles}
        />

        {selectedIds.length > 0 && (
          <BulkBar
            count={selectedIds.length}
            pending={bulkPending}
            onAction={(a) => setConfirm({ action: a, ids: selectedIds })}
            onClear={clearSelection}
          />
        )}

        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th style={{ paddingLeft: 24, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={toggleAllOnPage}
                    aria-label="Pilih semua di halaman ini"
                  />
                </th>
                <th style={{ width: 44 }}>No</th>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>IP Terakhir</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u, idx) => {
                const rd = roleDef(u.roleSlug);
                const isChecked = checked.has(u.id);
                return (
                  <tr key={u.id} onClick={() => setSelected(u)} style={{ cursor: "pointer" }}>
                    <td style={{ paddingLeft: 24 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(u.id)}
                        aria-label={`Pilih ${u.name}`}
                      />
                    </td>
                    <td className="muted text-xs mono">{startIdx + idx + 1}</td>
                    <td>
                      <div className="row" style={{ gap: 11 }}>
                        <div
                          className="avatar"
                          style={{ width: 34, height: 34, fontSize: 11, background: rd.color }}
                        >
                          {initials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--ink)" }}>{u.name}</div>
                          <div className="muted text-xs mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RolePill role={u.roleSlug} />
                    </td>
                    <td>
                      <StatusPill status={u.status} />
                    </td>
                    <td className="muted text-xs">
                      {u.lastLoginAt ? (
                        relTime(u.lastLoginAt)
                      ) : (
                        <span className="muted-2">Belum pernah</span>
                      )}
                    </td>
                    <td className="muted text-xs">
                      <div className="mono">{u.lastLoginIp ?? "—"}</div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ paddingRight: 24 }}>
                      <RowMenu
                        user={u}
                        onToast={setToast}
                        onChanged={() => router.refresh()}
                        onDelete={(id) => setConfirm({ action: "delete", ids: [id] })}
                      />
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <b>Tidak ada hasil</b>Coba ubah pencarian atau filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filtered.length}
          startIdx={startIdx}
          endIdx={endIdx}
          totalPages={totalPages}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>

      {selected && (
        <UserDrawer
          user={selected}
          roles={roles}
          onClose={() => setSelected(null)}
          onToast={setToast}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
      {adding && (
        <AddUserDrawer
          roles={roles}
          onClose={() => setAdding(false)}
          onToast={setToast}
          onAdded={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          action={confirm.action}
          count={confirm.ids.length}
          pending={bulkPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => runBulk(confirm.action, confirm.ids)}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "var(--navy-800)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
