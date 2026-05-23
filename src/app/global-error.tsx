"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Critical error</p>
          <h1 className="mt-2 text-2xl font-semibold">The application failed to render</h1>
          <p className="mt-3 text-sm text-slate-300">
            A global error boundary caught a fatal issue. Retry after refreshing.
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={reset} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
