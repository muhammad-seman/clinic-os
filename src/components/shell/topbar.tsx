import { Icon } from "@/components/ui/icon";
import { SidebarToggleButton } from "@/components/shell/app-shell.client";

export function Topbar({ title, crumb }: { title: string; crumb: string }) {
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
      <button className="icon-btn" title="Notifikasi">
        <Icon name="bell" size={16} />
        <span className="dot" />
      </button>
      <button className="icon-btn" title="Pengaturan">
        <Icon name="settings" size={16} />
      </button>
    </header>
  );
}
