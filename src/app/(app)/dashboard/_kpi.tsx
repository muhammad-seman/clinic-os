import { Icon } from "@/components/ui/icon";
import type { fetchDashboard } from "@/server/services/dashboard";
import { fmtIDRk } from "./_helpers";

type Kpi = Awaited<ReturnType<typeof fetchDashboard>>["kpi"];

export function KpiSection({ kpi }: { kpi: Kpi }) {
  return (
    <div className="kpi-grid">
      <div className="kpi featured">
        <div className="lbl"><Icon name="trending" /> Revenue</div>
        <div className="v mono">{fmtIDRk(BigInt(kpi.revenue))}</div>
        <div className="d">
          {kpi.revPct === null ? (
            <span className="muted">{kpi.totalBookings} booking bulan ini</span>
          ) : (
            <>
              <span className={"chg " + (kpi.revPct >= 0 ? "up" : "down")}>
                {kpi.revPct >= 0 ? "+" : ""}
                {kpi.revPct}%
              </span>{" "}
              vs bulan lalu
            </>
          )}
        </div>
      </div>
      <div className="kpi">
        <div className="lbl"><Icon name="sparkle" /> Profit</div>
        <div className="v mono">{fmtIDRk(BigInt(kpi.profit))}</div>
        <div className="d">
          <span className={"chg " + (kpi.margin >= 0 ? "up" : "down")}>
            {kpi.margin >= 0 ? "+" : ""}
            {kpi.margin}%
          </span>{" "}
          margin rata-rata
        </div>
      </div>
      <div className="kpi">
        <div className="lbl"><Icon name="booking" /> Total Booking</div>
        <div className="v">
          {kpi.totalBookings}
          <span style={{ fontSize: 14, color: "var(--ink-4)", marginLeft: 6 }}>tindakan</span>
        </div>
        <div className="d">
          <span className={"chg " + (kpi.totalDelta >= 0 ? "up" : "down")}>
            {kpi.totalDelta >= 0 ? "+" : ""}
            {kpi.totalDelta}
          </span>{" "}
          vs bulan lalu
        </div>
      </div>
      <div className="kpi">
        <div className="lbl"><Icon name="receivable" /> Kas Piutang</div>
        <div className="v mono">{fmtIDRk(BigInt(kpi.receivable))}</div>
        <div className="d">
          {kpi.dueSoon > 0 ? (
            <>
              <span className="chg down">{kpi.dueSoon} jatuh tempo</span> minggu ini
            </>
          ) : (
            <span className="muted">Tidak ada jatuh tempo dekat</span>
          )}
        </div>
      </div>
    </div>
  );
}
