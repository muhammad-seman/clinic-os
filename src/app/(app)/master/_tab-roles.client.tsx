"use client";

import { Icon } from "@/components/ui/icon";
import {
  createTaskRoleAction,
  deleteTaskRoleAction,
  updateTaskRoleAction,
} from "./_actions";
import {
  DrawerShell,
  RowActions,
  useDelete,
  useDrawerSubmit,
  useEntityDelete,
} from "./_shared.client";
import type { TaskRole } from "./_types";

export function RolesTab({
  roles,
  onEdit,
}: {
  roles: TaskRole[];
  onEdit: (r: TaskRole) => void;
}) {
  const del = useDelete(deleteTaskRoleAction);
  const max = Math.max(1, ...roles.map((r) => r.usage));
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Peran Tindakan</h3>
          <p>
            Peran yang muncul saat assign karyawan ke booking (mis. Pencuci Rambut,
            Asisten Dokter). Berbeda dari peran akun (Superadmin/Admin/Staff).
          </p>
        </div>
      </div>
      <div className="card-b flush">
        <table className="t">
          <thead>
            <tr>
              <th>Nama Peran</th>
              <th>Untuk Tipe</th>
              <th>Status</th>
              <th>Frekuensi Penggunaan</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  <b>Belum ada peran tindakan</b>
                  Tambahkan peran seperti Pencuci Rambut, Asisten Dokter, dll.
                </td>
              </tr>
            )}
            {roles.map((r) => {
              const isDoctor = r.forType === "doctor";
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>
                    {r.label}{" "}
                    <span className="muted text-xs mono">· {r.slug}</span>
                  </td>
                  <td>
                    <span className={"pill " + (isDoctor ? "gold" : "")}>
                      <Icon name={isDoctor ? "doctor" : "staff"} size={11} />{" "}
                      {isDoctor ? "Dokter" : "Staff"}
                    </span>
                  </td>
                  <td>
                    {r.active ? (
                      <span className="pill lunas" style={{ fontSize: 10 }}>
                        Aktif
                      </span>
                    ) : (
                      <span className="pill" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div
                        className="bar"
                        style={{
                          width: 140,
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
                  <td>
                    <RowActions
                      onEdit={() => onEdit(r)}
                      onDelete={() => del.run(r.id, r.label)}
                      pending={del.pending}
                    />
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

export function TaskRoleDrawer({
  row,
  onClose,
}: {
  row?: TaskRole | undefined;
  onClose: () => void;
}) {
  const editing = !!row;
  const { pending, error, submit } = useDrawerSubmit(
    editing ? updateTaskRoleAction : createTaskRoleAction,
  );
  const del = useEntityDelete(deleteTaskRoleAction, onClose);
  return (
    <DrawerShell
      title={editing ? "Edit Peran Tindakan" : "Peran Tindakan Baru"}
      subtitle={
        editing ? row!.label : "Mis. Pencuci Rambut, Asisten Dokter, Beautician"
      }
      onClose={onClose}
      pending={pending || del.pending}
      error={error}
      onSubmit={(fd) => submit(fd, onClose)}
      onDelete={editing ? () => del.run(row!.id, row!.label) : undefined}
    >
      {editing && <input type="hidden" name="id" value={row!.id} />}
      <div className="field">
        <label>Nama Peran</label>
        <input
          name="label"
          required
          className="input"
          autoFocus
          defaultValue={row?.label ?? ""}
          placeholder="mis. Pencuci Rambut"
        />
        {!editing && (
          <div className="muted text-xs">Slug akan dibuat otomatis dari nama.</div>
        )}
      </div>
      <div className="field">
        <label>Untuk Tipe Karyawan</label>
        <select
          name="forType"
          className="select"
          defaultValue={row?.forType ?? "staff"}
          required
        >
          <option value="staff">Staff / Beautician / Asisten</option>
          <option value="doctor">Dokter</option>
        </select>
        <div className="muted text-xs">
          Menentukan filter dropdown karyawan saat assign di booking.
        </div>
      </div>
      {editing && (
        <label className="row" style={{ gap: 8, fontSize: 13 }}>
          <input type="checkbox" name="active" defaultChecked={row!.active} />
          Aktif (muncul di pilihan assign)
        </label>
      )}
    </DrawerShell>
  );
}
