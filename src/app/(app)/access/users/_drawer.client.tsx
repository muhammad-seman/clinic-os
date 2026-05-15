"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { StatusPill, fmtDateTime, initials, roleDef } from "../_shared";
import { revokeUserSessionsAction, updateUserAction } from "./_actions";
import type { RoleOpt, UserRow } from "./_types";

export function UserDrawer({
  user,
  roles,
  onClose,
  onToast,
  onChanged,
}: {
  user: UserRow;
  roles: RoleOpt[];
  onClose: () => void;
  onToast: (m: string) => void;
  onChanged: () => void;
}) {
  const [roleSlug, setRoleSlug] = useState(user.roleSlug);
  const [pending, start] = useTransition();
  const dirty = roleSlug !== user.roleSlug;
  const rd = roleDef(user.roleSlug);

  const save = () => {
    start(async () => {
      const res = await updateUserAction(user.id, { roleSlug });
      if (res.ok) {
        onToast("Perubahan disimpan");
        onChanged();
      } else onToast(res.error);
    });
  };

  const revokeSessions = () => {
    start(async () => {
      const res = await revokeUserSessionsAction(user.id);
      if (!res.ok) {
        onToast(res.error);
        return;
      }
      const count = res.data?.count ?? 0;
      onToast(
        count === 0
          ? "Tidak ada sesi aktif untuk dicabut"
          : `${count} sesi dicabut`,
      );
    });
  };

  const lockToggle = () => {
    const next = user.status === "locked" ? "active" : "locked";
    start(async () => {
      const res = await updateUserAction(user.id, { status: next });
      if (res.ok) {
        onToast(next === "locked" ? "Akun dikunci" : "Akun dibuka");
        onChanged();
      } else onToast(res.error);
    });
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade" style={{ width: "min(560px, 100vw)" }}>
        <div className="drawer-h">
          <button className="btn ghost sm" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <StatusPill status={user.status} />
        </div>
        <div className="drawer-b vstack" style={{ gap: 18 }}>
          <section className="vstack" style={{ gap: 10 }}>
            <div className="eyebrow">Identitas</div>
            <div className="row" style={{ gap: 14 }}>
              <div
                className="avatar"
                style={{
                  width: 56,
                  height: 56,
                  fontSize: 18,
                  background: rd.color,
                }}
              >
                {initials(user.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
                <div className="muted text-xs mono">{user.email}</div>
                <div className="muted text-xs">
                  Bergabung {fmtDateTime(user.joined)}
                </div>
              </div>
            </div>
          </section>

          <section className="vstack" style={{ gap: 10 }}>
            <div className="eyebrow">Peran</div>
            <div className="grid-2 even" style={{ gap: 8 }}>
              {roles.map((r) => {
                const def = roleDef(r.slug);
                const active = roleSlug === r.slug;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleSlug(r.slug)}
                    className="btn"
                    style={{
                      justifyContent: "flex-start",
                      borderColor: active ? def.color : "var(--line)",
                      background: active ? def.color + "12" : "var(--bg-elev)",
                    }}
                  >
                    <span
                      className="d"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: def.color,
                      }}
                    />
                    <span style={{ fontWeight: active ? 600 : 500 }}>{r.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="muted text-xs">
              Peran menentukan modul & aksi yang dapat diakses. Lihat matrix di{" "}
              <b>Peran &amp; Izin</b>.
            </div>
          </section>

          <section className="vstack" style={{ gap: 10 }}>
            <div className="eyebrow">Keamanan</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn sm"
                onClick={revokeSessions}
                disabled={pending}
              >
                <Icon name="logout" size={12} />{" "}
                {pending ? "Mencabut…" : "Cabut Semua Sesi"}
              </button>
              {user.status !== "locked" ? (
                <button
                  type="button"
                  className="btn sm danger"
                  onClick={lockToggle}
                  disabled={pending}
                >
                  <Icon name="lock" size={12} /> Kunci Akun
                </button>
              ) : (
                <button
                  type="button"
                  className="btn sm"
                  onClick={lockToggle}
                  disabled={pending}
                >
                  <Icon name="unlock" size={12} /> Buka Kunci
                </button>
              )}
            </div>
          </section>

          <section className="vstack" style={{ gap: 10 }}>
            <div className="eyebrow">Login Terakhir</div>
            <div className="card" style={{ borderRadius: 10 }}>
              <div className="card-b" style={{ padding: 14 }}>
                <div className="row" style={{ gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--bg-sunken)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--navy-800)",
                    }}
                  >
                    <Icon name="monitor" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="muted text-xs mono">
                      {user.lastLoginIp ?? "—"} ·{" "}
                      {user.lastLoginAt ? fmtDateTime(user.lastLoginAt) : "Belum pernah"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="drawer-f">
          <span className="muted text-xs">
            ID <span className="mono">{user.id.slice(0, 8)}</span>
          </span>
          <div className="hstack">
            <button type="button" className="btn" onClick={onClose} disabled={pending}>
              Batal
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
      </aside>
    </>
  );
}
