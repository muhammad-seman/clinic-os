"use client";

import { Icon } from "@/components/ui/icon";
import type { AttendanceRow } from "@/server/services/attendance";
import { fmtTime, type GeoState } from "./_helpers";
import { RadiusViz } from "./_radius-viz.client";

export function TapCard({
  meName,
  meId,
  geo,
  now,
  clinicRadius,
  distance,
  inRange,
  myToday,
  pending,
  onRefreshLocation,
  onTap,
}: {
  meName: string | null;
  meId: string | null;
  geo: GeoState;
  now: Date | null;
  clinicRadius: number;
  distance: number | null;
  inRange: boolean;
  myToday: AttendanceRow | undefined;
  pending: boolean;
  onRefreshLocation: () => void;
  onTap: () => void;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Tap Hadir</h3>
          <p>{meName ? `Sebagai ${meName}` : "Anda belum login"}</p>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onRefreshLocation}
            disabled={geo.status === "loading"}
          >
            <Icon name="refresh" size={12} />{" "}
            {geo.status === "loading" ? "Mengakses…" : "Refresh Lokasi"}
          </button>
        </div>
      </div>
      <div className="card-b">
        <div className="map" style={{ height: 260, marginBottom: 16 }}>
          <RadiusViz
            inside={inRange}
            radius={clinicRadius}
            distance={distance ?? clinicRadius * 4}
          />
        </div>

        {geo.status === "loading" && (
          <div className="muted text-xs" style={{ marginBottom: 12, textAlign: "center" }}>
            <Icon name="pin" size={12} /> Mengakses lokasi Anda…
          </div>
        )}
        {geo.status === "error" && (
          <div
            className="pill dp"
            style={{
              padding: "8px 12px",
              fontSize: 12,
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Icon name="alert" size={12} />
            <span style={{ flex: 1 }}>{geo.message}</span>
            <button type="button" className="btn sm" onClick={onRefreshLocation}>
              Coba Lagi
            </button>
          </div>
        )}

        <div className="hstack" style={{ gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div className="muted text-xs">Lokasi Anda</div>
            <div className="mono fw-6" style={{ fontSize: 12 }}>
              {geo.status === "ok"
                ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`
                : "—"}
            </div>
            {geo.status === "ok" && (
              <div className="muted text-xs">Akurasi ±{Math.round(geo.accuracy)} m</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted text-xs">Jarak ke Titik</div>
            <div
              className="mono fw-7"
              style={{
                fontSize: 16,
                color:
                  distance === null
                    ? "var(--ink-3)"
                    : inRange
                      ? "var(--sage)"
                      : "var(--rose)",
              }}
            >
              {distance === null ? "—" : `${distance} m`}{" "}
              <span className="muted text-xs">/ {clinicRadius} m</span>
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
              <div className="text-xs mono" style={{ color: "var(--ink-2)" }}>
                {fmtTime.format(new Date(myToday.recordedAt))} WITA · {myToday.distance} m dari titik
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={!inRange || pending || !meId || geo.status !== "ok"}
            onClick={onTap}
            style={{ width: "100%", justifyContent: "center", padding: 14, fontSize: 14 }}
          >
            <Icon name="pin" size={16} />
            {!meId
              ? "Belum Login"
              : geo.status !== "ok"
                ? "Menunggu Lokasi"
                : inRange
                  ? `Hadir — ${now ? fmtTime.format(now) : ""}`
                  : "Di Luar Radius"}
          </button>
        )}

        {geo.status === "ok" && !inRange && (
          <div className="muted text-xs" style={{ marginTop: 8, textAlign: "center" }}>
            Mendekat ke titik klinik untuk mengaktifkan tombol hadir.
          </div>
        )}
      </div>
    </div>
  );
}
