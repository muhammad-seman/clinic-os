"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { fmtIDR, initials } from "@/lib/format";
import type { CustomerRow, AprioriRow } from "@/server/services/insight";

function fmtIDRk(n: bigint): string {
  const v = Number(n);
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp ${Math.round(v / 1_000)}rb`;
  return fmtIDR(n);
}

export function InsightView({
  customers,
  rules,
  transactions,
}: {
  customers: CustomerRow[];
  rules: AprioriRow[];
  transactions: number;
}) {
  const [supportMin, setSupportMin] = useState(0.15);
  const [confMin, setConfMin] = useState(0.6);

  const filtered = rules
    .filter((r) => r.support >= supportMin && r.conf >= confMin)
    .sort((x, y) => y.conf - x.conf);

  const topNom = [...customers]
    .sort((a, b) => (BigInt(b.total) > BigInt(a.total) ? 1 : -1))
    .slice(0, 10);
  const topFreq = [...customers]
    .sort((a, b) => b.count - a.count || (BigInt(b.total) > BigInt(a.total) ? 1 : -1))
    .slice(0, 10);

  const returning = customers.filter((c) => c.count > 1).length;
  const returningRate = customers.length
    ? Math.round((returning / customers.length) * 100)
    : 0;
  const avgSpend = customers.length
    ? customers.reduce((a, c) => a + BigInt(c.total), 0n) / BigInt(customers.length)
    : 0n;

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Customer Insight</h2>
          <p>Loyalitas pelanggan & pola jasa bersamaan (Apriori) · {transactions} basket</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi">
          <div className="lbl"><Icon name="users" /> Total Klien</div>
          <div className="v">{customers.length}</div>
          <div className="d">unique customers</div>
        </div>
        <div className="kpi">
          <div className="lbl"><Icon name="refresh" /> Returning Rate</div>
          <div className="v">{returningRate}%</div>
          <div className="d">{returning} klien dengan ≥ 2 kunjungan</div>
        </div>
        <div className="kpi">
          <div className="lbl"><Icon name="sparkle" /> Avg Spend / Klien</div>
          <div className="v mono">{fmtIDRk(avgSpend)}</div>
          <div className="d">Sepanjang lifecycle</div>
        </div>
        <div className="kpi">
          <div className="lbl"><Icon name="link" /> Pola Apriori Aktif</div>
          <div className="v">{filtered.length}</div>
          <div className="d">
            support ≥ {Math.round(supportMin * 100)}%, conf ≥ {Math.round(confMin * 100)}%
          </div>
        </div>
      </div>

      <div className="grid-2 even" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top 10 · Berdasarkan Nominal</h3>
              <p>Akumulasi nilai booking</p>
            </div>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Klien</th>
                  <th className="num">Total</th>
                  <th className="num">Kunjungan</th>
                </tr>
              </thead>
              <tbody>
                {topNom.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      <b>Belum ada data klien</b>
                      Data muncul setelah booking pertama tercatat.
                    </td>
                  </tr>
                )}
                {topNom.map((c, i) => (
                  <tr key={c.name + (c.phone ?? "")}>
                    <td>
                      {i < 3 ? (
                        <span className="pill gold" style={{ padding: "2px 8px", fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                      )}
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
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                          <div className="mono muted text-xs">{c.phone ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <span className="mono fw-6">{fmtIDR(BigInt(c.total))}</span>
                    </td>
                    <td className="num">{c.count}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Top 10 · Berdasarkan Frekuensi</h3>
              <p>Independen dari nominal</p>
            </div>
          </div>
          <div className="card-b flush">
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Klien</th>
                  <th className="num">Kunjungan</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {topFreq.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      <b>Belum ada data klien</b>
                    </td>
                  </tr>
                )}
                {topFreq.map((c, i) => (
                  <tr key={c.name + (c.phone ?? "")}>
                    <td>
                      {i < 3 ? (
                        <span
                          className="pill"
                          style={{
                            background: "var(--navy-800)",
                            color: "#fff",
                            fontWeight: 700,
                            padding: "2px 8px",
                          }}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                      )}
                    </td>
                    <td>
                      <div className="hstack" style={{ gap: 10 }}>
                        <div
                          className="avatar"
                          style={{ width: 28, height: 28, fontSize: 10, background: "var(--navy-600)" }}
                        >
                          {initials(c.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                          <div className="mono muted text-xs">{c.phone ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <span className="mono fw-7">{c.count}×</span>
                    </td>
                    <td className="num">{fmtIDRk(BigInt(c.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Apriori — Market Basket Sederhana</h3>
            <p>Pola jasa yang sering diambil bersamaan oleh klien yang sama</p>
          </div>
          <div className="hstack" style={{ gap: 14 }}>
            <div className="hstack" style={{ gap: 8 }}>
              <label className="text-xs muted">Min Support {Math.round(supportMin * 100)}%</label>
              <input
                type="range"
                min={5}
                max={50}
                value={supportMin * 100}
                onChange={(e) => setSupportMin(Number(e.target.value) / 100)}
                style={{ width: 80, accentColor: "var(--navy-800)" }}
              />
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <label className="text-xs muted">Min Confidence {Math.round(confMin * 100)}%</label>
              <input
                type="range"
                min={30}
                max={100}
                value={confMin * 100}
                onChange={(e) => setConfMin(Number(e.target.value) / 100)}
                style={{ width: 80, accentColor: "var(--gold)" }}
              />
            </div>
          </div>
        </div>
        <div className="card-b flush">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="ico">
                <Icon name="link" size={28} />
              </div>
              <b>Tidak ada pola yang memenuhi threshold</b>
              {transactions === 0
                ? "Belum ada basket transaksi — tambahkan booking dengan jasa/paket."
                : "Turunkan support atau confidence untuk melihat hasil."}
            </div>
          ) : (
            <table className="t">
              <thead>
                <tr>
                  <th>Antecedent</th>
                  <th></th>
                  <th>Consequent</th>
                  <th className="num">Support</th>
                  <th className="num">Confidence</th>
                  <th className="num">Lift</th>
                  <th>Interpretasi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((r, i) => (
                  <tr key={i}>
                    <td>{r.aName}</td>
                    <td>
                      <Icon name="arrowUpRight" size={14} className="muted" />
                    </td>
                    <td>{r.bName}</td>
                    <td className="num">
                      <span className="mono">{Math.round(r.support * 100)}%</span>
                    </td>
                    <td className="num">
                      <span className="mono fw-6">{Math.round(r.conf * 100)}%</span>
                    </td>
                    <td className="num">
                      <span className="mono">{r.lift.toFixed(2)}×</span>
                    </td>
                    <td className="text-xs muted" style={{ maxWidth: 280 }}>
                      {Math.round(r.conf * 100)}% klien yang ambil <b>{r.aName}</b> juga ambil{" "}
                      <b>{r.bName}</b>.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
