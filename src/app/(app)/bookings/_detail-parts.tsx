"use client";

import type { ReactNode } from "react";

export function Metric({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div style={{ lineHeight: 1.1 }}>
      <div className="muted text-xs" style={{ marginBottom: 3 }}>
        {label}
      </div>
      <div
        className={mono ? "mono" : ""}
        style={{ fontWeight: 600, fontSize: 14, color: color ?? "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row between" style={{ padding: "4px 0" }}>
      <span className="muted text-sm">{label}</span>
      <span style={{ fontSize: 13 }}>{children}</span>
    </div>
  );
}
