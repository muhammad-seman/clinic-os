import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { fetchAttendanceOverview } from "@/server/services/attendance";
import { AttendanceView } from "./_view.client";

export default async function Page() {
  await assert("attendance.view");
  const data = await fetchAttendanceOverview();
  return (
    <>
      <Topbar title="Absensi GPS" crumb="SDM" />
      <AttendanceView data={data} />
    </>
  );
}
