import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { currentRole } from "@/server/auth/rbac";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { Sidebar } from "@/components/shell/sidebar";
import { AppShell } from "@/components/shell/app-shell.client";
import { fetchSidebarBadges } from "@/server/services/shell/badges";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const role = await currentRole();
  const session = await auth();
  if (!role || !session?.user?.id) redirect("/login");

  const [u] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const badges = await fetchSidebarBadges();

  return (
    <AppShell
      sidebar={<Sidebar role={role} user={{ name: u?.name ?? "User" }} badges={badges} />}
    >
      {children}
    </AppShell>
  );
}
