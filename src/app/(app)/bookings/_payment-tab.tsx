"use client";

import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Row } from "./_detail-parts";
import type {
  BookingDetail,
  BookingStatus,
  PaymentRow,
} from "./_detail-types";

const METHOD_LABEL: Record<PaymentRow["method"], string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  lainnya: "Lainnya",
};

const fmtDT = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Makassar",
});

export function PaymentTab({
  b,
  price,
  paid,
  remaining,
  amount,
  setAmount,
  kind,
  setKind,
  method,
  setMethod,
  note,
  setNote,
  readOnly,
  pending,
  onSettle,
  onChangeStatus,
  payments,
}: {
  b: BookingDetail;
  price: bigint;
  paid: bigint;
  remaining: bigint;
  amount: string;
  setAmount: (v: string) => void;
  kind: "lunas" | "dp";
  setKind: (k: "lunas" | "dp") => void;
  method: "cash" | "transfer" | "qris" | "lainnya";
  setMethod: (m: "cash" | "transfer" | "qris" | "lainnya") => void;
  note: string;
  setNote: (n: string) => void;
  readOnly: boolean;
  pending: boolean;
  onSettle: (amountCents: string) => void;
  onChangeStatus: (s: BookingStatus) => void;
  payments: PaymentRow[];
}) {
  const fullyPaid = remaining === 0n && paid > 0n;
  const dpSuggest = (price / 2n).toString();
  return (
    <div className="vstack" style={{ gap: 18 }}>
      <div className="card">
        <div className="card-b">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Total Tagihan
          </div>
          <div className="row between">
            <span className="muted">Harga jasa/paket</span>
            <span className="mono fw-7" style={{ fontSize: 24 }}>
              {fmtIDR(price)}
            </span>
          </div>
          <div className="divider" />
          <Row label="Sudah dibayar">
            <span className="mono">{fmtIDR(paid)}</span>
          </Row>
          <Row label="Sisa">
            <span
              className="mono fw-6"
              style={{ color: remaining > 0n ? "var(--rose)" : "var(--sage)" }}
            >
              {fmtIDR(remaining)}
            </span>
          </Row>
          <Row label="Status pembayaran">
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
              {b.payment === "paid"
                ? "Lunas"
                : b.payment === "dp"
                  ? "DP"
                  : b.payment === "termin"
                    ? "Termin"
                    : "Belum bayar"}
            </span>
          </Row>
        </div>
      </div>

      {!readOnly && remaining > 0n && (
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Catat Pembayaran</h3>
              <p>Pilih skema (Lunas / DP) lalu masukkan nominal</p>
            </div>
          </div>
          <div className="card-b vstack" style={{ gap: 14 }}>
            {b.payment === "unpaid" && (
              <div className="grid-2 even" style={{ gap: 10 }}>
                <PaymentOption
                  active={kind === "lunas"}
                  onClick={() => {
                    setKind("lunas");
                    setAmount(remaining.toString());
                  }}
                  icon="check"
                  title="Lunas"
                  desc={`Bayar penuh ${fmtIDR(price)}`}
                />
                <PaymentOption
                  active={kind === "dp"}
                  onClick={() => {
                    setKind("dp");
                    setAmount(dpSuggest);
                  }}
                  icon="receivable"
                  title="DP / Termin"
                  desc="Bayar sebagian, sisa masuk piutang"
                />
              </div>
            )}

            <div className="field">
              <label>
                Nominal (Rp) · <span className="muted">maks {fmtIDR(remaining)}</span>
              </label>
              <input
                className="input mono"
                inputMode="numeric"
                placeholder={kind === "lunas" ? remaining.toString() : dpSuggest}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {amount && BigInt(amount || "0") > 0n && BigInt(amount) < remaining && (
                <div className="muted text-xs" style={{ marginTop: 6 }}>
                  Sisa{" "}
                  <span className="mono">{fmtIDR(remaining - BigInt(amount))}</span>{" "}
                  akan masuk Kas Piutang.
                </div>
              )}
            </div>
            <div className="grid-2 even" style={{ gap: 10 }}>
              <div className="field">
                <label>Metode</label>
                <select
                  className="select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                >
                  <option value="cash">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="field">
                <label>Catatan (opsional)</label>
                <input
                  className="input"
                  placeholder="mis. cicilan ke-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn primary"
                disabled={pending || !amount || amount === "0"}
                onClick={() => onSettle(amount)}
              >
                <Icon name="check" size={12} />{" "}
                {BigInt(amount || "0") >= remaining
                  ? "Catat Pelunasan"
                  : "Catat Pembayaran"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => onSettle(remaining.toString())}
              >
                Lunasi Sisa ({fmtIDR(remaining)})
              </button>
            </div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Riwayat Pembayaran</h3>
              <p>{payments.length} kali pembayaran tercatat</p>
            </div>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Metode</th>
                  <th className="num">Nominal</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="mono text-xs">{fmtDT.format(new Date(p.paidAt))}</td>
                    <td>
                      <span className="pill outline" style={{ fontSize: 10.5 }}>
                        {METHOD_LABEL[p.method]}
                      </span>
                    </td>
                    <td className="num mono fw-6">{fmtIDR(BigInt(p.amountCents))}</td>
                    <td className="muted text-sm">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fullyPaid && (
        <div className="card" style={{ borderColor: "var(--sage)" }}>
          <div className="card-b" style={{ color: "var(--sage)", fontSize: 13 }}>
            <Icon name="check" size={12} /> Pembayaran lunas.
          </div>
        </div>
      )}

      {b.status !== "cancelled" && b.status !== "done" && (
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Status Booking</h3>
              <p>Pindah status sesuai progress di klinik · alur maju saja</p>
            </div>
          </div>
          <div className="card-b vstack" style={{ gap: 10 }}>
            <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
              {b.status === "scheduled" && (
                <button
                  type="button"
                  className="btn sm primary"
                  disabled={pending}
                  onClick={() => onChangeStatus("in_progress")}
                >
                  <Icon name="clock" size={12} /> Mulai
                </button>
              )}
              {b.status === "in_progress" && (
                <button
                  type="button"
                  className="btn sm primary"
                  disabled={pending}
                  onClick={() => onChangeStatus("done")}
                >
                  <Icon name="check" size={12} /> Selesaikan
                </button>
              )}
              {b.status === "scheduled" && (
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={pending}
                  onClick={() => onChangeStatus("no_show")}
                >
                  Tidak Hadir
                </button>
              )}
              {b.status === "scheduled" && (
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={pending}
                  onClick={() => onChangeStatus("cancelled")}
                  style={{ color: "var(--rose)" }}
                >
                  <Icon name="x" size={12} /> Batalkan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: "check" | "receivable";
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "14px 16px",
        border: "1px solid " + (active ? "var(--navy-800)" : "var(--line)"),
        borderRadius: 10,
        background: active ? "rgba(31,58,107,.05)" : "var(--bg-elev)",
        cursor: "pointer",
      }}
    >
      <div className="row" style={{ gap: 10, marginBottom: 6 }}>
        <Icon
          name={icon}
          size={16}
          style={{ color: active ? "var(--navy-800)" : "var(--ink-3)" }}
        />
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</span>
      </div>
      <div className="muted text-sm">{desc}</div>
    </button>
  );
}
