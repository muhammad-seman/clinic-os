"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import type {
  ClinicConfig,
  OperatingHoursConfig,
  ThresholdConfig,
} from "@/server/services/system-config";
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
  hours,
  users,
}: {
  clinic: ClinicConfig;
  thresholds: ThresholdConfig;
  hours: OperatingHoursConfig;
  users: UserRow[];
}) {
  const router = useRouter();
  const [c, setC] = useState<ClinicConfig>(clinic);
  const [latStr, setLatStr] = useState<string>(String(clinic.lat ?? ""));
  const [lngStr, setLngStr] = useState<string>(String(clinic.lng ?? ""));
  const [t, setT] = useState<ThresholdConfig>(thresholds);
  const [h, setH] = useState<OperatingHoursConfig>(hours);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Resync local state when server data changes (after save + router.refresh)
  useEffect(() => {
    setC(clinic);
    setLatStr(String(clinic.lat ?? ""));
    setLngStr(String(clinic.lng ?? ""));
  }, [clinic.lat, clinic.lng, clinic.name, clinic.address, clinic.radius]);
  useEffect(() => {
    setT(thresholds);
  }, [thresholds.aprioriSupport, thresholds.aprioriConfidence]);
  useEffect(() => {
    setH(hours);
  }, [hours.openHour, hours.closeHour]);

  const parseCoord = (s: string): number | null => {
    const trimmed = s.trim();
    if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === "-.") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  function save() {
    setMsg(null);
    setError(null);
    const lat = parseCoord(latStr);
    const lng = parseCoord(lngStr);
    if (lat === null) {
      setError("Latitude tidak valid");
      return;
    }
    if (lng === null) {
      setError("Longitude tidak valid");
      return;
    }
    if (lat < -90 || lat > 90) {
      setError("Latitude harus antara -90 dan 90");
      return;
    }
    if (lng < -180 || lng > 180) {
      setError("Longitude harus antara -180 dan 180");
      return;
    }
    if (h.closeHour <= h.openHour) {
      setError("Jam tutup harus lebih besar dari jam buka");
      return;
    }
    start(async () => {
      const r = await saveConfigAction({
        clinic: {
          name: c.name,
          address: c.address,
          lat,
          lng,
          radius: c.radius,
        },
        thresholds: t,
        hours: h,
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
                  type="text"
                  inputMode="decimal"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  placeholder="-3.808385"
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  placeholder="114.786489"
                />
              </div>
            </div>
            <div className="field">
              <label>Radius (meter)</label>
              <input
                className="input mono"
                type="number"
                min={1}
                step={1}
                value={c.radius}
                onChange={(e) => {
                  const v = e.target.value;
                  setC({ ...c, radius: v === "" ? 0 : Math.max(0, Math.trunc(Number(v))) });
                }}
                placeholder="80"
              />
              <div className="muted text-xs">
                Tombol "Hadir" aktif hanya bila karyawan dalam radius ini. Tidak ada batas
                maksimum — isi sesuai kebutuhan (mis. 2000).
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
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-h">
          <div>
            <h3>Jam Operasional Klinik</h3>
            <p>
              Mengontrol slot kalender dan validasi input booking · zona WITA
            </p>
          </div>
          <div className="muted text-sm">
            Aktif: <b className="mono">{String(h.openHour).padStart(2, "0")}:00</b>
            {" – "}
            <b className="mono">{String(h.closeHour).padStart(2, "0")}:00</b>
          </div>
        </div>
        <div className="card-b">
          <div className="grid-2 even" style={{ gap: 14 }}>
            <div className="field">
              <label>Jam Buka</label>
              <select
                className="select mono"
                value={h.openHour}
                onChange={(e) =>
                  setH({ ...h, openHour: Number(e.target.value) })
                }
              >
                {Array.from({ length: 24 }, (_, i) => i).map((i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <div className="muted text-xs">Jam pertama menerima booking.</div>
            </div>
            <div className="field">
              <label>Jam Tutup</label>
              <select
                className="select mono"
                value={h.closeHour}
                onChange={(e) =>
                  setH({ ...h, closeHour: Number(e.target.value) })
                }
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <div className="muted text-xs">
                Booking terakhir harus dimulai sebelum jam ini.
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
