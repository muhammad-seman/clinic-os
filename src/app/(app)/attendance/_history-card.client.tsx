"use client";

import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import type { AttendanceOverview } from "@/server/services/attendance";
import { ROLE_AVATAR_BG, fmtDate, fmtTime } from "./_helpers";

export function HistoryCard({
  history,
}: {
  history: AttendanceOverview["history"];
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Riwayat Absensi</h3>
          <p>{history.length} catatan terbaru</p>
        </div>
      </div>
      <div className="card-b flush">
        <table className="t">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Waktu</th>
              <th>Koordinat</th>
              <th className="num">Jarak</th>
              <th>Validitas</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  <b>Belum ada riwayat absensi</b>Tap Hadir untuk mencatat kehadiran.
                </td>
              </tr>
            )}
            {history.slice(0, 20).map((a) => {
              const bg = a.roleSlug
                ? (ROLE_AVATAR_BG[a.roleSlug] ?? "var(--navy-500)")
                : "var(--navy-500)";
              return (
                <tr key={a.id}>
                  <td>
                    <div className="hstack" style={{ gap: 8 }}>
                      <div
                        className="avatar"
                        style={{ width: 24, height: 24, fontSize: 9, background: bg }}
                      >
                        {initials(a.userName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{a.userName}</div>
                        <div className="muted text-xs">{a.roleLabel ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono text-xs">
                      {fmtDate.format(new Date(a.recordedAt))}{" "}
                      {fmtTime.format(new Date(a.recordedAt))}
                    </span>
                  </td>
                  <td>
                    <span className="mono text-xs muted">
                      {a.lat.toFixed(5)}, {a.lng.toFixed(5)}
                    </span>
                  </td>
                  <td className="num">
                    <span className="mono">{a.distance} m</span>
                  </td>
                  <td>
                    {a.inRange ? (
                      <span className="pill sage">
                        <Icon name="check" size={10} /> Dalam radius
                      </span>
                    ) : (
                      <span className="pill">
                        <Icon name="alert" size={10} /> Luar radius
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
