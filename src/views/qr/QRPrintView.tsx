"use client";

import { useMemo } from "react";
import { Download, Printer, ShieldCheck, QrCode } from "lucide-react";

type QRPrintViewProps = {
  machine: {
    id: string;
    assetTag: string;
    name: string;
    status: string;
    serial: string;
    category?: { name: string } | null;
    supplier?: { name: string } | null;
    storeRoom?: { name: string } | null;
  };
  qrDataUrl: string;
  qrPayload: string;
  fileName: string;
};

export function QRPrintView({ machine, qrDataUrl, qrPayload, fileName }: QRPrintViewProps) {
  const downloadHref = useMemo(() => qrDataUrl, [qrDataUrl]);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=800");
    if (printWindow) {
      const qrImage = document.querySelector('[data-qr-print] img') as HTMLImageElement | null;
      if (!qrImage?.src) return;

      const escapedSrc = qrImage.src.replace(/"/g, "&quot;");
      const escapedAlt = (qrImage.alt || "Machine QR code").replace(/"/g, "&quot;");

      printWindow.document.open();
      printWindow.document.write(
        `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print QR Code</title>
    <style>
      @page { margin: 0; }
      html, body { width: 100%; height: 100%; }
      body { margin: 0; background: #fff; }
      img {
        width: 100vw;
        height: 100vh;
        object-fit: contain;
        image-rendering: pixelated;
      }
    </style>
  </head>
  <body>
    <img src="${escapedSrc}" alt="${escapedAlt}" />
  </body>
</html>`
      );
      printWindow.document.close();

      const img = printWindow.document.querySelector("img") as HTMLImageElement | null;
      const doPrint = () => {
        printWindow.focus();
        printWindow.print();
      };

      if (img && !img.complete) {
        img.onload = doPrint;
        img.onerror = doPrint;
      } else {
        doPrint();
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadHref;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr] print:block">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">QR Print</p>
            <h1 className="text-3xl font-semibold text-slate-900">{machine.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Asset Tag: {machine.assetTag}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 print:hidden">
            <ShieldCheck className="mr-1 inline-block h-4 w-4" />
            Ready for print
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div data-qr-print>
              <img src={qrDataUrl} alt={`${machine.name} QR code`} className="w-full rounded-2xl bg-white p-3" />
            </div>
            <p className="mt-3 text-center text-xs font-medium text-slate-500">Scan to validate machine asset</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <QrCode className="h-4 w-4" />
                QR Payload
              </div>
              <p className="mt-3 break-all font-mono text-xs leading-5 text-slate-600">{qrPayload}</p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-900">{machine.status}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Serial</dt>
                <dd className="mt-1 font-medium text-slate-900">{machine.serial}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</dt>
                <dd className="mt-1 font-medium text-slate-900">{machine.category?.name || "-"}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Store Room</dt>
                <dd className="mt-1 font-medium text-slate-900">{machine.storeRoom?.name || "-"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <aside className="space-y-4 print:hidden">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Download and Print</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Download QR
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print QR
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Print Notes</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Use a high-resolution printer for best scan results.</li>
            <li>Place the QR on machine labels or asset plates.</li>
            <li>Validate the QR with mobile camera before deployment.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
