"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { MenuItem } from "../_shared";
import { updateUserAction } from "./_actions";
import type { UserRow } from "./_types";

export function RowMenu({
  user,
  onToast,
  onChanged,
  onDelete,
}: {
  user: UserRow;
  onToast: (msg: string) => void;
  onChanged: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => window.addEventListener("click", close, { once: true }), 0);
    return () => clearTimeout(t);
  }, [open]);

  const patch = (p: { status?: UserRow["status"] }, msg: string) => {
    start(async () => {
      const res = await updateUserAction(user.id, p);
      if (res.ok) {
        onToast(msg);
        onChanged();
      } else onToast(res.error);
    });
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn ghost sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="more" size={14} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 5,
            minWidth: 200,
            background: "var(--bg-elev)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "var(--shadow-lg)",
            padding: 6,
          }}
        >
          {user.status === "locked" ? (
            <MenuItem
              icon="unlock"
              label="Buka kunci akun"
              onClick={() => {
                setOpen(false);
                patch({ status: "active" }, "Akun dibuka kembali");
              }}
            />
          ) : user.status === "active" ? (
            <MenuItem
              icon="lock"
              label="Kunci akun"
              onClick={() => {
                setOpen(false);
                patch({ status: "locked" }, "Akun dikunci");
              }}
            />
          ) : null}
          <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
          <MenuItem
            icon="slash"
            label="Nonaktifkan pengguna"
            onClick={() => {
              setOpen(false);
              patch({ status: "disabled" }, `${user.name} dinonaktifkan`);
            }}
          />
          <MenuItem
            icon="trash"
            label="Hapus pengguna"
            danger
            onClick={() => {
              setOpen(false);
              onDelete(user.id);
            }}
          />
        </div>
      )}
    </div>
  );
}
