"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, QrCode, Upload, Camera, X } from "lucide-react";
import toast from "react-hot-toast";
import { fmtDate } from "@/utils/dateFormat";

type Bill = {
  id: string;
  scheduleDate: string;
  supplier: { id: string; name: string; code: string };
  type: { id: string; name: string };
  item: { id: string; name: string };
  Store: { id: string; name: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  totalWithGst: number;
  orderDeliveryDate: string;
  status: string;
  notes?: string | null;
  completedAt?: string | null;
  completedBy?: { id: string; name: string } | null;
  completedByPlant?: { id: string; name: string } | null;
  deliveredAt?: string | null;
  deliveredBy?: { id: string; name: string } | null;
  createdAt: string;
};

export default function QRScanView() {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [delivered, setDelivered] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState<Bill[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecentDeliveries();
  }, []);

  const fetchRecentDeliveries = async () => {
    try {
      const response = await fetch("/api/schedules?status=COMPLETED");
      const data = await response.json();
      if (data.success) {
        // Filter only delivered/closed orders and take the 5 most recent
        const deliveredOrders = data.data
          .filter((s: Bill) => (s.status === "DELIVERED" || s.status === "CLOSED") && s.deliveredAt)
          .sort((a: Bill, b: Bill) => new Date(b.deliveredAt!).getTime() - new Date(a.deliveredAt!).getTime())
          .slice(0, 5);
        setRecentDeliveries(deliveredOrders);
      }
    } catch (error) {
      console.error("Failed to fetch recent deliveries:", error);
    }
  };

  const fetchBillData = async (billId: string) => {
    setLoading(true);
    setAccessDenied(false);
    setErrorMessage("");
    setBill(null);
    setDelivered(false);

    try {
      const response = await fetch("/api/schedules/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.accessDenied) {
          setAccessDenied(true);
        }
        setErrorMessage(result.message || "Bill not found");
        toast.error(result.message || "Failed to retrieve bill");
        return;
      }

      setBill(result.data);
      toast.success("Order details retrieved");
      stopCamera();
    } catch {
      setErrorMessage("Error scanning bill");
      toast.error("Failed to scan bill");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setLoading(true);
    try {
      const jsQR = (await import("jsqr")).default;
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            toast.error("Failed to process image");
            setLoading(false);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            fetchBillData(code.data);
          } else {
            toast.error("No QR code found in image");
            setLoading(false);
          }
        };
        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to read QR code");
      setLoading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      startScanning();
    } catch (error) {
      toast.error("Failed to access camera");
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startScanning = async () => {
    const jsQR = (await import("jsqr")).default;
    
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          fetchBillData(code.data);
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
          }
        }
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const markDelivered = async () => {
    if (!bill) return;
    if (!confirm("Confirm this order has been delivered?")) return;

    try {
      const response = await fetch(`/api/schedules/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      toast.success("Order confirmed as delivered!");
      setDelivered(true);
      setBill(null);
      fetchRecentDeliveries(); // Refresh the delivery history
    } catch {
      toast.error("Failed to confirm delivery");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Schedule Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">QR Scan</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Scan the QR code from a completed order bill to confirm delivery
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mx-auto max-w-xl space-y-4">

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <QrCode className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Only orders marked as <span className="font-semibold">Completed</span> in the Final Schedule can be scanned here. Enter the Bill ID printed on the delivery bill.
            </p>
          </div>

          {/* Camera Scanner */}
          {scanning ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  className="w-full"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 border-4 border-blue-500 rounded-xl shadow-lg"></div>
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700"
              >
                <X className="h-4 w-4" />
                Stop Camera
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={startCamera}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-slate-900 disabled:scale-100 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
              >
                <Camera className="h-5 w-5" />
                Scan with Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 disabled:scale-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
              >
                <Upload className="h-5 w-5" />
                Upload QR Image
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Processing QR code...</p>
            </div>
          )}

          {/* Delivered success */}
          {delivered && (
            <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Order confirmed as delivered successfully!</p>
            </div>
          )}

          {/* Access denied */}
          {accessDenied && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-400">Access Denied</p>
                <p className="mt-1 text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* General error */}
          {errorMessage && !accessDenied && (
            <div className="flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{errorMessage}</p>
            </div>
          )}

          {/* Bill details */}
          {bill && (
            <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{bill.supplier.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {bill.type.name} • {bill.item.name} • {bill.Store.name}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  ✓ COMPLETED
                </span>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Schedule Date</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDate(bill.scheduleDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Delivery Date</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDate(bill.orderDeliveryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{bill.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total (with GST)</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">₹{bill.totalWithGst.toFixed(2)}</p>
                </div>
              </div>

              {bill.completedBy && (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed By</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {bill.completedBy.name}
                    {bill.completedByPlant && (
                      <span className="ml-2 text-slate-500 dark:text-slate-400">({bill.completedByPlant.name})</span>
                    )}
                  </p>
                </div>
              )}

              {bill.notes && (
                <p className="text-sm italic text-slate-600 dark:text-slate-400">📝 {bill.notes}</p>
              )}

              <button
                onClick={markDelivered}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-900 hover:shadow-xl dark:bg-slate-950 dark:hover:bg-black"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Delivery
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Delivery History */}
      {recentDeliveries.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Delivery Confirmations</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Last 5 orders confirmed via QR scan</p>
          </div>
          <div className="space-y-3">
            {recentDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{delivery.supplier.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {delivery.item.name} • {delivery.Store.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    ✓ Delivered
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{delivery.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    <p className="font-semibold text-blue-700 dark:text-blue-400">₹{delivery.totalWithGst.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Delivered On</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {delivery.deliveredAt ? fmtDate(delivery.deliveredAt) : "—"}
                    </p>
                  </div>
                </div>
                {delivery.deliveredBy && (
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs dark:border-blue-800 dark:bg-blue-900/20">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Confirmed by:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300">{delivery.deliveredBy.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
