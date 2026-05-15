# Progres clinic-os

Catatan singkat per iterasi. Terbaru di atas.

---

## Iterasi 9 — 2026-05-15 · Topbar lonceng/setting/logout + Booking detail drawer

**Topbar (RSC async sekarang):**
- 🔔 Bell → `Link` ke `/notif`, ber-dot kalau total alert (besok + low stock + overdue) > 0 via `fetchNotifCount()`.
- ⚙️ Settings → `Link` ke `/config`.
- 🚪 Logout — `LogoutButton` client island memanggil `signOutAction` (server action) → `signOut({ redirectTo: "/login" })`.
- Nav item: tag "✓ done" dihapus, hanya "WIP" yang tampil (semua sudah done).

**Booking detail drawer (gap utama prototype):**
- Row tabel `/bookings` sekarang clickable → drawer 3 tab: Ringkasan, Eksekusi, Pembayaran.
- Eksekusi: tombol ubah status (Terjadwal/Mulai/Selesaikan/Tidak Hadir/Batalkan) via `setBookingStatusAction`.
- Pembayaran: nominal cicilan + tombol "Lunasi Sisa". `applyPayment` di repo otomatis update `payment` (dp/paid) saat sisa = 0.
- New endpoint: `GET /api/v1/bookings/[id]` (SWR fetcher).
- New action: `setBookingStatusAction`, `settleBookingJsonAction`. Audit `booking.status`, `booking.settle`.

**Verifikasi**
- `npx tsc --noEmit` clean.
- `next build` sukses 26 routes. `/bookings` 11 kB (+1.4 kB karena detail drawer).
- Cross-check 14 halaman: master CRUD ✓, stock adjust ✓, fee mark/unmark ✓, settle piutang ✓, attendance GPS ✓, notif groups ✓, config save ✓, akses (users/roles/audit/sessions) ✓.

---

## Iterasi 8 — 2026-05-15 · Attendance / Notif / Config (3 WIP terakhir)

**Modul selesai (semua nav `done`):**
- `/attendance` — Tap Hadir GPS dengan simulator dalam/luar radius + `RadiusViz` SVG. Pemilihan karyawan, validasi haversine vs `clinic.lat/lng/radius`, guard dobel-absen hari ini. Daftar "Kehadiran Hari Ini" + tabel riwayat 12 baris. Action `recordAttendanceAction` (RBAC `attendance.create`).
- `/notif` — RSC penuh, 3 group: Reminder H-1 (booking besok), Stok Minim (`stock <= minStock`), Piutang overdue (`dueAt < now && remaining > 0`). Empty state per grup match prototype.
- `/config` — Form 2-kolom: Klinik (nama/alamat/lat/lng/radius/timezone) + Threshold Apriori (support/confidence/lowStockMultiplier). Tabel Manajemen Akun dari `listUsers()`. Action `saveConfigAction` upsert ke `system_config`.

**Schema/Service**
- New `system_config(key text PK, value jsonb, updated_at)` di `schema/system-config.ts` + export. **Perlu `npm run db:push`.**
- New services: `services/attendance/index.ts` (haversine + guard), `services/notif/index.ts`, `services/system-config/index.ts` (default in-code, override via row).
- Audit log: `attendance.record`, `attendance.duplicate`, `attendance.out_of_range`, `config.update`.
- Nav `attendance | notif | config` status → `done`.

**Verifikasi**
- `npx tsc --noEmit` clean.
- `next build` sukses 25 routes. `/attendance` 3.18 kB · `/notif` 857 B · `/config` 2.28 kB.

**Catatan**
- `system_config` butuh `db:push`; service fallback ke default in-code jika tabel belum ada / row kosong.
- Config "Manajemen Akun" hanya tampilkan list; CRUD ada di `/access/users`.

---

## Iterasi 7 — 2026-05-15 · Fee / Stock / Insight + Dashboard pixel-match

**Modul WIP berikut (batch 3):**
- `/fee` — KPI 3 (Total siap-bayar, Tindakan, Rata-rata). Period switcher (Minggu/Bulan/Kuartal) lewat `?p=`. Tabs Belum/Sudah/Semua. Agregasi `booking_assignments.fee_cents` per karyawan untuk booking `done|in_progress` dalam range periode. Aksi **Tandai Bayar** insert ke tabel baru `fee_payments(employee_id, period unique, amount_cents, paid_at)` + action **batal tandai**. Negatif case: dobel-tandai → error toast; revert → "tidak ada catatan".
- `/stock` — KPI 4 (Total item, Nilai inventaris, Di bawah ambang, Pemakaian 30 hari). Grid-2: tabel stok dengan bar status (low/warn/ok) + tombol −1/+1/+10 (server action `adjustStockAction`, RBAC `stock.update`) | Log pengeluaran 30 hari (join `bookingMaterials`). Negatif: stok ≥0 dijaga `GREATEST(stock+delta,0)` di repo.
- `/insight` — KPI 4 (Total Klien, Returning Rate, Avg Spend, Pola Apriori Aktif). Grid-2 Top Nominal & Top Frekuensi. Apriori per-klien basket (union service di semua booking, exclude cancelled) + slider Support/Confidence client-side dengan empty state jika threshold tidak terpenuhi.

**Dashboard re-write (match `screen-dashboard.jsx`):**
- KPI 4: Revenue, Profit, Total Booking, Kas Piutang — semua pakai data riil.
  - Profit bulan ini = `SUM(paid_cents) − SUM(booking_materials.qty × materials.cost_cents)` untuk booking non-cancelled.
  - Δ vs bulan lalu untuk Revenue & Total; jumlah jatuh tempo &lt;7 hari untuk Piutang.
- Revenue & Profit chart (SVG line+area) dengan period switcher `?p=day|week|month|year` → service `bucketsFor()` bikin 12 jam / 8 minggu / 8 bulan / 6 tahun real-aggregated.
- Booking Mendatang, Top Nominal, Top Frekuensi, Apriori Preview (top 5 conf ≥60%, support ≥10%), Peringatan stok dengan bar.

**Schema/Service**
- New `feePayments` table di `schema/fee-payments.ts` + export di index (perlu `db:push`).
- New services: `services/fee`, `services/stock`, `services/insight`. Dashboard service di-overhaul (bucket aggregation + profit calc + apriori preview).
- New icons: `package`, `flask`, `arrowDownRight`, `arrowUpRight`, `link`, `sparkle`, `trending`.

**Verifikasi**
- `npx tsc --noEmit` clean.
- `next build` sukses 25 routes. `/dashboard` 1.18 kB · `/fee` 2.43 kB · `/stock` 3.28 kB · `/insight` 2.19 kB.
- Nav status: tinggal `attendance`, `notif`, `config` (`wip`).

**Catatan**
- `fee_payments` butuh `npm run db:push` agar tabel terbuat.
- Dashboard period selain `month`: query agregasi sederhana (no index khusus untuk bucket besar).

---

## Iterasi 1–6 (ringkas)

- I1 Bootstrap Next 15 + Drizzle + Auth.js v5 + RBAC + 16 tabel.
- I2 Bookings module REST/RSC/SWR + drawer; split auth edge vs node.
- I3 Demo seed; CRUD Master Services/Employees/Materials + adjust stock.
- I4 Fix login redirect + `unstable_cache` Set→string[] serialization.
- I5 UI align: `app.css`/`tokens.css` masuk, Icon stroke 1.5, shell sidebar+topbar dari DB.
- I6 Init git `clinic-os` + push GH; Master Data single page 5 tab; `/dashboard`, `/calendar`, `/piutang` selesai.
