"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MultiImageUploadField } from "@/components/product/MultiImageUploadField";

const itemFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  type: z.enum(["Insert", "Drill", "HSS Drill", "Reamer", "Endmill", "Holemill"], {
    errorMap: () => ({ message: "Please select a type" }),
  }),
  diameter: z.string().min(1, "Diameter is required"),
  lifeDurationValue: z.string().min(1, "Life duration value is required"),
  lifeDurationUnit: z.enum(["days", "months", "years"], {
    errorMap: () => ({ message: "Select days, months, or years" }),
  }),
  unitPrice: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price")]).transform(v => typeof v === "string" ? parseFloat(v) : v),
  itemCode: z.string().min(1, "Item code is required"),
  description: z.string().min(1, "Description is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

type ItemFormProps = {
  onSuccess?: () => void;
  isLoading?: boolean;
  initialData?: {
    id: string;
    name: string;
    variant: string | null;
    itemCode: string | null;
    description: string;
    lifeDuration: string;
    unitPrice: number | null;
    imagesJson?: string | null;
    supplier: { id: string; name: string } | null;
  };
  isEditing?: boolean;
};

export function ItemForm({ onSuccess, isLoading = false, initialData, isEditing = false }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      type: (initialData.variant?.split(" - ")[0] || "Insert") as "Insert" | "Drill" | "HSS Drill" | "Reamer" | "Endmill" | "Holemill",
      diameter: initialData.variant?.split(" - ")[1] || "",
      lifeDurationValue: initialData.lifeDuration.split(" ")[0],
      lifeDurationUnit: initialData.lifeDuration.split(" ")[1] as "days" | "months" | "years",
      unitPrice: initialData.unitPrice || 0,
      itemCode: initialData.itemCode || "",
      description: initialData.description,
      supplierName: initialData.supplier?.name || "",
    } : {
      lifeDurationUnit: "days",
    },
  });

  const selectedUnit = watch("lifeDurationUnit") || "days";

  const loading = isSubmitting || isLoading;
  const [unitPrice, setUnitPrice] = useState<number>(initialData?.unitPrice || 0);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.imagesJson ? JSON.parse(initialData.imagesJson) : []
  );

  const handleImagesSelect = (images: string[]) => {
    setSelectedImages(images);
  };

  const onSubmit = async (data: ItemFormData) => {
    // Validate images are provided
    if (selectedImages.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    try {
      const lifeDuration = `${data.lifeDurationValue} ${data.lifeDurationUnit}`;
      const variant = `${data.type} - ${data.diameter}`;
      
      if (isEditing && initialData) {
        // Update mode
        const response = await fetch(`/api/items/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            variant: variant,
            itemCode: data.itemCode,
            description: data.description,
            lifeDuration: lifeDuration,
            unitPrice: data.unitPrice || 0,
            supplierName: data.supplierName,
            imagesJson: JSON.stringify(selectedImages),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to update product");
        }

        toast.success("Product updated successfully!");
        onSuccess?.();
      } else {
        // Create mode
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            variant: variant,
            itemCode: data.itemCode,
            description: data.description,
            lifeDuration: lifeDuration,
            unitPrice: data.unitPrice || 0,
            supplierName: data.supplierName,
            imagesJson: JSON.stringify(selectedImages),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to create product");
        }

        toast.success("Product created successfully!");
        reset();
        setUnitPrice(0);
        setSelectedImages([]);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isEditing ? "Failed to update product" : "Failed to create product");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Product Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Product Name <span className="text-red-500 font-bold">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          placeholder="Enter product name"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* 2. Type Dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Type <span className="text-red-500 font-bold">*</span>
        </label>
        <select
          {...register("type")}
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 appearance-none cursor-pointer"
        >
          <option value="">Select type</option>
          <option value="Insert">Insert</option>
          <option value="Drill">Drill</option>
          <option value="HSS Drill">HSS Drill</option>
          <option value="Reamer">Reamer</option>
          <option value="Endmill">Endmill</option>
          <option value="Holemill">Holemill</option>
        </select>
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
      </div>

      {/* 3. Diameter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Diameter <span className="text-red-500 font-bold">*</span>
          <span className="text-slate-400 text-xs ml-2">(Example: 1mm, 2mm)</span>
        </label>
        <input
          {...register("diameter")}
          type="text"
          placeholder="e.g., 1mm, 2mm, 3mm"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.diameter && <p className="text-red-500 text-sm mt-1">{errors.diameter.message}</p>}
      </div>

      {/* 4. Life Duration */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Life Duration <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="space-y-3">
          {/* Duration Value Input */}
          <input
            {...register("lifeDurationValue")}
            type="number"
            min="1"
            placeholder="Enter duration (e.g., 20)"
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          
          {/* Unit Selection Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'days', label: 'Days', icon: '📅' },
              { value: 'months', label: 'Months', icon: '📆' },
              { value: 'years', label: 'Years', icon: '🗓️' },
            ].map((unit) => (
              <label
                key={unit.value}
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedUnit === unit.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                    : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-blue-300 hover:shadow-sm'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  {...register("lifeDurationUnit")}
                  type="radio"
                  value={unit.value}
                  disabled={loading}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">{unit.icon}</span>
                <span className={`text-sm font-semibold ${
                  selectedUnit === unit.value
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {unit.label}
                </span>
                {selectedUnit === unit.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>
        {(errors.lifeDurationValue || errors.lifeDurationUnit) && (
          <p className="text-red-500 text-sm mt-1">
            {errors.lifeDurationValue?.message || errors.lifeDurationUnit?.message}
          </p>
        )}
      </div>

      {/* 5. Unit Price */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Unit Price <span className="text-red-500 font-bold">*</span>
        </label>
        <input
          {...register("unitPrice", {
            onChange: (e) => setUnitPrice(parseFloat(e.target.value) || 0),
          })}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</p>}
      </div>

      {/* 6. Item Code */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Item Code <span className="text-red-500 font-bold">*</span>
        </label>
        <input
          {...register("itemCode")}
          type="text"
          placeholder="Enter item code"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.itemCode && <p className="text-red-500 text-sm mt-1">{errors.itemCode.message}</p>}
      </div>

      {/* 7. Item Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Item Description <span className="text-red-500 font-bold">*</span>
        </label>
        <textarea
          {...register("description")}
          placeholder="Enter item description"
          disabled={loading}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      {/* 8. Supplier Name - Textbox */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Supplier Name <span className="text-red-500 font-bold">*</span>
        </label>
        <input
          {...register("supplierName")}
          type="text"
          placeholder="Enter supplier name"
          disabled={loading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.supplierName && <p className="text-red-500 text-sm mt-1">{errors.supplierName.message}</p>}
      </div>

      {/* 9. Product Images */}
      <MultiImageUploadField
        onImagesSelect={handleImagesSelect}
        currentImages={selectedImages}
        disabled={loading}
      />

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-slate-950 dark:hover:bg-black"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Product" : "Create Product")}
        </button>
      </div>

      {/* Required Fields Legend */}
      <div className="text-xs text-slate-500 dark:text-slate-400 pt-2">
        <span className="text-red-500 font-bold">*</span> = All fields are required
      </div>
    </form>
  );
}
