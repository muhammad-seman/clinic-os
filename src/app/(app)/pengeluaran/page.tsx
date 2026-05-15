import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { PAGE_META } from "@/components/shell/nav";
import { fetchExpenses } from "@/server/services/expense";
import { ExpenseView } from "./_view.client";

export default async function Page() {
  await assert("expenses.view");
  const rows = await fetchExpenses({ limit: 200 });
  const meta = PAGE_META.expenses ?? { title: "Pengeluaran", crumb: "Keuangan" };
  return (
    <>
      <Topbar title={meta.title} crumb={meta.crumb} />
      <ExpenseView initialRows={rows} />
    </>
  );
}
