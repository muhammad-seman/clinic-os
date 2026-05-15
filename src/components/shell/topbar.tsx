import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SidebarToggleButton } from "@/components/shell/app-shell.client";
import { LogoutButton } from "@/components/shell/logout-button.client";
import { fetchNotifCount } from "@/server/services/notif/count";

export async function Topbar({ title, crumb }: { title: string; crumb: string }) {
  const count = await fetchNotifCount();
  const hasAlert = count > 0;
  return (
    <header className="topbar">
      <SidebarToggleButton />
      <div className="title-block">
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
      </div>
      <div className="spacer" />
      <div className="search">
        <Icon name="search" size={15} />
        <input placeholder="Cari klien, booking, atau jasa…" />
        <kbd>⌘K</kbd>
      </div>
      <Link
        href="/notif"
        className="icon-btn"
        title={hasAlert ? `${count} notifikasi` : "Notifikasi"}
        aria-label="Notifikasi"
      >
        <Icon name="bell" size={16} />
        {hasAlert && <span className="dot" />}
      </Link>
      <Link
        href="/config"
        className="icon-btn"
        title="Pengaturan"
        aria-label="Pengaturan"
      >
        <Icon name="settings" size={16} />
      </Link>
      <LogoutButton />
    </header>
  );
}
