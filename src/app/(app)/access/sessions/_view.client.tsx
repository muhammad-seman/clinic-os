"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  KpiSmall,
  RolePill,
  ToggleRow,
  fmtDateTime,
  relTime,
} from "../_shared";
import { revokeAllSessionsAction, revokeSessionAction } from "./_actions";

type SessionRow = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  device: string;
  ip: string | null;
  city: string | null;
  geoFlag: string | null;
  startedAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export function SessionsView({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "suspicious" | "policy">("active");
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const [policy, setPolicy] = useState({
    minPwLen: 10,
    requireSymbols: true,
    requireNumbers: true,
    require2faAdmin: true,
    require2faAll: false,
    sessionTtlHours: 12,
    lockoutAfter: 5,
    lockoutMinutes: 30,
    ipAllowlistOn: false,
    auditExportOnly: true,
  });
  const [policyDirty, setPolicyDirty] = useState(false);
  const setP = <K extends keyof typeof policy>(k: K, v: (typeof policy)[K]) => {
    setPolicy((p) => ({ ...p, [k]: v }));
    setPolicyDirty(true);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const active = sessions.filter((s) => s.geoFlag !== "suspicious");
  const suspicious = sessions.filter((s) => s.geoFlag === "suspicious");

  const revoke = (id: string) => {
    start(async () => {
      const res = await revokeSessionAction(id);
      if (res.ok) {
        setToast("Sesi dicabut");
        router.refresh();
      } else setToast(res.error);
    });
  };

  const revokeAll = () => {
    start(async () => {
      const res = await revokeAllSessionsAction();
      if (res.ok) {
        setToast("Semua sesi dicabut");
        router.refresh();
      } else setToast(res.error);
    });
  };

  const list = tab === "active" ? active : tab === "suspicious" ? suspicious : [];

  return (
    <div className="content wide">
      <div className="page-h">
        <div>
          <h2>Sesi &amp; Keamanan</h2>
          <p>Sesi aktif & kebijakan otentikasi · NextAuth + middleware</p>
        </div>
        <div className="hstack">
          <button
            type="button"
            className="btn danger"
            onClick={revokeAll}
            disabled={pending || sessions.length === 0}
          >
            <Icon name="logout" size={13} /> Cabut Semua Sesi
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiSmall
          icon="key"
          label="Sesi Aktif"
          value={active.length}
          hint={`${new Set(active.map((s) => s.userId)).size} pengguna`}
        />
        <KpiSmall
          icon="alert"
          label="Sesi Mencurigakan"
          value={suspicious.length}
          hint={suspicious.length > 0 ? "IP / lokasi tidak biasa" : "Tidak ada"}
          tone="rose"
        />
        <KpiSmall
          icon="shield"
          label="2FA Wajib"
          value={policy.require2faAll ? "Semua" : "Admin+"}
          hint={
            policy.require2faAll
              ? "Untuk semua pengguna"
              : "Superadmin, Owner, Admin"
          }
          tone="gold"
        />
        <KpiSmall
          icon="clock"
          label="Session TTL"
          value={policy.sessionTtlHours + "j"}
          hint="Idle timeout otomatis"
          tone="navy"
        />
      </div>

      <div className="tabs">
        <button
          type="button"
          aria-selected={tab === "active"}
          onClick={() => setTab("active")}
        >
          Sesi Aktif<span className="count">{active.length}</span>
        </button>
        <button
          type="button"
          aria-selected={tab === "suspicious"}
          onClick={() => setTab("suspicious")}
        >
          Mencurigakan
          {suspicious.length > 0 && <span className="count">{suspicious.length}</span>}
        </button>
        <button
          type="button"
          aria-selected={tab === "policy"}
          onClick={() => setTab("policy")}
        >
          Kebijakan Keamanan
        </button>
      </div>

      {(tab === "active" || tab === "suspicious") && (
        <div className="card">
          <div className="card-h">
            <div>
              <h3>{tab === "active" ? "Sesi Aktif" : "Sesi Mencurigakan"}</h3>
              <p>
                {tab === "active"
                  ? "Sesi yang sedang berjalan, urut terbaru"
                  : "Perlu peninjauan — lokasi/IP di luar pola normal"}
              </p>
            </div>
          </div>
          <div className="card-b flush">
            {list.length === 0 ? (
              <div className="empty">
                <b>Tidak ada sesi</b>
                {tab === "suspicious"
                  ? "Tidak ada anomali terdeteksi."
                  : "Pengguna belum login."}
              </div>
            ) : (
              list.map((s) => {
                const sus = s.geoFlag === "suspicious";
                const mobile =
                  s.device.toLowerCase().includes("android") ||
                  s.device.toLowerCase().includes("iphone") ||
                  s.device.toLowerCase().includes("ipad");
                return (
                  <div
                    key={s.id}
                    className="row"
                    style={{
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--line)",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9,
                        background: sus ? "var(--rose-soft)" : "var(--bg-sunken)",
                        color: sus ? "var(--rose)" : "var(--navy-800)",
                        display: "grid",
                        placeItems: "center",
                        flex: "none",
                        border: sus ? "1px solid #dabac0" : "1px solid var(--line)",
                      }}
                    >
                      <Icon name={mobile ? "smartphone" : "monitor"} size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <b>{s.userName}</b>
                        <RolePill role={s.userRole} />
                        {sus && (
                          <span className="pill dp">
                            <Icon name="alert" size={10} /> Anomali
                          </span>
                        )}
                        {s.geoFlag === "clinic" && (
                          <span className="pill outline">
                            <Icon name="pin" size={10} /> Di klinik
                          </span>
                        )}
                      </div>
                      <div className="muted text-xs" style={{ marginTop: 3 }}>
                        {s.device}
                        {s.ip && (
                          <>
                            {" "}· <span className="mono">{s.ip}</span>
                          </>
                        )}
                        {s.city && <> · {s.city}</>}
                      </div>
                      <div
                        className="muted-2 text-xs mono"
                        style={{ marginTop: 2 }}
                      >
                        Mulai {fmtDateTime(s.startedAt)} · aktif {relTime(s.lastSeenAt)}
                      </div>
                    </div>
                    <div className="hstack">
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => revoke(s.id)}
                        disabled={pending}
                      >
                        <Icon name="logout" size={12} /> Cabut
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === "policy" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Kebijakan Password</h3>
                <p>Berlaku untuk semua pengguna baru & rotasi</p>
              </div>
            </div>
            <div className="card-b vstack" style={{ gap: 14 }}>
              <div className="field">
                <label>Panjang Minimum · {policy.minPwLen} karakter</label>
                <input
                  type="range"
                  min={6}
                  max={24}
                  value={policy.minPwLen}
                  onChange={(e) => setP("minPwLen", Number(e.target.value))}
                  style={{ accentColor: "var(--navy-800)" }}
                />
                <div className="muted text-xs">
                  Rekomendasi NIST: ≥ 8 karakter dengan validasi anti-common-password.
                </div>
              </div>
              <ToggleRow
                label="Wajib mengandung simbol"
                hint="!@#$%^&* dst."
                value={policy.requireSymbols}
                onChange={(v) => setP("requireSymbols", v)}
              />
              <ToggleRow
                label="Wajib mengandung angka"
                hint="Minimal 1 digit numerik"
                value={policy.requireNumbers}
                onChange={(v) => setP("requireNumbers", v)}
              />
              <div className="field">
                <label>
                  Kunci akun setelah · {policy.lockoutAfter}× gagal login
                </label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={policy.lockoutAfter}
                  onChange={(e) => setP("lockoutAfter", Number(e.target.value))}
                  style={{ accentColor: "var(--rose)" }}
                />
                <div className="muted text-xs">
                  Lalu kunci selama {policy.lockoutMinutes} menit. Admin bisa membuka manual.
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Otentikasi Multi-Faktor</h3>
                <p>TOTP via Google Authenticator / Authy</p>
              </div>
            </div>
            <div className="card-b vstack" style={{ gap: 14 }}>
              <ToggleRow
                label="Wajibkan 2FA untuk Superadmin & Admin"
                hint="Peran dengan akses sensitif harus mendaftar TOTP."
                value={policy.require2faAdmin}
                onChange={(v) => setP("require2faAdmin", v)}
              />
              <ToggleRow
                label="Wajibkan 2FA untuk semua pengguna"
                hint="Termasuk karyawan. Login tanpa 2FA akan diblokir."
                value={policy.require2faAll}
                onChange={(v) => setP("require2faAll", v)}
              />
              <div className="divider" />
              <div className="field">
                <label>Session Timeout · {policy.sessionTtlHours} jam idle</label>
                <input
                  type="range"
                  min={1}
                  max={48}
                  value={policy.sessionTtlHours}
                  onChange={(e) => setP("sessionTtlHours", Number(e.target.value))}
                  style={{ accentColor: "var(--gold)" }}
                />
                <div className="muted text-xs">
                  Sesi yang tidak aktif lebih lama akan diakhiri otomatis.
                </div>
              </div>
              <ToggleRow
                label="IP allowlist (akses dari IP klinik saja)"
                hint="Untuk peran admin operasional. Owner & Superadmin tidak dibatasi."
                value={policy.ipAllowlistOn}
                onChange={(v) => setP("ipAllowlistOn", v)}
              />
              <ToggleRow
                label="Hanya Superadmin & Owner yang bisa ekspor"
                hint="Audit log, laporan keuangan, data pelanggan."
                value={policy.auditExportOnly}
                onChange={(v) => setP("auditExportOnly", v)}
              />
            </div>
            <div
              className="drawer-f"
              style={{ borderTop: "1px solid var(--line)", justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="btn primary"
                disabled={!policyDirty}
                onClick={() => {
                  setPolicyDirty(false);
                  setToast("Kebijakan keamanan diperbarui");
                }}
              >
                <Icon name="check" size={13} /> Simpan Kebijakan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "var(--navy-800)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
