export default function ForgotPage() {
  return (
    <>
      <h1 className="text-lg font-semibold mb-1">Lupa kata sandi</h1>
      <p className="text-sm text-ink-3 mb-6">Kami akan mengirim tautan reset ke email Anda.</p>
      <form className="space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="email@klinik.id"
          className="w-full px-3 py-2 border border-line rounded-md bg-bg"
        />
        <button className="w-full py-2 rounded-md bg-navy-800 text-white font-medium">Kirim tautan</button>
      </form>
    </>
  );
}
