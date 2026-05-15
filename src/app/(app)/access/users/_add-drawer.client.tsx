"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { addUserAction } from "./_actions";
import type { RoleOpt } from "./_types";

export function AddUserDrawer({
  roles,
  onClose,
  onToast,
  onAdded,
}: {
  roles: RoleOpt[];
  onClose: () => void;
  onToast: (m: string) => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [roleSlug, setRoleSlug] = useState(
    roles.find((r) => r.slug === "admin")?.slug ?? roles[0]?.slug ?? "",
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await addUserAction({ name, email, roleSlug, password });
      if (res.ok) {
        onToast(`Pengguna ${name} ditambahkan`);
        onAdded();
      } else setError(res.error);
    });
  };

  const valid = !!email && !!name && password.length >= 8;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade" style={{ width: "min(480px, 100vw)" }}>
        <div className="drawer-h">
          <button className="btn ghost sm" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <h3>Tambah Pengguna</h3>
            <p>Akun langsung aktif, tanpa verifikasi email</p>
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
            <label>Password Awal</label>
            <div className="input-prefix">
              <span className="p">
                <Icon name="key" size={13} />
              </span>
              <input
                className="input mono"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setShowPwd((v) => !v)}
                style={{ marginLeft: 6 }}
              >
                <Icon name={showPwd ? "unlock" : "lock"} size={12} />
              </button>
            </div>
            <div className="muted text-xs">
              Sampaikan password ini ke pengguna. Mereka bisa mengubahnya setelah login.
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
          {error && (
            <div className="pill dp" style={{ padding: "6px 10px", fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>
        <div className="drawer-f">
          <span className="muted text-xs">Akun langsung aktif</span>
          <div className="hstack">
            <button type="button" className="btn" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!valid || pending}
              onClick={submit}
            >
              <Icon name="plus" size={13} /> {pending ? "Menyimpan…" : "Tambah"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
