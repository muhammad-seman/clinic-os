"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import { recordAttendanceAction } from "./_actions";
import type {
  AttendanceOverview,
  AttendanceRow,
  EmployeeRow,
} from "@/server/services/attendance";

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

export function AttendanceView({ data }: { data: AttendanceOverview }) {
  const router = useRouter();
  const { clinic, history, today, employees } = data;
  const [simInside, setSimInside] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const [empId, setEmpId] = useState<string>(employees[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const distance = simInside ? 14 : 230;
  const inRange = distance <= clinic.radius;

  const todayMap: Record<string, AttendanceRow> = {};
  today.forEach((a) => {
    todayMap[a.empId] = a;
  });

  const activeEmployees: EmployeeRow[] = employees.filter((e) => e.active);
  const selectedEmp = employees.find((e) => e.id === empId) ?? activeEmployees[0];
  const myToday = selectedEmp ? todayMap[selectedEmp.id] : undefined;

  function tap() {
    if (!selectedEmp) return;
    setError(null);
    const offsetLat = simInside ? 0 : 0.002;
    const offsetLng = simInside ? 0 : 0.0015;
    start(async () => {
      const r = await recordAttendanceAction({
        employeeId: selectedEmp.id,
        lat: clinic.lat + offsetLat,
        lng: clinic.lng + offsetLng,
      });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Absensi GPS</h2>
          <p>
            One-click attendance · validasi radius {clinic.radius} m dari titik klinik
          </p>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <span className="muted text-xs mono">{clinic.timezone}</span>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--rose)", marginBottom: 12 }}>
          <div className="card-b" style={{ color: "var(--rose)", fontSize: 13 }}>
            <Icon name="alert" size={12} /> {error}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Tap Hadir</h3>
              <p>{selectedEmp ? `Sebagai ${selectedEmp.name}` : "Pilih karyawan"}</p>
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <span className="muted text-xs">Simulasi:</span>
              <div className="role-switch">
                <button
                  type="button"
                  aria-pressed={simInside}
                  onClick={() => setSimInside(true)}
                >
                  Dalam Radius
                </button>
                <button
                  type="button"
                  aria-pressed={!simInside}
                  onClick={() => setSimInside(false)}
                >
                  Di Luar
                </button>
              </div>
            </div>
          </div>
          <div className="card-b">
            <div className="map" style={{ height: 260, marginBottom: 16 }}>
              <RadiusViz inside={simInside} radius={clinic.radius} distance={distance} />
            </div>

            {activeEmployees.length > 1 && (
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Karyawan</label>
                <select
                  className="input"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                >
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="hstack" style={{ gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="muted text-xs">Lokasi Anda</div>
                <div className="mono fw-6" style={{ fontSize: 12 }}>
                  {(clinic.lat + (simInside ? 0 : 0.002)).toFixed(5)},{" "}
                  {(clinic.lng + (simInside ? 0 : 0.0015)).toFixed(5)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="muted text-xs">Jarak ke Titik</div>
                <div
                  className="mono fw-7"
                  style={{
                    fontSize: 16,
                    color: inRange ? "var(--sage)" : "var(--rose)",
                  }}
                >
                  {distance} m{" "}
                  <span className="muted text-xs">/ {clinic.radius} m</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="muted text-xs">Sekarang</div>
                <div className="mono fw-7" style={{ fontSize: 16 }}>
                  {now ? fmtTime.format(now) : "--:--"}
                  <span className="muted text-xs">
                    :{now ? String(now.getSeconds()).padStart(2, "0") : "--"}
                  </span>
                </div>
              </div>
            </div>

            {myToday ? (
              <div
                className="hstack"
                style={{
                  gap: 12,
                  padding: 14,
                  borderRadius: 10,
                  background: "var(--sage-soft)",
                  color: "var(--sage)",
                }}
              >
                <Icon name="check" size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--sage)" }}>
                    Sudah Hadir Hari Ini
                  </div>
                  <div
                    className="text-xs mono"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {fmtTime.format(new Date(myToday.recordedAt))} WITA ·{" "}
                    {myToday.distance} m dari titik
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn primary"
                disabled={!inRange || pending || !selectedEmp}
                onClick={tap}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: 14,
                  fontSize: 14,
                }}
              >
                <Icon name="pin" size={16} />
                {inRange
                  ? `Hadir — ${now ? fmtTime.format(now) : ""}`
                  : "Di Luar Radius"}
              </button>
            )}

            {!inRange && (
              <div
                className="muted text-xs"
                style={{ marginTop: 8, textAlign: "center" }}
              >
                Mendekat ke titik klinik untuk mengaktifkan tombol hadir.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Kehadiran Hari Ini</h3>
              <p>
                {Object.keys(todayMap).length} dari {activeEmployees.length} karyawan
                aktif
              </p>
            </div>
          </div>
          <div className="card-b flush">
            {activeEmployees.map((e) => {
              const att = todayMap[e.id];
              return (
                <div
                  key={e.id}
                  className="hstack"
                  style={{
                    padding: "11px 18px",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div
                    className="avatar"
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: 11,
                      background:
                        e.type === "doctor"
                          ? "var(--navy-700)"
                          : "var(--navy-500)",
                    }}
                  >
                    {initials(e.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</div>
                    <div className="muted text-xs">
                      {e.type === "doctor" ? "Dokter" : "Staff"}
                    </div>
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
                    <span className="pill">
                      <span
                        className="d"
                        style={{ background: "var(--ink-4)" }}
                      />{" "}
                      Belum hadir
                    </span>
                  )}
                </div>
              );
            })}
            {activeEmployees.length === 0 && (
              <div className="empty">
                <b>Belum ada karyawan</b>Tambahkan karyawan di Master Data.
              </div>
            )}
          </div>
        </div>
      </div>

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
                <th>Karyawan</th>
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
                    <b>Belum ada riwayat absensi</b>Tap Hadir untuk mencatat
                    kehadiran.
                  </td>
                </tr>
              )}
              {history.slice(0, 12).map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="hstack" style={{ gap: 8 }}>
                      <div
                        className="avatar"
                        style={{
                          width: 24,
                          height: 24,
                          fontSize: 9,
                          background:
                            a.empType === "doctor"
                              ? "var(--navy-700)"
                              : "var(--navy-500)",
                        }}
                      >
                        {initials(a.empName)}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>
                        {a.empName}
                      </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RadiusViz({
  inside,
  radius,
  distance,
}: {
  inside: boolean;
  radius: number;
  distance: number;
}) {
  return (
    <svg
      viewBox="0 0 400 260"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="r-g">
          <stop offset="0%" stopColor="rgba(184,149,106,.25)" />
          <stop offset="60%" stopColor="rgba(184,149,106,.10)" />
          <stop offset="100%" stopColor="rgba(184,149,106,0)" />
        </radialGradient>
      </defs>
      <circle
        cx="200"
        cy="130"
        r="95"
        fill="url(#r-g)"
        stroke="rgba(184,149,106,.4)"
        strokeDasharray="3 4"
      />
      <circle
        cx="200"
        cy="130"
        r="60"
        fill="rgba(184,149,106,.04)"
        stroke="rgba(184,149,106,.2)"
        strokeDasharray="2 4"
      />
      <g transform="translate(200 130)">
        <circle r="10" fill="var(--navy-800)" />
        <circle r="5" fill="#fff" />
        <text
          y="-18"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--navy-800)"
        >
          NS · {radius}m
        </text>
      </g>
      {inside ? (
        <g transform="translate(220 145)">
          <circle r="9" fill="rgba(90,125,111,.2)" />
          <circle r="5" fill="var(--sage)" />
          <text
            y="22"
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--sage)"
          >
            Anda · {distance}m
          </text>
        </g>
      ) : (
        <g transform="translate(330 60)">
          <circle r="9" fill="rgba(168,105,115,.2)" />
          <circle r="5" fill="var(--rose)" />
          <text
            y="-12"
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--rose)"
          >
            Anda · {distance}m
          </text>
        </g>
      )}
    </svg>
  );
}
