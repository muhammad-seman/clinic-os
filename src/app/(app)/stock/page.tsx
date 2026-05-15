import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fmtIDR } from "@/lib/format";
import { fetchStockOverview } from "@/server/services/stock";
import { StockAdjustButton } from "./_view.client";

const fmtDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default async function Page() {
  await assert("stock.view");
  const { materials, log, kpi } = await fetchStockOverview();

  return (
    <>
      <Topbar title="Stok & Inventaris" crumb="Inventaris" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Stok & Inventaris</h2>
            <p>Material habis pakai · stok berkurang otomatis saat eksekusi tindakan</p>
          </div>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="kpi">
            <div className="lbl"><Icon name="package" /> Total Item</div>
            <div className="v">{kpi.totalItems}</div>
            <div className="d">{kpi.available} tersedia</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="stock" /> Nilai Inventaris</div>
            <div className="v mono">{fmtIDR(BigInt(kpi.totalValue))}</div>
            <div className="d">Berdasarkan harga modal</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="alert" /> Di Bawah Ambang</div>
            <div className="v" style={{ color: kpi.low ? "var(--rose)" : "var(--ink)" }}>{kpi.low}</div>
            <div className="d">Item perlu restock</div>
          </div>
          <div className="kpi">
            <div className="lbl"><Icon name="refresh" /> Pemakaian 30 hari</div>
            <div className="v">
              {kpi.usage30}
              <span style={{ fontSize: 14, color: "var(--ink-4)", marginLeft: 6 }}>pengeluaran</span>
            </div>
            <div className="d">Tercatat pada booking</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Daftar Stok</h3>
                <p>Tambah / kurangi cepat · CRUD lengkap di Master</p>
              </div>
            </div>
            <div className="card-b flush">
              <table className="t">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Satuan</th>
                    <th className="num">Stok</th>
                    <th>Status</th>
                    <th className="num">Harga Modal</th>
                    <th style={{ width: 160 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty">
                        <b>Belum ada material</b>
                        Tambahkan via Master Data → Stok Barang.
                      </td>
                    </tr>
                  )}
                  {materials.map((m) => {
                    const status: "low" | "warn" | "ok" =
                      m.stock <= m.minStock ? "low" : m.stock <= m.minStock * 1.5 ? "warn" : "ok";
                    const pct = Math.min(100, (m.stock / Math.max(m.minStock * 2, 1)) * 100);
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="hstack" style={{ gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "var(--bg-sunken)",
                                border: "1px solid var(--line)",
                                display: "grid",
                                placeItems: "center",
                                color: "var(--ink-3)",
                              }}
                            >
                              <Icon name="flask" size={15} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{m.name}</div>
                              <div className="muted text-xs">
                                Ambang: {m.minStock} {m.unit}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="muted">{m.unit}</td>
                        <td className="num">
                          <span
                            className="mono fw-7"
                            style={{
                              color:
                                status === "low"
                                  ? "var(--rose)"
                                  : status === "warn"
                                    ? "var(--gold)"
                                    : "var(--ink)",
                            }}
                          >
                            {m.stock}
                          </span>
                        </td>
                        <td>
                          <div className="bar" style={{ width: 90 }}>
                            <span
                              className={status === "low" ? "rose" : status === "warn" ? "gold" : "sage"}
                              style={{ width: pct + "%" }}
                            />
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 3 }}>
                            {status === "low"
                              ? "Di bawah ambang"
                              : status === "warn"
                                ? "Mendekati ambang"
                                : "Aman"}
                          </div>
                        </td>
                        <td className="num">{fmtIDR(BigInt(m.costCents))}</td>
                        <td>
                          <div className="hstack" style={{ gap: 6 }}>
                            <StockAdjustButton id={m.id} delta={-1} label="−1" />
                            <StockAdjustButton id={m.id} delta={1} label="+1" />
                            <StockAdjustButton id={m.id} delta={10} label="+10" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Log Pengeluaran</h3>
                <p>Material terpakai pada tindakan (30 hari terakhir)</p>
              </div>
            </div>
            <div className="card-b flush">
              {log.length === 0 && (
                <div className="empty">
                  <b>Belum ada pengeluaran</b>
                  Material akan tercatat saat eksekusi tindakan.
                </div>
              )}
              {log.map((l, i) => (
                <div
                  key={i}
                  className="hstack"
                  style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)", gap: 12 }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "var(--bg-sunken)",
                      border: "1px solid var(--line)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--ink-3)",
                    }}
                  >
                    <Icon name="arrowDownRight" size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{l.matName}</div>
                    <div className="muted text-xs">
                      <span className="mono">{l.bookingCode}</span> · {l.clientName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono fw-6" style={{ color: "var(--rose)" }}>
                      −{l.qty} {l.matUnit}
                    </div>
                    <div className="mono muted text-xs">{fmtDate.format(new Date(l.when))}</div>
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
