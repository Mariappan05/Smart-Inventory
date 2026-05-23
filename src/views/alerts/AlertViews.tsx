"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { AlertTriangle, BellRing, Clock3, Flame, ShieldAlert, Volume2, X } from "lucide-react";
import toast from "react-hot-toast";

type AlertRow = {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  description?: string | null;
  createdAt: string;
  machine?: { name: string; assetTag: string };
};

const severityTheme: Record<AlertRow["severity"], string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-rose-200 bg-rose-50 text-rose-800",
};

export function AlertViews() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [history, setHistory] = useState<AlertRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [popup, setPopup] = useState<AlertRow | null>(null);
  const [socketUrl, setSocketUrl] = useState("");

  useEffect(() => {
    setSocketUrl(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin);
  }, []);

  useEffect(() => {
    let socket: Socket | null = null;
    let audioContext: AudioContext | null = null;

    const fetchAlerts = async () => {
      const response = await fetch("/api/alerts/open");
      const data = await response.json();
      setAlerts(data.data || []);

      const recent = await fetch("/api/alerts/recent");
      const recentData = await recent.json();
      setHistory(recentData.data || []);
    };

    const init = async () => {
      if (!socketUrl) {
        return;
      }

      await fetchAlerts();

      socket = io(socketUrl, {
        path: "/api/socketio",
        transports: ["websocket"],
      });

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("notification", (event) => {
        if (event?.type === "alert.created") {
          const alert = event.payload as AlertRow;
          setAlerts((prev) => [alert, ...prev].slice(0, 8));
          setHistory((prev) => [alert, ...prev].slice(0, 20));
          setPopup(alert);
          toast.error(alert.title, { duration: 6000 });
          if (soundEnabled) {
            audioContext = audioContext ?? new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 880;
            gain.gain.value = 0.05;
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start();
            window.setTimeout(() => oscillator.stop(), 180);
          }
        }
        if (event?.type === "alert.acknowledged" || event?.type === "alert.resolved") {
          fetchAlerts();
        }
      });
    };

    init();

    return () => {
      socket?.disconnect();
    };
  }, [socketUrl, soundEnabled]);

  const dismissPopup = () => setPopup(null);

  const acknowledge = async (id: string) => {
    await fetch(`/api/alerts/${id}/acknowledge`, { method: "PATCH" });
    setAlerts((prev) => prev.map((item) => (item.id === id ? { ...item, status: "ACKNOWLEDGED" } : item)));
  };

  const resolve = async (id: string) => {
    await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" });
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Security Center</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Realtime Alert Monitor</h2>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <BellRing className="h-4 w-4" />
                {connected ? "Connected" : "Disconnected"}
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-50"
              >
                <Volume2 className="h-4 w-4" />
                {soundEnabled ? "Sound On" : "Sound Off"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              <p className="text-xs uppercase tracking-[0.2em]">Critical</p>
              <p className="mt-1 text-2xl font-semibold">{alerts.filter((alert) => alert.severity === "HIGH").length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <p className="text-xs uppercase tracking-[0.2em]">Open Alerts</p>
              <p className="mt-1 text-2xl font-semibold">{alerts.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <p className="text-xs uppercase tracking-[0.2em]">History</p>
              <p className="mt-1 text-2xl font-semibold">{history.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Open Alerts</h3>
          </div>
          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No active alerts.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`rounded-2xl border px-4 py-3 ${severityTheme[alert.severity]}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{alert.title}</p>
                      <p className="mt-1 text-xs">{alert.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em]">{alert.machine?.name || "Unknown machine"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => acknowledge(alert.id)}
                        className="rounded-full border border-current px-3 py-1 text-xs font-medium"
                      >
                        Ack
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(alert.id)}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Alert History</h3>
          </div>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No alert history yet.
              </div>
            ) : (
              history.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{alert.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{alert.status}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${severityTheme[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Emergency Alert</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{popup.title}</h3>
              </div>
              <button type="button" onClick={dismissPopup} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{popup.description}</p>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-rose-800">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">Immediate operator attention required</span>
              </div>
              <button
                type="button"
                onClick={dismissPopup}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
