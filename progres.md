# Progres clinic-os

Catatan singkat per iterasi. Yang terbaru di atas.

---

## Iterasi 5 — 2026-05-15 · UI alignment ke prototype + fix Server Action stale

**Bug — "Failed to find Server Action … workers"**
- Penyebab: bug dev-mode Next 15.1.0 ditambah `.next` cache yang menyimpan ID action lama setelah hot-reload.
- Fix: upgrade ke `next@^15.5.18` + `eslint-config-next@^15.5.18`. Clean `.next` setelah upgrade.

**UI selaras prototype (per ARCHITECTURE: "match visual output")**
- `app.css` prototype disalin ke `src/styles/app.css`; `globals.css` mengimpor `tailwindcss + tokens.css + app.css`. Tailwind tetap tersedia, tapi class utama berasal dari prototype.
- `src/components/ui/icon.tsx` — Icon component dengan stroke 1.5 dan path SVG identik dengan `icons.jsx` prototype (subset yang dipakai di Iterasi 1–4).

**Auth UI**
- `app/(auth)/_shell.tsx` — split panel 300px brand panel (gradient navy + radial gold) + form area, footer "© 2026 NS Aesthetic" + Ketentuan/Privasi, "Hubungi admin" pojok kanan atas.
- `app/(auth)/login/page.tsx` + `_form.tsx` — heading eyebrow "Clinic OS" gold + judul "Masuk ke Clinic OS"; pakai `.field` `.input-prefix` `.input mono` dengan icon mail/lock, toggle eye untuk show password, checkbox "Ingat perangkat 14 hari", tombol `.btn primary` dengan icon login, divider OR, button `.btn` ke /2fa. Error ditampilkan via `.pill dp`.

**Shell**
- `app/(app)/layout.tsx` — render `<div class="app">` + `<Sidebar/>` + `<div class="main">`.
- `components/shell/sidebar.tsx` — server component pakai `.side`/`.side-brand`/`.mark`/`.name`/`.side-section`/`.side-nav`/`.side-foot`. Avatar role pakai warna dari `ROLE_DEF`. Footer menampilkan nama user dari DB.
- `components/shell/nav-item.client.tsx` — client island baca `usePathname()` → set `aria-current="page"` + gold accent bar via CSS. Badge `.badge`/`.badge.alt` muncul per nav id (calendar/piutang/stock) tapi disembunyikan saat item aktif.
- `server/services/shell/badges.ts` — query 3 angka: booking hari ini, booking dp/termin, material `stock <= minStock`.
- `components/shell/topbar.tsx` — `.topbar` + `.menu-btn` + `.title-block` (crumb + h1) + `.search` dengan kbd "⌘K" + `.icon-btn` (bell + dot, settings).

**Bookings**
- Page: `.content wide` + `.page-h` (judul + deskripsi + search inline + tombol primary "Booking Baru" dengan icon plus).
- Tabs: `.tabs` (Semua / Terjadwal / Berlangsung / Selesai) dengan `.count` pill.
- Tabel: `.card > .card-b.flush > table.t` dengan `.row-id` mono untuk kode, `.pill scheduled/in-progress/done/dp/lunas/outline` untuk status & pembayaran, chevronRight di kolom terakhir. Empty state pakai `.empty`.
- Drawer: `.scrim` + `.drawer.fade` + `.drawer-h` (judul + "Tahap 1 — pemesanan klien") + `.drawer-b` (3 section 01/02/03 dengan eyebrow) + `.drawer-f` (footer dengan Batal + Simpan primary). Form Section pakai sub-card `.card-h` + `.eyebrow`.

**Master (Services / Employees / Materials)**
- Pattern sama: `.content wide` + `.page-h` + `.card > table.t` + drawer `.scrim/.drawer/.drawer-h/-b/-f`.
- Services: kolom Layanan/Kategori/Durasi/Harga/Status; drawer 3 field utama + select kategori.
- Employees: kolom Nama/Tipe/Telepon/Bergabung/Status; drawer dengan select tipe.
- Materials: kolom Nama (+ pill "Low" jika ≤ min) / Unit / HPP / Stok (rose bila low) / Min / Penyesuaian (`btn sm` −1 +1 +10). Header menampilkan jumlah item & low-count.

**Placeholder modul belum diimplementasi**
- `components/shell/placeholder.tsx` pakai `.card > .card-b > .empty` dengan icon settings.

**Verifikasi E2E**
- `npx tsc --noEmit` clean.
- signin → 200 redirect /dashboard.
- `/dashboard`, `/bookings`, `/master/services`, `/master/employees`, `/master/materials` semua 200 dengan ukuran 60–75KB.
- Markup probe: terdeteksi class `.content wide`, `.page-h`, `.tabs`, `.card`, `table.t`, `.pill`, `.side-brand`, `.topbar`, `aria-current="page"`.
- Devlog: zero error.

