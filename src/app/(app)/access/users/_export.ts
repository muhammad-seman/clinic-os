import type { RoleOpt, UserRow } from "./_types";

const csvEscape = (v: string) => {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
};

export function exportUsersCsv(rows: UserRow[], roles: RoleOpt[]) {
  const header = ["Nama", "Email", "Peran", "Status", "Bergabung", "Last Login", "IP Terakhir"];
  const role = (slug: string) => roles.find((r) => r.slug === slug)?.label ?? slug;
  const csv = [
    header.join(","),
    ...rows.map((u) =>
      [
        u.name,
        u.email,
        role(u.roleSlug),
        u.status,
        u.joined ? new Date(u.joined).toISOString() : "",
        u.lastLoginAt ?? "",
        u.lastLoginIp ?? "",
      ]
        .map((s) => csvEscape(String(s ?? "")))
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pengguna-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
