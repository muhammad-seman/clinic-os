import { ScreenPlaceholder } from "@/components/shell/placeholder";
import { assert } from "@/server/auth/rbac";

export default async function Page() {
  await assert("dashboard.view");
  return <ScreenPlaceholder id="dashboard" />;
}
