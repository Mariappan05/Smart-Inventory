"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { saveRememberedCredentials, clearRememberedCredentials, getRememberedCredentials } from "@/lib/auth/rememberMe";

export function LoginView() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Load saved credentials first
    const { username, rememberMe } = getRememberedCredentials();
    
    if (username) {
      setIdentifier(username);
      setRememberMe(rememberMe);
    }

    // Check if user already has valid session
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          // User is already logged in, redirect to home
          router.replace("/");
          return;
        }
      } catch (error) {
        console.log("No active session");
      }
    };

    checkSession();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error("Username/Email and password are required");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || "Invalid credentials");
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      
      // Handle Remember Me
      if (rememberMe) {
        saveRememberedCredentials(identifier);
      } else {
        clearRememberedCredentials();
      }

      toast.success("Login successful!");
      
      // Redirect to home
      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_55%,_#cbd5f5)] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/90 p-10 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Smart Machine Inventory</p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">Sign in to manage assets, scans, and alerts.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Username / Email</label>
            <input
              type="text"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="Employee ID or Email"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder=""
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-950 dark:hover:bg-black"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
