import { LoginForm } from "./_form";

export default function LoginPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--gold)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Clinic OS
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-.015em",
            color: "var(--ink)",
          }}
        >
          Masuk ke Clinic OS
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
          Gunakan email klinik Anda untuk melanjutkan.
        </p>
      </div>
      <LoginForm />
    </>
  );
}
