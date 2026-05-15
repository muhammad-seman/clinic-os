import { fmtIDR } from "@/lib/format";

export const fmtDay = new Intl.DateTimeFormat("id-ID", { day: "2-digit" });
export const fmtMon = new Intl.DateTimeFormat("id-ID", { month: "short" });
export const fmtTime = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtIDRk(n: bigint): string {
  const v = Number(n);
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `${sign}Rp ${(a / 1_000_000_000).toFixed(1)}M`;
  if (a >= 1_000_000) return `${sign}Rp ${(a / 1_000_000).toFixed(1)}jt`;
  if (a >= 1_000) return `${sign}Rp ${Math.round(a / 1_000)}rb`;
  return fmtIDR(BigInt(v));
}
