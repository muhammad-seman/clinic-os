import { Fragment } from "react";
import Link from "next/link";
import { assert } from "@/server/auth/rbac";
import { Topbar } from "@/components/shell/topbar";
import { Icon } from "@/components/ui/icon";
import { fetchWeekEvents } from "@/server/services/calendar";

const fmtDow = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
const fmtMonthYear = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

function fmtIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseStart(param?: string): Date {
  const base = param ? new Date(`${param}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  const dow = base.getDay();
  const diff = (dow + 6) % 7;
  base.setDate(base.getDate() - diff);
  return base;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  await assert("calendar.view");
  const { w } = await searchParams;
  const weekStart = parseStart(w);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await fetchWeekEvents(weekStart);

  const byKey: Record<string, typeof events> = {};
  for (const e of events) {
    const dt = new Date(e.scheduledAt);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`;
    (byKey[key] ??= []).push(e);
  }

  const prev = new Date(weekStart);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(weekStart);
  next.setDate(next.getDate() + 7);

  return (
    <>
      <Topbar title="Kalender Booking" crumb="Operasional" />
      <div className="content wide">
        <div className="page-h">
          <div>
            <h2>{fmtMonthYear.format(weekStart)}</h2>
            <p>Pemandangan jadwal mingguan · 08:00 – 18:00</p>
          </div>
          <div className="row">
            <Link href={`/calendar?w=${fmtIso(prev)}`} className="btn ghost sm">
              <Icon name="chevronLeft" size={14} />
            </Link>
            <Link href={`/calendar`} className="btn ghost sm">Hari Ini</Link>
            <Link href={`/calendar?w=${fmtIso(next)}`} className="btn ghost sm">
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
              const isToday = +d === +today;
              return (
                <div
                  key={+d}
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
                  <b style={{ fontSize: 16 }}>{d.getDate()}</b>
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
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${h}`;
                  const items = byKey[key] ?? [];
                  return (
                    <div
                      key={`c-${+d}-${h}`}
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
