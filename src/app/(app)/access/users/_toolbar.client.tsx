"use client";

import { Icon } from "@/components/ui/icon";
import type { RoleOpt } from "./_types";

export function UsersToolbar({
  query,
  onQuery,
  roleFilter,
  onRoleFilter,
  statusFilter,
  onStatusFilter,
  roles,
}: {
  query: string;
  onQuery: (v: string) => void;
  roleFilter: string;
  onRoleFilter: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  roles: RoleOpt[];
}) {
  const hasFilter = query || roleFilter !== "all" || statusFilter !== "all";
  return (
    <div
      className="card-h"
      style={{ gap: 10, display: "flex", flexWrap: "nowrap", alignItems: "center" }}
    >
      <div className="search" style={{ flex: "1 1 auto", minWidth: 0 }}>
        <Icon name="search" size={15} />
        <input
          placeholder="Cari nama atau email…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <select
        className="select"
        value={roleFilter}
        onChange={(e) => onRoleFilter(e.target.value)}
        style={{ width: 160, flex: "0 0 auto" }}
      >
        <option value="all">Semua peran</option>
        {roles.map((r) => (
          <option key={r.id} value={r.slug}>
            {r.label}
          </option>
        ))}
      </select>
      <select
        className="select"
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value)}
        style={{ width: 150, flex: "0 0 auto" }}
      >
        <option value="all">Semua status</option>
        <option value="active">Aktif</option>
        <option value="pending">Tertunda</option>
        <option value="locked">Terkunci</option>
        <option value="disabled">Non-aktif</option>
      </select>
      {hasFilter && (
        <button
          className="btn ghost sm"
          style={{ flex: "0 0 auto" }}
          onClick={() => {
            onQuery("");
            onRoleFilter("all");
            onStatusFilter("all");
          }}
        >
          <Icon name="x" size={12} /> Reset
        </button>
      )}
    </div>
  );
}

export function BulkBar({
  count,
  pending,
  onAction,
  onClear,
}: {
  count: number;
  pending: boolean;
  onAction: (a: "delete" | "disable" | "lock") => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 24px",
        background: "var(--bg-sunken)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        fontSize: 13,
      }}
    >
      <span style={{ fontWeight: 600 }}>{count} dipilih</span>
      <span className="muted">·</span>
      <button className="btn ghost sm" disabled={pending} onClick={() => onAction("lock")}>
        <Icon name="lock" size={12} /> Kunci
      </button>
      <button className="btn ghost sm" disabled={pending} onClick={() => onAction("disable")}>
        <Icon name="x" size={12} /> Nonaktifkan
      </button>
      <button
        className="btn ghost sm"
        disabled={pending}
        style={{ color: "var(--rose)" }}
        onClick={() => onAction("delete")}
      >
        <Icon name="trash" size={12} /> Hapus
      </button>
      <div style={{ flex: 1 }} />
      <button className="btn ghost sm" onClick={onClear}>
        Batal
      </button>
    </div>
  );
}
