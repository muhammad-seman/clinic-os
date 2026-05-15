export const MODULES = [
  "dashboard",
  "calendar",
  "bookings",
  "clients",
  "piutang",
  "fee",
  "expenses",
  "insight",
  "attendance",
  "master",
  "notif",
  "config",
  "users",
  "roles",
  "audit",
  "sessions",
] as const;
export type Module = (typeof MODULES)[number];

export const ACTIONS = ["view", "create", "update", "delete", "settle", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export type PermissionKey = `${Module}.${Action}` | `${Module}.view`;

export const PERM_CATALOG: { key: string; module: Module; label: string }[] = [
  ...MODULES.flatMap((m) => [
    { key: `${m}.view`, module: m, label: `Lihat ${m}` },
    { key: `${m}.create`, module: m, label: `Buat ${m}` },
    { key: `${m}.update`, module: m, label: `Ubah ${m}` },
    { key: `${m}.delete`, module: m, label: `Hapus ${m}` },
  ]),
  // Permission khusus: izin mencatatkan absensi atas nama user lain.
  // Hanya untuk role yang berwenang (mis. admin/owner/superadmin).
  { key: "attendance.proxy", module: "attendance", label: "Bantu absen karyawan lain" },
];

export const SYSTEM_ROLES = {
  superadmin: { label: "Superadmin", short: "SA", color: "#b8956a" },
  owner: { label: "Owner", short: "OW", color: "#5a7d6f" },
  admin: { label: "Admin", short: "AD", color: "#1f3a6b" },
} as const;
export type SystemRole = keyof typeof SYSTEM_ROLES;

export const ROLE_DEFAULT_MODULES: Record<SystemRole, Module[]> = {
  superadmin: [...MODULES],
  owner: ["dashboard", "fee", "insight", "piutang", "expenses", "attendance", "notif", "audit"],
  admin: [
    "dashboard",
    "calendar",
    "bookings",
    "clients",
    "fee",
    "insight",
    "piutang",
    "expenses",
    "attendance",
    "master",
    "notif",
    "users",
    "audit",
  ],
};

/** Permission yang harus dilucuti dari default-module assignment per role. */
export const ROLE_PERMISSION_DENY: Partial<Record<SystemRole, string[]>> = {};
