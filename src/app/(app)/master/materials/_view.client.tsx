"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { createMaterialAction, adjustStockAction } from "./_actions";

type Row = {
  id: string;
  name: string;
  unit: string;
  costCents: string;
  stock: number;
  minStock: number;
};

export function MaterialsView({ items }: { items: Row[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const adjust = (id: string, delta: number) => {
    start(async () => {
      await adjustStockAction(id, delta);
      router.refresh();
    });
  };

  const lowCount = items.filter((m) => m.stock <= m.minStock).length;

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Master · Bahan & Stok</h2>
          <p>
            {items.length} item · {lowCount > 0 ? (
              <span style={{ color: "var(--rose)", fontWeight: 500 }}>
                {lowCount} di bawah minimum
              </span>
            ) : (
              <span>semua di atas minimum</span>
            )}
          </p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Bahan Baru
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Unit</th>
                <th className="num">HPP</th>
                <th className="num">Stok</th>
                <th className="num">Minimum</th>
                <th style={{ width: 180 }}>Penyesuaian</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const low = m.stock <= m.minStock;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>
                      {m.name}
                      {low && (
                        <span
                          className="pill dp"
                          style={{ marginLeft: 8, padding: "1px 6px", fontSize: 10 }}
                        >
                          Low
                        </span>
                      )}
                    </td>
                    <td className="muted">{m.unit}</td>
                    <td className="num">{fmtIDR(BigInt(m.costCents))}</td>
                    <td
                      className="num"
                      style={{
                        color: low ? "var(--rose)" : "var(--ink)",
                        fontWeight: low ? 600 : 400,
                      }}
                    >
                      {m.stock}
                    </td>
                    <td className="num muted">{m.minStock}</td>
                    <td>
                      <div className="hstack" style={{ gap: 6 }}>
                        <button
                          className="btn sm"
                          disabled={pending}
                          onClick={() => adjust(m.id, -1)}
                        >
                          −
                        </button>
                        <button
                          className="btn sm"
                          disabled={pending}
                          onClick={() => adjust(m.id, +1)}
                        >
                          +
                        </button>
                        <button
                          className="btn sm"
                          disabled={pending}
                          onClick={() => adjust(m.id, +10)}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                <h3>Bahan Baru</h3>
                <p>Disertakan otomatis pada pemilihan booking</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              id="mat-form"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await createMaterialAction(fd);
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
                  <div className="grid-2 even" style={{ gap: 12 }}>
                    <div className="field">
                      <label>Unit (mis. btl, pcs)</label>
                      <input name="unit" required className="input" />
                    </div>
                    <div className="field">
                      <label>HPP per unit (Rupiah)</label>
                      <input
                        name="costCents"
                        type="number"
                        required
                        className="input mono"
                      />
                    </div>
                  </div>
                  <div className="grid-2 even" style={{ gap: 12 }}>
                    <div className="field">
                      <label>Stok awal</label>
                      <input
                        name="stock"
                        type="number"
                        defaultValue={0}
                        className="input mono"
                      />
                    </div>
                    <div className="field">
                      <label>Stok minimum</label>
                      <input
                        name="minStock"
                        type="number"
                        defaultValue={0}
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
              <span className="muted text-sm">Stok akan dikurangi saat booking selesai.</span>
              <div className="hstack">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Batal
                </button>
                <button type="submit" form="mat-form" className="btn primary" disabled={pending}>
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
