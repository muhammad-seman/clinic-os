"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS: { id: "day" | "week" | "month" | "year"; label: string }[] = [
  { id: "day", label: "Hari" },
  { id: "week", label: "Minggu" },
  { id: "month", label: "Bulan" },
  { id: "year", label: "Tahun" },
];

export function PeriodSwitch({ period }: { period: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <div className="role-switch" style={{ borderRadius: 8 }}>
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={period === p.id}
          onClick={() => {
            const params = new URLSearchParams(sp.toString());
            params.set("p", p.id);
            router.push("/dashboard?" + params.toString());
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
