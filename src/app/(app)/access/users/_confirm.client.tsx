"use client";

import type { BulkAction } from "./_types";

export function ConfirmDialog({
  action,
  count,
  pending,
  onCancel,
  onConfirm,
}: {
  action: BulkAction;
  count: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title =
    action === "delete"
      ? "Hapus pengguna?"
      : action === "disable"
        ? "Nonaktifkan pengguna?"
        : "Kunci pengguna?";
  const body =
    action === "delete"
      ? `${count} pengguna akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
      : action === "disable"
        ? `${count} pengguna akan dinonaktifkan dan tidak bisa login.`
        : `${count} pengguna akan dikunci hingga di-unlock kembali.`;
  return (
    <>
      <div className="scrim" onClick={onCancel} />
      <div
        role="dialog"
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "var(--bg-elev)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            width: "min(440px, 92vw)",
            padding: 20,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            {body}
          </p>
          <div className="hstack" style={{ justifyContent: "flex-end", marginTop: 16, gap: 8 }}>
            <button className="btn" onClick={onCancel} disabled={pending}>
              Batal
            </button>
            <button
              className={"btn " + (action === "delete" ? "danger" : "primary")}
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? "Memproses…" : "Konfirmasi"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
