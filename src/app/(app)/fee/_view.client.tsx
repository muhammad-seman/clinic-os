"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { fmtIDR, initials } from "@/lib/format";
import { markFeePaidAction, unmarkFeePaidAction } from "./_actions";

const fmtDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export type FeeStat = {
  empId: string;
  name: string;
  phone: string | null;
  type: string;
  total: string;
  count: number;
  last: string | null;
  byRole: Record<string, string>;
  paid: { amount: string; paidAt: string } | null;
};

export function FeeView({
  period,
  periodKey,
  stats,
}: {
  period: "week" | "month" | "quarter";
  periodKey: string;
  stats: FeeStat[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"unpaid" | "paid" | "all">("unpaid");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered =
    statusFilter === "unpaid"
      ? stats.filter((s) => !s.paid)
      : statusFilter === "paid"
        ? stats.filter((s) => !!s.paid)
        : stats;

  const grand = stats.reduce((a, s) => a + BigInt(s.total), 0n);
  const grandActions = stats.reduce((a, s) => a + s.count, 0);
  const avg = stats.length ? grand / BigInt(stats.length) : 0n;
  const unpaidCount = stats.filter((s) => !s.paid).length;
  const paidCount = stats.length - unpaidCount;

  function setPeriod(p: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("p", p);
    router.push(url.pathname + "?" + url.searchParams.toString());
  }

  function mark(empId: string, amountCents: string) {
    setError(null);
    start(async () => {
      const r = await markFeePaidAction({ employeeId: empId, period: periodKey, amountCents });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }
  function unmark(empId: string) {
    setError(null);
    start(async () => {
      const r = await unmarkFeePaidAction({ employeeId: empId, period: periodKey });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Fee Karyawan</h2>
          <p>Total fee yang terkumpul · siap bayar · periode <span className="mono">{periodKey}</span></p>
        </div>
        <div className="hstack" style={{ gap: 10 }}>
          <div className="role-switch">
            {(["week", "month", "quarter"] as const).map((p) => (
              <button key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>
                {p === "week" ? "Minggu" : p === "month" ? "Bulan" : "Kuartal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--rose)", marginBottom: 12 }}>
          <div className="card-b" style={{ color: "var(--rose)", fontSize: 13 }}>
            <Icon name="alert" size={12} /> {error}
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi featured">
          <div className="lbl"><Icon name="fee" /> Total Fee (Siap Bayar)</div>
          <div className="v mono">{fmtIDR(grand)}</div>
          <div className="d">{stats.length} karyawan · periode berjalan</div>
        </div>
        <div className="kpi">
          <div className="lbl"><Icon name="users" /> Tindakan Terlibat</div>
          <div className="v">{grandActions}<span style={{ fontSize: 14, color: "var(--ink-4)", marginLeft: 6 }}>baris</span></div>
          <div className="d">Akumulasi tugas</div>
        </div>
        <div className="kpi">
          <div className="lbl"><Icon name="clock" /> Rata-rata / Karyawan</div>
          <div className="v mono">{fmtIDR(avg)}</div>
          <div className="d">Periode berjalan</div>
        </div>
      </div>

      <div className="tabs">
        <button aria-selected={statusFilter === "unpaid"} onClick={() => setStatusFilter("unpaid")}>
          Belum Dibayar<span className="count">{unpaidCount}</span>
        </button>
        <button aria-selected={statusFilter === "paid"} onClick={() => setStatusFilter("paid")}>
          Sudah Dibayar<span className="count">{paidCount}</span>
        </button>
        <button aria-selected={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          Semua<span className="count">{stats.length}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tipe</th>
                <th>Peran Dominan</th>
                <th className="num">Tindakan</th>
                <th className="num">Total Fee</th>
                <th>Aktivitas Terakhir</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    <b>{statusFilter === "paid" ? "Belum ada pembayaran" : "Belum ada fee terkumpul"}</b>
                    {statusFilter === "paid"
                      ? "Tandai pembayaran fee untuk muncul di tab ini."
                      : "Jalankan eksekusi tindakan untuk mencatat fee."}
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const totalBI = BigInt(s.total);
                const topRole = Object.entries(s.byRole).sort((a, b) =>
                  BigInt(b[1]) > BigInt(a[1]) ? 1 : -1,
                )[0];
                const isDoctor = s.type === "doctor";
                return (
                  <tr key={s.empId}>
                    <td>
                      <div className="hstack" style={{ gap: 10 }}>
                        <div
                          className="avatar"
                          style={{
                            width: 32,
                            height: 32,
                            background: isDoctor ? "var(--navy-700)" : "var(--navy-500)",
                          }}
                        >
                          {initials(s.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{s.name}</div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                            {s.phone ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={"pill " + (isDoctor ? "gold" : "")}>
                        <Icon name={isDoctor ? "doctor" : "staff"} size={11} />
                        {isDoctor ? "Dokter" : "Staff"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{topRole?.[0] ?? "—"}</div>
                      <div className="muted text-xs">
                        {topRole
                          ? `${fmtIDR(BigInt(topRole[1]))} (${
                              totalBI === 0n
                                ? 0
                                : Math.round((Number(BigInt(topRole[1])) / Number(totalBI)) * 100)
                            }%)`
                          : "—"}
                      </div>
                    </td>
                    <td className="num">{s.count}×</td>
                    <td className="num">
                      <span className="mono fw-7">{fmtIDR(totalBI)}</span>
                    </td>
                    <td>
                      <span className="mono text-xs muted">
                        {s.last ? fmtDate.format(new Date(s.last)) : "—"}
                      </span>
                    </td>
                    <td>
                      {s.paid ? (
                        <div className="hstack" style={{ gap: 6 }}>
                          <span className="pill sage" style={{ fontSize: 10.5 }}>
                            <Icon name="check" size={10} /> Dibayar
                          </span>
                          <button
                            type="button"
                            className="btn sm ghost"
                            disabled={pending}
                            onClick={() => unmark(s.empId)}
                            title="Batal tandai"
                          >
                            <Icon name="refresh" size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={pending || totalBI === 0n}
                          onClick={() => mark(s.empId, s.total)}
                        >
                          Tandai Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
