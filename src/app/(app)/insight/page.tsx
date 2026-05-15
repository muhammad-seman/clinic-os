import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { fetchInsight } from "@/server/services/insight";
import { InsightView } from "./_view.client";

export default async function Page() {
  await assert("insight.view");
  const { customers, rules, transactions } = await fetchInsight();
  return (
    <>
      <Topbar title="Customer Insight" crumb="Analitik" />
      <InsightView customers={customers} rules={rules} transactions={transactions} />
    </>
  );
}
