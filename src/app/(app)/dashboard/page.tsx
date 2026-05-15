import Link from "next/link";
import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fmtIDR, initials } from "@/lib/format";
import { fetchDashboard, type ChartPoint, type Period } from "@/server/services/dashboard";
import { PeriodSwitch } from "./_view.client";

const fmtDay = new Intl.DateTimeFormat("id-ID", { day: "2-digit" });
const fmtMon = new Intl.DateTimeFormat("id-ID", { month: "short" });
const fmtTime = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function fmtIDRk(n: bigint): string {
  const v = Number(n);
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `${sign}Rp ${(a / 1_000_000_000).toFixed(1)}M`;
  if (a >= 1_000_000) return `${sign}Rp ${(a / 1_000_000).toFixed(1)}jt`;
  if (a >= 1_000) return `${sign}Rp ${Math.round(a / 1_000)}rb`;
  return fmtIDR(BigInt(v));
}

function RevenueChart({ data }: { data: ChartPoint[] }) {
  const W = 720;
  const H = 200;
  const P = { l: 50, r: 16, t: 10, b: 26 };
  const maxRev = data.reduce((m, d) => (BigInt(d.rev) > m ? BigInt(d.rev) : m), 0n);
  const max = Number(maxRev) * 1.1 || 1;
  const n = data.length;
  const xs = (i: number) => P.l + i * ((W - P.l - P.r) / Math.max(1, n - 1));
  const ys = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  const linePath = (key: "rev" | "profit") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(2)},${ys(Number(d[key])).toFixed(2)}`)
      .join(" ");
  const areaPath =
    linePath("rev") +
    ` L${xs(n - 1).toFixed(2)},${H - P.b} L${xs(0).toFixed(2)},${H - P.b} Z`;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(11,29,61,.15)" />
            <stop offset="100%" stopColor="rgba(11,29,61,0)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line
              className="grid"
              x1={P.l}
              x2={W - P.r}
              y1={P.t + (H - P.t - P.b) * p}
              y2={P.t + (H - P.t - P.b) * p}
              strokeDasharray="2 4"
            />
            <text className="axis" x={6} y={P.t + (H - P.t - P.b) * p + 4}>
              {fmtIDRk(BigInt(Math.round(max * (1 - p))))}
            </text>
          </g>
        ))}
        <path d={areaPath} className="area" />
        <path d={linePath("rev")} className="line" />
        <path d={linePath("profit")} className="line alt" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(Number(d.rev))} r={3.5} className="dot" />
            <text x={xs(i)} y={H - 6} textAnchor="middle" className="axis">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const PERIOD_SET: Period[] = ["day", "week", "month", "year"];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await assert("dashboard.view");
  const sp = await searchParams;
  const period: Period = (PERIOD_SET as string[]).includes(sp.p ?? "")
    ? (sp.p as Period)
    : "month";
  const data = await fetchDashboard(period);

  const periodLabel =
    period === "day" ? "harian" : period === "week" ? "mingguan" : period === "year" ? "tahunan" : "bulanan";

  return (
    <>
      <Topbar title="Ringkasan" crumb="Dashboard" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Selamat datang.</h2>
            <p>
              Ringkasan operasional NS Aesthetic — periode <b className="muted">{periodLabel}</b>.
            </p>
          </div>
          <div className="hstack" style={{ gap: 10 }}>
            <PeriodSwitch period={period} />
            <Link href="/bookings" className="btn primary">
              <Icon name="plus" size={14} /> Booking Baru
            </Link>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi featured">
            <div className="lbl"><Icon name="trending" /> Revenue</div>
            <div className="v mono">{fmtIDRk(BigInt(data.kpi.revenue))}</div>
            <div className="d">
              {data.kpi.revPct === null ? (
                <span className="muted">{data.kpi.totalBookings} booking bulan ini</span>
              ) : (
                <>
                  <span className={"chg " + (data.kpi.revPct >= 0 ? "up" : "down")}>
                    {data.kpi.revPct >= 0 ? "+" : ""}
                    {data.kpi.revPct}%
                  </span>{" "}
                  vs bulan lalu
                </>
              )}
            </div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="sparkle" /> Profit</div>
            <div className="v mono">{fmtIDRk(BigInt(data.kpi.profit))}</div>
            <div className="d">
              <span className={"chg " + (data.kpi.margin >= 0 ? "up" : "down")}>
                {data.kpi.margin >= 0 ? "+" : ""}
                {data.kpi.margin}%
              </span>{" "}
              margin rata-rata
            </div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="booking" /> Total Booking</div>
            <div className="v">
              {data.kpi.totalBookings}
              <span style={{ fontSize: 14, color: "var(--ink-4)", marginLeft: 6 }}>tindakan</span>
            </div>
            <div className="d">
              <span className={"chg " + (data.kpi.totalDelta >= 0 ? "up" : "down")}>
                {data.kpi.totalDelta >= 0 ? "+" : ""}
                {data.kpi.totalDelta}
              </span>{" "}
              vs bulan lalu
            </div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="receivable" /> Kas Piutang</div>
            <div className="v mono">{fmtIDRk(BigInt(data.kpi.receivable))}</div>
            <div className="d">
              {data.kpi.dueSoon > 0 ? (
                <>
                  <span className="chg down">{data.kpi.dueSoon} jatuh tempo</span> minggu ini
                </>
              ) : (
                <span className="muted">Tidak ada jatuh tempo dekat</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Revenue & Profit</h3>
                <p>Tren {data.chart.length} periode terakhir · IDR</p>
              </div>
              <div className="hstack" style={{ gap: 12 }}>
                <span className="hstack" style={{ gap: 6, fontSize: 11, color: "var(--ink-3)" }}>
                  <span style={{ width: 10, height: 2, background: "var(--navy-800)" }} /> Revenue
                </span>
                <span className="hstack" style={{ gap: 6, fontSize: 11, color: "var(--ink-3)" }}>
                  <span
                    style={{
                      width: 10,
                      height: 2,
                      background: "var(--gold)",
                      borderTop: "1px dashed var(--gold)",
                    }}
                  />{" "}
                  Profit
                </span>
              </div>
            </div>
            <div className="card-b" style={{ paddingBottom: 14 }}>
              <RevenueChart data={data.chart} />
            </div>
          </div>

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
                    className="hstack"
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
                        <div style={{ fontWeight: 700, color: "var(--navy-800)" }}>
                          {fmtDay.format(dt)}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--ink-4)", textTransform: "uppercase" }}>
                          {fmtMon.format(dt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hstack" style={{ gap: 8 }}>
                        <b style={{ fontSize: 13.5, fontWeight: 600 }}>{b.clientName}</b>
                        <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                          {b.code}
                        </span>
                      </div>
                      <div
                        className="muted"
                        style={{
                          fontSize: 12,
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {b.serviceName ?? b.packageName ?? "—"} · {fmtTime.format(dt)}
                      </div>
                    </div>
                    <span
                      className={
                        "pill " +
                        (b.status === "scheduled"
                          ? "scheduled"
                          : b.status === "in_progress"
                            ? "in-progress"
                            : "done")
                      }
                    >
                      {b.status === "scheduled"
                        ? "Terjadwal"
                        : b.status === "in_progress"
                          ? "Berlangsung"
                          : "Selesai"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid-2 even" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Top Customer · Nominal</h3>
                <p>Akumulasi pembayaran masuk</p>
              </div>
              <span className="pill gold">
                <Icon name="sparkle" size={10} /> Loyal
              </span>
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
                        <div className="hstack" style={{ gap: 10 }}>
                          <div
                            className="avatar"
                            style={{
                              width: 28,
                              height: 28,
                              fontSize: 10,
                              background: i === 0 ? "var(--gold)" : "var(--navy-600)",
                              color: i === 0 ? "var(--navy-900)" : "#fff",
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

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Top Customer · Frekuensi</h3>
                <p>Independen dari nominal</p>
              </div>
              <span className="pill">
                <Icon name="users" size={10} /> Returning
              </span>
            </div>
            <div className="card-b flush">
              <table className="t">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Klien</th>
                    <th className="num">Visits</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topByFreq.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">
                        Belum ada transaksi
                      </td>
                    </tr>
                  )}
                  {data.topByFreq.map((c, i) => (
                    <tr key={`${c.name}-${i}`}>
                      <td>
                        <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                      </td>
                      <td>
                        <div className="hstack" style={{ gap: 10 }}>
                          <div
                            className="avatar"
                            style={{
                              width: 28,
                              height: 28,
                              fontSize: 10,
                              background: "var(--navy-600)",
                              color: "#fff",
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
                      <td className="num">{c.visits}×</td>
                      <td className="num mono">{fmtIDRk(BigInt(c.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Apriori — Pola Jasa Bersamaan</h3>
                <p>support ≥ 10% · confidence ≥ 60%</p>
              </div>
              <Link href="/insight" className="btn ghost sm">
                Lihat detail <Icon name="chevronRight" size={12} />
              </Link>
            </div>
            <div className="card-b">
              {data.aprioriPreview.length === 0 ? (
                <div className="empty" style={{ padding: "24px 0" }}>
                  <b>Belum ada pola signifikan</b>
                  Butuh lebih banyak transaksi untuk mining Apriori.
                </div>
              ) : (
                <div className="vstack">
                  {data.aprioriPreview.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          i === data.aprioriPreview.length - 1 ? "none" : "1px solid var(--line)",
                      }}
                    >
                      <div className="hstack" style={{ gap: 8, marginBottom: 6, fontSize: 13 }}>
                        <span className="pill outline" style={{ fontSize: 11 }}>
                          {p.aName}
                        </span>
                        <Icon name="arrowUpRight" size={13} className="muted" />
                        <span
                          className="pill outline"
                          style={{ fontSize: 11, color: "var(--gold)", borderColor: "var(--gold-soft)" }}
                        >
                          {p.bName}
                        </span>
                      </div>
                      <div
                        className="hstack"
                        style={{ gap: 16, fontSize: 11.5, color: "var(--ink-3)" }}
                      >
                        <div className="minibar" style={{ flex: 1 }}>
                          <span className="muted text-xs" style={{ width: 80 }}>
                            Confidence
                          </span>
                          <div className="b">
                            <span style={{ width: p.conf * 100 + "%", background: "var(--navy-800)" }} />
                          </div>
                          <span className="v">{Math.round(p.conf * 100)}%</span>
                        </div>
                        <div className="minibar" style={{ flex: 1 }}>
                          <span className="muted text-xs" style={{ width: 60 }}>
                            Support
                          </span>
                          <div className="b">
                            <span
                              style={{
                                width: Math.min(100, p.support * 200) + "%",
                                background: "var(--gold)",
                              }}
                            />
                          </div>
                          <span className="v">{Math.round(p.support * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Peringatan</h3>
                <p>Item butuh perhatian</p>
              </div>
              <Link href="/stock" className="btn ghost sm">
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
                  className="hstack"
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
                  <div style={{ width: 80 }}>
                    <div className="bar">
                      <span
                        className={m.stock < m.minStock ? "rose" : "gold"}
                        style={{
                          width: Math.min(100, (m.stock / Math.max(1, m.minStock)) * 100) + "%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
