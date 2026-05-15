export default function TwoFactorPage() {
  return (
    <>
      <h1 className="text-lg font-semibold mb-1">Verifikasi 2FA</h1>
      <p className="text-sm text-ink-3 mb-6">Masukkan kode 6 digit dari authenticator Anda.</p>
      <form className="space-y-4">
        <input
          name="code"
          inputMode="numeric"
          maxLength={6}
          className="w-full px-3 py-2 border border-line rounded-md bg-bg text-center text-lg tracking-widest font-mono"
        />
        <button className="w-full py-2 rounded-md bg-navy-800 text-white font-medium">Verifikasi</button>
      </form>
    </>
  );
}
