"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type ClientOption = { id: string; name: string; phone: string };

export type ClientSelection =
  | { mode: "existing"; clientId: string; name: string; phone: string }
  | { mode: "new"; name: string; phone: string };

export function ClientSearchSelect({
  value,
  onChange,
}: {
  value: ClientSelection | null;
  onChange: (v: ClientSelection) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/v1/clients?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (r.ok) {
          const d = (await r.json()) as { items: ClientOption[] };
          setOptions(d.items);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const isNewMode = value?.mode === "new";

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input type="hidden" name="clientId" value={value?.mode === "existing" ? value.clientId : ""} />
      <input type="hidden" name="clientName" value={value?.name ?? ""} />
      <input type="hidden" name="clientPhone" value={value?.phone ?? ""} />

      <div
        className="input"
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingRight: 8,
        }}
        onClick={() => setOpen(true)}
      >
        <Icon name="search" size={14} className="muted" />
        {value ? (
          <span style={{ flex: 1 }}>
            <b>{value.name}</b>
            {value.phone && (
              <>
                {" · "}
                <span className="mono muted text-xs">{value.phone}</span>
              </>
            )}
            {value.mode === "new" && (
              <span className="pill outline" style={{ marginLeft: 8, fontSize: 10 }}>
                BARU
              </span>
            )}
          </span>
        ) : (
          <span className="muted" style={{ flex: 1 }}>
            Cari klien (nama / no. telp) atau klik &quot;Klien Baru&quot;…
          </span>
        )}
        <Icon name="chevronDown" size={12} className="muted" />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            zIndex: 30,
            padding: 8,
          }}
        >
          <div className="search" style={{ marginBottom: 8 }}>
            <Icon name="search" size={13} />
            <input
              autoFocus
              placeholder="Ketik nama atau nomor telepon…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {!isNewMode && (
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {loading && <div className="muted text-sm" style={{ padding: 8 }}>Mencari…</div>}
              {!loading && options.length === 0 && (
                <div className="muted text-sm" style={{ padding: 8 }}>
                  Tidak ada hasil. Tambahkan sebagai klien baru di bawah.
                </div>
              )}
              {options.map((opt) => {
                const displayPhone = opt.phone.startsWith("noPhone-") ? "" : opt.phone;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="row"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 6,
                      gap: 8,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => {
                      onChange({
                        mode: "existing",
                        clientId: opt.id,
                        name: opt.name,
                        phone: displayPhone,
                      });
                      setOpen(false);
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{opt.name}</div>
                      <div className="mono text-xs muted">{displayPhone || "—"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="divider" style={{ margin: "8px 0" }} />
          <div className="vstack" style={{ gap: 6 }}>
            <div className="muted text-xs">Klien Baru</div>
            <div className="grid-2 even" style={{ gap: 8 }}>
              <input
                className="input"
                placeholder="Nama klien baru"
                value={isNewMode ? value!.name : query}
                onChange={(e) => {
                  const name = e.target.value;
                  onChange({ mode: "new", name, phone: newPhone });
                }}
              />
              <input
                className="input mono"
                placeholder="No. telp baru"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value);
                  if (isNewMode) onChange({ mode: "new", name: value!.name, phone: e.target.value });
                }}
              />
            </div>
            <button
              type="button"
              className="btn sm primary"
              disabled={!value || value.mode !== "new" || !value.name.trim()}
              onClick={() => setOpen(false)}
            >
              <Icon name="check" size={12} /> Pakai klien baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
