"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function LoginView() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;
    const rememberMe = formData.get("rememberMe") === "on";

    if (!identifier || !password) {
      toast.error("Username/Email and password are required");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || "Invalid credentials");
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      
      if (rememberMe) {
        localStorage.setItem("savedIdentifier", identifier);
        localStorage.setItem("savedPassword", password);
      } else {
        localStorage.removeItem("savedIdentifier");
        localStorage.removeItem("savedPassword");
      }

      toast.success("Login successful!");
      
      // Wait a bit for cookie to be set, then redirect
      setTimeout(() => {
        window.location.replace("/");
      }, 100);
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
              defaultValue={typeof window !== "undefined" ? localStorage.getItem("savedIdentifier") || "" : ""}
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
              defaultValue={typeof window !== "undefined" ? localStorage.getItem("savedPassword") || "" : ""}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder=""
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              id="rememberMe"
              defaultChecked={typeof window !== "undefined" ? !!localStorage.getItem("savedIdentifier") : false}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
              Remember username and password
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
