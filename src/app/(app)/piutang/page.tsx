import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fmtIDR } from "@/lib/format";
import { fetchPiutang } from "@/server/services/piutang";
import { PiutangActions } from "./_view.client";

const fmtDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function Page() {
  await assert("piutang.view");
  const rows = await fetchPiutang();
  const now = Date.now();
  const totalOpen = rows.reduce((a, r) => a + BigInt(r.remainingCents), 0n);
  const dueSoon = rows.filter((r) => r.dueAt && +new Date(r.dueAt) - now < 7 * 86400e3 && +new Date(r.dueAt) >= now);
  const overdue = rows.filter((r) => r.dueAt && +new Date(r.dueAt) < now);
  const sumDueSoon = dueSoon.reduce((a, r) => a + BigInt(r.remainingCents), 0n);
  const sumOverdue = overdue.reduce((a, r) => a + BigInt(r.remainingCents), 0n);

  return (
    <>
      <Topbar title="Kas Piutang" crumb="Keuangan" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Kas Piutang</h2>
            <p>
              Booking dengan DP atau pembayaran termin · {rows.length} aktif
            </p>
          </div>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="kpi">
            <div className="lbl"><Icon name="receivable" /> Total Piutang</div>
            <div className="v mono">{fmtIDR(totalOpen)}</div>
            <div className="d">{rows.length} booking aktif</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="clock" /> Jatuh Tempo &lt; 7 hari</div>
            <div className="v mono" style={{ color: dueSoon.length ? "var(--gold)" : "var(--ink)" }}>
              {fmtIDR(sumDueSoon)}
            </div>
            <div className="d">{dueSoon.length} booking</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="alert" /> Overdue</div>
            <div className="v mono" style={{ color: overdue.length ? "var(--rose)" : "var(--ink)" }}>
              {fmtIDR(sumOverdue)}
            </div>
            <div className="d">{overdue.length} booking</div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Booking dengan Sisa Pembayaran</h3>
              <p>Urut berdasarkan tenggat terdekat</p>
            </div>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Klien</th>
                  <th>Jasa</th>
                  <th>Tanggal</th>
                  <th className="num">Terbayar</th>
                  <th className="num">Sisa</th>
                  <th>Tenggat</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
                      <b>Semua piutang sudah dilunasi</b>
                      Tidak ada DP atau pembayaran termin yang menggantung.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const isOverdue = r.dueAt && +new Date(r.dueAt) < now;
                  return (
                    <tr key={r.id}>
                      <td><span className="row-id mono">{r.code}</span></td>
                      <td>{r.clientName}</td>
                      <td className="muted">{r.serviceName ?? r.packageName ?? "—"}</td>
                      <td>
                        <span className="mono text-xs">
                          {fmtDate.format(new Date(r.scheduledAt))}
                        </span>
                      </td>
                      <td className="num mono">{fmtIDR(BigInt(r.paidCents))}</td>
                      <td className="num">
                        <span style={{ color: "var(--rose)", fontWeight: 600 }} className="mono">
                          {fmtIDR(BigInt(r.remainingCents))}
                        </span>
                      </td>
                      <td>
                        {r.dueAt ? (
                          <span className={"pill " + (isOverdue ? "dp" : "gold")} style={{ fontSize: 10.5 }}>
                            {fmtDate.format(new Date(r.dueAt))}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <PiutangActions id={r.id} remaining={r.remainingCents} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
