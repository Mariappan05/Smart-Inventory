"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, type ProductCreateInput } from "@/validations/productSchemas";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Hash, Loader2, RefreshCw } from "lucide-react";
import { Select } from "@/components/ui/Select";

const GST_RATE = 0.18;

type ProductFormProps = {
  types: { id: string; name: string; supplierId?: string | null }[];
  items: { id: string; name: string; supplierId?: string | null }[];
  suppliers: { id: string; name: string }[];
  stores: { id: string; name: string }[];
  initialData?: any;
  onSubmit?: (data: ProductCreateInput) => void;
  onSuccess?: () => void;
  isLoading?: boolean;
};

export function ProductForm({
  types,
  items,
  suppliers,
  stores,
  initialData,
  onSubmit,
  onSuccess,
  isLoading = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: initialData
      ? {
          serial: initialData.serial,
          supplierId: initialData.supplierId,
          typeId: initialData.typeId,
          itemId: initialData.itemId,
          plantId: initialData.plantId,
          price: initialData.price,
        }
      : {
          serial: "Loading...",
        },
  });

  const loading = isSubmitting || isLoading;
  const priceValue = watch("price");
  const selectedSupplierId = watch("supplierId");
  const serialValue = watch("serial");
  const [gstAmount, setGstAmount] = useState(0);
  const [totalWithGst, setTotalWithGst] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [generatingSerial, setGeneratingSerial] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const filteredTypes = selectedSupplierId ? types.filter((t) => t.supplierId === selectedSupplierId) : [];
  const filteredItems = selectedSupplierId ? items.filter((i) => i.supplierId === selectedSupplierId) : [];

  // Generate serial number on mount
  useEffect(() => {
    if (!initialData) {
      generateNextSerial();
    }
  }, [initialData]);

  useEffect(() => {
    setValue("typeId", "");
    setValue("itemId", "");
  }, [selectedSupplierId, setValue]);

  useEffect(() => {
    const p = Number(priceValue) || 0;
    setGstAmount(parseFloat((p * GST_RATE).toFixed(2)));
    setTotalWithGst(parseFloat((p * (1 + GST_RATE)).toFixed(2)));
  }, [priceValue]);

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const generateNextSerial = async () => {
    setGeneratingSerial(true);
    try {
      const response = await fetch("/api/machines/next-serial");
      if (response.ok) {
        const data = await response.json();
        setValue("serial", data.serial);
      } else {
        // Fallback to timestamp-based if API fails
        const fallback = `S${Date.now().toString().slice(-8)}`;
        setValue("serial", fallback);
      }
    } catch (error) {
      // Fallback to timestamp-based if API fails
      const fallback = `S${Date.now().toString().slice(-8)}`;
      setValue("serial", fallback);
    } finally {
      setGeneratingSerial(false);
    }
  };

  const handleRegenerateSerial = () => {
    generateNextSerial();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 10) {
      toast.error("Maximum 10 images allowed");
      e.target.value = "";
      return;
    }

    // Revoke old previews
    imagePreviews.forEach(url => URL.revokeObjectURL(url));

    // Create new previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImageFiles(files);
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the removed preview
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleFormSubmit = async (data: ProductCreateInput) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      // Calculate price with GST before sending to API
      const priceWithGST = data.price ? parseFloat((data.price * (1 + GST_RATE)).toFixed(2)) : undefined;

      const url = initialData ? `/api/machines/${initialData.id}` : "/api/machines";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: priceWithGST,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save product");
      }

      const result = await response.json().catch(() => null);
      const productId: string | undefined = initialData?.id ?? result?.data?.id;

      if (productId && imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch(`/api/uploads/machines/${productId}`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => null);
          toast.error(uploadErr?.message || "Product saved, but image upload failed");
        }
      }

      // Clear images after successful submission
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviews([]);
      setFileInputKey(prev => prev + 1);

      toast.success(initialData ? "Product updated successfully" : "Product created successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const fieldClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Hash className="h-4 w-4" />
          Serial Number
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Auto-generated
          </span>
        </label>
        <div className="relative mt-1">
          <input
            {...register("serial")}
            readOnly
            className={`${fieldClass} cursor-not-allowed bg-slate-50 font-mono text-slate-600 dark:bg-slate-800 pr-12`}
          />
          <button
            type="button"
            onClick={handleRegenerateSerial}
            disabled={loading || !!initialData || generatingSerial}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            title="Generate new serial number"
          >
            <RefreshCw className={`h-4 w-4 ${generatingSerial ? "animate-spin" : ""}`} />
          </button>
        </div>
        {errors.serial && <p className="mt-1 text-xs text-red-600">{errors.serial.message}</p>}
      </div>

      <div>
        <Select
          {...register("supplierId")}
          label="Supplier Name"
          disabled={loading}
          placeholder="Select a supplier"
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.supplierId?.message}
        />
      </div>

      <div>
        <Select
          {...register("typeId")}
          label="Type"
          disabled={loading || !selectedSupplierId}
          placeholder={selectedSupplierId ? "Select a type" : "Select a supplier first"}
          options={filteredTypes.map((t) => ({ value: t.id, label: t.name }))}
          error={errors.typeId?.message}
        />
      </div>

      <div>
        <Select
          {...register("itemId")}
          label="Item"
          disabled={loading || !selectedSupplierId}
          placeholder={selectedSupplierId ? "Select an item" : "Select a supplier first"}
          options={filteredItems.map((i) => ({ value: i.id, label: i.name }))}
          error={errors.itemId?.message}
        />
      </div>

      <div>
        <Select
          {...register("plantId")}
          label="Store Name"
          disabled={loading}
          placeholder="Select a store"
          options={stores.map((p) => ({ value: p.id, label: p.name }))}
          error={errors.plantId?.message}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (excl. GST)</label>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enter price without GST. Total with GST will be saved.</p>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            {...register("price")}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            disabled={loading}
            className={`${fieldClass} mt-0 pl-7`}
          />
        </div>
        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}

        {(Number(priceValue) || 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/40">
            <span className="text-slate-600 dark:text-slate-400">
              GST (18%):{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{gstAmount.toFixed(2)}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-400">
              Total (will be saved):{" "}
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">₹{totalWithGst.toFixed(2)}</span>
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Images</label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload up to 10 images for this product</p>
        
        <div className="mt-3 space-y-3">
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-full bg-red-500 p-2 text-white shadow-lg transition hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700">
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              multiple
              disabled={loading}
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition group-hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {imagePreviews.length > 0 ? "Add more images" : "Click to upload images"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, GIF up to 10MB each
            </p>
            {imagePreviews.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {imagePreviews.length} image{imagePreviews.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </label>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl disabled:scale-100 disabled:bg-slate-400 disabled:shadow-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialData ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
