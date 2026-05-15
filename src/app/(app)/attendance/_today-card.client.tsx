"use client";

import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import type {
  AttendanceOverview,
  AttendanceRow,
} from "@/server/services/attendance";
import { ROLE_AVATAR_BG, fmtTime, type GeoState } from "./_helpers";

export function TodayCard({
  users,
  todayMap,
  meId,
  canProxy,
  inRange,
  pending,
  proxyTargetId,
  geo,
  onProxyTap,
}: {
  users: AttendanceOverview["users"];
  todayMap: Record<string, AttendanceRow>;
  meId: string | null;
  canProxy: boolean;
  inRange: boolean;
  pending: boolean;
  proxyTargetId: string | null;
  geo: GeoState;
  onProxyTap: (id: string) => void;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Kehadiran Hari Ini</h3>
          <p>
            {Object.keys(todayMap).length} dari {users.length} user aktif
            {canProxy && " · Anda bisa bantu absen karyawan lain"}
          </p>
        </div>
      </div>
      <div className="card-b flush">
        {users.map((u) => {
          const att = todayMap[u.id];
          const bg = ROLE_AVATAR_BG[u.roleSlug] ?? "var(--navy-500)";
          return (
            <div
              key={u.id}
              className="hstack"
              style={{
                padding: "11px 18px",
                borderBottom: "1px solid var(--line)",
                gap: 12,
              }}
            >
              <div
                className="avatar"
                style={{ width: 32, height: 32, fontSize: 11, background: bg }}
              >
                {initials(u.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {u.name}
                  {u.id === meId && (
                    <span className="pill outline" style={{ fontSize: 10, marginLeft: 8 }}>
                      ANDA
                    </span>
                  )}
                </div>
                <div className="muted text-xs">{u.roleLabel}</div>
              </div>
              {att ? (
                <div style={{ textAlign: "right" }}>
                  <div
                    className="mono fw-6"
                    style={{ fontSize: 13, color: "var(--sage)" }}
                  >
                    {fmtTime.format(new Date(att.recordedAt))}
                  </div>
                  <div className="muted text-xs mono">{att.distance} m</div>
                </div>
              ) : (
                <div className="hstack" style={{ gap: 6 }}>
                  <span className="pill">
                    <span className="d" style={{ background: "var(--ink-4)" }} /> Belum hadir
                  </span>
                  {canProxy && u.id !== meId && (
                    <button
                      type="button"
                      className="btn sm primary"
                      disabled={!inRange || pending || geo.status !== "ok"}
                      onClick={() => onProxyTap(u.id)}
                      title={
                        geo.status !== "ok"
                          ? "Menunggu lokasi"
                          : !inRange
                            ? "Anda di luar radius klinik"
                            : `Catatkan kehadiran untuk ${u.name}`
                      }
                    >
                      <Icon name="pin" size={11} />{" "}
                      {pending && proxyTargetId === u.id ? "Memproses…" : "Bantu Absen"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="empty">
            <b>Belum ada pengguna</b>Tambahkan pengguna dengan permission attendance.create
            di Akses &amp; Keamanan.
          </div>
        )}
      </div>
    </div>
  );
}
