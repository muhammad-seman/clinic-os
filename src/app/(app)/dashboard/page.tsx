import Link from "next/link";
import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fmtIDR } from "@/lib/format";
import { fetchDashboard } from "@/server/services/dashboard";

const fmtDay = new Intl.DateTimeFormat("id-ID", { day: "2-digit" });
const fmtMon = new Intl.DateTimeFormat("id-ID", { month: "short" });
const fmtTime = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function Page() {
  await assert("dashboard.view");
  const data = await fetchDashboard();

  return (
    <>
      <Topbar title="Ringkasan" crumb="Dashboard" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Selamat datang.</h2>
            <p>Ringkasan operasional bulan ini · NS Aesthetic</p>
          </div>
          <Link href="/bookings" className="btn primary">
            <Icon name="plus" size={14} /> Booking Baru
          </Link>
        </div>

        <div className="kpi-grid">
          <div className="kpi featured">
            <div className="lbl"><Icon name="receivable" /> Revenue (bulan ini)</div>
            <div className="v mono">{fmtIDR(BigInt(data.kpi.revenue))}</div>
            <div className="d">{data.kpi.totalBookings} booking</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="receivable" /> Kas Piutang</div>
            <div className="v mono">{fmtIDR(BigInt(data.kpi.receivable))}</div>
            <div className="d">DP / termin belum lunas</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="booking" /> Total Booking</div>
            <div className="v">{data.kpi.totalBookings}<span style={{ fontSize: 14, color: "var(--ink-4)", marginLeft: 6 }}>bulan ini</span></div>
            <div className="d">termasuk semua status</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="users" /> Karyawan</div>
            <div className="v">{data.kpi.employees}</div>
            <div className="d">aktif &amp; non-aktif</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Booking Mendatang</h3>
                <p>5 jadwal terdekat</p>
              </div>
              <Link href="/calendar" className="btn ghost sm">
                Lihat semua <Icon name="chevronRight" size={12} />
              </Link>
            </div>
            <div className="card-b flush">
              {data.upcoming.length === 0 && (
                <div className="empty">Tidak ada booking mendatang</div>
              )}
              {data.upcoming.map((b) => {
                const dt = new Date(b.scheduledAt);
                return (
                  <div
                    key={b.id}
                    className="row"
                    style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 8,
                        background: "var(--bg-sunken)",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid var(--line)",
                        flex: "none",
                      }}
                    >
                      <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                        <div style={{ fontWeight: 700, color: "var(--navy-800)" }}>{fmtDay.format(dt)}</div>
                        <div style={{ fontSize: 9, color: "var(--ink-4)", textTransform: "uppercase" }}>
                          {fmtMon.format(dt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <b style={{ fontSize: 13.5, fontWeight: 600 }}>{b.clientName}</b>
                        <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                          {b.code}
                        </span>
                      </div>
                      <div
                        className="muted"
                        style={{ fontSize: 12, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {b.serviceName ?? b.packageName ?? "—"} · {fmtTime.format(dt)}
                      </div>
                    </div>
                    <span className={"pill " + (b.status === "scheduled" ? "scheduled" : b.status === "in_progress" ? "in-progress" : "done")}>
                      {b.status === "scheduled" ? "Terjadwal" : b.status === "in_progress" ? "Berlangsung" : "Selesai"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Peringatan Stok</h3>
                <p>Item di bawah ambang minimum</p>
              </div>
              <Link href="/master" className="btn ghost sm">
                Kelola <Icon name="chevronRight" size={12} />
              </Link>
            </div>
            <div className="card-b flush">
              {data.lowStock.length === 0 && (
                <div className="empty">
                  <div className="ico">
                    <Icon name="check" size={28} />
                  </div>
                  <b>Semua stok aman</b>
                  Tidak ada item di bawah ambang batas
                </div>
              )}
              {data.lowStock.map((m) => (
                <div
                  key={m.id}
                  className="row"
                  style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", gap: 12 }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--rose) 12%, transparent)",
                      color: "var(--rose)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="alert" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      Stok {m.stock} {m.unit} · ambang {m.minStock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top Customer · Nominal</h3>
              <p>Akumulasi pembayaran masuk</p>
            </div>
            <span className="pill gold"><Icon name="users" size={10} /> Loyal</span>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Klien</th>
                  <th className="num">Total</th>
                  <th className="num">Visits</th>
                </tr>
              </thead>
              <tbody>
                {data.topByNominal.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      Belum ada transaksi
                    </td>
                  </tr>
                )}
                {data.topByNominal.map((c, i) => (
                  <tr key={`${c.name}-${i}`}>
                    <td>
                      <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div
                          className="avatar"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: i === 0 ? "var(--navy-900)" : "#fff",
                            background: i === 0 ? "var(--gold)" : "var(--navy-600)",
                          }}
                        >
                          {initials(c.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                            {c.phone ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num mono">{fmtIDR(BigInt(c.total))}</td>
                    <td className="num">{c.visits}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
