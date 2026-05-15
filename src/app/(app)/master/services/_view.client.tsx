"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { createServiceAction } from "./_actions";

type Row = {
  id: string;
  name: string;
  priceCents: string;
  durationMin: number;
  active: boolean;
  categoryName: string | null;
};

export function ServicesView({
  items,
  categories,
}: {
  items: Row[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Master · Layanan</h2>
          <p>Katalog jasa & paket yang ditawarkan klinik</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Layanan Baru
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Kategori</th>
                <th>Durasi</th>
                <th className="num">Harga</th>
                <th style={{ width: 100 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    <b>Belum ada layanan</b>
                    Tambahkan layanan pertama untuk membuka pemesanan.
                  </td>
                </tr>
              )}
              {items.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td className="muted">{s.categoryName ?? "—"}</td>
                  <td className="mono">{s.durationMin} mnt</td>
                  <td className="num">{fmtIDR(BigInt(s.priceCents))}</td>
                  <td>
                    <span className={"pill " + (s.active ? "lunas" : "outline")}>
                      {s.active ? "Aktif" : "Non-aktif"}
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
                <h3>Layanan Baru</h3>
                <p>Tambahkan ke katalog</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              id="svc-form"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await createServiceAction(fd);
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
                    <label>Nama</label>
                    <input name="name" required className="input" />
                  </div>
                  <div className="field">
                    <label>Kategori</label>
                    <select name="categoryId" className="select">
                      <option value="">—</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid-2 even" style={{ gap: 12 }}>
                    <div className="field">
                      <label>Harga (Rupiah)</label>
                      <input
                        name="priceCents"
                        type="number"
                        required
                        className="input mono"
                      />
                    </div>
                    <div className="field">
                      <label>Durasi (menit)</label>
                      <input
                        name="durationMin"
                        type="number"
                        defaultValue={30}
                        className="input mono"
                      />
                    </div>
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
              <span className="muted text-sm">Bisa dinonaktifkan kapan saja.</span>
              <div className="hstack">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="svc-form"
                  className="btn primary"
                  disabled={pending}
                >
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
