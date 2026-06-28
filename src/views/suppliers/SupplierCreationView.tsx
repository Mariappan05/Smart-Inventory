"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface TempSupplier {
  tempId: string;
  name: string;
  code: string;
  gstNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export function SupplierCreationView() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    gstNumber: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  const [tempSuppliers, setTempSuppliers] = useState<TempSupplier[]>([]);
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showTempSuppliers, setShowTempSuppliers] = useState(false);

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // GST Number (GSTIN) validation - Indian format
  const validateGSTIN = (gst: string): boolean => {
    if (!gst) return false; // mandatory
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gst.toUpperCase());
  };

  // Phone number validation (Indian format: +91 XXXXXXXXXX or just 10 digits)
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length === 10;
  };

  // Get validation error for a field
  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find((e) => e.field === fieldName)?.message;
  };

  // Has validation error for field
  const hasFieldError = (fieldName: string): boolean => {
    return errors.some((e) => e.field === fieldName);
  };

  // Validate form
  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    if (!form.name.trim()) {
      newErrors.push({ field: "name", message: "Supplier name is required" });
    }

    if (!form.code.trim()) {
      newErrors.push({ field: "code", message: "Supplier code is required" });
    }

    if (!form.gstNumber.trim()) {
      newErrors.push({ field: "gstNumber", message: "GST Number is required" });
    } else if (!validateGSTIN(form.gstNumber.trim())) {
      newErrors.push({
        field: "gstNumber",
        message: "Invalid GSTIN format. Example: 22AAAAA0000A1Z5",
      });
    }

    if (form.contactEmail && !validateEmail(form.contactEmail)) {
      newErrors.push({ field: "contactEmail", message: "Invalid email format" });
    }

    if (form.contactPhone && !validatePhoneNumber(form.contactPhone)) {
      newErrors.push({
        field: "contactPhone",
        message: "Phone must be 10 digits (Indian mobile number)",
      });
    }

    // Check for duplicates in temp table
    if (
      tempSuppliers.some(
        (s) => s.name.toLowerCase() === form.name.toLowerCase() && !editingTempId
      )
    ) {
      newErrors.push({
        field: "name",
        message: "This supplier name already exists in the temporary list",
      });
    }

    if (
      tempSuppliers.some(
        (s) => s.code.toUpperCase() === form.code.toUpperCase() && !editingTempId
      )
    ) {
      newErrors.push({
        field: "code",
        message: "This supplier code already exists in the temporary list",
      });
    }

    return newErrors;
  };

  const handleAddSupplier = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (newErrors.length > 0) {
      toast.error("Please fix validation errors");
      return;
    }

    if (editingTempId) {
      // Update existing
      setTempSuppliers(
        tempSuppliers.map((s) =>
          s.tempId === editingTempId
            ? {
                ...s,
                name: form.name,
                code: form.code.toUpperCase(),
                gstNumber: form.gstNumber.toUpperCase(),
                contactEmail: form.contactEmail,
                contactPhone: form.contactPhone,
                address: form.address,
              }
            : s
        )
      );
      setEditingTempId(null);
      toast.success("Supplier updated in temporary list");
    } else {
      // Add new
      const newSupplier: TempSupplier = {
        tempId: Date.now().toString(),
        name: form.name,
        code: form.code.toUpperCase(),
        gstNumber: form.gstNumber.toUpperCase(),
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
      };
      setTempSuppliers([...tempSuppliers, newSupplier]);
      toast.success("Supplier added to temporary list");
    }

    resetForm();
  };

  const handleEditSupplier = (supplier: TempSupplier) => {
    setForm({
      name: supplier.name,
      code: supplier.code,
      gstNumber: supplier.gstNumber,
      contactEmail: supplier.contactEmail,
      contactPhone: supplier.contactPhone,
      address: supplier.address,
    });
    setEditingTempId(supplier.tempId);
    setErrors([]);
  };

  const handleDeleteSupplier = (tempId: string) => {
    setTempSuppliers(tempSuppliers.filter((s) => s.tempId !== tempId));
    if (editingTempId === tempId) {
      resetForm();
    }
    toast.success("Supplier removed from temporary list");
  };

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      gstNumber: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    });
    setEditingTempId(null);
    setErrors([]);
  };

  // Handle phone input - only allow digits, no auto-formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const digitsOnly = e.target.value.replace(/\D/g, "");
    // Limit to 10 digits
    const limitedValue = digitsOnly.slice(0, 10);

    setForm({ ...form, contactPhone: limitedValue });
    setErrors(errors.filter((e) => e.field !== "contactPhone"));
  };

  // Format phone for display in table
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "-";
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) return phone;
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  };

  const handleCreateAllSuppliers = async () => {
    if (tempSuppliers.length === 0) {
      toast.error("Add at least one supplier to create");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const supplier of tempSuppliers) {
        try {
          const response = await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: supplier.name,
              code: supplier.code,
              gstNumber: supplier.gstNumber,
              contactEmail: supplier.contactEmail || null,
              contactPhone: supplier.contactPhone || null,
              address: supplier.address || null,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to create ${supplier.name}:`, result.message);
          }
        } catch (error) {
          failCount++;
          console.error(`Error creating ${supplier.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} supplier(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to create ${failCount} supplier(s)`);
      }

      if (failCount === 0 && successCount > 0) {
        setTempSuppliers([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white/70 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              New Supplier Entry
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Add suppliers to temporary list, verify details, then create them in
              the database
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTempSuppliers(!showTempSuppliers)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            {showTempSuppliers ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Suppliers
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Suppliers
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {editingTempId ? "Edit Supplier" : "Add Supplier"}
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Supplier Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors(errors.filter((err) => err.field !== "name"));
                  }}
                  placeholder="Enter supplier name"
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    hasFieldError("name")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                />
                {hasFieldError("name") && (
                  <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                )}
              </div>
              {hasFieldError("name") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError("name")}
                </p>
              )}
            </div>

            {/* Supplier Code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Supplier Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase(),
                    });
                    setErrors(errors.filter((err) => err.field !== "code"));
                  }}
                  placeholder="Enter supplier code"
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    hasFieldError("code")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                />
                {hasFieldError("code") && (
                  <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                )}
              </div>
              {hasFieldError("code") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError("code")}
                </p>
              )}
            </div>

            {/* GST Number */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                GST Number (GSTIN) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => {
                    setForm({ ...form, gstNumber: e.target.value.toUpperCase() });
                    setErrors(errors.filter((err) => err.field !== "gstNumber"));
                  }}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  maxLength={15}
                  className={`w-full rounded-lg border bg-white px-4 py-2 font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    hasFieldError("gstNumber")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : form.gstNumber && validateGSTIN(form.gstNumber)
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                />
                {hasFieldError("gstNumber") && (
                  <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                )}
                {!hasFieldError("gstNumber") && form.gstNumber && validateGSTIN(form.gstNumber) && (
                  <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                )}
              </div>
              {hasFieldError("gstNumber") && (
                <p className="mt-1 text-xs text-red-500">{getFieldError("gstNumber")}</p>
              )}
              {!hasFieldError("gstNumber") && form.gstNumber && validateGSTIN(form.gstNumber) && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Valid GSTIN
                </p>
              )}
              {!hasFieldError("gstNumber") && !validateGSTIN(form.gstNumber) && form.gstNumber.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Format: 2-digit state code + 5 letters + 4 digits + 1 letter + 1 digit/letter + Z + 1 digit/letter
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => {
                    setForm({ ...form, contactEmail: e.target.value });
                    setErrors(errors.filter((err) => err.field !== "contactEmail"));
                  }}
                  placeholder="Enter email address"
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    hasFieldError("contactEmail")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                />
                {hasFieldError("contactEmail") && (
                  <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                )}
              </div>
              {hasFieldError("contactEmail") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError("contactEmail")}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number (10 digits)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-white ${
                    hasFieldError("contactPhone")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                  }`}
                  maxLength={10}
                />
                {hasFieldError("contactPhone") && (
                  <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                )}
              </div>
              {hasFieldError("contactPhone") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError("contactPhone")}
                </p>
              )}
              {form.contactPhone && !hasFieldError("contactPhone") && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Valid phone number ({form.contactPhone.length}/10)
                </p>
              )}
              {form.contactPhone && hasFieldError("contactPhone") && (
                <p className="mt-1 text-xs text-slate-500">
                  {form.contactPhone.length} / 10 digits
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter supplier address"
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddSupplier}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              {editingTempId ? "Update in List" : "Add to List"}
            </button>
            {editingTempId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Temporary Suppliers Table */}
      {tempSuppliers.length > 0 && showTempSuppliers && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Temporary Suppliers ({tempSuppliers.length})
            </p>
          </div>
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  GST Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tempSuppliers.map((supplier) => (
                <tr
                  key={supplier.tempId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {supplier.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {supplier.code}
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                    {supplier.gstNumber || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {supplier.contactEmail || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatPhoneForDisplay(supplier.contactPhone) || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {supplier.address || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSupplier(supplier)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1 text-sm text-amber-900 transition hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSupplier(supplier.tempId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm text-red-900 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Suppliers Button */}
      {tempSuppliers.length > 0 && showTempSuppliers && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setTempSuppliers([])}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Clear List
          </button>
          <button
            type="button"
            onClick={handleCreateAllSuppliers}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create {tempSuppliers.length} Supplier
            {tempSuppliers.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Collapsed View Message */}
      {tempSuppliers.length > 0 && !showTempSuppliers && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click 'View Suppliers' to see {tempSuppliers.length} supplier{tempSuppliers.length !== 1 ? "s" : ""} in temporary list
          </p>
        </div>
      )}

      {/* Empty State */}
      {tempSuppliers.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Add suppliers using the form above, then create them all at once
          </p>
        </div>
      )}
    </div>
  );
}
