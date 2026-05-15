"use client";

import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import {
  setBookingStatusAction,
  settleBookingJsonAction,
  saveBookingExecutionAction,
  finalizeBookingExecutionAction,
} from "./_actions";
import { Metric } from "./_detail-parts";
import {
  type ApiResponse,
  type Assignment,
  type BookingStatus,
  type DetailTab,
  STATUS_LABEL,
  detailFetcher,
  fmtDate,
  statusPill,
} from "./_detail-types";
import { ExecutionTab } from "./_execution-tab";
import { PaymentTab } from "./_payment-tab";
import { SummaryTab } from "./_summary-tab";

export function BookingDetailDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { data, mutate, isLoading, error: loadError } = useSWR<ApiResponse>(
    id ? `/api/v1/bookings/${id}` : null,
    detailFetcher,
  );
  const [tab, setTab] = useState<DetailTab>("ringkasan");
  const [amount, setAmount] = useState("");
  const [paymentKind, setPaymentKind] = useState<"lunas" | "dp">("lunas");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris" | "lainnya">(
    "cash",
  );
  const [paymentNote, setPaymentNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [draftAssign, setDraftAssign] = useState<Assignment[]>([]);
  useEffect(() => {
    if (!data) return;
    setDraftAssign(data.booking.assignments);
  }, [data]);

  useEffect(() => {
    if (!id) return;
    setTab("ringkasan");
    setError(null);
    setAmount("");
  }, [id]);

  const b = data?.booking;
  const refRoles = data?.refRoles ?? [];
  const refEmployees = data?.refEmployees ?? [];

  const price = b ? BigInt(b.priceCents) : 0n;
  const paid = b ? BigInt(b.paidCents) : 0n;
  // Compute remaining dynamically from price - paid (robust to legacy rows where
  // remaining_cents was never initialised).
  const remaining = price > paid ? price - paid : 0n;

  const executionReadOnly =
    b?.status === "done" || b?.status === "cancelled" || b?.status === "no_show";
  const paymentReadOnly = b?.status === "cancelled" || remaining === 0n;

  const liveFee = draftAssign.reduce((a, x) => a + (BigInt(x.feeCents) || 0n), 0n);
  const liveProfit = price - liveFee;
  const margin = price > 0n ? Number((liveProfit * 100n) / price) : 0;

  function refresh() {
    mutate();
    onChanged();
  }

  function settle(amountCents: string) {
    if (!b) return;
    setError(null);
    if (!amountCents || amountCents === "0") {
      setError("Nominal harus lebih dari 0");
      return;
    }
    if (BigInt(amountCents) > remaining) {
      setError(`Nominal melebihi sisa tagihan (${fmtIDR(remaining)})`);
      return;
    }
    start(async () => {
      const r = await settleBookingJsonAction({
        id: b.id,
        amountCents,
        method: paymentMethod,
        note: paymentNote || null,
      });
      if (!r.ok) setError(r.error);
      else {
        setAmount("");
        setPaymentNote("");
        refresh();
      }
    });
  }

  function changeStatus(status: BookingStatus) {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await setBookingStatusAction({ id: b.id, status });
      if (!r.ok) setError(r.error);
      else refresh();
    });
  }

  function buildExecutePayload(bid: string, nextStatus?: "in_progress" | "done") {
    const base = {
      id: bid,
      assignments: draftAssign.map((a) => ({
        roleId: a.roleId,
        employeeId: a.employeeId,
        feeCents: a.feeCents,
      })),
    };
    return nextStatus ? { ...base, nextStatus } : base;
  }

  function saveDraft() {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await saveBookingExecutionAction(buildExecutePayload(b.id));
      if (!r.ok) setError(r.error);
      else refresh();
    });
  }

  function startExecution() {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await finalizeBookingExecutionAction(
        buildExecutePayload(b.id, "in_progress"),
      );
      if (!r.ok) setError(r.error);
      else refresh();
    });
  }

  function completeExecution() {
    if (!b) return;
    setError(null);
    start(async () => {
      const r = await finalizeBookingExecutionAction(buildExecutePayload(b.id, "done"));
      if (!r.ok) setError(r.error);
      else {
        refresh();
        setTab("pembayaran");
      }
    });
  }

  if (!id) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade" style={{ width: "min(820px, 96vw)" }}>
        <div className="drawer-h">
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <h3>{b ? b.clientName : isLoading ? "Memuat…" : "—"}</h3>
              {b && (
                <span className={"pill " + statusPill(b.status)}>
                  {STATUS_LABEL[b.status]}
                </span>
              )}
              {b && b.payment !== "unpaid" && (
                <span className={"pill " + (b.payment === "paid" ? "lunas" : "dp")}>
                  {b.payment === "paid" ? "Lunas" : b.payment === "dp" ? "DP" : "Termin"}
                </span>
              )}
            </div>
            <p>
              {b ? (
                <>
                  <span className="mono">{b.code}</span> ·{" "}
                  {b.packageName ?? b.serviceName ?? "—"} ·{" "}
                  {fmtDate.format(new Date(b.scheduledAt))} WITA
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
          <div
            style={{
              padding: "0 24px",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg-elev)",
            }}
          >
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 0 }}>
              {(["ringkasan", "eksekusi", "pembayaran"] as const).map((t) => (
                <button key={t} aria-selected={tab === t} onClick={() => setTab(t)}>
                  {t === "ringkasan"
                    ? "Ringkasan"
                    : t === "eksekusi"
                      ? "Eksekusi Tindakan"
                      : "Pembayaran"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="drawer-b">
          {isLoading && <p className="muted">Memuat detail booking…</p>}
          {!isLoading && !b && (
            <p className="muted">
              Booking tidak ditemukan{loadError ? ` (${(loadError as Error).message})` : ""}.
            </p>
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
            <SummaryTab b={b} price={price} fee={liveFee} profit={liveProfit} margin={margin} />
          )}

          {b && tab === "eksekusi" && (
            <ExecutionTab
              readOnly={executionReadOnly}
              assignments={draftAssign}
              setAssignments={setDraftAssign}
              refRoles={refRoles}
              refEmployees={refEmployees}
              price={price}
              fee={liveFee}
              profit={liveProfit}
              margin={margin}
            />
          )}

          {b && tab === "pembayaran" && (
            <PaymentTab
              b={b}
              price={price}
              paid={paid}
              remaining={remaining}
              amount={amount}
              setAmount={setAmount}
              kind={paymentKind}
              setKind={setPaymentKind}
              method={paymentMethod}
              setMethod={setPaymentMethod}
              note={paymentNote}
              setNote={setPaymentNote}
              readOnly={paymentReadOnly}
              pending={pending}
              onSettle={settle}
              onChangeStatus={changeStatus}
              payments={data?.payments ?? []}
            />
          )}
        </div>

        {b && tab === "eksekusi" && !executionReadOnly && (
          <div className="drawer-f" style={{ gap: 16, flexWrap: "wrap" }}>
            <div className="hstack" style={{ gap: 16, flexWrap: "wrap" }}>
              <Metric label="Harga" value={fmtIDR(price)} mono />
              <Metric label="Σ Fee" value={fmtIDR(liveFee)} mono />
              <Metric
                label="Profit"
                value={fmtIDR(liveProfit)}
                color={liveProfit > 0n ? "var(--sage)" : "var(--rose)"}
                mono
              />
              <Metric label="Margin" value={`${margin}%`} mono />
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <button type="button" className="btn ghost" onClick={saveDraft} disabled={pending}>
                Simpan Draft
              </button>
              {b.status === "scheduled" ? (
                <button
                  type="button"
                  className="btn primary"
                  onClick={startExecution}
                  disabled={pending || draftAssign.length === 0}
                  title={draftAssign.length === 0 ? "Tambahkan minimal satu peran" : undefined}
                >
                  <Icon name="clock" size={13} /> Mulai Tindakan
                </button>
              ) : (
                <button
                  type="button"
                  className="btn primary"
                  onClick={completeExecution}
                  disabled={pending}
                >
                  <Icon name="check" size={13} /> Selesaikan Tindakan
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
