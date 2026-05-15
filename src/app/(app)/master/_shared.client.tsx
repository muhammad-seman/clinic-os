"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import type { Tab } from "./_types";

export const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TabLink({
  tab,
  current,
  count,
  children,
}: {
  tab: Tab;
  current: Tab;
  count: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const active = tab === current;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        if (!active) router.push(`/master?tab=${tab}`, { scroll: false });
      }}
    >
      {children}
      <span className="count">{count}</span>
    </button>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  pending,
}: {
  onEdit: () => void;
  onDelete: () => void;
  pending?: boolean;
}) {
  return (
    <div className="hstack" style={{ gap: 4 }}>
      <button type="button" className="btn ghost sm" onClick={onEdit} disabled={pending}>
        <Icon name="edit" size={12} />
      </button>
      <button
        type="button"
        className="btn ghost sm"
        onClick={onDelete}
        disabled={pending}
        style={{ color: "var(--rose)" }}
      >
        <Icon name="trash" size={12} />
      </button>
    </div>
  );
}

export function useDelete(
  action: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>,
) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (id: string, label: string) => {
    if (!window.confirm(`Hapus "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    start(async () => {
      const r = await action(id);
      if (r.ok) router.refresh();
      else window.alert(r.error);
    });
  };
  return { pending, run };
}

export function DrawerShell({
  title,
  subtitle,
  onClose,
  onSubmit,
  pending,
  error,
  children,
  submitLabel = "Simpan",
  onDelete,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  error: string | null;
  children: ReactNode;
  submitLabel?: string | undefined;
  onDelete?: (() => void) | undefined;
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
          {onDelete ? (
            <button
              type="button"
              className="btn ghost"
              onClick={onDelete}
              disabled={pending}
              style={{ color: "var(--rose)" }}
            >
              <Icon name="trash" size={13} /> Hapus
            </button>
          ) : (
            <span className="muted text-sm">Bisa diubah kapan saja.</span>
          )}
          <div className="hstack">
            <button type="button" className="btn ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button
              type="submit"
              form="master-form"
              className="btn primary"
              disabled={pending}
            >
              <Icon name="check" size={14} />
              {pending ? "Menyimpan…" : submitLabel}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function useDrawerSubmit(
  action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
) {
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

export function useEntityDelete(
  action: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>,
  onSuccess: () => void,
) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (id: string, label: string) => {
    if (!window.confirm(`Hapus "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    start(async () => {
      const r = await action(id);
      if (r.ok) {
        router.refresh();
        onSuccess();
      } else window.alert(r.error);
    });
  };
  return { pending, run };
}
