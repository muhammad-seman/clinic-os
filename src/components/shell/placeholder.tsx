import { Topbar } from "./topbar";
import { PAGE_META } from "./nav";
import { Icon } from "@/components/ui/icon";

export function ScreenPlaceholder({ id, note }: { id: keyof typeof PAGE_META; note?: string }) {
  const meta = PAGE_META[id] ?? { title: id, crumb: "" };
  return (
    <>
      <Topbar title={meta.title} crumb={meta.crumb} />
      <div className="content">
        <div className="card">
          <div className="card-b">
            <div className="empty">
              <Icon name="settings" size={36} className="ico" />
              <b>Modul belum diimplementasi</b>
              {note ?? "Pattern sudah disiapkan — lihat ARCHITECTURE §9 dan prototype di Design/project/."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
