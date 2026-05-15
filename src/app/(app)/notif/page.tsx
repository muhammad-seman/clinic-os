import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { fetchNotifBundle } from "@/server/services/notif";
import { Icon } from "@/components/ui/icon";
import { fmtIDR } from "@/lib/format";

const fmtTime = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Makassar",
});
const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Makassar",
});

export default async function Page() {
  await assert("notif.view");
  const data = await fetchNotifBundle();

  return (
    <>
      <Topbar title="Notifikasi" crumb="Sistem" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>Notifikasi</h2>
            <p>Reminder &amp; alert sistem · Vercel Cron Jobs</p>
          </div>
        </div>

        <div className="vstack" style={{ gap: 14 }}>
          <Group
            title="Reminder H-1 · Booking Besok"
            icon="calendar"
            iconColor="var(--navy-800)"
            count={data.tomorrow.length}
          >
            {data.tomorrow.length === 0 ? (
              <div className="empty">
                <b>Tidak ada booking besok</b>Cron job tidak akan mengirim
                reminder.
              </div>
            ) : (
              data.tomorrow.map((b) => (
                <div
                  key={b.id}
                  className="hstack"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--bg-sunken)",
                      border: "1px solid var(--line)",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--navy-800)",
                    }}
                  >
                    {new Date(b.when).getDate()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{b.client}</div>
                    <div className="muted text-xs">
                      <span className="mono">{b.code}</span> · {b.label} ·{" "}
                      {fmtTime.format(new Date(b.when))} WITA
                    </div>
                  </div>
                </div>
              ))
            )}
          </Group>

          <Group
            title="Alert Stok Minim"
            icon="flask"
            iconColor="var(--rose)"
            count={data.lowStock.length}
          >
            {data.lowStock.length === 0 ? (
              <div className="empty">
                <b>Semua stok aman</b>Tidak ada item ≤ ambang batas.
              </div>
            ) : (
              data.lowStock.map((m) => (
                <div
                  key={m.id}
                  className="hstack"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--rose-soft)",
                      color: "var(--rose)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="flask" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                    <div className="muted text-xs">
                      Stok {m.stock} {m.unit} · ambang {m.min} {m.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </Group>

          <Group
            title="Reminder Piutang · Jatuh Tempo"
            icon="clock"
            iconColor="var(--gold)"
            count={data.overdue.length}
          >
            {data.overdue.length === 0 ? (
              <div className="empty">
                <b>Tidak ada piutang overdue</b>Semua tagihan masih dalam
                tenggat.
              </div>
            ) : (
              data.overdue.map((b) => (
                <div
                  key={b.id}
                  className="hstack"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--gold-soft)",
                      color: "#8b6e44",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="clock" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {b.client}{" "}
                      <span className="muted text-xs">· {b.code}</span>
                    </div>
                    <div className="muted text-xs">
                      Sisa{" "}
                      <span className="mono">
                        {fmtIDR(BigInt(b.remaining))}
                      </span>{" "}
                      · tenggat {fmtDate.format(new Date(b.dueAt))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </Group>
        </div>
      </div>
    </>
  );
}

function Group({
  title,
  icon,
  iconColor,
  count,
  children,
}: {
  title: string;
  icon: "calendar" | "flask" | "clock";
  iconColor: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div className="hstack" style={{ gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: iconColor + "1a",
              color: iconColor,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name={icon} size={16} />
          </div>
          <div>
            <h3>{title}</h3>
            <p>{count} item</p>
          </div>
        </div>
      </div>
      <div className="card-b flush">{children}</div>
    </div>
  );
}
