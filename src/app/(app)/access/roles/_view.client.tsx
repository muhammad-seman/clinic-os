"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { roleDef } from "../_shared";
import { saveRoleMatrixAction } from "./_actions";

type Role = { id: string; slug: string; label: string; isSystem: boolean };
type Perm = { key: string; module: string; label: string };

const MODULE_ICON: Record<string, string> = {
  dashboard: "dashboard",
  calendar: "calendar",
  bookings: "booking",
  piutang: "receivable",
  fee: "fee",
  stock: "stock",
  insight: "insight",
  attendance: "attendance",
  master: "master",
  notif: "bell",
  config: "settings",
  users: "users",
  roles: "shield",
  audit: "history",
  sessions: "key",
};

const MODULE_LABEL: Record<string, string> = {
  dashboard: "Ringkasan",
  calendar: "Kalender",
  bookings: "Booking",
  piutang: "Kas Piutang",
  fee: "Fee Karyawan",
  stock: "Stok & Inventaris",
  insight: "Customer Insight",
  attendance: "Absensi",
  master: "Master Data",
  notif: "Notifikasi",
  config: "Konfigurasi",
  users: "Pengguna",
  roles: "Peran & Izin",
  audit: "Audit Log",
  sessions: "Sesi & Keamanan",
};

