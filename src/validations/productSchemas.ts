import { z } from "zod";

export const productCreateSchema = z.object({
  serial: z.string().min(1, "Serial number is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  typeId: z.string().min(1, "Type is required"),
  itemId: z.string().min(1, "Item is required"),
  plantId: z.string().min(1, "Store is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  rawMaterialType: z.string().min(1, "Raw material type is required"),
  rmSupplier: z.string().min(1, "RM supplier is required"),
  rmPrice: z.coerce.number().positive("RM price must be greater than 0"),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_STOCK"]).optional(),
  typeId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
});

export const productStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_STOCK"]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type ProductStatusInput = z.infer<typeof productStatusSchema>;