**Catatan untuk iterasi berikutnya**
- Modul lain (dashboard isi, calendar, piutang, fee, stock, insight, attendance, access/*) masih placeholder. Tinggal pakai pattern yang sama: `.page-h` + `.card` + `table.t` / `.kpi-grid` / `.cal` / drawer.
- Saat menambah icon baru, tambahkan ke `components/ui/icon.tsx` dengan path SVG dari `Design/project/icons.jsx`.

---

## Iterasi 4 — 2026-05-15 · Fix login flow end-to-end

**Bug 1 — Login menampilkan "NEXT_REDIRECT"**
- Penyebab: `signIn(..., { redirectTo })` melempar `RedirectError` sebagai mekanisme redirect Next.js; `try/catch` di Server Action menangkapnya dan menampilkannya sebagai error string.
- Fix di `app/(auth)/login/_actions.ts`: re-throw bila `isRedirectError(e)` (import dari `next/dist/client/components/redirect-error`); map `AuthError` dengan type `CredentialsSignin` → pesan ramah "Email atau kata sandi salah".

**Bug 2 — `role.permissions.has is not a function` di semua route protected**
- Penyebab: `unstable_cache` di `currentRole()` menyerialisasi `Set` jadi `{}`. Saat dibaca kembali, `.has` tidak ada.
- Fix: simpan permissions di cache sebagai `string[]`, rekonstruksi `new Set(...)` di luar cache wrapper (lihat `server/auth/rbac.ts`).
- Tambahan: bump cache key ke `["rbac:v2", uid]` agar entri cache lama (shape `Set→{}`) tidak dipakai.

**Verifikasi E2E (curl + cookie jar)**
- `POST /api/auth/callback/credentials` (email=admin@klinik.id, password=admin123) → 200 redirect ke `/dashboard`.
- `/dashboard`, `/bookings`, `/master/services`, `/master/employees`, `/master/materials` semua → 200.
- `/api/v1/options` → 7 services + 5 doctors.
- `/api/v1/bookings` → 8 items (paginated, no nextCursor karena seed cuma 8).
- `devlog`: zero error setelah fresh `.next` + restart.

**Catatan operasi**
- Setelah perubahan pada bentuk data yang masuk `unstable_cache`, **selalu bump cache key** (atau hapus `.next`) untuk hindari "object is not iterable" dari entri lama.

---

## Iterasi 3 — 2026-05-15 · Demo seed + 3 modul Master

**Demo seed (`npm run db:seed-demo`)**
- 4 kategori (Facial, Laser, Body Treatment, Injectable).
- 7 layanan dengan harga & durasi realistis.
- 1 paket (Bridal Glow x4) berisi 2 layanan.
- 5 karyawan (2 dokter, 2 terapis, 1 resepsionis).
- 5 bahan habis pakai dengan stok awal (3 di antaranya di bawah min → memicu badge low-stock di sidebar nanti).
- 8 sample booking lintas status (scheduled/in_progress/done) & pembayaran (unpaid/dp/paid/termin).
- Tambah 2 role custom (`dokter`, `terapis`) untuk dukungan booking assignment.
- Script idempoten (`onConflictDoNothing`).

**Bookings drawer**
- `GET /api/v1/options` baru (services aktif + dokter aktif).
- Drawer fetch options via SWR saat dibuka; tambah `<select>` untuk layanan & dokter.
- Server Action create di-extend menerima `serviceId`, `doctorId`.

**Master · Services**
- `lib/validation/master.ts` (Zod): createService, createEmployee, createMaterial, adjustStock.
- `server/repositories/master.repo.ts`: list & insert untuk services/employees/materials, `adjustMaterialStock` pakai `GREATEST(stock + delta, 0)`.
- `server/services/master/index.ts`: pure functions + audit logging (`master.service.create`, `master.employee.create`, `master.material.create`, `stock.adjust`).
- `app/(app)/master/services/{page.tsx,_view.client.tsx,_actions.ts}` — RSC list + client drawer + server action create.

**Master · Employees**
- Pattern sama dengan Services. Drawer dengan select Tipe (Dokter/Terapis/Resepsionis/Admin), tampilkan tanggal bergabung & status.

**Master · Materials (+ stok)**
- List menampilkan HPP, stok, min, dengan highlight rose ketika `stock ≤ minStock`.
- Inline button -1 / +1 / +10 memanggil `adjustStockAction` (RBAC: `stock.update`, audit `stock.adjust`).
- Drawer create field stok awal & min.
- Revalidate `/master/materials` + `/stock` saat ada perubahan.

**Fix konfig**
- Disable `experimental.typedRoutes` di `next.config.ts` — bentrok dengan typecheck strict + grouped routes `(app)`. Bisa diaktifkan lagi nanti dengan migrasi `Route` types.

**Verifikasi**
- `tsc --noEmit` clean.
- Dev server boot 1.5s.
- Probe (tanpa auth): `/`, `/bookings`, `/master/services`, `/master/employees`, `/master/materials`, `/api/v1/options` semua → 302 ke /login (middleware OK). `/login` → 200.
- Modul siap diuji setelah login dengan `admin@klinik.id` / `admin123`.

**Belum**
- Modul lain (calendar, piutang, fee, stock summary, insight, attendance, access/*, notif, config).
- Categories & Packages master pages.
- Detail/edit Bookings (drawer baru hanya untuk create).
- Session-row di DB & TOTP flow.
- Cron jobs, test suite.

---

## Iterasi 2 — 2026-05-15 · Runtime + Bookings module

**Runtime**
- `brew services start postgresql@15` → DB up.
- `CREATE DATABASE clinic_os` + `CREATE EXTENSION citext`.
- `npm install` selesai (443 packages).
- `.env` diisi (user pg lokal: `wildasalsabila`).
- `drizzle-kit push` apply schema (16 tabel + 9 index).
  - Fix: bigint `default(0n)` → `default(sql\`0\`)` di `bookings.ts` (drizzle-kit gagal serialize BigInt).
- `npm run db:seed` → 4 system roles + 60 permissions.
- `npm run db:bootstrap` → akun `admin@klinik.id` / `admin123` (superadmin).
  - Fix: `seed.ts` & `bootstrap-admin.ts` tidak pakai `server-only` (CLI script); pakai `node --env-file=.env --import tsx ...`.

**Bookings module (referensi pattern modul lain)**
- `lib/validation/booking.ts` — Zod schema (filter, create, settle).
- `server/repositories/booking.repo.ts` — Drizzle queries (list dgn cursor pagination, get, insert, applyPayment).
- `server/services/booking/{list,create,settle}.ts` — pure functions + audit logging.
- `app/api/v1/bookings/route.ts` — REST GET untuk SWR.
- `app/(app)/bookings/page.tsx` — RSC: initial fetch + render `BookingsList`.
- `app/(app)/bookings/_list.client.tsx` — SWR Infinite, filter q/status, pagination "muat lebih banyak".
- `app/(app)/bookings/_drawer.client.tsx` — form Booking Baru.
- `app/(app)/bookings/_actions.ts` — Server Actions (create, settle) + revalidatePath.

**Auth fix**
- Split `server/auth/config.ts` (full, Node-only) vs `server/auth/edge-config.ts` (edge-safe untuk middleware).
- `middleware.ts` instansiasi NextAuth dari edge config saja → tidak bundle argon2/pg.

**Verifikasi**
- `tsc --noEmit` clean.
- `npm run dev` boot 1.4s. Probe:
  - `GET /` → 302 (ke /login, sesuai middleware).
  - `GET /login` → 200.
  - `GET /bookings` → 302 (belum auth).
  - `GET /api/health` → 302 (belum auth) — bisa dipindah ke public bila perlu.

**Belum**
- REST/page untuk modul lain (calendar, piutang, fee, stock, dst).
- Session row di DB (saat ini JWT stateless, `sessions` table belum diisi saat signIn).
- TOTP flow end-to-end di `/2fa`.
- Cron handlers, test suite (Vitest + Playwright).
- Materials/services/employees seed agar drawer Bookings bisa pilih layanan & dokter.

---

## Iterasi 1 — 2026-05-15 · Bootstrap project

- Folder `clinic-os/` dibuat sebagai folder ketiga di root (selain `Docs/`, `Design/`).
- Konfigurasi Next 15 + TS strict + Tailwind 4 + Drizzle + Auth.js v5 + SWR + Zod.
- Design tokens disalin dari prototype; `globals.css` mapping ke Tailwind `@theme`.
- Schema Drizzle 16 tabel (users, roles, permissions, sessions, audit_log, services, packages, categories, package_services, employees, materials, bookings, booking_assignments, booking_materials, attendance).
- Auth scaffold: credentials provider, argon2, TOTP helper, `assert(permission)`, audit logger, middleware route guard.
- Shell `(app)/layout.tsx` — sidebar memfilter NAV by `${module}.view` permission.
- Stub page untuk 15 route NAV; tiap stub memanggil `assert("<module>.view")`.
- Auth pages: `/login` (Server Action), `/2fa`, `/forgot`.
- `/api/health` smoke test DB.
- README + .gitignore + .env.example.
