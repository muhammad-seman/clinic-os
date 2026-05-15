export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-bg-elev border border-line rounded-lg p-6 shadow-sm text-center">
        <h1 className="font-semibold mb-2">Halaman tidak ditemukan</h1>
        <a href="/dashboard" className="text-sm text-navy-700 underline">
          Kembali ke dashboard
        </a>
      </div>
    </main>
  );
}
