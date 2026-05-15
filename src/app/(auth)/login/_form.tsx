"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { signInAction } from "./_actions";

export function LoginForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  return (
    <form
      className="vstack"
      style={{ gap: 14 }}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await signInAction(fd);
          if (!res.ok) setError(res.error);
        });
      }}
    >
      <div className="field">
        <label>Email</label>
        <div className="input-prefix">
          <span className="p">
            <Icon name="mail" size={13} />
          </span>
          <input
            name="email"
            type="email"
            required
            defaultValue="admin@klinik.id"
            className="input mono"
          />
        </div>
      </div>

      <div className="field">
        <div className="row between">
          <label>Password</label>
          <a
            href="/forgot"
            style={{ fontSize: 11, color: "var(--navy-800)", fontWeight: 500 }}
          >
            Lupa password?
          </a>
        </div>
        <div className="input-prefix" style={{ position: "relative" }}>
          <span className="p">
            <Icon name="lock" size={13} />
          </span>
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            className="input mono"
            style={{ paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Sembunyikan" : "Tampilkan"}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: 0,
              color: "var(--ink-4)",
              padding: 4,
              cursor: "pointer",
            }}
          >
            <Icon name="eye" size={14} />
          </button>
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--ink-2)",
          cursor: "default",
        }}
      >
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          style={{ width: 14, height: 14, accentColor: "var(--navy-800)" }}
        />
        Ingat perangkat ini selama 14 hari
      </label>

      {error && (
        <div
          className="pill dp"
          style={{ padding: "6px 10px", fontSize: 12, alignSelf: "flex-start" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn primary"
        style={{ justifyContent: "center", width: "100%", padding: "11px 14px", marginTop: 4 }}
      >
        <span>{pending ? "Memproses…" : "Masuk"}</span>
        <Icon name="login" size={13} />
      </button>

      <div style={{ position: "relative", margin: "4px 0" }}>
        <div style={{ height: 1, background: "var(--line)" }} />
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "var(--bg-elev)",
            padding: "0 10px",
            fontSize: 11,
            color: "var(--ink-4)",
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          atau
        </span>
      </div>

      <a href="/2fa" className="btn" style={{ justifyContent: "center", width: "100%" }}>
        <Icon name="shield" size={13} /> Verifikasi 2FA
      </a>

      <div style={{ textAlign: "center", fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
        Belum punya akun? Hubungi <b style={{ color: "var(--ink-2)" }}>Superadmin</b> untuk
        diundang.
      </div>
    </form>
  );
}
