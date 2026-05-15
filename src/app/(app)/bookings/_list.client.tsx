"use client";

import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/http";
import { K } from "@/lib/swr-keys";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import type { BookingListResult } from "@/server/services/booking/list";
import { BookingDrawer } from "./_drawer.client";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  in_progress: "Berlangsung",
  done: "Selesai",
  cancelled: "Batal",
  no_show: "Tidak Hadir",
};

const STATUS_PILL: Record<string, string> = {
  scheduled: "scheduled",
  in_progress: "in-progress",
  done: "done",
  cancelled: "dp",
  no_show: "outline",
};

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "Belum",
  dp: "DP",
  termin: "Termin",
  paid: "Lunas",
};

function fmtDateID(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

const TABS: Array<{ id: string; label: string }> = [
  { id: "", label: "Semua" },
  { id: "scheduled", label: "Terjadwal" },
  { id: "in_progress", label: "Berlangsung" },
  { id: "done", label: "Selesai" },
];

export function BookingsList({
  initialData,
  q,
  status,
}: {
  initialData: BookingListResult;
  q: string;
  status: string;
}) {
  const [query, setQuery] = useState(q);
  const [filter, setFilter] = useState(status);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, size, setSize, isValidating, mutate } = useSWRInfinite<BookingListResult>(
    (i, prev) => {
      if (prev && !prev.nextCursor) return null;
      return K.bookings.list({
        q: query,
        status: filter || undefined,
        cursor: prev?.nextCursor ?? null,
      });
    },
    fetcher,
    { fallbackData: [initialData], revalidateFirstPage: false, keepPreviousData: true },
  );

  const items = data?.flatMap((d) => d.items) ?? [];
  const last = data?.[data.length - 1];
  const hasMore = !!last?.nextCursor;
  const totalCount = items.length;

  return (
    <>
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Booking</h2>
            <p>Daftar seluruh booking · klik untuk eksekusi tindakan & pembayaran</p>
          </div>
          <div className="row">
            <div className="search" style={{ minWidth: 240 }}>
              <Icon name="search" size={14} />
              <input
                placeholder="Cari klien atau ID booking"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="btn primary" onClick={() => setDrawerOpen(true)}>
              <Icon name="plus" size={14} /> Booking Baru
            </button>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
              <span className="count">
                {t.id === "" ? totalCount : items.filter((b) => b.status === t.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>ID</th>
                  <th>Klien</th>
                  <th>Jasa / Paket</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                  <th>Pembayaran</th>
                  <th className="num">Sisa</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
                      <Icon name="booking" size={36} className="ico" />
                      <b>Tidak ada booking</b>
                      Coba ubah filter atau buat booking baru.
                    </td>
                  </tr>
                )}
                {items.map((b) => (
                  <tr key={b.id} style={{ cursor: "default" }}>
                    <td>
                      <span className="row-id">{b.code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.clientName}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        {b.clientPhone ?? "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {b.packageName ?? b.serviceName ?? "—"}
                      </div>
                      {b.doctorName && (
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          PJ: {b.doctorName}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{fmtDateID(b.scheduledAt)}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        {fmtTime(b.scheduledAt)} WITA
                      </div>
                    </td>
                    <td>
                      <span className={"pill " + (STATUS_PILL[b.status] ?? "")}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          "pill " +
                          (b.payment === "paid"
                            ? "lunas"
                            : b.payment === "dp" || b.payment === "termin"
                              ? "dp"
                              : "outline")
                        }
                      >
                        {PAYMENT_LABEL[b.payment] ?? b.payment}
                      </span>
                    </td>
                    <td className="num">{fmtIDR(BigInt(b.remainingCents))}</td>
                    <td>
                      <Icon name="chevronRight" size={14} className="muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <button
              className="btn"
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
            >
              {isValidating ? "Memuat…" : "Muat lebih banyak"}
            </button>
          </div>
        )}
      </div>

      <BookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => {
          setDrawerOpen(false);
          mutate();
        }}
      />
    </>
  );
}
