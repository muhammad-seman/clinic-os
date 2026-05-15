import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { fetchDashboard } from "@/server/services/dashboard";

type Patterns = Awaited<ReturnType<typeof fetchDashboard>>["aprioriPreview"];

export function AprioriCard({ patterns }: { patterns: Patterns }) {
  return (
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
        {patterns.length === 0 ? (
          <div className="empty" style={{ padding: "24px 0" }}>
            <b>Belum ada pola signifikan</b>
            Butuh lebih banyak transaksi untuk mining Apriori.
          </div>
        ) : (
          <div className="vstack">
            {patterns.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom: i === patterns.length - 1 ? "none" : "1px solid var(--line)",
                }}
              >
                <div className="hstack" style={{ gap: 8, marginBottom: 6, fontSize: 13 }}>
                  <span className="pill outline" style={{ fontSize: 11 }}>
                    {p.aName}
                  </span>
                  <Icon name="arrowUpRight" size={13} className="muted" />
                  <span
                    className="pill outline"
                    style={{
                      fontSize: 11,
                      color: "var(--gold)",
                      borderColor: "var(--gold-soft)",
                    }}
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
                      <span
                        style={{ width: p.conf * 100 + "%", background: "var(--navy-800)" }}
                      />
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
  );
}
