"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { fmtIDR } from "@/lib/format";
import { createExpenseAction, deleteExpenseAction } from "./_actions";

type Row = {
  id: string;
  category: string;
  description: string;
  amountCents: string;
  paymentMethod: string;
  occurredAt: string;
  createdAt: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  operasional: "Operasional",
  bahan: "Bahan Habis",
  gaji: "Gaji",
  sewa: "Sewa",
  marketing: "Marketing",
  utilitas: "Listrik / Air",
  lainnya: "Lainnya",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  lainnya: "Lainnya",
};

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function ExpenseView({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  // Sync dengan data terbaru saat router.refresh menghasilkan initialRows baru.
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const total = rows.reduce((a, r) => a + BigInt(r.amountCents), 0n);

  const monthNow = new Date();
  const monthStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 1);
  const monthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 1);
  const monthTotal = rows
    .filter((r) => {
      const d = new Date(r.occurredAt);
      return d >= monthStart && d < monthEnd;
    })
    .reduce((a, r) => a + BigInt(r.amountCents), 0n);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.category === filter);

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Pengeluaran</h2>
          <p>Catat pengeluaran operasional · mengurangi profit klinik</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi">
          <div className="lbl">
            <Icon name="wallet" /> Total Pengeluaran
          </div>
          <div className="v mono">{fmtIDR(total)}</div>
          <div className="d">{rows.length} transaksi</div>
        </div>
        <div className="kpi">
          <div className="lbl">
            <Icon name="clock" /> Bulan Ini
          </div>
          <div className="v mono">{fmtIDR(monthTotal)}</div>
          <div className="d">Periode berjalan</div>
        </div>
        <div className="kpi">
          <div className="lbl">
            <Icon name="insight" /> Rata-rata / Transaksi
          </div>
          <div className="v mono">
            {fmtIDR(rows.length > 0 ? total / BigInt(rows.length) : 0n)}
          </div>
          <div className="d">Seluruh data</div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "360px 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Catat Pengeluaran</h3>
              <p>Tambahkan transaksi baru</p>
            </div>
          </div>
          <div className="card-b">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                const fd = new FormData(e.currentTarget);
                const form = e.currentTarget;
                start(async () => {
                  const r = await createExpenseAction(fd);
                  if (r.ok) {
                    form.reset();
                    router.refresh();
                  } else setError(r.error);
                });
              }}
              className="vstack"
              style={{ gap: 10 }}
            >
              <div className="field">
                <label>Tanggal</label>
                <input
                  name="occurredAt"
                  type="datetime-local"
                  required
                  defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
                  className="input mono"
                />
              </div>
              <div className="field">
                <label>Kategori</label>
                <select name="category" className="select" required defaultValue="operasional">
                  {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Deskripsi</label>
                <input
                  name="description"
                  className="input"
                  required
                  placeholder="mis. Beli sabun cuci muka"
                />
              </div>
              <div className="field">
                <label>Nominal (Rp)</label>
                <input
                  name="amount"
                  className="input mono"
                  inputMode="numeric"
                  required
                  placeholder="0"
                />
              </div>
              <div className="field">
                <label>Metode Pembayaran</label>
                <select name="paymentMethod" className="select" defaultValue="cash">
                  {Object.entries(METHOD_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="pill dp" style={{ fontSize: 12, padding: "6px 10px" }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn primary" disabled={pending}>
                <Icon name="check" size={13} />
                {pending ? "Menyimpan…" : "Simpan Pengeluaran"}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Riwayat</h3>
              <p>{filtered.length} transaksi tercatat</p>
            </div>
            <select
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="all">Semua kategori</option>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Metode</th>
                  <th className="num">Nominal</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      <b>Belum ada pengeluaran</b>
                      Catat pengeluaran pertama lewat form di samping.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="mono text-xs">{fmtDate.format(new Date(r.occurredAt))}</td>
                    <td>
                      <span className="pill outline" style={{ fontSize: 10.5 }}>
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </span>
                    </td>
                    <td>{r.description}</td>
                    <td className="muted text-sm">{METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod}</td>
                    <td className="num mono fw-6">{fmtIDR(BigInt(r.amountCents))}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost sm"
                        title="Hapus"
                        onClick={() =>
                          start(async () => {
                            if (!confirm("Hapus pengeluaran ini?")) return;
                            const res = await deleteExpenseAction(r.id);
                            if (res.ok) {
                              setRows((prev) => prev.filter((x) => x.id !== r.id));
                            }
                          })
                        }
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
