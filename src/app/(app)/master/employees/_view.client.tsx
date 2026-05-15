"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { createEmployeeAction } from "./_actions";

type Row = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  active: boolean;
  joinedAt: Date;
};

const TYPES = ["Dokter", "Terapis", "Resepsionis", "Admin"];

function fmtDateID(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function EmployeesView({ items }: { items: Row[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Master · Karyawan</h2>
          <p>Daftar dokter, terapis, dan staf klinik</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Karyawan Baru
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Telepon</th>
                <th>Bergabung</th>
                <th style={{ width: 100 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500 }}>{e.name}</td>
                  <td className="muted">{e.type}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {e.phone ?? "—"}
                  </td>
                  <td className="muted">{fmtDateID(e.joinedAt)}</td>
                  <td>
                    <span className={"pill " + (e.active ? "lunas" : "outline")}>
                      {e.active ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <aside className="drawer fade" style={{ width: "min(540px,100vw)" }}>
            <div className="drawer-h">
              <div style={{ flex: 1 }}>
                <h3>Karyawan Baru</h3>
                <p>Profil ditampilkan di pemilihan booking</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              id="emp-form"
              onSubmit={(ev) => {
                ev.preventDefault();
                setError(null);
                const fd = new FormData(ev.currentTarget);
                start(async () => {
                  const res = await createEmployeeAction(fd);
                  if (res.ok) {
                    setOpen(false);
                    router.refresh();
                  } else setError(res.error);
                });
              }}
            >
              <div className="drawer-b">
                <div className="vstack" style={{ gap: 14 }}>
                  <div className="field">
                    <label>Nama lengkap</label>
                    <input name="name" required className="input" />
                  </div>
                  <div className="field">
                    <label>Tipe</label>
                    <select name="type" className="select">
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Telepon</label>
                    <input name="phone" type="tel" className="input mono" />
                  </div>
                  {error && (
                    <div className="pill dp" style={{ padding: "6px 10px", fontSize: 12 }}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </form>
            <div className="drawer-f">
              <span className="muted text-sm">Bisa ditautkan ke akun pengguna nanti.</span>
              <div className="hstack">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Batal
                </button>
                <button type="submit" form="emp-form" className="btn primary" disabled={pending}>
                  <Icon name="check" size={14} />
                  {pending ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
