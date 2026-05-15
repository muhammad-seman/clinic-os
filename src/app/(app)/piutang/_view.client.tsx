"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { settleRemainingAction } from "./_actions";

export function PiutangActions({ id, remaining }: { id: string; remaining: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="hstack" style={{ gap: 6 }}>
      <button
        type="button"
        className="btn sm primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await settleRemainingAction(id, remaining);
            if (r.ok) router.refresh();
          })
        }
      >
        <Icon name="check" size={12} /> Lunasi
      </button>
    </div>
  );
}
