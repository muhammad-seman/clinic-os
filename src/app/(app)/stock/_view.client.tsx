"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { adjustStockAction } from "./_actions";

export function StockAdjustButton({ id, delta, label }: { id: string; delta: number; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await adjustStockAction({ id, delta });
            if (!r.ok) setErr(r.error);
            else router.refresh();
          })
        }
        title={delta > 0 ? `Tambah ${delta}` : `Kurangi ${-delta}`}
      >
        {label}
      </button>
      {err && (
        <span className="text-xs" style={{ color: "var(--rose)", marginLeft: 6 }}>
          <Icon name="alert" size={10} /> {err}
        </span>
      )}
    </>
  );
}
