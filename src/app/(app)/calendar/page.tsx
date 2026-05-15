import { Fragment } from "react";
import Link from "next/link";
import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fetchWeekEvents } from "@/server/services/calendar";
import { getOperatingHours } from "@/server/services/system-config";

const TZ = "Asia/Makassar"; // WITA = UTC+8 (no DST)
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

const fmtDow = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: TZ });
const fmtMonthYear = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: TZ });

/** Returns WITA Y/M/D/H/dow (Mon=1..Sun=7) parts for a UTC date. */
function witaParts(d: Date) {
  // Shift by +8h then read UTC fields → equivalent to WITA local fields.
  const shifted = new Date(d.getTime() + WITA_OFFSET_MS);
  const dowSun0 = shifted.getUTCDay(); // 0..6, Sun=0
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    dowMon0: (dowSun0 + 6) % 7, // 0..6, Mon=0
  };
}

/** Build a UTC Date for a given WITA Y-M-D 00:00 local time. */
function witaDayStartToUtc(y: number, m: number, d: number) {
  // WITA 00:00 = UTC of prior day 16:00 → Date.UTC at WITA midnight minus 8h.
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - WITA_OFFSET_MS);
}

function fmtIsoWita(d: Date) {
  const p = witaParts(d);
  const m = String(p.m + 1).padStart(2, "0");
  const day = String(p.d).padStart(2, "0");
  return `${p.y}-${m}-${day}`;
}

/** Parse the ?w= param (YYYY-MM-DD in WITA) and return the Monday of that week (UTC instant). */
function parseStart(param?: string): Date {
  let y: number, m: number, d: number;
  if (param) {
    const [ys, ms, ds] = param.split("-").map((n) => parseInt(n, 10));
    if (!ys || !ms || !ds) return parseStart();
    y = ys;
    m = ms - 1;
    d = ds;
  } else {
    const now = witaParts(new Date());
    y = now.y;
    m = now.m;
    d = now.d;
  }
  const day = witaDayStartToUtc(y, m, d);
  const parts = witaParts(day);
  // Shift back to Monday
  return new Date(day.getTime() - parts.dowMon0 * 86400 * 1000);
}

// jam ditentukan dari config (jam operasional klinik)

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  await assert("calendar.view");
  const { w } = await searchParams;
  const weekStart = parseStart(w);
  const hours = await getOperatingHours();
  const HOURS = Array.from(
    { length: hours.closeHour - hours.openHour },
    (_, i) => i + hours.openHour,
  );
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400 * 1000));
  const todayParts = witaParts(new Date());
  const todayKey = `${todayParts.y}-${todayParts.m}-${todayParts.d}`;

  const events = await fetchWeekEvents(weekStart);

  const byKey: Record<string, typeof events> = {};
  let outOfRange = 0;
  for (const e of events) {
    const p = witaParts(new Date(e.scheduledAt));
    if (p.h < hours.openHour || p.h >= hours.closeHour) outOfRange += 1;
    const key = `${p.y}-${p.m}-${p.d}-${p.h}`;
    (byKey[key] ??= []).push(e);
  }

  const prev = new Date(weekStart.getTime() - 7 * 86400 * 1000);
  const next = new Date(weekStart.getTime() + 7 * 86400 * 1000);

  return (
    <>
      <Topbar title="Kalender Booking" crumb="Operasional" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>{fmtMonthYear.format(weekStart)}</h2>
            <p>
              Pemandangan jadwal mingguan ·{" "}
              {String(hours.openHour).padStart(2, "0")}:00 – {String(hours.closeHour).padStart(2, "0")}:00 WITA ·{" "}
              {events.length} booking minggu ini
              {outOfRange > 0 && ` (${outOfRange} di luar jam tidak tampil)`}
            </p>
          </div>
          <div className="row">
            <Link href={`/calendar?w=${fmtIsoWita(prev)}`} className="btn ghost sm">
              <Icon name="chevronLeft" size={14} />
            </Link>
            <Link href={`/calendar`} className="btn ghost sm">Hari Ini</Link>
            <Link href={`/calendar?w=${fmtIsoWita(next)}`} className="btn ghost sm">
              <Icon name="chevronRight" size={14} />
            </Link>
            <Link href="/bookings" className="btn primary">
              <Icon name="plus" size={14} /> Booking
            </Link>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7, 1fr)",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                fontSize: 11,
                color: "var(--ink-4)",
                borderBottom: "1px solid var(--line)",
                borderRight: "1px solid var(--line)",
                background: "var(--bg-sunken)",
              }}
            >
              WITA
            </div>
            {days.map((d) => {
              const p = witaParts(d);
              const dayKey = `${p.y}-${p.m}-${p.d}`;
              const isToday = dayKey === todayKey;
              return (
                <div
                  key={dayKey}
                  style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--line)",
                    borderRight: "1px solid var(--line)",
                    background: isToday
                      ? "color-mix(in srgb, var(--gold) 12%, transparent)"
                      : "var(--bg-sunken)",
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase" }}>
                    {fmtDow.format(d)}
                  </div>
                  <b style={{ fontSize: 16 }}>{p.d}</b>
                </div>
              );
            })}

            {HOURS.map((h) => (
              <Fragment key={`row-${h}`}>
                <div
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    color: "var(--ink-4)",
                    borderBottom: "1px solid var(--line)",
                    borderRight: "1px solid var(--line)",
                    background: "var(--bg-sunken)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
                {days.map((d) => {
                  const p = witaParts(d);
                  const key = `${p.y}-${p.m}-${p.d}-${h}`;
                  const items = byKey[key] ?? [];
                  return (
                    <div
                      key={`c-${p.y}-${p.m}-${p.d}-${h}`}
                      style={{
                        padding: 4,
                        borderBottom: "1px solid var(--line)",
                        borderRight: "1px solid var(--line)",
                        minHeight: 56,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {items.map((e) => (
                        <div
                          key={e.id}
                          style={{
                            padding: "4px 6px",
                            borderRadius: 6,
                            background: "var(--navy-800)",
                            color: "#fff",
                            fontSize: 11,
                            lineHeight: 1.2,
                          }}
                          title={`${e.clientName} · ${e.serviceName ?? e.packageName ?? ""}`}
                        >
                          <div style={{ fontWeight: 600 }}>{e.clientName}</div>
                          <div style={{ opacity: 0.8 }}>
                            {e.serviceName ?? e.packageName ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
