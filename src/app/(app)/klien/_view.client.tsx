"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

type Row = {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  createdAt: string;
  bookingsCount: number;
};

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function ClientsView({
  initialRows,
  initialQuery,
}: {
  initialRows: Row[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  // Pakai search server-side via URL agar bookmark-able.
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      if (query) sp.set("q", query);
      router.replace(`/klien${sp.toString() ? "?" + sp.toString() : ""}`);
    }, 350);
    return () => clearTimeout(t);
  }, [query, router]);

  const visible = initialRows.map((r) => ({
    ...r,
    displayPhone: r.phone.startsWith("noPhone-") ? "" : r.phone,
  }));

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Daftar Klien</h2>
          <p>
            {visible.length} klien terdaftar · phone unik · klien baru otomatis dibuat saat
            input booking
          </p>
        </div>
        <div className="search" style={{ minWidth: 320 }}>
          <Icon name="search" size={14} />
          <input
            placeholder="Cari nama atau no. telepon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Nama</th>
                <th>No. Telepon</th>
                <th className="num">Total Booking</th>
                <th>Terdaftar</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    <Icon name="users" size={36} className="ico" />
                    <b>Belum ada klien</b>
                    Klien baru akan otomatis terbuat saat membuat booking dengan no. telepon
                    yang belum ada.
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td className="mono text-sm">{r.displayPhone || <span className="muted">—</span>}</td>
                  <td className="num">{r.bookingsCount}</td>
                  <td className="mono text-xs">{fmtDate.format(new Date(r.createdAt))}</td>
                  <td className="muted text-sm">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
