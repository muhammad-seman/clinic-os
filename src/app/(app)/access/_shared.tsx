"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export const ROLE_DEFS: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Superadmin", color: "#b8956a" },
  owner: { label: "Owner", color: "#5a7d6f" },
  admin: { label: "Admin", color: "#1f3a6b" },
};

export function roleDef(slug: string) {
  return ROLE_DEFS[slug] ?? { label: slug, color: "#6b7280" };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function relTime(iso: string | Date | null): string {
  if (!iso) return "—";
  const ts = typeof iso === "string" ? +new Date(iso) : +iso;
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return Math.max(1, Math.round(diff)) + "d lalu";
  if (diff < 3600) return Math.round(diff / 60) + "m lalu";
  if (diff < 86400) return Math.round(diff / 3600) + "j lalu";
  if (diff < 86400 * 7) return Math.round(diff / 86400) + "h lalu";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(ts));
}

export function fmtDateTime(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(d);
}

export function KpiSmall({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: string;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "sage" | "gold" | "navy" | "rose";
}) {
  const colorMap: Record<string, string> = {
    sage: "var(--sage)",
    gold: "var(--gold)",
    navy: "var(--navy-800)",
    rose: "var(--rose)",
  };
  const color = tone ? colorMap[tone] : "var(--ink-3)";
  return (
    <div className="kpi">
      <div className="lbl">
        {/* @ts-expect-error icon name dynamic */}
        <Icon name={icon} size={13} className="ico" style={{ color }} /> {label}
      </div>
      <div className="v mono">{value}</div>
      {hint && <div className="d">{hint}</div>}
    </div>
  );
}

export function RolePill({ role }: { role: string }) {
  const r = roleDef(role);
  return (
    <span
      className="pill"
      style={{
        background: r.color + "1a",
        color: r.color,
        borderColor: r.color + "33",
      }}
    >
      <span className="d" style={{ background: r.color }} />
      {r.label}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  if (status === "active")
    return (
      <span className="pill lunas">
        <span className="d" />
        Aktif
      </span>
    );
  if (status === "pending")
    return (
      <span className="pill gold">
        <span className="d" />
        Diundang
      </span>
    );
  if (status === "locked")
    return (
      <span className="pill dp">
        <Icon name="lock" size={11} /> Terkunci
      </span>
    );
  if (status === "disabled")
    return (
      <span className="pill" style={{ color: "var(--ink-4)" }}>
        <span className="d" />
        Non-aktif
      </span>
    );
  return <span className="pill">{status}</span>;
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="row"
      style={{
        padding: "12px 14px",
        border: "1px solid var(--line)",
        borderRadius: 10,
        background: "var(--bg-elev)",
        gap: 14,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {hint && (
          <div className="muted text-xs" style={{ marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          border: 0,
          padding: 2,
          background: value ? "var(--navy-800)" : "var(--line-strong)",
          position: "relative",
          cursor: "pointer",
          transition: "background .15s",
        }}
      >
        <span
          style={{
            display: "block",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transform: `translateX(${value ? 16 : 0}px)`,
            transition: "transform .15s",
            boxShadow: "0 1px 2px rgba(0,0,0,.15)",
          }}
        />
      </button>
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const style: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 6,
    background: "transparent",
    border: 0,
    color: danger ? "var(--rose)" : "var(--ink-2)",
    fontSize: 13,
    textAlign: "left",
    cursor: "pointer",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "var(--rose-soft)" : "var(--bg-sunken)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* @ts-expect-error icon name dynamic */}
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}
