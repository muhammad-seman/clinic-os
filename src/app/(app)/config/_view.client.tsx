"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import type { ClinicConfig, ThresholdConfig } from "@/server/services/system-config";
import type { UserRow } from "@/server/repositories/access.repo";
import { saveConfigAction } from "./_actions";

const fmtRelative = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Makassar",
});

export function ConfigView({
  clinic,
  thresholds,
  users,
}: {
  clinic: ClinicConfig;
  thresholds: ThresholdConfig;
  users: UserRow[];
}) {
  const router = useRouter();
  const [c, setC] = useState<ClinicConfig>(clinic);
  const [t, setT] = useState<ThresholdConfig>(thresholds);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    setError(null);
    start(async () => {
      const r = await saveConfigAction({
        clinic: {
          name: c.name,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          radius: c.radius,
        },
        thresholds: t,
      });
      if (!r.ok) setError(r.error);
      else {
        setMsg("Konfigurasi disimpan");
        router.refresh();
      }
    });
  }

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Konfigurasi Sistem</h2>
          <p>Pengaturan global · hanya bisa diubah oleh Superadmin</p>
        </div>
        <button
          type="button"
          className="btn primary"
          disabled={pending}
          onClick={save}
        >
          <Icon name="check" size={13} /> {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>

      {msg && (
        <div className="card" style={{ borderColor: "var(--sage)", marginBottom: 12 }}>
          <div className="card-b" style={{ color: "var(--sage)", fontSize: 13 }}>
            <Icon name="check" size={12} /> {msg}
          </div>
        </div>
      )}
      {error && (
        <div className="card" style={{ borderColor: "var(--rose)", marginBottom: 12 }}>
          <div className="card-b" style={{ color: "var(--rose)", fontSize: 13 }}>
            <Icon name="alert" size={12} /> {error}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Titik Klinik &amp; Radius GPS</h3>
              <p>Validator untuk fitur absensi</p>
            </div>
          </div>
          <div className="card-b vstack" style={{ gap: 14 }}>
            <div className="field">
              <label>Nama Cabang</label>
              <input
                className="input"
                value={c.name}
                onChange={(e) => setC({ ...c, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Alamat</label>
              <input
                className="input"
                value={c.address}
                onChange={(e) => setC({ ...c, address: e.target.value })}
              />
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="field">
                <label>Latitude</label>
                <input
                  className="input mono"
                  value={c.lat}
                  onChange={(e) =>
                    setC({ ...c, lat: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  className="input mono"
                  value={c.lng}
                  onChange={(e) =>
                    setC({ ...c, lng: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Radius (meter) · {c.radius} m</label>
              <input
                type="range"
                min={20}
                max={300}
                step={10}
                value={c.radius}
                onChange={(e) => setC({ ...c, radius: Number(e.target.value) })}
                style={{ accentColor: "var(--navy-800)" }}
              />
              <div className="muted text-xs">
                Tombol "Hadir" aktif hanya bila karyawan dalam radius ini.
              </div>
            </div>
            <div className="field">
              <label>Zona Waktu</label>
              <input className="input" value={c.timezone} readOnly />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Threshold Apriori</h3>
              <p>Parameter algoritma market basket</p>
            </div>
          </div>
          <div className="card-b vstack" style={{ gap: 14 }}>
            <div className="field">
              <label>
                Min Support · {Math.round(t.aprioriSupport * 100)}%
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={Math.round(t.aprioriSupport * 100)}
                onChange={(e) =>
                  setT({ ...t, aprioriSupport: Number(e.target.value) / 100 })
                }
                style={{ accentColor: "var(--navy-800)" }}
              />
              <div className="muted text-xs">
                Minimum frekuensi pasangan jasa untuk dipertimbangkan.
              </div>
            </div>
            <div className="field">
              <label>
                Min Confidence · {Math.round(t.aprioriConfidence * 100)}%
              </label>
              <input
                type="range"
                min={30}
                max={100}
                value={Math.round(t.aprioriConfidence * 100)}
                onChange={(e) =>
                  setT({ ...t, aprioriConfidence: Number(e.target.value) / 100 })
                }
                style={{ accentColor: "var(--gold)" }}
              />
              <div className="muted text-xs">
                Probabilitas minimum agar pola dimunculkan.
              </div>
            </div>
            <div className="divider" />
            <div className="field">
              <label>
                Faktor Ambang Stok · ×{t.lowStockMultiplier.toFixed(2)}
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={t.lowStockMultiplier}
                onChange={(e) =>
                  setT({ ...t, lowStockMultiplier: Number(e.target.value) })
                }
                style={{ accentColor: "var(--gold)" }}
              />
              <div className="muted text-xs">
                Pengali ambang batas global untuk alert stok minim.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Manajemen Akun</h3>
            <p>{users.length} akun · CRUD penuh tersedia di Akses &amp; Keamanan</p>
          </div>
        </div>
        <div className="card-b flush">
          <table className="t">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    <b>Belum ada akun</b>Buat akun pertama di /access/users.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="hstack" style={{ gap: 10 }}>
                      <div
                        className="avatar"
                        style={{
                          width: 30,
                          height: 30,
                          fontSize: 10,
                          background: "var(--navy-600)",
                        }}
                      >
                        {initials(u.name)}
                      </div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </td>
                  <td className="mono muted text-xs">{u.email}</td>
                  <td>
                    <span className="pill">{u.roleSlug}</span>
                  </td>
                  <td>
                    {u.status === "active" ? (
                      <span className="pill sage">
                        <span className="d" /> Aktif
                      </span>
                    ) : (
                      <span className="pill">
                        <span className="d" /> {u.status}
                      </span>
                    )}
                  </td>
                  <td className="muted text-xs">
                    {u.lastLoginAt
                      ? fmtRelative.format(new Date(u.lastLoginAt))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
