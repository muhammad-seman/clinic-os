import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { listActiveSessions } from "@/server/repositories/access.repo";
import { SessionsView } from "./_view.client";

export default async function Page() {
  await assert("sessions.view");
  const sessions = await listActiveSessions();
  return (
    <>
      <Topbar title="Sesi & Keamanan" crumb="Akses & Keamanan" />
      <SessionsView sessions={sessions} />
    </>
  );
}
