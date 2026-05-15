import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { fetchDashboard } from "@/server/services/dashboard";
import { fmtDay, fmtMon, fmtTime } from "./_helpers";

type Upcoming = Awaited<ReturnType<typeof fetchDashboard>>["upcoming"];

export function UpcomingCard({ upcoming }: { upcoming: Upcoming }) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Booking Mendatang</h3>
          <p>5 jadwal terdekat</p>
        </div>
        <Link href="/calendar" className="btn ghost sm">
          Lihat semua <Icon name="chevronRight" size={12} />
        </Link>
      </div>
      <div className="card-b flush">
        {upcoming.length === 0 && (
          <div className="empty">Tidak ada booking mendatang</div>
        )}
        {upcoming.map((b) => {
          const dt = new Date(b.scheduledAt);
          return (
            <div
              key={b.id}
              className="hstack"
              style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", gap: 14 }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 8,
                  background: "var(--bg-sunken)",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid var(--line)",
                  flex: "none",
                }}
              >
                <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700, color: "var(--navy-800)" }}>
                    {fmtDay.format(dt)}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--ink-4)",
                      textTransform: "uppercase",
                    }}
                  >
                    {fmtMon.format(dt)}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hstack" style={{ gap: 8 }}>
                  <b style={{ fontSize: 13.5, fontWeight: 600 }}>{b.clientName}</b>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                    {b.code}
                  </span>
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.serviceName ?? b.packageName ?? "—"} · {fmtTime.format(dt)}
                </div>
              </div>
              <span
                className={
                  "pill " +
                  (b.status === "scheduled"
                    ? "scheduled"
                    : b.status === "in_progress"
                      ? "in-progress"
                      : "done")
                }
              >
                {b.status === "scheduled"
                  ? "Terjadwal"
                  : b.status === "in_progress"
                    ? "Berlangsung"
                    : "Selesai"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
