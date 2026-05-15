import Link from "next/link";
import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fetchDashboard, type Period } from "@/server/services/dashboard";
import { AprioriCard } from "./_apriori";
import { RevenueChart } from "./_chart";
import { KpiSection } from "./_kpi";
import { TopByFreqCard, TopByNominalCard } from "./_top-customers";
import { UpcomingCard } from "./_upcoming";
import { PeriodSwitch } from "./_view.client";

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
    period === "day"
      ? "harian"
      : period === "week"
        ? "mingguan"
        : period === "year"
          ? "tahunan"
          : "bulanan";

  return (
    <>
      <Topbar title="Ringkasan" crumb="Dashboard" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Selamat datang.</h2>
            <p>
              Ringkasan operasional NS Aesthetic — periode{" "}
              <b className="muted">{periodLabel}</b>.
            </p>
          </div>
          <div className="hstack" style={{ gap: 10 }}>
            <PeriodSwitch period={period} />
            <Link href="/bookings" className="btn primary">
              <Icon name="plus" size={14} /> Booking Baru
            </Link>
          </div>
        </div>

        <KpiSection kpi={data.kpi} />

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Revenue & Profit</h3>
                <p>Tren {data.chart.length} periode terakhir · IDR</p>
              </div>
              <div className="hstack" style={{ gap: 12 }}>
                <span
                  className="hstack"
                  style={{ gap: 6, fontSize: 11, color: "var(--ink-3)" }}
                >
                  <span style={{ width: 10, height: 2, background: "var(--navy-800)" }} />{" "}
                  Revenue
                </span>
                <span
                  className="hstack"
                  style={{ gap: 6, fontSize: 11, color: "var(--ink-3)" }}
                >
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

          <UpcomingCard upcoming={data.upcoming} />
        </div>

        <div className="grid-2 even" style={{ marginBottom: 18 }}>
          <TopByNominalCard rows={data.topByNominal} />
          <TopByFreqCard rows={data.topByFreq} />
        </div>

        <div className="grid-2">
          <AprioriCard patterns={data.aprioriPreview} />
        </div>
      </div>
    </>
  );
}
