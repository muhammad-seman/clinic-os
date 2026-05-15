import { ScreenPlaceholder } from "@/components/shell/placeholder";
import { assert } from "@/server/auth/rbac";

export default async function Page() {
  await assert("piutang.view");
  return <ScreenPlaceholder id="piutang" />;
}