export function RolesView({
  roles,
  matrix: initialMatrix,
  catalog,
}: {
  roles: Role[];
  matrix: Record<string, string[]>;
  catalog: Perm[];
}) {
  const router = useRouter();
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    roles.forEach((r) => {
      m[r.slug] = new Set(initialMatrix[r.slug] ?? []);
    });
    return m;
  });
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const totalPerms = catalog.length;

  const grouped = useMemo(() => {
    const g: Record<string, Perm[]> = {};
    catalog.forEach((p) => {
      (g[p.module] ??= []).push(p);
    });
    return g;
  }, [catalog]);

  const toggle = (slug: string, key: string) => {
    if (slug === "superadmin") return;
    setMatrix((m) => {
      const next = { ...m };
      const s = new Set(next[slug]);
      if (s.has(key)) s.delete(key);
      else s.add(key);
      next[slug] = s;
      return next;
    });
    setDirty(true);
  };

  const reset = () => {
    const m: Record<string, Set<string>> = {};
    roles.forEach((r) => {
      m[r.slug] = new Set(initialMatrix[r.slug] ?? []);
    });
    setMatrix(m);
    setDirty(false);
  };

  const save = () => {
    const payload: Record<string, string[]> = {};
    Object.entries(matrix).forEach(([slug, set]) => {
      payload[slug] = Array.from(set);
    });
    start(async () => {
      const res = await saveRoleMatrixAction(payload);
      if (res.ok) {
        setDirty(false);
        setToast("Peran & izin disimpan");
        router.refresh();
      } else setToast(res.error);
    });
  };

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Peran &amp; Izin</h2>
          <p>
            Matrix kontrol akses · {totalPerms} izin granular di{" "}
            {Object.keys(grouped).length} modul
          </p>
        </div>
        <div className="hstack">
          {dirty && (
            <span className="pill gold">
              <span className="d" />
              Belum disimpan
            </span>
          )}
          <button type="button" className="btn" onClick={reset} disabled={pending || !dirty}>
            <Icon name="refresh" size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!dirty || pending}
            onClick={save}
          >
            <Icon name="check" size={13} /> {pending ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        {roles.map((r) => (
          <RoleCard
            key={r.id}
            role={r}
            count={matrix[r.slug]?.size ?? 0}
            total={totalPerms}
          />
        ))}
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Matrix Izin</h3>
            <p>Klik sel untuk toggle · Superadmin selalu mendapat semua izin</p>
          </div>
        </div>
        <div className="card-b flush" style={{ overflowX: "auto" }}>
          <table className="t matrix">
            <thead>
              <tr>
                <th style={{ paddingLeft: 24, minWidth: 280 }}>Izin</th>
                {roles.map((r) => {
                  const def = roleDef(r.slug);
                  return (
                    <th key={r.id} style={{ textAlign: "center", minWidth: 120 }}>
                      <div className="vstack" style={{ gap: 4, alignItems: "center" }}>
                        <span
                          className="d"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: def.color,
                          }}
                        />
                        <span
                          style={{
                            color: "var(--ink)",
                            textTransform: "none",
                            letterSpacing: 0,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {r.label}
                        </span>
                        <span
                          className="muted-2 mono"
                          style={{ fontSize: 10, letterSpacing: 0 }}
                        >
                          {matrix[r.slug]?.size ?? 0}/{totalPerms}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([mod, perms]) => (
                <ModuleRows
                  key={mod}
                  mod={mod}
                  perms={perms}
                  roles={roles}
                  matrix={matrix}
                  toggle={toggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

function ModuleRows({
  mod,
  perms,
  roles,
  matrix,
  toggle,
}: {
  mod: string;
  perms: Perm[];
  roles: Role[];
  matrix: Record<string, Set<string>>;
  toggle: (slug: string, key: string) => void;
}) {
  const icon = MODULE_ICON[mod] ?? "list";
  const label = MODULE_LABEL[mod] ?? mod;
  return (
    <>
      <tr>
        <td
          colSpan={1 + roles.length}
          style={{
            background: "var(--bg-sunken)",
            padding: "10px 24px",
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="row" style={{ gap: 10 }}>
            {/* @ts-expect-error dynamic icon name */}
            <Icon name={icon} size={14} style={{ color: "var(--navy-800)" }} />
            <span
              style={{
                fontWeight: 600,
                letterSpacing: ".02em",
                fontSize: 12,
                textTransform: "uppercase",
                color: "var(--ink-2)",
              }}
            >
              {label}
            </span>
            <span className="muted-2 text-xs">· {perms.length} izin</span>
          </div>
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p.key}>
          <td style={{ paddingLeft: 24 }}>
            <div style={{ fontWeight: 500 }}>{p.label}</div>
            <div className="muted mono text-xs">{p.key}</div>
          </td>
          {roles.map((r) => {
            const on = matrix[r.slug]?.has(p.key) ?? false;
            const locked = r.slug === "superadmin";
            const def = roleDef(r.slug);
            return (
              <td key={r.id} style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => toggle(r.slug, p.key)}
                  disabled={locked}
                  aria-pressed={on}
                  title={
                    locked
                      ? "Superadmin selalu memiliki semua izin"
                      : on
                        ? "Klik untuk cabut"
                        : "Klik untuk beri"
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    cursor: locked ? "not-allowed" : "pointer",
                    border: "1px solid " + (on ? def.color : "var(--line)"),
                    background: on ? def.color : "var(--bg-elev)",
                    color: "#fff",
                    display: "inline-grid",
                    placeItems: "center",
                    opacity: locked && !on ? 0.35 : 1,
                  }}
                >
                  {on && <Icon name="check" size={12} />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function RoleCard({ role, count, total }: { role: Role; count: number; total: number }) {
  const def = roleDef(role.slug);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="kpi" style={{ borderLeft: `3px solid ${def.color}` }}>
      <div className="row between">
        <div className="lbl">
          <span
            className="d"
            style={{ width: 8, height: 8, borderRadius: 999, background: def.color }}
          />{" "}
          {role.label}
        </div>
      </div>
      <div className="v mono" style={{ fontSize: 22 }}>
        {count}{" "}
        <span className="muted-2" style={{ fontSize: 13, fontWeight: 400 }}>
          / {total}
        </span>
      </div>
      <div className="bar" style={{ marginTop: 8 }}>
        <span style={{ width: pct + "%", background: def.color }} />
      </div>
      <div className="d" style={{ marginTop: 8 }}>
        {pct}% izin aktif ·{" "}
        {role.slug === "superadmin" ? "Tidak bisa diubah" : "Klik sel matrix di bawah"}
      </div>
    </div>
  );
}
