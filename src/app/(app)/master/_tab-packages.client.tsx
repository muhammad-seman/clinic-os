"use client";

import { useState } from "react";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import {
  createPackageAction,
  deletePackageAction,
  updatePackageAction,
} from "./_actions";
import {
  DrawerShell,
  RowActions,
  useDelete,
  useDrawerSubmit,
  useEntityDelete,
} from "./_shared.client";
import type { Package, Service } from "./_types";

export function PackagesTab({
  packages,
  onEdit,
}: {
  packages: Package[];
  onEdit: (p: Package) => void;
}) {
  const del = useDelete(deletePackageAction);
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
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
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
                  <span className="pill gold" style={{ fontSize: 10 }}>
                    BUNDLE
                  </span>
                  {p.active && (
                    <span className="pill lunas" style={{ fontSize: 10 }}>
                      Aktif
                    </span>
                  )}
                </div>
                <RowActions
                  onEdit={() => onEdit(p)}
                  onDelete={() => del.run(p.id, p.name)}
                  pending={del.pending}
                />
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

export function PackageDrawer({
  services,
  row,
  onClose,
}: {
  services: Service[];
  row?: Package | undefined;
  onClose: () => void;
}) {
  const editing = !!row;
  const { pending, error, submit } = useDrawerSubmit(
    editing ? updatePackageAction : createPackageAction,
  );
  const del = useEntityDelete(deletePackageAction, onClose);
  const [picked, setPicked] = useState<Set<string>>(
    new Set(row?.services.map((s) => s.id) ?? []),
  );
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
      title={editing ? "Edit Paket" : "Paket Promo Baru"}
      subtitle={editing ? row!.name : "Bundle ≥ 2 jasa · harga manual"}
      onClose={onClose}
      pending={pending || del.pending}
      error={error}
      onSubmit={(fd) => {
        picked.forEach((id) => fd.append("serviceIds", id));
        submit(fd, onClose);
      }}
      onDelete={editing ? () => del.run(row!.id, row!.name) : undefined}
    >
      {editing && <input type="hidden" name="id" value={row!.id} />}
      <div className="field">
        <label>Nama Paket</label>
        <input name="name" required className="input" defaultValue={row?.name ?? ""} />
      </div>
      <div className="field">
        <label>Harga Paket (Rupiah)</label>
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
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
              }}
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
      {editing && (
        <label className="row" style={{ gap: 8, fontSize: 13 }}>
          <input type="checkbox" name="active" defaultChecked={row!.active} />
          Aktif
        </label>
      )}
    </DrawerShell>
  );
}
