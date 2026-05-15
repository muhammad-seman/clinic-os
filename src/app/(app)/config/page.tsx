import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import {
  getClinicConfig,
  getOperatingHours,
  getThresholds,
} from "@/server/services/system-config";
import { listUsers } from "@/server/repositories/access.repo";
import { ConfigView } from "./_view.client";

export const dynamic = "force-dynamic";

export default async function Page() {
  await assert("config.view");
  const [clinic, thresholds, hours, users] = await Promise.all([
    getClinicConfig(),
    getThresholds(),
    getOperatingHours(),
    listUsers(),
  ]);
  return (
    <>
      <Topbar title="Konfigurasi Sistem" crumb="Sistem" />
      <ConfigView
        clinic={clinic}
        thresholds={thresholds}
        hours={hours}
        users={users}
      />
    </>
  );
}
