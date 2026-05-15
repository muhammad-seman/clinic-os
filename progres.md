# Progres clinic-os

Catatan singkat per iterasi. Terbaru di atas.

---

## Iterasi 6 — 2026-05-15 · Master Data tabs + Dashboard/Calendar/Piutang

**Git** — init repo `clinic-os/`, user lokal `muhammad-seman <muhammad.seman030801@gmail.com>`, push ke `github.com/muhammad-seman/clinic-os`.

**Master Data** — refactor jadi single-page `/master` 5 tab (sesuai `screen-master.jsx`):
- Tabs: Kategori&Jasa, Paket Promo, Peran, Karyawan, Stok Barang — dengan `.count` pill.
- Tab 1: grid-2 (list kategori + tabel jasa). Tambah CRUD Kategori (`createCategoryAction`).
- Tab 2: card grid bundle dengan kalkulasi `hemat` (sum harga jasa − harga paket). CRUD Paket via drawer pilih ≥2 jasa.
- Tab 3: tabel Peran dari RBAC roles + bar chart frekuensi (count dari `booking_assignments`); pill Dokter/Staff dari slug.
- Tab 4: card grid karyawan (avatar inisial, pill tipe + aktif/non-aktif).
- Tab 5: tabel stok dengan kolom Nilai Stok (stock × HPP) + adjust −1/+1/+10 inline.
- Drawer pattern: `_view.client.tsx` punya `DrawerShell` reusable + 5 drawers.
- Subroute lama (`/master/services`, `/employees`, `/materials`, `/categories`, `/packages`, `/roles`) dihapus; nav `master.href` → `/master`.
- Tambah icon `doctor` & `staff` di `components/ui/icon.tsx`.
- Repo `master.repo.ts`: `listCategoriesWithCount`, `listPackages`, `insertCategory`, `insertPackage` (transaksi), `listTaskRoles` (left join `bookingAssignments` + COUNT).
- Validation `master.ts`: `createCategorySchema`, `createPackageSchema` (serviceIds ≥ 2).

**Sidebar — 3 menu WIP berikut diselesaikan:**
- `/dashboard` — KPI grid (Revenue bulan ini, Piutang, Total Booking, Karyawan) + Booking Mendatang (5 terdekat) + Peringatan Stok + Top Customer · Nominal. Data via `server/services/dashboard`.
- `/calendar` — week view 08–18 dengan grid 60px + 7 hari, navigasi `?w=YYYY-MM-DD`, today highlighted gold. Data via `server/services/calendar.fetchWeekEvents`.
- `/piutang` — KPI 3 (Total / <7 hari / Overdue) + tabel sisa pembayaran sorted by `dueAt`, action **Lunasi** = `settleBooking` dengan `amountCents = remaining`. Permission `piutang.update`.

**Verifikasi**
- `npx tsc --noEmit` clean.
- `next build` sukses (25 routes). `/master` 7.33 kB · `/dashboard` 877 B · `/calendar` 877 B · `/piutang` 2.95 kB.
- Nav status: `done` untuk dashboard, calendar, bookings, piutang, master, users, roles, audit, sessions. Sisanya `wip`: fee, stock, insight, attendance, notif, config.

**Catatan**
- Chart Revenue & Apriori (dashboard) belum diimplementasikan; bisa dijadikan iterasi berikut bila data sudah cukup.
- Calendar belum punya event-click → drawer detail booking. Day/Month view juga belum.

---

## Iterasi 1–5 (ringkas)

- I1 Bootstrap: Next 15 + TS strict + Tailwind 4 + Drizzle + Auth.js v5 + SWR + Zod. 16 tabel, RBAC scaffold, 15 stub route.
- I2 Runtime + Bookings module (REST + RSC + SWR Infinite + drawer). Split auth config edge vs node untuk middleware.
- I3 Demo seed (`db:seed-demo`: 4 kat, 7 jasa, 1 paket, 5 karyawan, 5 material, 8 booking). Master Services/Employees/Materials CRUD + adjust stock.
- I4 Fix login: re-throw `RedirectError`, ramah pesan `CredentialsSignin`. Fix `unstable_cache` serialisasi `Set` → simpan sebagai `string[]`, bump key ke `rbac:v2`.
- I5 UI align ke prototype: salin `app.css` + `tokens.css`, Icon component stroke 1.5. Auth split-panel, shell sidebar+topbar dengan badge dari DB, bookings tabel + drawer.
