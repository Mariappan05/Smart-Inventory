"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Barcode, AlertCircle, CheckCircle, Bell, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { ModernDropdown } from "@/components/ui/ModernDropdown";
import { formatDate } from "@/utils/dateTimeFormat";

interface IncomingRequest {
  id: string;
  storeName: string;
  storeCode: string;
  userName: string;
  userEmail?: string;
  fromDate: string;
  toDate: string;
  items: RequestItem[];
  totalQuantity: number;
  requestDate: string;
  status: string;
}

interface RequestItem {
  id: string;
  toolName: string;
  toolCode: string;
  componentCode?: string;
  requestedQuantity: number;
  productBarcode?: string;
}

interface ScannedProduct {
  id: string;
  barcode: string;
  toolName: string;
  toolCode: string;
  quantity: number;
  scanTime: string;
}

interface PendingOutwardItem {
  id: string;
  requestId: string;
  toolName: string;
  toolCode: string;
  requestedQuantity: number;
  returnQuantity: number;
  scannedQuantity: number;
  scannedProducts: ScannedProduct[];
}

export function OutwardView() {
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [barcodeScanInput, setBarcodeScanInput] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("");
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [pendingOutwardItems, setPendingOutwardItems] = useState<PendingOutwardItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PendingOutwardItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showFinalizedRecords, setShowFinalizedRecords] = useState(false);
  const [finalizedRecords, setFinalizedRecords] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [emergencyNotificationShown, setEmergencyNotificationShown] = useState(false);

  // Fetch incoming requests on mount
  useEffect(() => {
    fetchIncomingRequests();
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests/incoming");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch incoming requests");
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        // Transform ToolRequest objects into IncomingRequest format
        const transformedRequests: IncomingRequest[] = data.data.map((request: any) => ({
          id: request.id,
          storeName: request.storeName,
          storeCode: request.storeCode,
          userName: request.userName || "System",
          userEmail: request.userEmail,
          fromDate: new Date(request.fromDate).toISOString(),
          toDate: new Date(request.toDate).toISOString(),
          items: [
            {
              id: request.id,
              toolName: request.toolName,
              toolCode: request.toolName,
              componentCode: request.componentCode,
              requestedQuantity: request.productionQuantity,
              productBarcode: undefined,
            },
          ],
          totalQuantity: request.productionQuantity,
          requestDate: new Date(request.createdAt).toISOString(),
          status: request.status,
        }));

        setIncomingRequests(transformedRequests);
      } else {
        const errorMsg = data.error || "Failed to fetch incoming requests";
        console.error("API Error:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch incoming requests";
      console.error("Error fetching requests:", error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Format dropdown options
  const formatRequestOption = (request: IncomingRequest) => {
    const dateRange = `${formatDate(request.fromDate)} to ${formatDate(request.toDate)}`;
    return `${request.storeName} (${request.storeCode}) - ${request.userName} - ${dateRange}`;
  };

  const searchableFields = (request: IncomingRequest) => {
    return [
      request.storeName,
      request.storeCode,
      request.userName,
      formatDate(request.fromDate),
      formatDate(request.toDate),
    ].join(" ");
  };

  // Handle request selection
  const handleRequestSelect = (requestId: string | string[]) => {
    // Convert to string and handle array case
    const id = Array.isArray(requestId) ? requestId[0] || "" : requestId;
    
    // If empty, reset the form
    if (!id) {
      setSelectedRequest(null);
      setScannedProducts([]);
      setReturnQuantity("");
      setBarcodeScanInput("");
      setPendingOutwardItems([]);
      setValidationWarnings([]);
      setEmergencyNotificationShown(false);
      return;
    }

    const request = incomingRequests.find((r) => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setScannedProducts([]);
      setReturnQuantity("");
      setBarcodeScanInput("");
      setValidationWarnings([]);
    }
  };

  // Check validation warnings
  const checkValidationWarnings = () => {
    const warnings: string[] = [];
    
    if (!selectedRequest) return;
    
    // Check if return quantity matches incoming request quantity
    if (returnQuantity && !isNaN(Number(returnQuantity))) {
      const returnQty = Number(returnQuantity);
      const totalRequested = selectedRequest.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
      
      if (returnQty !== totalRequested) {
        warnings.push(`Return Quantity must match Incoming Request Quantity (${totalRequested})`);
      }
    }

    setValidationWarnings(warnings);
  };

  // Helper to check if quantity is valid (for disabling controls)
  const isQuantityValid = () => {
    if (!selectedRequest || !returnQuantity || isNaN(Number(returnQuantity))) {
      return false;
    }
    
    const returnQty = Number(returnQuantity);
    const totalRequested = selectedRequest.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
    return returnQty === totalRequested;
  };

  // Handle barcode scan
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeScanInput && selectedRequest) {
      // Check if quantity is valid before allowing scan
      if (!isQuantityValid()) {
        toast.error("Return Quantity must match Incoming Request Quantity before scanning");
        setBarcodeScanInput("");
        return;
      }

      const scannedProduct: ScannedProduct = {
        id: Date.now().toString(),
        barcode: barcodeScanInput,
        toolName: selectedRequest.items[0]?.toolName || "Unknown",
        toolCode: selectedRequest.items[0]?.toolCode || "N/A",
        quantity: 1,
        scanTime: new Date().toISOString(),
      };

      setScannedProducts([...scannedProducts, scannedProduct]);
      setBarcodeScanInput("");
      toast.success("Product scanned successfully");
    }
  };

  // Add to pending outward items
  const handleAddOutwardItem = () => {
    if (!selectedRequest) {
      toast.error("Please select an incoming request first");
      return;
    }

    if (!returnQuantity || isNaN(Number(returnQuantity))) {
      toast.error("Please enter valid return quantity");
      return;
    }

    // Check if quantity is valid
    if (!isQuantityValid()) {
      toast.error("Return Quantity must match Incoming Request Quantity");
      return;
    }

    if (scannedProducts.length === 0) {
      toast.error("Please scan at least one product");
      return;
    }

    // Check if all items are scanned from the request
    const totalRequested = selectedRequest.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
    if (scannedProducts.length !== totalRequested) {
      setEmergencyNotificationShown(true);
      toast.error(
        `EMERGENCY: Only ${scannedProducts.length} of ${totalRequested} items scanned. Emergency notification sent to admin!`
      );
      // Trigger emergency alarm for IoT devices
      triggerEmergencyAlarm();
      return;
    }

    const pendingItem: PendingOutwardItem = {
      id: Date.now().toString(),
      requestId: selectedRequest.id,
      toolName: selectedRequest.items[0]?.toolName || "Unknown",
      toolCode: selectedRequest.items[0]?.toolCode || "N/A",
      requestedQuantity: totalRequested,
      returnQuantity: Number(returnQuantity),
      scannedQuantity: scannedProducts.length,
      scannedProducts,
    };

    setPendingOutwardItems([...pendingOutwardItems, pendingItem]);
    toast.success("Outward item added to temporary list");
    
    // Reset form
    setSelectedRequest(null);
    setScannedProducts([]);
    setReturnQuantity("");
    setBarcodeScanInput("");
    setValidationWarnings([]);
  };

  // Trigger emergency alarm
  const triggerEmergencyAlarm = async () => {
    try {
      // Send notification to admin
      await fetch("/api/emergency-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "UNSCANNED_PRODUCTS",
          severity: "HIGH",
          message: "Unscanned products detected during outward process",
          timestamp: new Date().toISOString(),
        }),
      });

      // Trigger IoT device alarm
      await fetch("/api/iot/alarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alarmType: "SECURITY_ALERT",
          duration: 30000, // 30 seconds
        }),
      });
    } catch (error) {
      console.error("Error triggering emergency alarm:", error);
    }
  };

  // Remove scanned product
  const handleRemoveScannedProduct = (productId: string) => {
    setScannedProducts(scannedProducts.filter((p) => p.id !== productId));
  };

  // Edit pending item
  const handleEditOutwardItem = (item: PendingOutwardItem) => {
    setEditForm({ ...item });
    setEditingItemId(item.id);
  };

  // Save edited item
  const handleSaveEditedItem = () => {
    if (!editingItemId) return;

    setPendingOutwardItems(
      pendingOutwardItems.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              returnQuantity: editForm.returnQuantity || item.returnQuantity,
              scannedQuantity: editForm.scannedQuantity || item.scannedQuantity,
            }
          : item
      )
    );

    setEditingItemId(null);
    setEditForm({});
    toast.success("Item updated");
  };

  // Delete pending item
  const handleDeletePendingItem = (itemId: string) => {
    setPendingOutwardItems(pendingOutwardItems.filter((item) => item.id !== itemId));
    toast.success("Item removed from temporary list");
  };

  // Submit all outward items
  const handleSubmitOutwardItems = async () => {
    if (pendingOutwardItems.length === 0) {
      toast.error("Add at least one outward item to submit");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of pendingOutwardItems) {
        try {
          const response = await fetch("/api/outward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: item.requestId,
              toolName: item.toolName,
              toolCode: item.toolCode,
              returnQuantity: item.returnQuantity,
              scannedQuantity: item.scannedQuantity,
              scannedProducts: item.scannedProducts,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to create outward record:`, result.message);
          }
        } catch (error) {
          failCount++;
          console.error(`Error creating outward record:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} outward record(s)`);
        setFinalizedRecords([...finalizedRecords, ...pendingOutwardItems]);
        setPendingOutwardItems([]);
      }
      if (failCount > 0) {
        toast.error(`Failed to create ${failCount} outward record(s)`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Notification */}
      {emergencyNotificationShown && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950 flex items-center gap-3">
          <Bell className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">⚠️ EMERGENCY ALERT</p>
            <p className="text-sm text-red-800 dark:text-red-200">
              Unscanned products detected. Emergency notification sent to admin and IoT devices triggered.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Product Outward
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Process outgoing products with incoming request validation and dual table verification
        </p>
      </div>

      {/* Incoming Requests Dropdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Select Incoming Request
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : (
          <ModernDropdown
            options={incomingRequests.map((request) => ({
              value: request.id,
              label: formatRequestOption(request),
            }))}
            value={selectedRequest?.id || ""}
            onChange={handleRequestSelect}
            placeholder="Select an incoming request..."
            searchableText={(request) => {
              const req = incomingRequests.find((r) => r.id === request.value);
              return req ? searchableFields(req) : "";
            }}
          />
        )}
      </div>

      {/* Request Details & Barcode Scan Section */}
      {selectedRequest && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Request Details & Barcode Scan
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Store Info */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Store Name
              </label>
              <input
                type="text"
                value={selectedRequest.storeName}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Store Code
              </label>
              <input
                type="text"
                value={selectedRequest.storeCode}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              />
            </div>

            {/* User Info */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                User Name
              </label>
              <input
                type="text"
                value={selectedRequest.userName}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date Range
              </label>
              <input
                type="text"
                value={`${formatDate(selectedRequest.fromDate)} to ${formatDate(selectedRequest.toDate)}`}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Return Quantity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Return Quantity <span className="text-red-500">*</span>
                {selectedRequest && (
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    (Expected: {selectedRequest.items.reduce((sum, item) => sum + item.requestedQuantity, 0)})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={returnQuantity}
                onChange={(e) => {
                  setReturnQuantity(e.target.value);
                  checkValidationWarnings();
                }}
                placeholder="Enter return quantity"
                className={`w-full rounded-lg border px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 dark:bg-slate-700 dark:text-white ${
                  returnQuantity && !isQuantityValid()
                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-slate-700"
                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                }`}
              />
              {returnQuantity && !isQuantityValid() && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  Return Quantity does not match Incoming Request Quantity.
                </p>
              )}
            </div>

            {/* Barcode Scan Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Scan Product Barcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barcodeScanInput}
                  onChange={(e) => setBarcodeScanInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  placeholder={isQuantityValid() ? "Scan barcode and press Enter" : "Set valid Return Quantity first"}
                  disabled={!isQuantityValid()}
                  className={`w-full rounded-lg border px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 dark:text-white ${
                    isQuantityValid()
                      ? "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                      : "border-slate-300 bg-slate-100 text-slate-500 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                />
                <Barcode className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              {validationWarnings.map((warning, idx) => (
                <p key={idx} className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Scanned Products Table */}
          {scannedProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Scanned Products ({scannedProducts.length})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Tool Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Barcode
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Scan Time
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {scannedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                          {product.toolName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {product.barcode}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-slate-100">
                          {product.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(product.scanTime)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveScannedProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add to List Button */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleAddOutwardItem}
              disabled={!isQuantityValid() || scannedProducts.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
              title={!isQuantityValid() ? "Return Quantity must match Incoming Request Quantity" : scannedProducts.length === 0 ? "Please scan at least one product" : "Add to List"}
            >
              <Plus className="h-4 w-4" />
              Add to List
            </button>
          </div>
        </div>
      )}

      {/* Pending Outward Items Section */}
      {pendingOutwardItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pending Outward Items ({pendingOutwardItems.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowFinalizedRecords(!showFinalizedRecords)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              {showFinalizedRecords ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Records
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Records
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Return Qty
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Scanned
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pendingOutwardItems.map((item) => {
                  const isQuantityMismatch = item.returnQuantity !== item.requestedQuantity;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        isQuantityMismatch
                          ? "bg-red-50 dark:bg-red-950"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                        {item.toolName} ({item.toolCode})
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.requestedQuantity}
                      </td>
                      <td className={`px-4 py-3 text-center text-sm font-medium ${
                        isQuantityMismatch
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}>
                        {editingItemId === item.id ? (
                          <input
                            type="number"
                            value={editForm.returnQuantity || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, returnQuantity: Number(e.target.value) })
                            }
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-center"
                          />
                        ) : (
                          <>
                            {item.returnQuantity}
                            {isQuantityMismatch && (
                              <AlertCircle className="ml-1 inline h-4 w-4 text-red-600" />
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-slate-100">
                        {item.scannedQuantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {editingItemId === item.id ? (
                            <>
                              <button
                                onClick={handleSaveEditedItem}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditOutwardItem(item)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePendingItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingOutwardItems([])}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Clear List
            </button>
            <button
              type="button"
              onClick={handleSubmitOutwardItems}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit {pendingOutwardItems.length} Record{pendingOutwardItems.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingOutwardItems.length === 0 && !selectedRequest && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select an incoming request to begin the outward process
          </p>
        </div>
      )}
    </div>
  );
}
