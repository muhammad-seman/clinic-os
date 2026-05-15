import { Icon } from "@/components/ui/icon";
import { fmtIDR, initials } from "@/lib/format";
import type { fetchDashboard } from "@/server/services/dashboard";
import { fmtIDRk } from "./_helpers";

type TopRow = Awaited<ReturnType<typeof fetchDashboard>>["topByNominal"][number];

export function TopByNominalCard({ rows }: { rows: TopRow[] }) {
  return (
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Belum ada transaksi
                </td>
              </tr>
            )}
            {rows.map((c, i) => (
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
  );
}

export function TopByFreqCard({ rows }: { rows: TopRow[] }) {
  return (
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Belum ada transaksi
                </td>
              </tr>
            )}
            {rows.map((c, i) => (
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
  );
}
