import React from 'react';

export interface Machine {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  serial: string;
  category: {
    name: string;
    id: string;
    storeId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    supplierId?: string | null;
    createdById?: string | null;
  };
  supplier: {
    id: string;
    name: string;
    [key: string]: any;
  };
  storeRoom: {
    id: string;
    name: string;
    [key: string]: any;
  };
}

interface QRPrintViewProps {
  machine: Machine;
  qrDataUrl: string;
  qrPayload?: string;
  fileName?: string;
}

export const QRPrintView: React.FC<QRPrintViewProps> = ({
  machine,
  qrDataUrl,
  qrPayload,
  fileName,
}) => {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">QR Code Print</h1>
      
      <div className="border rounded-lg p-6 bg-white dark:bg-slate-800">
        <div className="mb-4 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Machine ID:</strong> {machine.id}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Name:</strong> {machine.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Serial:</strong> {machine.serial}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Status:</strong> {machine.status}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Category:</strong> {machine.category?.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Supplier:</strong> {machine.supplier?.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Store Room:</strong> {machine.storeRoom?.name}
          </p>
        </div>

        {qrDataUrl ? (
          <div className="flex justify-center mb-4">
            <img 
              src={qrDataUrl} 
              alt="QR Code" 
              className="w-48 h-48 border border-slate-300"
            />
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-700 rounded p-8 text-center mb-4">
            <p className="text-slate-500 dark:text-slate-400">QR Code not available</p>
          </div>
        )}

        {qrPayload && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 break-all">
            <strong>Payload:</strong> {qrPayload}
          </div>
        )}

        <button
          onClick={() => window.print()}
          className="w-full bg-black px-4 py-2 text-white rounded-lg hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black"
        >
          Print
        </button>
      </div>
    </div>
  );
};
