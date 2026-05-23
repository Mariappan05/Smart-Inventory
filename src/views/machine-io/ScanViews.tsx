"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Camera, ScanLine, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Upload, X } from "lucide-react";
import { fmtDateTime } from "@/utils/dateFormat";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/Select";
import { UserSelect } from "@/components/ui/UserSelect";

type ValidationResult = {
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
  latestMovement?: {
    movementType: string;
    movedAt: string;
  };
  isCheckedOut?: boolean;
  nextAction?: "IN" | "OUT";
};

type MovementLog = {
  id: string;
  movementType: string;
  movedAt: string;
  notes?: string | null;
  product?: { 
    id: string;
    serial: string;
    item?: { name: string };
    images?: { url: string; isPrimary: boolean }[];
  };
  movedBy?: { 
    name: string; 
    id: string;
    images?: { url: string; isPrimary: boolean }[];
  } | null;
  reason?: string | null;
};

export function MachineIOView() {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const startLockRef = useRef(false);
  const scanLockRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "ready" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("Scan a product QR code to begin IN/OUT tracking.");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [payload, setPayload] = useState("");
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string; employeeNo: string | null; imageUrl?: string | null }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [form, setForm] = useState({
    issuedTo: "",
    isInternalTransfer: false,
    transferToUserId: "",
    reason: "",
    expectedReturnAt: "",
    conditionNote: "",
    toStoreRoomId: "",
  });

  const statusTone = useMemo(() => {
    if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400";
    if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400";
    if (status === "processing") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400";
    return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300";
  }, [status]);

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
    stream.getTracks().forEach((track) => track.stop());
  };

  const getCameraErrorMessage = (error: unknown) => {
    const isInsecureContext = typeof window !== "undefined" && !window.isSecureContext;
    if (isInsecureContext) {
      return "Camera access requires a secure origin (HTTPS). Use https:// or localhost, then try again.";
    }

    const raw =
      typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? String((error as { message: string }).message)
          : "";

    const rawLower = raw.toLowerCase();
    if (rawLower.includes("notallowederror") || rawLower.includes("permission")) {
      return "Camera permission denied. Please allow camera access in your browser (lock icon near the address bar) and try again.";
    }
    if (rawLower.includes("notfounderror") || rawLower.includes("devicesnotfound")) {
      return "No camera device found. Please connect a camera or try on a device with a camera.";
    }
    if (rawLower.includes("notreadableerror") || rawLower.includes("trackstart")) {
      return "Camera is already in use by another app/tab. Close other apps using the camera and try again.";
    }

    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        return "Camera permission denied. Please allow camera access in your browser (lock icon near the address bar) and try again.";
      }

      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        return "No camera device found. Please connect a camera or try on a device with a camera.";
      }

      if (error.name === "NotReadableError") {
        return "Camera is already in use by another app/tab. Close other apps using the camera and try again.";
      }

      if (error.name === "OverconstrainedError") {
        return "Camera constraints could not be satisfied. Try switching to a different camera/device.";
      }

      if (error.name === "AbortError") {
        return "Camera start was interrupted. Try again.";
      }

      return `Camera error: ${error.name}`;
    }

    if (error instanceof Error) {
      return error.message || "Unable to access camera.";
    }

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && "name" in error && typeof (error as { name?: unknown }).name === "string") {
      return `Camera error: ${String((error as { name: string }).name)}`;
    }

    return raw
      ? `Unable to access camera: ${raw}`
      : "Unable to access camera. Check: (1) you allowed camera permission, (2) no other app is using the camera, (3) you are on https:// or localhost.";
  };

  useEffect(() => {
    let mounted = true;

    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const response = await fetch("/api/machine-io/logs?page=1&pageSize=8");
        const data = await response.json();
        const rows = data?.data?.data ?? data?.data ?? [];
        if (mounted) {
          setLogs(Array.isArray(rows) ? rows : []);
        }
      } catch {
        if (mounted) {
          setLogs([]);
        }
      } finally {
        if (mounted) {
          setLoadingLogs(false);
        }
      }
    };

    const fetchEmployees = async () => {
      try {
        const [empRes, sessionRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/auth/session"),
        ]);
        const empData = await empRes.json();
        const sessionData = await sessionRes.json();

        if (mounted && empData.success) {
          const list = empData.data || [];
          setEmployees(list);

          if (sessionData.authenticated) {
            const me = list.find((e: { id: string }) => e.id === sessionData.userId);
            if (me) {
              setCurrentUser({ id: me.id, name: me.name, role: sessionData.role });
              setForm((prev) => ({ ...prev, issuedTo: me.id }));
            }
          }
        }
      } catch {
        if (mounted) setEmployees([]);
      }
    };

    fetchLogs();
    fetchEmployees();
    const interval = window.setInterval(fetchLogs, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      qrCodeRef.current?.stop().catch(() => undefined);
      qrCodeRef.current?.clear();
      qrCodeRef.current = null;
    };
  }, []);

  const startCameraScanner = async () => {
    if (!scannerRef.current) {
      throw new Error("Scanner container is not available.");
    }

    if (startLockRef.current) return;
    startLockRef.current = true;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await qrCodeRef.current?.stop().catch(() => undefined);
      qrCodeRef.current?.clear();
      qrCodeRef.current = null;

      const onScanSuccess = async (decodedText: string) => {
        if (scanLockRef.current) return;
        scanLockRef.current = true;
        setPayload(decodedText);
        setStatus("processing");
        setMessage("Validating QR code...");

        try {
          const response = await fetch("/api/machine-io/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: decodedText }),
          });
          const result = await response.json();
          const data = result.data as ValidationResult;
          setValidation(data);

          if (data?.valid) {
            setStatus("success");
            setMessage(data.message || "QR validated successfully.");
          } else {
            setStatus("error");
            setMessage(data?.message || result.message || "QR validation failed.");
          }
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Unable to validate QR code.");
        } finally {
          scanLockRef.current = false;
        }
      };

      const onScanFailure = () => undefined;

      const instance = new Html5Qrcode(scannerRef.current.id);
      qrCodeRef.current = instance;

      try {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);

        const preferredCameraId =
          cameras.find((camera) => /back|rear|environment/i.test(camera.label ?? ""))?.id ??
          cameras[0]?.id;

        await instance.start(
          preferredCameraId
            ? preferredCameraId
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1,
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (error) {
        // Ensure we don't keep a half-started instance around.
        await instance.stop().catch(() => undefined);
        instance.clear();
        qrCodeRef.current = null;
        throw error;
      }

      setStatus("ready");
      setMessage("Camera started. Point it at a QR code.");
    } finally {
      startLockRef.current = false;
    }
  };

  const enableCamera = async () => {
    setStatus("processing");
    setMessage("Requesting camera permissions...");

    if (typeof window !== "undefined" && !window.isSecureContext) {
      const friendly = "Camera access requires a secure origin (HTTPS). Use https:// or localhost, then try again.";
      toast.error(friendly);
      setStatus("error");
      setMessage(friendly);
      return;
    }

    try {
      // Request permission first so the subsequent scanner start is not blocked.
      await requestCameraPermission();
      toast.success("Camera permission granted");
      setMessage("Starting camera scanner...");
      await startCameraScanner();
    } catch (error) {
      const friendly = getCameraErrorMessage(error);

      toast.error(friendly);
      setStatus("error");
      setMessage(friendly);
    }
  };

  const refreshLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/machine-io/logs?page=1&pageSize=8");
      const data = await response.json();
      const rows = data?.data?.data ?? data?.data ?? [];
      setLogs(Array.isArray(rows) ? rows : []);
      toast.success("Logs refreshed");
    } catch (error) {
      toast.error("Failed to refresh logs");
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setStatus("processing");
    setMessage("Reading QR code from image...");

    try {
      const jsQR = (await import("jsqr")).default;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            toast.error("Failed to process image");
            setStatus("error");
            setMessage("Failed to process image");
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setUploadedImage(event.target?.result as string);
            setPayload(code.data);
            setStatus("processing");
            setMessage("QR code detected. Validating...");

            try {
              const response = await fetch("/api/machine-io/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload: code.data }),
              });
              const result = await response.json();
              const data = result.data as ValidationResult;
              setValidation(data);

              if (data?.valid) {
                if (data.isCheckedOut || data.nextAction === "IN") {
                  setStatus("error");
                  setMessage("This product is already marked OUT. Please mark it IN first.");
                  toast.error("Product already marked OUT");
                } else {
                  setStatus("success");
                  setMessage(data.message || "QR validated successfully.");
                  toast.success("QR code scanned from image");
                }
              } else {
                setStatus("error");
                setMessage(data?.message || result.message || "QR validation failed.");
              }
            } catch (error) {
              setStatus("error");
              setMessage(error instanceof Error ? error.message : "Unable to validate QR code.");
            }
          } else {
            toast.error("No QR code found in image");
            setStatus("error");
            setMessage("No QR code detected in the uploaded image");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to read QR code from image");
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to process image");
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualValidate = async () => {
    if (!payload.trim()) {
      toast.error("Scan or paste a QR payload first.");
      return;
    }

    setStatus("processing");
    setMessage("Validating payload...");

    try {
      const response = await fetch("/api/machine-io/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const result = await response.json();
      const data = result.data as ValidationResult;
      setValidation(data);
      setStatus(data?.valid ? "success" : "error");
      setMessage(data?.message || result.message || "Validation complete.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Validation failed.");
    }
  };

  const runAction = async (action: "OUT" | "IN") => {
    if (!payload.trim()) {
      toast.error("Validate a QR code first.");
      return;
    }

    if (action === "OUT") {
      if (!form.issuedTo.trim()) {
        toast.error("Please select an employee.");
        return;
      }
      
      if (validation?.isCheckedOut || validation?.nextAction === "IN") {
        toast.error("This product is already marked OUT. Please mark it IN first.");
        return;
      }
    }

    const endpoint = action === "OUT" ? "/api/machine-io/out" : "/api/machine-io/in";
    const selectedEmployee = employees.find((e) => e.id === form.issuedTo);
    const body =
      action === "OUT"
        ? {
            payload,
            issuedTo: selectedEmployee?.name ?? form.issuedTo,
            issuedToId: form.issuedTo,
            isInternalTransfer: form.isInternalTransfer,
            transferToUserId: form.transferToUserId,
            reason: form.reason,
            expectedReturnAt: form.expectedReturnAt || null,
          }
        : {
            payload,
            conditionNote: form.conditionNote,
            toStoreRoomId: form.toStoreRoomId,
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to mark machine ${action}`);
      }

      toast.success(`Product marked ${action}`);
      setValidation(null);
      setPayload("");
      setUploadedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Product processed successfully. Scan next QR code.");
      setStatus("idle");
      setForm({
        issuedTo: currentUser?.id ?? "",
        isInternalTransfer: false,
        transferToUserId: "",
        reason: "",
        expectedReturnAt: "",
        conditionNote: "",
        toStoreRoomId: "",
      });
      
      // Force refresh logs immediately
      const logsResponse = await fetch("/api/machine-io/logs?page=1&pageSize=8");
      const logsData = await logsResponse.json();
      const rows = logsData?.data?.data ?? logsData?.data ?? [];
      setLogs(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to mark product ${action}`);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : `Failed to mark product ${action}`);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Product IN/OUT</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">QR Scanner</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshLogs}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
          >
            <RefreshCcw className={`h-4 w-4 ${loadingLogs ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={enableCamera}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Camera className="h-4 w-4" />
            Enable Camera
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700">
            <Upload className="h-4 w-4" />
            Upload QR Image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadedImage && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Uploaded QR Image</p>
              <button
                type="button"
                onClick={clearUploadedImage}
                className="rounded-lg p-1 hover:bg-slate-200 transition dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <img
              src={uploadedImage}
              alt="Uploaded QR"
              className="w-full max-w-xs rounded-xl"
            />
          </div>
        )}

        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${statusTone}`}>
          <div className="flex items-center gap-2 font-medium">
            {status === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            <span>{message}</span>
          </div>
        </div>

        {/* Product Details Card */}
        {validation?.product && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
              <h3 className="text-lg font-semibold text-white">Product Details</h3>
            </div>
            
            <div className="p-5">
              {/* Product Image and Basic Info */}
              <div className="mb-5 flex gap-4">
                <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  {validation.product.images?.[0]?.url ? (
                    <img 
                      src={validation.product.images[0].url} 
                      alt={validation.product.item?.name || validation.product.serial}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {validation.product.item?.name || "Product"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Serial: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{validation.product.serial}</span>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">
                    <div className={`h-2 w-2 rounded-full ${
                      validation.product.status === "AVAILABLE" ? "bg-green-500" :
                      validation.product.status === "IN_USE" ? "bg-blue-500" :
                      validation.product.status === "MAINTENANCE" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    <span className="text-slate-700 dark:text-slate-300">{validation.product.status}</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Next: {validation.nextAction ?? "OUT"}
                  </div>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {validation.product.type?.name || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Supplier</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {validation.product.supplier?.name || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Store Location</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {validation.product.plant?.name || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {validation.product.price ? `₹${validation.product.price.toFixed(2)}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div ref={scannerRef} id="machine-io-scanner" className="min-h-[320px] overflow-hidden rounded-2xl bg-black" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            placeholder="Paste or scan the product QR payload"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400"
          />
          <button
            type="button"
            onClick={handleManualValidate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Validate
          </button>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ArrowDownToLine className="h-4 w-4" />
              Mark OUT
            </div>
            <div className="mt-4 space-y-3">
              <UserSelect
                value={form.issuedTo}
                onChange={(e) => setForm((prev) => ({ ...prev, issuedTo: e.target.value }))}
                placeholder="Select employee"
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`,
                  imageUrl: emp.imageUrl
                }))}
              />
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isInternalTransfer}
                  onChange={(e) => setForm((prev) => ({ ...prev, isInternalTransfer: e.target.checked, transferToUserId: "" }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">Internal Transfer</span>
              </label>

              {form.isInternalTransfer && (
                <div className="animate-slide-in">
                  <UserSelect
                    value={form.transferToUserId}
                    onChange={(e) => setForm((prev) => ({ ...prev, transferToUserId: e.target.value }))}
                    placeholder="Transfer to user..."
                    options={employees.filter(emp => emp.id !== form.issuedTo).map((emp) => ({
                      value: emp.id,
                      label: `${emp.name}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`,
                      imageUrl: emp.imageUrl
                    }))}
                  />
                </div>
              )}

              <input
                value={form.expectedReturnAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expectedReturnAt: event.target.value }))}
                type="datetime-local"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10"
              />
              <textarea
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                rows={3}
                placeholder="Reason for OUT"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10"
              />
              <button
                type="button"
                onClick={() => runAction("OUT")}
                disabled={validation?.isCheckedOut || validation?.nextAction === "IN"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-amber-600 hover:shadow-xl disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <ArrowRightLeft className="h-4 w-4" />
                {validation?.isCheckedOut ? "Product Already OUT" : "Mark Product OUT"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Realtime Status</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Live Dashboard Updates</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <span>Scanner</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{status}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <span>Current action</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{validation?.nextAction ?? "OUT"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <span>Logs</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{loadingLogs ? "..." : logs.length}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Movement Logs</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Recent IN/OUT Activity</h3>
          <div className="mt-4 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No movement logs yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      {log.product?.images?.[0]?.url ? (
                        <img
                          src={log.product.images[0].url}
                          alt={log.product.item?.name || log.product.serial}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ArrowRightLeft className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">
                          {log.product?.item?.name || "Unknown product"}
                        </p>
                        <p className="text-xs text-slate-500 flex-shrink-0 dark:text-slate-400">{fmtDateTime(log.movedAt)}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.product?.serial || "-"}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {log.movementType}
                      </p>
                      {log.movedBy && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            {log.movedBy.images?.[0]?.url ? (
                              <img
                                src={log.movedBy.images[0].url}
                                alt={log.movedBy.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">By: {log.movedBy.name}</p>
                        </div>
                      )}
                      {log.reason && (
                        <p className="mt-0.5 text-xs text-slate-500 italic dark:text-slate-400">{log.reason}</p>
                      )}
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
