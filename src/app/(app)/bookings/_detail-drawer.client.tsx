"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/http";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { setBookingStatusAction, settleBookingJsonAction } from "./_actions";

type BookingDetail = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string | null;
  scheduledAt: string;
  status: "scheduled" | "in_progress" | "done" | "cancelled" | "no_show";
  payment: "unpaid" | "dp" | "termin" | "paid";
  paidCents: string;
  remainingCents: string;
  serviceName: string | null;
  packageName: string | null;
  doctorName: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  in_progress: "Berlangsung",
  done: "Selesai",
  cancelled: "Batal",
  no_show: "Tidak Hadir",
};

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Makassar",
});

type Tab = "ringkasan" | "eksekusi" | "pembayaran";

export function BookingDetailDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { data, mutate, isLoading } = useSWR<BookingDetail>(
    id ? `/api/v1/bookings/${id}` : null,
    fetcher,
  );
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!id) return null;

  const b = data;
  const readOnly = b?.status === "done" || b?.status === "cancelled";

  function refresh() {
    mutate();
    onChanged();
  }

  function settle(amountCents: string) {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await settleBookingJsonAction({ id: b.id, amountCents });
      if (!r.ok) setError(r.error);
      else {
        setAmount("");
        refresh();
      }
    });
  }

  function changeStatus(status: BookingDetail["status"]) {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await setBookingStatusAction({ id: b.id, status });
      if (!r.ok) setError(r.error);
      else refresh();
    });
  }

  const remaining = b ? BigInt(b.remainingCents) : 0n;
  const paid = b ? BigInt(b.paidCents) : 0n;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade">
        <div className="drawer-h">
          <div style={{ flex: 1 }}>
            <h3>{b ? `${b.clientName}` : "Memuat…"}</h3>
            <p>
              {b ? (
                <>
                  <span className="mono">{b.code}</span> ·{" "}
                  {STATUS_LABEL[b.status] ?? b.status}
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {b && (
          <div className="tabs" style={{ paddingLeft: 20, paddingRight: 20 }}>
            {(["ringkasan", "eksekusi", "pembayaran"] as const).map((t) => (
              <button
                key={t}
                aria-selected={tab === t}
                onClick={() => setTab(t)}
              >
                {t === "ringkasan"
                  ? "Ringkasan"
                  : t === "eksekusi"
                    ? "Eksekusi"
                    : "Pembayaran"}
              </button>
            ))}
          </div>
        )}

        <div className="drawer-b">
          {isLoading && <p className="muted">Memuat…</p>}
          {!isLoading && !b && (
            <p className="muted">Booking tidak ditemukan.</p>
          )}

          {error && (
            <div
              className="pill dp"
              style={{
                padding: "6px 10px",
                fontSize: 12,
                alignSelf: "flex-start",
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {b && tab === "ringkasan" && (
            <div className="vstack" style={{ gap: 12 }}>
              <Row label="Klien" value={b.clientName} />
              <Row label="No. Telepon" value={b.clientPhone ?? "—"} mono />
              <Row
                label="Layanan / Paket"
                value={b.packageName ?? b.serviceName ?? "—"}
              />
              <Row label="Penanggung Jawab" value={b.doctorName ?? "—"} />
              <Row
                label="Jadwal"
                value={fmtDate.format(new Date(b.scheduledAt))}
              />
              <Row label="Status" value={STATUS_LABEL[b.status] ?? b.status} />
            </div>
          )}

          {b && tab === "eksekusi" && (
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card">
                <div className="card-h">
                  <div>
                    <h3>Status Eksekusi</h3>
                    <p>Update status booking sesuai progress di klinik</p>
                  </div>
                </div>
                <div className="card-b vstack" style={{ gap: 10 }}>
                  <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn sm"
                      disabled={pending || b.status === "scheduled"}
                      onClick={() => changeStatus("scheduled")}
                    >
                      Terjadwal
                    </button>
                    <button
                      type="button"
                      className="btn sm primary"
                      disabled={pending || b.status === "in_progress"}
                      onClick={() => changeStatus("in_progress")}
                    >
                      <Icon name="clock" size={12} /> Mulai
                    </button>
                    <button
                      type="button"
                      className="btn sm primary"
                      disabled={pending || b.status === "done"}
                      onClick={() => changeStatus("done")}
                    >
                      <Icon name="check" size={12} /> Selesaikan
                    </button>
                    <button
                      type="button"
                      className="btn sm ghost"
                      disabled={pending || b.status === "no_show"}
                      onClick={() => changeStatus("no_show")}
                    >
                      Tidak Hadir
                    </button>
                    <button
                      type="button"
                      className="btn sm ghost"
                      disabled={pending || b.status === "cancelled"}
                      onClick={() => changeStatus("cancelled")}
                      style={{ color: "var(--rose)" }}
                    >
                      <Icon name="x" size={12} /> Batalkan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {b && tab === "pembayaran" && (
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card">
                <div className="card-h">
                  <div>
                    <h3>Ringkasan Pembayaran</h3>
                    <p>Total dibayar &amp; sisa tagihan</p>
                  </div>
                </div>
                <div className="card-b vstack" style={{ gap: 10 }}>
                  <Row label="Sudah dibayar" value={fmtIDR(paid)} mono />
                  <Row label="Sisa" value={fmtIDR(remaining)} mono />
                  <Row
                    label="Status pembayaran"
                    value={
                      b.payment === "paid"
                        ? "Lunas"
                        : b.payment === "dp"
                          ? "DP"
                          : b.payment === "termin"
                            ? "Termin"
                            : "Belum bayar"
                    }
                  />
                </div>
              </div>

              {remaining > 0n && !readOnly && (
                <div className="card">
                  <div className="card-h">
                    <div>
                      <h3>Catat Pembayaran</h3>
                      <p>Masukkan nominal cicilan / DP atau bayar penuh</p>
                    </div>
                  </div>
                  <div className="card-b vstack" style={{ gap: 12 }}>
                    <div className="field">
                      <label>Nominal (Rp)</label>
                      <input
                        className="input mono"
                        inputMode="numeric"
                        placeholder="100000"
                        value={amount}
                        onChange={(e) =>
                          setAmount(e.target.value.replace(/[^0-9]/g, ""))
                        }
                      />
                    </div>
                    <div className="hstack" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={pending || !amount || amount === "0"}
                        onClick={() => settle(amount)}
                      >
                        <Icon name="check" size={12} /> Catat
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={pending}
                        onClick={() => settle(remaining.toString())}
                      >
                        Lunasi Sisa ({fmtIDR(remaining)})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {remaining === 0n && paid > 0n && (
                <div
                  className="card"
                  style={{ borderColor: "var(--sage)" }}
                >
                  <div
                    className="card-b"
                    style={{ color: "var(--sage)", fontSize: 13 }}
                  >
                    <Icon name="check" size={12} /> Pembayaran lunas.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="hstack"
      style={{
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        borderBottom: "1px solid var(--line)",
      }}
    >
      <span className="muted text-xs">{label}</span>
      <span className={mono ? "mono" : ""} style={{ fontSize: 13 }}>
        {value}
      </span>
    </div>
  );
}
