"use client";

import { Bell, Bolt, LogOut, Search, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Topbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session?details=true")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setUserName(d.name ?? null);
          setUserRole(d.role ?? null);
          setUserImage(d.imageUrl ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const handleNotifications = () => {
    toast("No new notifications", { icon: "🔔" });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/machines?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSync = () => {
    toast.success("Sync triggered");
  };

  const handleLogout = async () => {
    try {
      // Keep remembered username when logging out
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearRememberedUsername: false })
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }

      toast.success("Logged out");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out");
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 px-5 py-4 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-md transition-all duration-300 hover:scale-110 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
          {userImage ? (
            <img src={userImage} alt={userName || "User"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Live Operations
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Industrial Command</h2>
          {userName && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{userName}</span>
              {userRole && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {userRole}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 items-center gap-3 sm:max-w-md">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm text-slate-600 shadow-sm transition hover:bg-white focus-within:border-slate-900 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:bg-slate-950/80 dark:focus-within:border-slate-200 dark:focus-within:bg-slate-950">
          <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <input
            type="search"
            placeholder="Search assets, stores, scans"
            className="h-full w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <ThemeToggle />
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          type="button"
          onClick={handleNotifications}
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          className="hidden items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:flex"
          type="button"
          onClick={handleSync}
        >
          <Bolt className="h-4 w-4" />
          Sync
        </button>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 sm:hidden"
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
        <button
          className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white sm:flex dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
