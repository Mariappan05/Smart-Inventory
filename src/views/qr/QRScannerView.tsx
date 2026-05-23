"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, AlertCircle, Loader2, ScanLine, Smartphone } from "lucide-react";
import { fmtDateTime } from "@/utils/dateFormat";

export type QRScanResult = {
  valid: boolean;
  message: string;
  product?: {
    id: string;
    serial: string;
    item?: { name: string };
    type?: { name: string };
    supplier?: { name: string };
    plant?: { name: string };
    status: string;
    price?: number;
    images?: { url: string; isPrimary: boolean }[];
  };
};

type ScanLog = {
  id: string;
  scannedAt: string;
  payload: string;
  product?: { 
    id: string;
    serial: string;
    item?: { name: string };
    images?: { url: string; isPrimary: boolean }[];
  };
  source: string;
};

export function QRScannerView() {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("Point the camera at a QR code to validate it in real time.");
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [manualValue, setManualValue] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    let scannerInstance: any = null;
    let mounted = true;

    const loadScanner = async () => {
      if (!scannerRef.current) {
        return;
      }

      try {
        // Check camera permissions first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (permError) {
            setStatus("error");
            setMessage("Camera permission denied. Please allow camera access in your browser settings.");
            return;
          }
        } else {
          setStatus("error");
          setMessage("Camera not supported on this device or browser.");
          return;
        }

        const { Html5QrcodeScanner } = await import("html5-qrcode");

        if (!mounted || !scannerRef.current) {
          return;
        }

        scannerInstance = new Html5QrcodeScanner(
          scannerRef.current.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            videoConstraints: {
              facingMode: "environment"
            }
          },
          false
        );

        scannerInstance.render(onScanSuccess, onScanFailure);
        setStatus("ready");
        fetchRecentLogs();
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Camera scanner failed to initialize.");
      }
    };

    const onScanSuccess = async (decodedText: string) => {
      setStatus("scanning");
      setMessage("QR code detected. Validating...");

      try {
        const validateResponse = await fetch("/api/qr/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: decodedText }),
        });

        const validateData = await validateResponse.json();
        setResult(validateData);

        if (validateData.valid) {
          await fetch("/api/qr/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: decodedText, source: "MOBILE" }),
          });

          setStatus("success");
          setMessage(validateData.message || "QR validated successfully.");
          await fetchRecentLogs();
        } else {
          setStatus("error");
          setMessage(validateData.message || "QR validation failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to validate QR code.");
      }
    };

    const onScanFailure = () => {
      // Ignore noisy camera errors while scanning.
    };

    const fetchRecentLogs = async () => {
      setLoadingLogs(true);
      try {
        const response = await fetch("/api/qr/logs?page=1&pageSize=5");
        const data = await response.json();
        const paged = data?.data?.data ?? data?.data ?? [];
        setLogs(Array.isArray(paged) ? paged : []);
      } catch {
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    loadScanner();

    return () => {
      mounted = false;
      scannerInstance?.clear().catch(() => undefined);
    };
  }, []);

  const validateManual = async () => {
    if (!manualValue.trim()) {
      setMessage("Enter a QR payload to validate.");
      setStatus("error");
      return;
    }

    setStatus("scanning");
    setMessage("Validating manual payload...");

    try {
      const validateResponse = await fetch("/api/qr/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: manualValue }),
      });

      const validateData = await validateResponse.json();
      setResult(validateData);

      if (validateData.valid) {
        await fetch("/api/qr/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: manualValue, source: "WEB" }),
        });
        setStatus("success");
        setMessage(validateData.message || "QR validated successfully.");
      } else {
        setStatus("error");
        setMessage(validateData.message || "QR validation failed.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to validate QR code.");
    }
  };

  const statusTone =
    status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : status === "scanning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 lg:p-6 shadow-panel">
        <div className="mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 sm:h-11 w-9 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-900 text-white flex-shrink-0">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500">
              Camera Scanner
            </p>
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 truncate">Mobile QR Validation</h2>
          </div>
        </div>

        <div className={`mb-3 sm:mb-5 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ${statusTone}`}>
          <div className="flex items-center gap-2 font-medium">
            {status === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            ) : status === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            ) : (
              <ScanLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            )}
            <span className="truncate">{message}</span>
          </div>
        </div>

        {/* Product Details Card */}
        {result?.product && (
          <div className="mb-3 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 sm:px-5 py-2.5 sm:py-3">
              <h3 className="text-base sm:text-lg font-semibold text-white">Product Details</h3>
            </div>
            
            <div className="p-3 sm:p-5">
              {/* Product Image and Basic Info */}
              <div className="mb-3 sm:mb-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 mx-auto sm:mx-0">
                  {result.product.images?.[0]?.url ? (
                    <img 
                      src={result.product.images[0].url} 
                      alt={result.product.item?.name || result.product.serial}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {result.product.item?.name || "Product"}
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-all">
                    Serial: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{result.product.serial}</span>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 sm:px-3 py-1 text-xs font-semibold dark:bg-slate-800 justify-center sm:justify-start">
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      result.product.status === "AVAILABLE" ? "bg-green-500" :
                      result.product.status === "IN_USE" ? "bg-blue-500" :
                      result.product.status === "MAINTENANCE" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{result.product.status}</span>
                  </div>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-2">
                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {result.product.type?.name || "-"}
                  </p>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Supplier</p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {result.product.supplier?.name || "-"}
                  </p>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Store</p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {result.product.plant?.name || "-"}
                  </p>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price</p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {result.product.price ? `₹${result.product.price.toFixed(2)}` : "-"}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 sm:mt-5 flex gap-2 sm:gap-3">
                <a
                  href={`/products/${result.product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg sm:rounded-xl bg-black px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black"
                >
                  View Details
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setStatus("ready");
                    setMessage("Ready to scan next QR code");
                  }}
                  className="flex-1 rounded-lg sm:rounded-xl border-2 border-slate-300 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Scan Next
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
          <div ref={scannerRef} id="qr-scanner" className="min-h-[240px] sm:min-h-[320px] overflow-hidden rounded-xl sm:rounded-2xl bg-black" />
        </div>

        <div className="mt-3 sm:mt-5 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-[1fr_auto]">
          <input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Paste QR payload for manual validation"
            className="w-full rounded-lg sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition focus:border-slate-900"
          />
          <button
            type="button"
            onClick={validateManual}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Smartphone className="h-4 w-4" />
            Validate
          </button>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Realtime Validation</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Status Summary</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Scanner state</span>
              <span className="font-semibold text-slate-900">{status}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Recent scans</span>
              <span className="font-semibold text-slate-900">{loadingLogs ? "..." : logs.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Mode</span>
              <span className="font-semibold text-slate-900">Mobile + Web</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">QR Scan Logs</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Latest Activity</h3>
          <div className="mt-4 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No scan logs yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      {log.product?.images?.[0]?.url ? (
                        <img 
                          src={log.product.images[0].url} 
                          alt={log.product.item?.name || log.product.serial}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {log.product?.item?.name || "Unknown product"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.product?.serial || "No serial"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {fmtDateTime(log.scannedAt)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.source}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
