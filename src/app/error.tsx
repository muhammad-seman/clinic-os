"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-bg-elev border border-line rounded-lg p-6 shadow-sm">
        <h1 className="font-semibold mb-2">Terjadi kesalahan</h1>
        <p className="text-sm text-ink-3 mb-4">{error.message}</p>
        <button onClick={reset} className="px-3 py-1.5 rounded-md bg-navy-800 text-white text-sm">
          Coba lagi
        </button>
      </div>
    </main>
  );
}
