"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Safely log error without causing React rendering issues
    try {
      if (error?.message) {
        console.error('Error:', error.message);
      } else if (typeof error === 'string') {
        console.error('Error:', error);
      } else {
        console.error('An error occurred');
      }
    } catch (e) {
      console.error('An error occurred');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-8 shadow-panel dark:border-rose-900 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Application error</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          The app hit an unexpected error. You can retry the operation or refresh the page.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={reset} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Try again
          </button>
          <button onClick={() => window.location.reload()} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
