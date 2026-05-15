# NS Aesthetic — Clinic OS

Implementasi awal sesuai `Design/project/ARCHITECTURE.md`.

**Stack:** Next.js 15 (App Router, RSC) · PostgreSQL 16 · Drizzle ORM · Auth.js v5 · SWR 2 · Tailwind CSS 4 · Zod.

## Status scaffold

Folder ini adalah **bootstrap** — belum semua screen diimplementasi. Yang sudah ada:

- Struktur folder lengkap (`src/app`, `src/server`, `src/lib`, `src/components`).
- Konfigurasi: `package.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.ts`, `postcss.config.mjs`, `.env.example`.
- **Design tokens** disalin dari prototype (`src/styles/tokens.css`) + `globals.css` (Tailwind 4 `@theme`).
- **DB schema (Drizzle):** users, roles, permissions, role_permissions, sessions, audit_log, categories, services, packages, package_services, employees, materials, bookings, booking_assignments, booking_materials, attendance.
- **Auth & RBAC:** `next-auth` Credentials provider, argon2 verifier, TOTP helper (otplib), `assert(permission)` server-side, middleware route guard, audit logger.
- **Shell:** sidebar (NAV difilter via `${module}.view` permission) + topbar + (auth) layout untuk login/2fa/forgot.
- **Stub pages** untuk semua route NAV (`/dashboard`, `/calendar`, `/bookings`, `/piutang`, `/fee`, `/stock`, `/insight`, `/attendance`, `/master/*`, `/access/{users,roles,audit,sessions}`, `/notif`, `/config`). Tiap stub melakukan `assert("<module>.view")`.
- Seed script (`src/server/db/seed.ts`) untuk system roles + permission catalog.
- `/api/health` untuk smoke test DB.

## Belum dibuat (next steps per ARCHITECTURE §13)

1. Service & repository per modul (`src/server/services/booking/*`, dll).
2. Halaman list + drawer per modul (`_list.client.tsx`, `_drawer.client.tsx`, `_actions.ts`).
3. REST endpoint SWR di `src/app/api/v1/*`.
4. Cron handlers (`reminder-h1`, `lock-stale-sessions`, `audit-retention`, `nightly-insight`).
5. Test suite (Vitest + Playwright).

## Menjalankan

```bash
pnpm install              # atau npm/yarn
cp .env.example .env      # isi DATABASE_URL & AUTH_SECRET
pnpm db:push              # apply schema ke Postgres
pnpm db:seed              # roles + permissions
pnpm dev
```

Sumber desain visual & intent: `../Design/project/`. Baca `ARCHITECTURE.md` di sana sebelum menambah modul.
