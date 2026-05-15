"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  KpiSmall,
  MenuItem,
  RolePill,
  StatusPill,
  ToggleRow,
  fmtDateTime,
  initials,
  relTime,
  roleDef,
} from "../_shared";
import {
  inviteUserAction,
  revokeUserSessionsAction,
  updateUserAction,
} from "./_actions";

type UserRow = {
  id: string;
  email: string;
  name: string;
  status: "active" | "pending" | "locked" | "disabled";
  totpEnabled: boolean;
  roleSlug: string;
  joined: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
};

type RoleOpt = { id: string; slug: string; label: string; isSystem: boolean };

export function UsersView({ items, roles }: { items: UserRow[]; roles: RoleOpt[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(
    () =>
      items.filter((u) => {
        if (roleFilter !== "all" && u.roleSlug !== roleFilter) return false;
        if (statusFilter !== "all" && u.status !== statusFilter) return false;
        if (
          query &&
          !(u.name + u.email).toLowerCase().includes(query.toLowerCase())
        )
          return false;
        return true;
      }),
    [items, query, roleFilter, statusFilter],
  );

  const stats = {
    total: items.length,
    active: items.filter((u) => u.status === "active").length,
    pending: items.filter((u) => u.status === "pending").length,
    twofa: items.filter((u) => u.totpEnabled).length,
  };
  const pct = (n: number) =>
    stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Pengguna</h2>
          <p>
            {stats.total} akun · undang, kelola peran, reset kredensial
          </p>
        </div>
        <div className="hstack">
          <button className="btn">
            <Icon name="download" size={13} /> Ekspor CSV
          </button>
          <button className="btn primary" onClick={() => setInviting(true)}>
            <Icon name="invite" size={13} /> Undang Pengguna
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
          label="Undangan Tertunda"
          value={stats.pending}
          hint="Belum verifikasi email"
          tone="gold"
        />
        <KpiSmall
          icon="shield"
          label="2FA Aktif"
          value={stats.twofa}
          hint={`${pct(stats.twofa)}% akun terlindungi`}
          tone="navy"
        />
      </div>

      <div className="card">
        <div className="card-h" style={{ gap: 14, flexWrap: "wrap" }}>
          <div className="search" style={{ minWidth: 280, flex: "1 1 280px", maxWidth: 420 }}>
            <Icon name="search" size={15} />
            <input
              placeholder="Cari nama atau email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
            <select
              className="select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ minWidth: 140 }}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: 130 }}
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="pending">Undangan</option>
              <option value="locked">Terkunci</option>
              <option value="disabled">Non-aktif</option>
            </select>
            <button className="btn ghost sm">
              <Icon name="filter" size={13} /> Filter Lanjutan
            </button>
          </div>
        </div>

        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Pengguna</th>
                <th>Peran</th>
                <th>Status</th>
                <th>2FA</th>
                <th>Last Login</th>
                <th>IP Terakhir</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rd = roleDef(u.roleSlug);
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ paddingLeft: 24 }}>
                      <div className="row" style={{ gap: 11 }}>
                        <div
                          className="avatar"
                          style={{
                            width: 34,
                            height: 34,
                            fontSize: 11,
                            background: rd.color,
                          }}
                        >
                          {initials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                            {u.name}
                          </div>
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
                    <td>
                      {u.totpEnabled ? (
                        <span className="pill lunas">
                          <Icon name="shield" size={11} /> Aktif
                        </span>
                      ) : (
                        <span className="pill" style={{ color: "var(--ink-3)" }}>
                          <Icon name="unlock" size={11} /> Tidak
                        </span>
                      )}
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
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ paddingRight: 24 }}
                    >
                      <RowMenu
                        user={u}
                        onToast={setToast}
                        onChanged={() => router.refresh()}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <b>Tidak ada hasil</b>Coba ubah pencarian atau filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
      {inviting && (
        <InviteDrawer
          roles={roles}
          onClose={() => setInviting(false)}
          onToast={setToast}
          onInvited={() => {
            setInviting(false);
            router.refresh();
          }}
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

function RowMenu({
  user,
  onToast,
  onChanged,
}: {
  user: UserRow;
  onToast: (msg: string) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => window.addEventListener("click", close, { once: true }), 0);
    return () => clearTimeout(t);
  }, [open]);

  const patch = (p: { status?: UserRow["status"]; totpEnabled?: boolean }, msg: string) => {
    start(async () => {
      const res = await updateUserAction(user.id, p);
      if (res.ok) {
        onToast(msg);
        onChanged();
      } else onToast(res.error);
    });
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn ghost sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="more" size={14} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 5,
            minWidth: 200,
            background: "var(--bg-elev)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "var(--shadow-lg)",
            padding: 6,
          }}
        >
          <MenuItem
            icon="key"
            label="Kirim reset password"
            onClick={() => {
              setOpen(false);
              onToast(`Reset password dikirim ke ${user.email}`);
            }}
          />
          {user.status === "locked" ? (
            <MenuItem
              icon="unlock"
              label="Buka kunci akun"
              onClick={() => {
                setOpen(false);
                patch({ status: "active" }, "Akun dibuka kembali");
              }}
            />
          ) : user.status === "active" ? (
            <MenuItem
              icon="lock"
              label="Kunci akun"
              onClick={() => {
                setOpen(false);
                patch({ status: "locked" }, "Akun dikunci");
              }}
            />
          ) : null}
          {!user.totpEnabled && (
            <MenuItem
              icon="shield"
              label="Wajibkan 2FA"
              onClick={() => {
                setOpen(false);
                patch({ totpEnabled: true }, "Permintaan 2FA dikirim");
              }}
            />
          )}
          <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
          <MenuItem
            icon="trash"
            label="Nonaktifkan pengguna"
            danger
            onClick={() => {
              setOpen(false);
              patch({ status: "disabled" }, `${user.name} dinonaktifkan`);
            }}
          />
        </div>
      )}
    </div>
  );
}

