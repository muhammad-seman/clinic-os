import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { fetchFeeStats, type Period } from "@/server/services/fee";
import { FeeView } from "./_view.client";

const PERIODS: Period[] = ["week", "month", "quarter"];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await assert("fee.view");
  const sp = await searchParams;
  const period = (PERIODS as string[]).includes(sp.p ?? "") ? (sp.p as Period) : "month";
  const data = await fetchFeeStats(period);
  return (
    <>
      <Topbar title="Fee Karyawan" crumb="Keuangan" />
      <FeeView period={data.period} periodKey={data.key} stats={data.stats} />
    </>
  );
}
