import { assert, currentRole } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { Topbar } from "@/components/shell/topbar";
import { fetchAttendanceOverview } from "@/server/services/attendance";
import { AttendanceView } from "./_view.client";

export default async function Page() {
  await assert("attendance.view");
  const session = await auth();
  const meId = session?.user?.id ?? null;
  const role = await currentRole();
  const canProxy = role?.permissions.has("attendance.proxy") ?? false;
  const data = await fetchAttendanceOverview(meId);
  return (
    <>
      <Topbar title="Absensi GPS" crumb="SDM" />
      <AttendanceView data={data} canProxy={canProxy} />
    </>
  );
}
