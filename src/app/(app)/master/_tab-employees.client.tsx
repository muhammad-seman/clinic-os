"use client";

import { Icon } from "@/components/ui/icon";
import {
  createEmployeeAction,
  deleteEmployeeAction,
  updateEmployeeAction,
} from "./_actions";
import {
  DrawerShell,
  RowActions,
  fmtDate,
  initials,
  useDelete,
  useDrawerSubmit,
  useEntityDelete,
} from "./_shared.client";
import type { Employee } from "./_types";

export function EmployeesTab({
  employees,
  onEdit,
}: {
  employees: Employee[];
  onEdit: (e: Employee) => void;
}) {
  const del = useDelete(deleteEmployeeAction);
  const aktif = employees.filter((e) => e.active).length;
  const non = employees.length - aktif;
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Karyawan</h3>
          <p>
            {aktif} aktif · {non} non-aktif · subjek booking & fee (tanpa akun login)
          </p>
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
                    <span
                      className={"pill " + (isDoctor ? "gold" : "")}
                      style={{ fontSize: 10 }}
                    >
                      <Icon name={isDoctor ? "doctor" : "staff"} size={10} />{" "}
                      {isDoctor ? "Dokter" : "Staff"}
                    </span>
                    {e.active ? (
                      <span className="pill lunas" style={{ fontSize: 10 }}>
                        Aktif
                      </span>
                    ) : (
                      <span className="pill" style={{ fontSize: 10 }}>
                        Non-aktif
                      </span>
                    )}
                  </div>
                </div>
                <RowActions
                  onEdit={() => onEdit(e)}
                  onDelete={() => del.run(e.id, e.name)}
                  pending={del.pending}
                />
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

export function EmployeeDrawer({
  row,
  onClose,
}: {
  row?: Employee | undefined;
  onClose: () => void;
}) {
  const editing = !!row;
  const { pending, error, submit } = useDrawerSubmit(
    editing ? updateEmployeeAction : createEmployeeAction,
  );
  const del = useEntityDelete(deleteEmployeeAction, onClose);
  return (
    <DrawerShell
      title={editing ? "Edit Karyawan" : "Karyawan Baru"}
      subtitle={editing ? row!.name : "Aktor yang muncul di assignment booking"}
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
      <div className="grid-2 even" style={{ gap: 12 }}>
        <div className="field">
          <label>Tipe</label>
          <select
            name="type"
            className="select"
            defaultValue={row?.type ?? "staff"}
            required
          >
            <option value="doctor">Dokter</option>
            <option value="therapist">Terapis</option>
            <option value="receptionist">Resepsionis</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="field">
          <label>Telepon</label>
          <input
            name="phone"
            className="input mono"
            placeholder="0812…"
            defaultValue={row?.phone ?? ""}
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
