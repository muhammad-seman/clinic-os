export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        background: "var(--bg-elev)",
        fontFamily: "var(--font-sans)",
        color: "var(--ink)",
        fontSize: 13,
      }}
    >
      <BrandPanel />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "32px 48px",
          position: "relative",
          minWidth: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 32,
            fontSize: 11.5,
            color: "var(--ink-3)",
          }}
        >
          Butuh bantuan?{" "}
          <span style={{ color: "var(--navy-800)", fontWeight: 500 }}>Hubungi admin</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 360 }}>{children}</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--ink-4)",
            marginTop: 16,
          }}
        >
          <span>© 2026 NS Aesthetic</span>
          <span>Ketentuan · Privasi</span>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      style={{
        background: "linear-gradient(155deg,#0b1d3d 0%,#142a52 55%,#1f3a6b 100%)",
        color: "#cfd4e0",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(184,149,106,.22),transparent 70%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(184,149,106,.10),transparent 70%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "linear-gradient(135deg,#b8956a 0%,#d6b889 100%)",
            display: "grid",
            placeItems: "center",
            color: "#070f25",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "-.02em",
          }}
        >
          NS
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 15, letterSpacing: "-.01em" }}>
            NS Aesthetic
          </div>
          <div
            style={{
              color: "#8d97ad",
              fontSize: 10.5,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Clinic OS
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", position: "relative" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#b8956a",
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Cab. Makassar
        </div>
        <h2
          style={{
            margin: 0,
            color: "#fff",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-.01em",
            lineHeight: 1.25,
          }}
        >
          Sistem terpadu untuk klinik kecantikan modern
        </h2>
        <p
          style={{
            color: "#8d97ad",
            fontSize: 12,
            marginTop: 14,
            lineHeight: 1.6,
            maxWidth: 240,
          }}
        >
          Booking, kalender, inventaris, kas piutang, fee, absensi, dan analitik — satu OS untuk
          seluruh tim.
        </p>

        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,.07)",
            display: "flex",
            gap: 18,
          }}
        >
          <Stat n="6" l="Cabang" />
          <Stat n="47" l="Karyawan" />
          <Stat n="12k" l="Booking/thn" />
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div style={{ color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16 }}>
        {n}
      </div>
      <div
        style={{
          color: "#6c7693",
          fontSize: 10,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {l}
      </div>
    </div>
  );
}
