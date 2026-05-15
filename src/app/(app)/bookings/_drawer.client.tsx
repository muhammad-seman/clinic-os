"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/http";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import {
  ClientSearchSelect,
  type ClientSelection,
} from "@/components/feature/client-search.client";
import { createBookingAction } from "./_actions";

type Options = {
  services: { id: string; name: string; priceCents: string }[];
  doctors: { id: string; name: string; type: string }[];
};

export function BookingDrawer({
  open,
  onClose,
  onCreated,
  hours,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  hours: { openHour: number; closeHour: number };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientSelection | null>(null);
  const { data } = useSWR<Options>(open ? (["options", "list"] as const) : null, fetcher);

  // Tanggal & jam dipisah supaya pilihan jam bisa dibatasi sesuai jam operasional.
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [date, setDate] = useState(defaultDate);
  const defaultHour = String(hours.openHour).padStart(2, "0");
  const [time, setTime] = useState(`${defaultHour}:00`);

  // Generate slot jam tiap 15 menit dari openHour..closeHour-1.
  const timeSlots = (() => {
    const out: string[] = [];
    for (let h = hours.openHour; h < hours.closeHour; h++) {
      for (const m of [0, 15, 30, 45]) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  })();

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer fade">
        <div className="drawer-h">
          <div style={{ flex: 1 }}>
            <h3>Booking Baru</h3>
            <p>Tahap 1 — pemesanan klien</p>
          </div>
          <button className="btn ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <form
          id="create-booking-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!client || !client.name.trim()) {
              setError("Pilih klien atau isi data klien baru");
              return;
            }
            if (!date || !time) {
              setError("Pilih tanggal dan jam");
              return;
            }
            const h = parseInt(time.slice(0, 2), 10);
            if (!Number.isFinite(h) || h < hours.openHour || h >= hours.closeHour) {
              setError(
                `Pilih jam antara ${String(hours.openHour).padStart(2, "0")}:00 – ${String(hours.closeHour).padStart(2, "0")}:00 WITA`,
              );
              return;
            }
            const fd = new FormData(e.currentTarget);
            // Gabungkan ke format datetime-local agar createBookingSchema bisa parse.
            fd.set("scheduledAt", `${date}T${time}`);
            start(async () => {
              const res = await createBookingAction(fd);
              if (res.ok) {
                setClient(null);
                setDate(defaultDate);
                setTime(`${defaultHour}:00`);
                onCreated();
              } else setError(res.error);
            });
          }}
        >
          <div className="drawer-b">
            <div className="vstack" style={{ gap: 18 }}>
              <Section eyebrow="01" title="Data Klien">
                <div className="field">
                  <label>Klien (cari atau buat baru)</label>
                  <ClientSearchSelect value={client} onChange={setClient} />
                </div>
              </Section>

              <Section eyebrow="02" title="Layanan">
                <div className="vstack" style={{ gap: 12 }}>
                  <div className="field">
                    <label>Pilih layanan</label>
                    <select name="serviceId" className="select">
                      <option value="">— Pilih layanan —</option>
                      {data?.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {fmtIDR(BigInt(s.priceCents))}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Dokter / Terapis penanggung jawab</label>
                    <select name="doctorId" className="select">
                      <option value="">— Pilih —</option>
                      {data?.doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>

              <Section eyebrow="03" title="Jadwal & Catatan">
                <div className="vstack" style={{ gap: 12 }}>
                  <div className="field">
                    <label>
                      Jadwal ·{" "}
                      <span className="muted text-xs">
                        jam buka {String(hours.openHour).padStart(2, "0")}:00 –{" "}
                        {String(hours.closeHour).padStart(2, "0")}:00 WITA
                      </span>
                    </label>
                    <div className="grid-2 even" style={{ gap: 10 }}>
                      <input
                        type="date"
                        required
                        className="input mono"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                      <select
                        required
                        className="select mono"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      >
                        {timeSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Catatan internal</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="input"
                      placeholder="Misal: klien meminta jadwal pagi"
                    />
                  </div>
                </div>
              </Section>

              {error && (
                <div
                  className="pill dp"
                  style={{ padding: "6px 10px", fontSize: 12, alignSelf: "flex-start" }}
                >
                  {error}
                </div>
              )}
            </div>
          </div>
        </form>
        <div className="drawer-f">
          <p className="muted text-sm">Pembayaran ditambahkan setelah booking dibuat.</p>
          <div className="hstack">
            <button type="button" className="btn ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button
              type="submit"
              form="create-booking-form"
              className="btn primary"
              disabled={pending}
            >
              <Icon name="check" size={14} />
              {pending ? "Menyimpan…" : "Simpan Booking"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="card-b">{children}</div>
    </div>
  );
}
