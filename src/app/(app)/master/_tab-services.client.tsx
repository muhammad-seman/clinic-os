"use client";

import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import {
  createCategoryAction,
  createServiceAction,
  deleteCategoryAction,
  deleteServiceAction,
  updateCategoryAction,
  updateServiceAction,
} from "./_actions";
import {
  DrawerShell,
  RowActions,
  useDelete,
  useDrawerSubmit,
  useEntityDelete,
} from "./_shared.client";
import type { Category, Service } from "./_types";

export function ServicesTab({
  services,
  categories,
  onAddCategory,
  onAddService,
  onEditCategory,
  onEditService,
}: {
  services: Service[];
  categories: Category[];
  onAddCategory: () => void;
  onAddService: () => void;
  onEditCategory: (c: Category) => void;
  onEditService: (s: Service) => void;
}) {
  const delCat = useDelete(deleteCategoryAction);
  const delSvc = useDelete(deleteServiceAction);

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
              <RowActions
                onEdit={() => onEditCategory(c)}
                onDelete={() => delCat.run(c.id, c.name)}
                pending={delCat.pending}
              />
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
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    <b>Belum ada jasa</b>
                    Tambahkan jasa pertama untuk membuka pemesanan.
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>
                    {s.name}{" "}
                    {!s.active && (
                      <span
                        className="pill"
                        style={{ fontSize: 10, marginLeft: 4, color: "var(--ink-3)" }}
                      >
                        Nonaktif
                      </span>
                    )}
                  </td>
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
                  <td>
                    <RowActions
                      onEdit={() => onEditService(s)}
                      onDelete={() => delSvc.run(s.id, s.name)}
                      pending={delSvc.pending}
                    />
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

export function ServiceDrawer({
  categories,
  row,
  onClose,
}: {
  categories: Category[];
  row?: Service | undefined;
  onClose: () => void;
}) {
  const editing = !!row;
  const { pending, error, submit } = useDrawerSubmit(
    editing ? updateServiceAction : createServiceAction,
  );
  const del = useEntityDelete(deleteServiceAction, onClose);
  return (
    <DrawerShell
      title={editing ? "Edit Jasa" : "Jasa Baru"}
      subtitle={editing ? row!.name : "Tahap 1 — atribut layanan"}
      onClose={onClose}
      pending={pending || del.pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
      onDelete={editing ? () => del.run(row!.id, row!.name) : undefined}
    >
      {editing && <input type="hidden" name="id" value={row!.id} />}
      <div className="field">
        <label>Nama</label>
        <input name="name" required className="input" defaultValue={row?.name ?? ""} />
      </div>
      <div className="field">
        <label>Kategori</label>
        <select
          name="categoryId"
          className="select"
          defaultValue={
            row && categories.find((c) => c.name === row.categoryName)?.id
              ? categories.find((c) => c.name === row.categoryName)!.id
              : ""
          }
        >
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
          <input
            name="priceCents"
            type="number"
            required
            min={0}
            className="input mono"
            defaultValue={row?.priceCents ?? ""}
          />
        </div>
        <div className="field">
          <label>Durasi (menit)</label>
          <input
            name="durationMin"
            type="number"
            defaultValue={row?.durationMin ?? 30}
            min={5}
            className="input mono"
          />
        </div>
      </div>
      {editing && (
        <label className="row" style={{ gap: 8, fontSize: 13 }}>
          <input type="checkbox" name="active" defaultChecked={row!.active} />
          Aktif
        </label>
      )}
    </DrawerShell>
  );
}

export function CategoryDrawer({
  row,
  onClose,
}: {
  row?: Category | undefined;
  onClose: () => void;
}) {
  const editing = !!row;
  const { pending, error, submit } = useDrawerSubmit(
    editing ? updateCategoryAction : createCategoryAction,
  );
  const del = useEntityDelete(deleteCategoryAction, onClose);
  return (
    <DrawerShell
      title={editing ? "Edit Kategori" : "Kategori Baru"}
      subtitle={editing ? row!.name : "Kelompokkan jasa serupa"}
      onClose={onClose}
      pending={pending || del.pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
      onDelete={editing ? () => del.run(row!.id, row!.name) : undefined}
    >
      {editing && <input type="hidden" name="id" value={row!.id} />}
      <div className="field">
        <label>Nama Kategori</label>
        <input
          name="name"
          required
          className="input"
          autoFocus
          defaultValue={row?.name ?? ""}
        />
      </div>
    </DrawerShell>
  );
}
