"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/http";
import { fmtIDR } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { createBookingAction } from "./_actions";

type Options = {
  services: { id: string; name: string; priceCents: string }[];
  doctors: { id: string; name: string; type: string }[];
};

export function BookingDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { data } = useSWR<Options>(open ? (["options", "list"] as const) : null, fetcher);

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
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createBookingAction(fd);
              if (res.ok) onCreated();
              else setError(res.error);
            });
          }}
        >
          <div className="drawer-b">
            <div className="vstack" style={{ gap: 18 }}>
              <Section eyebrow="01" title="Data Klien">
                <div className="grid-2 even" style={{ gap: 12 }}>
                  <div className="field">
                    <label>Nama klien</label>
                    <input name="clientName" required className="input" />
                  </div>
                  <div className="field">
                    <label>No. telepon</label>
                    <input name="clientPhone" type="tel" className="input mono" />
                  </div>
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
                    <label>Jadwal</label>
                    <input
                      name="scheduledAt"
                      type="datetime-local"
                      required
                      className="input mono"
                    />
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
