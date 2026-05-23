"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Shield className="h-16 w-16 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
        <p className="mb-6 text-lg text-slate-600 dark:text-slate-400">
          You do not have permission to access this page.
        </p>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-500">
          If you believe this is an error, please contact your administrator.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
