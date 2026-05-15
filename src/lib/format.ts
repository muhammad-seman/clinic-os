const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function fmtIDR(cents: bigint | number): string {
  const n = typeof cents === "bigint" ? Number(cents) : cents;
  return IDR.format(n);
}

export function fmtDate(d: Date | string, tz = "Asia/Makassar"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(date);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
