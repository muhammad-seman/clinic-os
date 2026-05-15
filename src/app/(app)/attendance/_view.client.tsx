"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { recordAttendanceAction } from "./_actions";
import type {
  AttendanceOverview,
  AttendanceRow,
} from "@/server/services/attendance";
import { type GeoState, haversineMeters } from "./_helpers";
import { HistoryCard } from "./_history-card.client";
import { TapCard } from "./_tap-card.client";
import { TodayCard } from "./_today-card.client";

export function AttendanceView({
  data,
  canProxy,
}: {
  data: AttendanceOverview;
  canProxy: boolean;
}) {
  const router = useRouter();
  const { clinic, history, today, users, meId, meName } = data;
  const [now, setNow] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [proxyTargetId, setProxyTargetId] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeo({ status: "error", message: "Browser tidak mendukung geolokasi" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan akses lokasi pada browser."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Lokasi tidak tersedia. Periksa GPS / koneksi."
              : err.code === err.TIMEOUT
                ? "Permintaan lokasi timeout. Coba lagi."
                : "Gagal mengambil lokasi.";
        setGeo({ status: "error", message: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  const distance =
    geo.status === "ok"
      ? haversineMeters(geo.lat, geo.lng, clinic.lat, clinic.lng)
      : null;
  const inRange = distance !== null && distance <= clinic.radius;

  const todayMap: Record<string, AttendanceRow> = {};
  today.forEach((a) => {
    todayMap[a.userId] = a;
  });

  const myToday = meId ? todayMap[meId] : undefined;

  function tap() {
    if (geo.status !== "ok") return;
    setError(null);
    start(async () => {
      const r = await recordAttendanceAction({ lat: geo.lat, lng: geo.lng });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function tapProxy(targetId: string) {
    if (geo.status !== "ok") return;
    setError(null);
    setProxyTargetId(targetId);
    start(async () => {
      const r = await recordAttendanceAction({
        lat: geo.lat,
        lng: geo.lng,
        targetUserId: targetId,
      });
      setProxyTargetId(null);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Absensi GPS</h2>
          <p>One-click attendance · validasi radius {clinic.radius} m dari titik klinik</p>
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
        <TapCard
          meName={meName}
          meId={meId}
          geo={geo}
          now={now}
          clinicRadius={clinic.radius}
          distance={distance}
          inRange={inRange}
          myToday={myToday}
          pending={pending}
          onRefreshLocation={requestLocation}
          onTap={tap}
        />

        <TodayCard
          users={users}
          todayMap={todayMap}
          meId={meId}
          canProxy={canProxy}
          inRange={inRange}
          pending={pending}
          proxyTargetId={proxyTargetId}
          geo={geo}
          onProxyTap={tapProxy}
        />
      </div>

      <HistoryCard history={history} />
    </div>
  );
}