function UserDrawer({
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
  const [twofa, setTwofa] = useState(user.totpEnabled);
  const [pending, start] = useTransition();
  const dirty = roleSlug !== user.roleSlug || twofa !== user.totpEnabled;
  const rd = roleDef(user.roleSlug);

  const save = () => {
    start(async () => {
      const res = await updateUserAction(user.id, { roleSlug, totpEnabled: twofa });
      if (res.ok) {
        onToast("Perubahan disimpan");
        onChanged();
      } else onToast(res.error);
    });
  };

  const revokeSessions = () => {
    start(async () => {
      const res = await revokeUserSessionsAction(user.id);
      onToast(res.ok ? "Semua sesi dicabut" : res.error);
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
            <ToggleRow
              label="Two-factor authentication (TOTP)"
              hint="Wajibkan kode 6-digit dari aplikasi authenticator saat login."
              value={twofa}
              onChange={setTwofa}
            />
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn sm"
                onClick={() => onToast(`Reset password dikirim ke ${user.email}`)}
              >
                <Icon name="key" size={12} /> Kirim Reset Password
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={revokeSessions}
                disabled={pending}
              >
                <Icon name="logout" size={12} /> Cabut Semua Sesi
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

function InviteDrawer({
  roles,
  onClose,
  onToast,
  onInvited,
}: {
  roles: RoleOpt[];
  onClose: () => void;
  onToast: (m: string) => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleSlug, setRoleSlug] = useState(roles.find((r) => r.slug === "staff")?.slug ?? roles[0]?.slug ?? "");
  const [send2fa, setSend2fa] = useState(true);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await inviteUserAction({ name, email, roleSlug, totpRequired: send2fa });
      if (res.ok) {
        onToast(`Undangan terkirim ke ${email}`);
        onInvited();
      } else setError(res.error);
    });
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade" style={{ width: "min(480px, 100vw)" }}>
        <div className="drawer-h">
          <button className="btn ghost sm" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <h3>Undang Pengguna</h3>
            <p>Email aktivasi berlaku 7 hari</p>
          </div>
        </div>
        <div className="drawer-b vstack" style={{ gap: 14 }}>
          <div className="field">
            <label>Nama Lengkap</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Nadia Putri"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <div className="input-prefix">
              <span className="p">
                <Icon name="mail" size={13} />
              </span>
              <input
                className="input mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nadia@nsaesthetic.id"
              />
            </div>
          </div>
          <div className="field">
            <label>Peran</label>
            <select
              className="select"
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="muted text-xs">Bisa diubah belakangan dari halaman ini.</div>
          </div>
          <ToggleRow
            label="Wajibkan 2FA pada login pertama"
            hint="Pengguna harus daftarkan TOTP sebelum bisa masuk."
            value={send2fa}
            onChange={setSend2fa}
          />
          {error && (
            <div className="pill dp" style={{ padding: "6px 10px", fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>
        <div className="drawer-f">
          <span className="muted text-xs">Link akan kadaluarsa 7 hari</span>
          <div className="hstack">
            <button type="button" className="btn" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!email || !name || pending}
              onClick={submit}
            >
              <Icon name="invite" size={13} /> {pending ? "Mengirim…" : "Kirim Undangan"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
