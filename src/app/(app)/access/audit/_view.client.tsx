"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { KpiSmall, fmtDateTime, roleDef } from "../_shared";

type AuditRow = {
  id: string;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  target: string;
  result: "ok" | "fail" | "denied";
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, unknown>;
};

type Actor = { id: string; name: string; roleSlug: string };

const ACTION_META: Record<string, { icon: string; tone: "navy" | "sage" | "rose" | "gold"; label: string }> = {
  "auth.login": { icon: "login", tone: "navy", label: "Login" },
  "auth.logout": { icon: "logout", tone: "navy", label: "Logout" },
  "booking.create": { icon: "plus", tone: "sage", label: "Booking dibuat" },
  "booking.update": { icon: "edit", tone: "navy", label: "Booking diubah" },
  "booking.delete": { icon: "trash", tone: "rose", label: "Booking dihapus" },
  "users.invite": { icon: "invite", tone: "sage", label: "Undang pengguna" },
  "users.update": { icon: "edit", tone: "navy", label: "Ubah pengguna" },
  "roles.update": { icon: "shield", tone: "gold", label: "Ubah peran" },
  "roles.write": { icon: "shield", tone: "gold", label: "Ubah peran" },
  "piutang.settle": { icon: "check", tone: "sage", label: "Lunasi piutang" },
  "finance.export": { icon: "download", tone: "navy", label: "Ekspor laporan" },
  "config.write": { icon: "settings", tone: "gold", label: "Ubah konfigurasi" },
  "sessions.revoke": { icon: "logout", tone: "rose", label: "Cabut sesi" },
  "master.service.create": { icon: "plus", tone: "sage", label: "Layanan baru" },
  "master.employee.create": { icon: "plus", tone: "sage", label: "Karyawan baru" },
};

const TONE_BG: Record<string, string> = {
  navy: "#1f3a6b",
  sage: "#5a7d6f",
  gold: "#b8956a",
  rose: "#a86973",
};

const CUTOFF_DAYS: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, all: 99999 };
const RANGE_LABEL: Record<string, string> = {
  "24h": "24 jam",
  "7d": "7 hari",
  "30d": "30 hari",
  all: "Semua",
};

export function AuditView({ events, actors }: { events: AuditRow[]; actors: Actor[] }) {
  const [actor, setActor] = useState("all");
  const [result, setResult] = useState("all");
  const [range, setRange] = useState("7d");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const cutoff = Date.now() - (CUTOFF_DAYS[range] ?? 99999) * 86400_000;
    return events.filter((e) => {
      if (+new Date(e.occurredAt) < cutoff) return false;
      if (actor !== "all" && e.actorId !== actor) return false;
      if (result !== "all" && e.result !== result) return false;
      if (query) {
        const hay = (
          e.id +
          e.action +
          e.target +
          (e.ip ?? "") +
          JSON.stringify(e.meta)
        ).toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, actor, result, range, query]);

  const stats = {
    total: filtered.length,
    logins: filtered.filter((e) => e.action.startsWith("auth.")).length,
    failed: filtered.filter((e) => e.result === "fail" || e.result === "denied").length,
    critical: filtered.filter((e) =>
      ["users.update", "roles.update", "roles.write", "config.write", "booking.delete"].includes(e.action),
    ).length,
  };

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Audit Log</h2>
          <p>Jejak aksi sensitif · retensi 365 hari · immutable append-only</p>
        </div>
        <div className="hstack">
          <button className="btn">
            <Icon name="download" size={13} /> Ekspor
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiSmall
          icon="list"
          label="Total Event"
          value={stats.total}
          hint={`${RANGE_LABEL[range]} terakhir`}
        />
        <KpiSmall
          icon="login"
          label="Login Berhasil"
          value={stats.logins}
          hint="Verifikasi kredensial"
          tone="sage"
        />
        <KpiSmall
          icon="alert"
          label="Gagal / Ditolak"
          value={stats.failed}
          hint={stats.failed > 0 ? "Tinjau IP & device" : "Aman"}
          tone="rose"
        />
        <KpiSmall
          icon="shield"
          label="Aksi Kritikal"
          value={stats.critical}
          hint="Ubah peran, hapus, ekspor"
          tone="gold"
        />
      </div>

      <div className="card">
        <div
          className="card-h"
          style={{ gap: 8, flexWrap: "nowrap", alignItems: "center" }}
        >
          <div className="search" style={{ flex: 1, minWidth: 0 }}>
            <Icon name="search" size={15} />
            <input
              placeholder="Cari ID, IP, target…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="role-switch" role="tablist" style={{ flex: "none" }}>
            {(["24h", "7d", "30d", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
              >
                <span>{RANGE_LABEL[r]}</span>
              </button>
            ))}
          </div>
          <select
            className="select"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            style={{ width: 160, flex: "none" }}
          >
            <option value="all">Semua aktor</option>
            {actors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            style={{ width: 140, flex: "none" }}
          >
            <option value="all">Semua hasil</option>
            <option value="ok">Berhasil</option>
            <option value="fail">Gagal</option>
            <option value="denied">Ditolak</option>
          </select>
        </div>

        <div className="card-b flush">
          {filtered.length === 0 ? (
            <div className="empty">
              <b>Tidak ada event</b>Ubah filter atau periode pencarian.
            </div>
          ) : (
            filtered.map((e) => {
              const meta = ACTION_META[e.action] ?? {
                icon: "list",
                tone: "navy" as const,
                label: e.action,
              };
              const failed = e.result !== "ok";
              const tone = TONE_BG[meta.tone] ?? TONE_BG.navy;
              return (
                <div
                  key={e.id}
                  className="row"
                  style={{
                    padding: "14px 24px",
                    borderBottom: "1px solid var(--line)",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: tone + "1a",
                      color: tone,
                      display: "grid",
                      placeItems: "center",
                      flex: "none",
                    }}
                  >
                    {/* @ts-expect-error dynamic icon */}
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{meta.label}</span>
                      <span className="pill outline mono" style={{ fontSize: 10.5 }}>
                        {e.action}
                      </span>
                      {e.result === "fail" && (
                        <span className="pill dp">
                          <span className="d" />
                          Gagal
                        </span>
                      )}
                      {e.result === "denied" && (
                        <span className="pill gold">
                          <Icon name="lock" size={10} /> Ditolak
                        </span>
                      )}
                      <span className="muted-2 mono text-xs right">AU-{e.id}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-2)" }}>
                      {e.actorName && (
                        <>
                          <b style={{ color: "var(--ink)" }}>{e.actorName}</b>
                          <span className="muted">
                            {" "}
                            ({e.actorRole ? roleDef(e.actorRole).label : "—"}) →{" "}
                          </span>
                        </>
                      )}
                      <span
                        className="mono"
                        style={{
                          color: failed ? "var(--rose)" : "var(--navy-800)",
                        }}
                      >
                        {e.target}
                      </span>
                    </div>
                    <div className="muted text-xs" style={{ marginTop: 4 }}>
                      <span className="mono">{fmtDateTime(e.occurredAt)} WITA</span>
                      {e.ip && (
                        <>
                          <span> · </span>
                          <span className="mono">{e.ip}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
