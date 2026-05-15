"use client";

import type { Dispatch, SetStateAction } from "react";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Row } from "./_detail-parts";
import type { Assignment, RefEmployee, RefRole } from "./_detail-types";

export function ExecutionTab({
  readOnly,
  assignments,
  setAssignments,
  refRoles,
  refEmployees,
  price,
  fee,
  profit,
  margin,
}: {
  readOnly: boolean;
  assignments: Assignment[];
  setAssignments: Dispatch<SetStateAction<Assignment[]>>;
  refRoles: RefRole[];
  refEmployees: RefEmployee[];
  price: bigint;
  fee: bigint;
  profit: bigint;
  margin: number;
}) {
  const addAssignment = () => {
    const role = refRoles[0];
    const emp = refEmployees[0];
    if (!role || !emp) return;
    setAssignments((a) => [
      ...a,
      {
        roleId: role.id,
        roleLabel: role.label,
        roleSlug: role.slug,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeType: emp.type,
        feeCents: "0",
      },
    ]);
  };
  const removeAssignment = (i: number) =>
    setAssignments((a) => a.filter((_, j) => j !== i));
  const updateAssignment = (i: number, patch: Partial<Assignment>) =>
    setAssignments((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="vstack" style={{ gap: 18 }}>
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Assign Peran &amp; Fee</h3>
            <p>Form dinamis · tambah baris untuk tiap peran yang terlibat</p>
          </div>
          {!readOnly && (
            <button className="btn sm" type="button" onClick={addAssignment}>
              <Icon name="plus" size={12} /> Tambah Peran
            </button>
          )}
        </div>
        <div className="card-b" style={{ paddingTop: 8 }}>
          {assignments.length === 0 ? (
            <div className="empty">
              <Icon name="users" size={28} className="ico" />
              <b>Belum ada peran</b>
              Tambahkan minimal satu peran untuk menghitung profit.
            </div>
          ) : (
            <div className="vstack" style={{ gap: 8 }}>
              {assignments.map((a, i) => {
                const role = refRoles.find((r) => r.id === a.roleId);
                const isDoctorRole = role?.forType === "doctor";
                const filtered = refEmployees.filter(
                  (e) =>
                    e.active &&
                    (isDoctorRole ? e.type === "doctor" : e.type !== "doctor"),
                );
                return (
                  <div
                    key={i}
                    className="row"
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      gap: 10,
                      background: "var(--bg-elev)",
                    }}
                  >
                    <span className="mono muted-2" style={{ width: 24, fontSize: 11 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <select
                      disabled={readOnly}
                      className="select"
                      style={{ flex: 1.4 }}
                      value={a.roleId}
                      onChange={(e) => {
                        const r = refRoles.find((x) => x.id === e.target.value);
                        updateAssignment(i, {
                          roleId: e.target.value,
                          roleLabel: r?.label ?? a.roleLabel,
                          roleSlug: r?.slug ?? a.roleSlug,
                        });
                      }}
                    >
                      {refRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <select
                      disabled={readOnly}
                      className="select"
                      style={{ flex: 1.4 }}
                      value={a.employeeId}
                      onChange={(e) => {
                        const emp = refEmployees.find((x) => x.id === e.target.value);
                        updateAssignment(i, {
                          employeeId: e.target.value,
                          employeeName: emp?.name ?? a.employeeName,
                          employeeType: emp?.type ?? a.employeeType,
                        });
                      }}
                    >
                      {(filtered.length > 0 ? filtered : refEmployees).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                    <div className="input-prefix" style={{ flex: 1, maxWidth: 180 }}>
                      <span className="p">Rp</span>
                      <input
                        disabled={readOnly}
                        className="input mono"
                        type="number"
                        min={0}
                        value={a.feeCents}
                        onChange={(e) =>
                          updateAssignment(i, { feeCents: e.target.value || "0" })
                        }
                      />
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => removeAssignment(i)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-b">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Live Perhitungan Profit
          </div>
          <div className="vstack" style={{ gap: 6 }}>
            <Row label="Harga jasa/paket">
              <span className="mono fw-6">{fmtIDR(price)}</span>
            </Row>
            <Row label="– Σ Fee Karyawan">
              <span className="mono">{fmtIDR(fee)}</span>
            </Row>
          </div>
          <div className="divider" />
          <Row label="Profit (estimasi)">
            <span
              className="mono fw-7"
              style={{
                fontSize: 18,
                color: profit > 0n ? "var(--sage)" : "var(--rose)",
              }}
            >
              {fmtIDR(profit)} <span className="muted text-xs">({margin}%)</span>
            </span>
          </Row>
        </div>
      </div>
    </div>
  );
}
