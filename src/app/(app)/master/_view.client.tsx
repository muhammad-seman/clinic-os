"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import {
  createServiceAction,
  createCategoryAction,
  createPackageAction,
  createEmployeeAction,
  createMaterialAction,
  adjustStockAction,
} from "./_actions";

type Service = {
  id: string;
  name: string;
  priceCents: string;
  durationMin: number;
  active: boolean;
  categoryName: string | null;
};
type Category = { id: string; name: string; serviceCount: number };
type Package = {
  id: string;
  name: string;
  priceCents: string;
  active: boolean;
  services: { id: string; name: string; priceCents: string }[];
};
type TaskRole = { id: string; slug: string; label: string; usage: number };
type Employee = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  active: boolean;
  joinedAt: string;
};
type Material = {
  id: string;
  name: string;
  unit: string;
  costCents: string;
  stock: number;
  minStock: number;
};

type Tab = "services" | "packages" | "roles" | "employees" | "materials";

export function MasterView(props: {
  services: Service[];
  categories: Category[];
  packages: Package[];
  roles: TaskRole[];
  employees: Employee[];
  materials: Material[];
}) {
  const [tab, setTab] = useState<Tab>("services");
  const [drawer, setDrawer] = useState<null | "service" | "category" | "package" | "employee" | "material">(null);

  const addLabel: Record<Tab, { label: string; key: Exclude<typeof drawer, null> }> = {
    services: { label: "Jasa", key: "service" },
    packages: { label: "Paket", key: "package" },
    roles: { label: "Peran", key: "service" }, // roles tab uses no drawer in design
    employees: { label: "Karyawan", key: "employee" },
    materials: { label: "Material", key: "material" },
  };

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Master Data</h2>
          <p>Data referensial yang dipanggil oleh transaksi · Superadmin &amp; Admin</p>
        </div>
        {tab !== "roles" && (
          <button className="btn primary" onClick={() => setDrawer(addLabel[tab].key)}>
            <Icon name="plus" size={13} /> Tambah {addLabel[tab].label}
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        <TabBtn active={tab === "services"} onClick={() => setTab("services")} count={props.services.length}>
          Kategori &amp; Jasa
        </TabBtn>
        <TabBtn active={tab === "packages"} onClick={() => setTab("packages")} count={props.packages.length}>
          Paket Promo
        </TabBtn>
        <TabBtn active={tab === "roles"} onClick={() => setTab("roles")} count={props.roles.length}>
          Peran
        </TabBtn>
        <TabBtn active={tab === "employees"} onClick={() => setTab("employees")} count={props.employees.length}>
          Karyawan
        </TabBtn>
        <TabBtn active={tab === "materials"} onClick={() => setTab("materials")} count={props.materials.length}>
          Stok Barang
        </TabBtn>
      </div>

      {tab === "services" && (
        <ServicesTab
          services={props.services}
          categories={props.categories}
          onAddCategory={() => setDrawer("category")}
          onAddService={() => setDrawer("service")}
        />
      )}
      {tab === "packages" && <PackagesTab packages={props.packages} />}
      {tab === "roles" && <RolesTab roles={props.roles} />}
      {tab === "employees" && <EmployeesTab employees={props.employees} />}
      {tab === "materials" && <MaterialsTab materials={props.materials} />}

      {drawer === "service" && (
        <ServiceDrawer categories={props.categories} onClose={() => setDrawer(null)} />
      )}
      {drawer === "category" && <CategoryDrawer onClose={() => setDrawer(null)} />}
      {drawer === "package" && (
        <PackageDrawer services={props.services} onClose={() => setDrawer(null)} />
      )}
      {drawer === "employee" && <EmployeeDrawer onClose={() => setDrawer(null)} />}
      {drawer === "material" && <MaterialDrawer onClose={() => setDrawer(null)} />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: ReactNode;
}) {
  return (
    <button aria-selected={active} onClick={onClick} role="tab">
      {children}
      <span className="count">{count}</span>
    </button>
  );
}

/* ---------------- Tabs ---------------- */

function ServicesTab({
  services,
  categories,
  onAddCategory,
  onAddService,
}: {
  services: Service[];
  categories: Category[];
  onAddCategory: () => void;
  onAddService: () => void;
}) {
  return (
    <div className="grid-2" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Kategori</h3>
            <p>{categories.length} kategori</p>
          </div>
          <button className="btn sm" onClick={onAddCategory}>
            <Icon name="plus" size={12} /> Kategori
          </button>
        </div>
        <div className="card-b flush">
          {categories.length === 0 && (
            <div className="empty">
              <b>Belum ada kategori</b>
              Tambahkan kategori untuk mengelompokkan jasa.
            </div>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="row"
              style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", gap: 12 }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                  color: "var(--gold)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="master" size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{c.name}</div>
                <div className="muted text-xs">{c.serviceCount} jasa</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Jasa / Treatment</h3>
            <p>Atribut: nama, kategori, harga jual, durasi</p>
          </div>
          <button className="btn sm primary" onClick={onAddService}>
            <Icon name="plus" size={12} /> Jasa
          </button>
        </div>
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th className="num">Durasi</th>
                <th className="num">Harga</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    <b>Belum ada jasa</b>
                    Tambahkan jasa pertama untuk membuka pemesanan.
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>
                    <span className="pill outline" style={{ fontSize: 10 }}>
                      {s.categoryName ?? "—"}
                    </span>
                  </td>
                  <td className="num">
                    <span className="mono">{s.durationMin}&apos;</span>
                  </td>
                  <td className="num">
                    <span className="mono fw-6">{fmtIDR(BigInt(s.priceCents))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PackagesTab({ packages }: { packages: Package[] }) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Paket Promo</h3>
          <p>Bundling 2+ jasa · harga di-set manual (tidak auto-sum)</p>
        </div>
      </div>
      <div
        className="card-b"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}
      >
        {packages.length === 0 && (
          <div className="empty">
            <b>Belum ada paket</b>
            Buat paket bundling dari 2 jasa atau lebih.
          </div>
        )}
        {packages.map((p) => {
          const sum = p.services.reduce((a, s) => a + BigInt(s.priceCents), 0n);
          const savings = sum - BigInt(p.priceCents);
          return (
            <div
              key={p.id}
              style={{
                padding: 16,
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "var(--bg-elev)",
              }}
            >
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="pill gold" style={{ fontSize: 10 }}>BUNDLE</span>
                  {p.active && (
                    <span className="pill lunas" style={{ fontSize: 10 }}>Aktif</span>
                  )}
                </div>
              </div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{p.name}</h4>
              <div className="muted text-xs" style={{ marginBottom: 10 }}>
                {p.services.length} jasa
              </div>
              <div className="vstack" style={{ gap: 4, marginBottom: 14 }}>
                {p.services.map((s) => (
                  <div key={s.id} className="row between" style={{ fontSize: 12.5 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Icon name="check" size={11} style={{ color: "var(--gold)" }} />
                      {s.name}
                    </span>
                    <span className="mono muted">{fmtIDR(BigInt(s.priceCents))}</span>
                  </div>
                ))}
              </div>
              <div className="divider" style={{ margin: "10px 0" }} />
              <div className="row between">
                <div>
                  <div className="muted text-xs">Harga Paket</div>
                  <div className="mono fw-7" style={{ fontSize: 18 }}>
                    {fmtIDR(BigInt(p.priceCents))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted text-xs">Hemat</div>
                  <div className="mono fw-6" style={{ color: "var(--sage)" }}>
                    {fmtIDR(savings)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RolesTab({ roles }: { roles: TaskRole[] }) {
  const max = Math.max(1, ...roles.map((r) => r.usage));
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Peran (Task Roles)</h3>
          <p>Dipakai saat assign karyawan ke booking</p>
        </div>
      </div>
      <div className="card-b flush">
        <table className="t">
          <thead>
            <tr>
              <th>Nama Peran</th>
              <th>Untuk Tipe</th>
              <th>Frekuensi Penggunaan</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  <b>Belum ada peran</b>
                </td>
              </tr>
            )}
            {roles.map((r) => {
              const isDoctor = r.slug.includes("dokter") || r.slug.includes("doctor");
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.label}</td>
                  <td>
                    <span className={"pill " + (isDoctor ? "gold" : "")}>
                      <Icon name={isDoctor ? "doctor" : "staff"} size={11} />{" "}
                      {isDoctor ? "Dokter" : "Staff"}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div
                        className="bar"
                        style={{
                          width: 160,
                          height: 6,
                          background: "var(--line)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${(r.usage / max) * 100}%`,
                            background: "var(--gold)",
                          }}
                        />
                      </div>
                      <span className="mono muted">{r.usage}× dipakai</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const fmtDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function EmployeesTab({ employees }: { employees: Employee[] }) {
  const aktif = employees.filter((e) => e.active).length;
  const non = employees.length - aktif;
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Karyawan</h3>
          <p>{aktif} aktif · {non} non-aktif</p>
        </div>
      </div>
      <div
        className="card-b"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}
      >
        {employees.length === 0 && (
          <div className="empty">
            <b>Belum ada karyawan</b>
            Tambahkan karyawan untuk assignment booking.
          </div>
        )}
        {employees.map((e) => {
          const isDoctor = e.type === "doctor" || e.type === "dokter";
          return (
            <div
              key={e.id}
              style={{
                padding: 14,
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "var(--bg-elev)",
                opacity: e.active ? 1 : 0.55,
              }}
            >
              <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                <div
                  className="avatar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    background: isDoctor ? "var(--navy-700)" : "var(--navy-500)",
                  }}
                >
                  {initials(e.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                  <div className="row" style={{ gap: 6, marginTop: 3 }}>
                    <span className={"pill " + (isDoctor ? "gold" : "")} style={{ fontSize: 10 }}>
                      <Icon name={isDoctor ? "doctor" : "staff"} size={10} />{" "}
                      {isDoctor ? "Dokter" : "Staff"}
                    </span>
                    {e.active ? (
                      <span className="pill lunas" style={{ fontSize: 10 }}>Aktif</span>
                    ) : (
                      <span className="pill" style={{ fontSize: 10 }}>Non-aktif</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="vstack" style={{ gap: 6, fontSize: 12.5 }}>
                <div className="row between">
                  <span className="muted">Kontak</span>
                  <span className="mono">{e.phone ?? "—"}</span>
                </div>
                <div className="row between">
                  <span className="muted">Bergabung</span>
                  <span className="mono">{fmtDate.format(new Date(e.joinedAt))}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MaterialsTab({ materials }: { materials: Material[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const lowCount = materials.filter((m) => m.stock <= m.minStock).length;

  function adjust(id: string, delta: number) {
    start(async () => {
      const r = await adjustStockAction(id, delta);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Stok Barang Dokter</h3>
          <p>
            {materials.length} item · {lowCount} di bawah ambang
          </p>
        </div>
      </div>
      <div className="card-b flush">
        <table className="t">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Satuan</th>
              <th className="num">Stok</th>
              <th className="num">Ambang Min</th>
              <th className="num">Harga Modal/Unit</th>
              <th className="num">Nilai Stok</th>
              <th style={{ width: 160 }}>Penyesuaian</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  <b>Belum ada material</b>
                </td>
              </tr>
            )}
            {materials.map((m) => {
              const low = m.stock <= m.minStock;
              const value = BigInt(m.costCents) * BigInt(m.stock);
              return (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>
                    {m.name}{" "}
                    {low && (
                      <span className="pill dp" style={{ fontSize: 10, marginLeft: 6 }}>
                        Low
                      </span>
                    )}
                  </td>
                  <td className="muted">{m.unit}</td>
                  <td className="num">
                    <span className={"mono " + (low ? "fw-7" : "")} style={low ? { color: "var(--rose)" } : undefined}>
                      {m.stock}
                    </span>
                  </td>
                  <td className="num">
                    <span className="mono muted">{m.minStock}</span>
                  </td>
                  <td className="num">
                    <span className="mono">{fmtIDR(BigInt(m.costCents))}</span>
                  </td>
                  <td className="num">
                    <span className="mono fw-6">{fmtIDR(value)}</span>
                  </td>
                  <td>
                    <div className="hstack" style={{ gap: 4 }}>
                      <button
                        className="btn sm"
                        type="button"
                        disabled={pending}
                        onClick={() => adjust(m.id, -1)}
                      >
                        −1
                      </button>
                      <button
                        className="btn sm"
                        type="button"
                        disabled={pending}
                        onClick={() => adjust(m.id, 1)}
                      >
                        +1
                      </button>
                      <button
                        className="btn sm"
                        type="button"
                        disabled={pending}
                        onClick={() => adjust(m.id, 10)}
                      >
                        +10
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Drawers ---------------- */

function DrawerShell({
  title,
  subtitle,
  onClose,
  onSubmit,
  pending,
  error,
  children,
  submitLabel = "Simpan",
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  error: string | null;
  children: ReactNode;
  submitLabel?: string;
}) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade" style={{ width: "min(540px,100vw)" }}>
        <div className="drawer-h">
          <div style={{ flex: 1 }}>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="btn ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <form
          id="master-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="drawer-b">
            <div className="vstack" style={{ gap: 14 }}>
              {children}
              {error && (
                <div className="pill dp" style={{ padding: "6px 10px", fontSize: 12 }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </form>
        <div className="drawer-f">
          <span className="muted text-sm">Bisa diubah kapan saja.</span>
          <div className="hstack">
            <button type="button" className="btn ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button type="submit" form="master-form" className="btn primary" disabled={pending}>
              <Icon name="check" size={14} />
              {pending ? "Menyimpan…" : submitLabel}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function useDrawerSubmit(action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submit = (fd: FormData, onSuccess: () => void) => {
    setError(null);
    start(async () => {
      const r = await action(fd);
      if (r.ok) {
        router.refresh();
        onSuccess();
      } else setError(r.error);
    });
  };
  return { pending, error, submit };
}

function ServiceDrawer({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const { pending, error, submit } = useDrawerSubmit(createServiceAction);
  return (
    <DrawerShell
      title="Jasa Baru"
      subtitle="Tahap 1 — atribut layanan"
      onClose={onClose}
      pending={pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
    >
      <div className="field">
        <label>Nama</label>
        <input name="name" required className="input" />
      </div>
      <div className="field">
        <label>Kategori</label>
        <select name="categoryId" className="select">
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid-2 even" style={{ gap: 12 }}>
        <div className="field">
          <label>Harga (Rupiah)</label>
          <input name="priceCents" type="number" required min={0} className="input mono" />
        </div>
        <div className="field">
          <label>Durasi (menit)</label>
          <input name="durationMin" type="number" defaultValue={30} min={5} className="input mono" />
        </div>
      </div>
    </DrawerShell>
  );
}

function CategoryDrawer({ onClose }: { onClose: () => void }) {
  const { pending, error, submit } = useDrawerSubmit(createCategoryAction);
  return (
    <DrawerShell
      title="Kategori Baru"
      subtitle="Kelompokkan jasa serupa"
      onClose={onClose}
      pending={pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
    >
      <div className="field">
        <label>Nama Kategori</label>
        <input name="name" required className="input" autoFocus />
      </div>
    </DrawerShell>
  );
}

function PackageDrawer({
  services,
  onClose,
}: {
  services: Service[];
  onClose: () => void;
}) {
  const { pending, error, submit } = useDrawerSubmit(createPackageAction);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const sum = services
    .filter((s) => picked.has(s.id))
    .reduce((a, s) => a + BigInt(s.priceCents), 0n);

  return (
    <DrawerShell
      title="Paket Promo Baru"
      subtitle="Bundle ≥ 2 jasa · harga manual"
      onClose={onClose}
      pending={pending}
      error={error}
      onSubmit={(fd) => {
        picked.forEach((id) => fd.append("serviceIds", id));
        submit(fd, onClose);
      }}
    >
      <div className="field">
        <label>Nama Paket</label>
        <input name="name" required className="input" />
      </div>
      <div className="field">
        <label>Harga Paket (Rupiah)</label>
        <input name="priceCents" type="number" required min={0} className="input mono" />
      </div>
      <div className="field">
        <label>Jasa Termasuk (pilih ≥ 2)</label>
        <div
          style={{
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid var(--line)",
            borderRadius: 8,
          }}
        >
          {services.map((s) => (
            <label
              key={s.id}
              className="row between"
              style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
            >
              <span className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={picked.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.name}
              </span>
              <span className="mono muted">{fmtIDR(BigInt(s.priceCents))}</span>
            </label>
          ))}
        </div>
        <div className="muted text-xs" style={{ marginTop: 6 }}>
          Total harga jasa: <span className="mono">{fmtIDR(sum)}</span> · dipilih {picked.size}
        </div>
      </div>
    </DrawerShell>
  );
}

function EmployeeDrawer({ onClose }: { onClose: () => void }) {
  const { pending, error, submit } = useDrawerSubmit(createEmployeeAction);
  return (
    <DrawerShell
      title="Karyawan Baru"
      subtitle="Aktor yang muncul di assignment booking"
      onClose={onClose}
      pending={pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
    >
      <div className="field">
        <label>Nama</label>
        <input name="name" required className="input" />
      </div>
      <div className="grid-2 even" style={{ gap: 12 }}>
        <div className="field">
          <label>Tipe</label>
          <select name="type" className="select" defaultValue="staff" required>
            <option value="doctor">Dokter</option>
            <option value="therapist">Terapis</option>
            <option value="receptionist">Resepsionis</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="field">
          <label>Telepon</label>
          <input name="phone" className="input mono" placeholder="0812…" />
        </div>
      </div>
    </DrawerShell>
  );
}

function MaterialDrawer({ onClose }: { onClose: () => void }) {
  const { pending, error, submit } = useDrawerSubmit(createMaterialAction);
  return (
    <DrawerShell
      title="Material Baru"
      subtitle="Inventaris habis pakai"
      onClose={onClose}
      pending={pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
    >
      <div className="grid-2 even" style={{ gap: 12 }}>
        <div className="field">
          <label>Nama</label>
          <input name="name" required className="input" />
        </div>
        <div className="field">
          <label>Satuan</label>
          <input name="unit" required className="input" placeholder="pcs / ml / btl" />
        </div>
      </div>
      <div className="grid-2 even" style={{ gap: 12 }}>
        <div className="field">
          <label>HPP / Unit (Rupiah)</label>
          <input name="costCents" type="number" required min={0} className="input mono" />
        </div>
        <div className="field">
          <label>Stok Awal</label>
          <input name="stock" type="number" defaultValue={0} min={0} className="input mono" />
        </div>
      </div>
      <div className="field">
        <label>Ambang Min</label>
        <input name="minStock" type="number" defaultValue={0} min={0} className="input mono" />
      </div>
    </DrawerShell>
  );
}
