import type { Module } from "@/lib/permissions";

export type ImplStatus = "done" | "wip";

export type NavItem = {
  id: Module;
  group: string;
  label: string;
  icon: string;
  href: string;
  status: ImplStatus;
};

export const NAV: NavItem[] = [
  { id: "dashboard", group: "Operasional", label: "Ringkasan", icon: "dashboard", href: "/dashboard", status: "done" },
  { id: "calendar", group: "Operasional", label: "Kalender", icon: "calendar", href: "/calendar", status: "done" },
  { id: "bookings", group: "Operasional", label: "Booking", icon: "booking", href: "/bookings", status: "done" },
  { id: "clients", group: "Operasional", label: "Klien", icon: "users", href: "/klien", status: "done" },
  { id: "piutang", group: "Keuangan", label: "Kas Piutang", icon: "receivable", href: "/piutang", status: "done" },
  { id: "fee", group: "Keuangan", label: "Fee Karyawan", icon: "fee", href: "/fee", status: "done" },
  { id: "expenses", group: "Keuangan", label: "Pengeluaran", icon: "wallet", href: "/pengeluaran", status: "done" },
  { id: "insight", group: "Analitik", label: "Customer Insight", icon: "insight", href: "/insight", status: "done" },
  { id: "attendance", group: "SDM", label: "Absensi", icon: "attendance", href: "/attendance", status: "done" },
  { id: "master", group: "Sistem", label: "Master Data", icon: "master", href: "/master", status: "done" },
  { id: "users", group: "Akses & Keamanan", label: "Pengguna", icon: "users", href: "/access/users", status: "done" },
  { id: "roles", group: "Akses & Keamanan", label: "Peran & Izin", icon: "shield", href: "/access/roles", status: "done" },
  { id: "audit", group: "Akses & Keamanan", label: "Audit Log", icon: "history", href: "/access/audit", status: "done" },
  { id: "sessions", group: "Akses & Keamanan", label: "Sesi & Keamanan", icon: "key", href: "/access/sessions", status: "done" },
  { id: "notif", group: "Sistem", label: "Notifikasi", icon: "bell", href: "/notif", status: "done" },
  { id: "config", group: "Sistem", label: "Konfigurasi", icon: "settings", href: "/config", status: "done" },
];

export const PAGE_META: Record<string, { title: string; crumb: string }> = {
  dashboard: { title: "Ringkasan", crumb: "Dashboard" },
  calendar: { title: "Kalender Booking", crumb: "Operasional" },
  bookings: { title: "Booking", crumb: "Operasional" },
  clients: { title: "Daftar Klien", crumb: "Operasional" },
  piutang: { title: "Kas Piutang", crumb: "Keuangan" },
  fee: { title: "Fee Karyawan", crumb: "Keuangan" },
  expenses: { title: "Pengeluaran", crumb: "Keuangan" },
  insight: { title: "Customer Insight", crumb: "Analitik" },
  attendance: { title: "Absensi", crumb: "SDM" },
  master: { title: "Master Data", crumb: "Sistem" },
  users: { title: "Pengguna", crumb: "Akses & Keamanan" },
  roles: { title: "Peran & Izin", crumb: "Akses & Keamanan" },
  audit: { title: "Audit Log", crumb: "Akses & Keamanan" },
  sessions: { title: "Sesi & Keamanan", crumb: "Akses & Keamanan" },
  notif: { title: "Notifikasi", crumb: "Sistem" },
  config: { title: "Konfigurasi Sistem", crumb: "Sistem" },
};
