"use client";

import { fmtIDR } from "@/lib/format";
import { Row } from "./_detail-parts";
import type { BookingDetail } from "./_detail-types";

export function SummaryTab({
  b,
  price,
  fee,
  profit,
  margin,
}: {
  b: BookingDetail;
  price: bigint;
  fee: bigint;
  profit: bigint;
  margin: number;
}) {
  return (
    <div className="vstack" style={{ gap: 18 }}>
      <div className="grid-2 even" style={{ gap: 14 }}>
        <div className="card">
          <div className="card-b">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Profitabilitas
            </div>
            <Row label={`Harga ${b.packageId ? "Paket" : "Jasa"}`}>
              <span className="mono fw-6">{fmtIDR(price)}</span>
            </Row>
            <Row label="– Σ Fee Karyawan">
              <span className="mono">{fmtIDR(fee)}</span>
            </Row>
            <div className="divider" />
            <div className="row between">
              <span className="fw-6">Profit per Booking</span>
              <span
                className="mono fw-7"
                style={{
                  fontSize: 18,
                  color: profit > 0n ? "var(--sage)" : "var(--rose)",
                }}
              >
                {fmtIDR(profit)}
              </span>
            </div>
            <div className="muted text-xs" style={{ marginTop: 4 }}>
              Margin {margin}% · 1 nomor booking
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-b">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Detail Klien
            </div>
            <div className="vstack" style={{ gap: 4 }}>
              <Row label="Nama">
                <b>{b.clientName}</b>
              </Row>
              <Row label="No. Telepon">
                <span className="mono">{b.clientPhone ?? "—"}</span>
              </Row>
              <Row label="Catatan">
                <span style={{ maxWidth: 240, textAlign: "right", fontSize: 12.5 }}>
                  {b.notes ?? "—"}
                </span>
              </Row>
              <Row label="Dokter PJ">{b.doctorName ?? "—"}</Row>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-b">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Tim Pelaksana
          </div>
          {b.assignments.length === 0 ? (
            <div className="muted text-sm">Belum ada peran ter-assign.</div>
          ) : (
            <div className="vstack" style={{ gap: 8 }}>
              {b.assignments.map((a, i) => (
                <div
                  key={i}
                  className="row"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    gap: 14,
                  }}
                >
                  <span className="pill outline" style={{ fontSize: 11 }}>
                    {a.roleLabel}
                  </span>
                  <div style={{ flex: 1 }}>{a.employeeName}</div>
                  <span className="mono fw-6">{fmtIDR(BigInt(a.feeCents))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
