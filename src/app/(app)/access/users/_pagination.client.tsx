"use client";

import { PAGE_SIZES } from "./_types";

function buildPageWindow(page: number, totalPages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (v: number | "…") => {
    if (v === "…") {
      if (out[out.length - 1] !== "…") out.push("…");
      return;
    }
    if (!out.includes(v)) out.push(v);
  };
  const win = 1;
  push(1);
  if (page - win > 2) push("…");
  for (let p = Math.max(2, page - win); p <= Math.min(totalPages - 1, page + win); p++) push(p);
  if (page + win < totalPages - 1) push("…");
  if (totalPages > 1) push(totalPages);
  return out;
}

export function Pagination({
  page,
  pageSize,
  total,
  startIdx,
  endIdx,
  totalPages,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  startIdx: number;
  endIdx: number;
  totalPages: number;
  onPage: (n: number) => void;
  onPageSize: (n: number) => void;
}) {
  const pages = buildPageWindow(page, totalPages);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        borderTop: "1px solid var(--line)",
        gap: 12,
        flexWrap: "wrap",
        fontSize: 13,
      }}
    >
      <div className="muted" style={{ fontSize: 12 }}>
        {total === 0
          ? "Tidak ada data"
          : `Menampilkan ${startIdx + 1}–${endIdx} dari ${total}`}
      </div>
      <div className="hstack" style={{ gap: 14, alignItems: "center" }}>
        <label className="hstack muted" style={{ gap: 6, fontSize: 12 }}>
          Baris per halaman
          <select
            className="select sm"
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            style={{ width: 72 }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="hstack" style={{ gap: 4 }}>
          <button
            className="btn ghost sm"
            onClick={() => onPage(1)}
            disabled={page <= 1}
            aria-label="Halaman pertama"
          >
            «
          </button>
          <button
            className="btn ghost sm"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`e${i}`}
                className="muted"
                style={{ padding: "0 6px", fontSize: 12 }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                className={"btn sm " + (p === page ? "primary" : "ghost")}
                onClick={() => onPage(p)}
                style={{ minWidth: 32 }}
              >
                {p}
              </button>
            ),
          )}
          <button
            className="btn ghost sm"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
          <button
            className="btn ghost sm"
            onClick={() => onPage(totalPages)}
            disabled={page >= totalPages}
            aria-label="Halaman terakhir"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
