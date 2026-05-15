import { ScreenPlaceholder } from "@/components/shell/placeholder";
import { assert } from "@/server/auth/rbac";

export default async function Page() {
  await assert("master.view");
  return <ScreenPlaceholder id="master" note="Submodul: packages" />;
}
