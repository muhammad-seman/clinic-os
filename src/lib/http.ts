export type SwrKey = readonly [resource: string, op: string, params?: unknown];

export async function fetcher<T>(key: SwrKey): Promise<T> {
  const [resource, op, params] = key;
  const qs = params ? `?${new URLSearchParams(flatten(params)).toString()}` : "";
  const url = `/api/v1/${resource}${op === "list" ? "" : `/${op}`}${qs}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function flatten(o: unknown): Record<string, string> {
  if (!o || typeof o !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}
