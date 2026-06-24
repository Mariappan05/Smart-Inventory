import { z } from "zod";

// ── User schemas ──────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  role: z.enum([
    "ADMIN",
    "ADMIN_MANAGER",
    "STORE_MANAGER",
    "EMPLOYEE",
    "SUB_STORE_LOGIN",
    "INWARD_PERSON",
    "OUTWARD_PERSON",
  ]).default("EMPLOYEE"),
  storeId: z.string().min(1, "Store is required"),
  employeeNo: z.string().max(50).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).toLowerCase().optional(),
  role: z
    .enum([
      "ADMIN",
      "ADMIN_MANAGER",
      "STORE_MANAGER",
      "EMPLOYEE",
      "SUB_STORE_LOGIN",
      "INWARD_PERSON",
      "OUTWARD_PERSON",
    ])
    .optional(),
  storeId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/)
    .optional(),
});

// ── Product / Item schemas ────────────────────────────────────────────────────

export const createProductSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(255).trim(),
  componentName: z.string().min(1, "Component name is required").max(255).trim(),
  componentCode: z.string().min(1, "Component code is required").max(100).trim(),
  storeId: z.string().min(1, "Store selection is required"),
  rawMaterialType: z.string().min(1, "Raw material type is required").max(100).trim(),
  rmSupplier: z.string().min(1, "RM supplier is required").max(255).trim(),
  rmPrice: z.number({ invalid_type_error: "Valid RM price is required" }).min(0),
});

// ── Supplier schemas ──────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(255).trim(),
  code: z.string().min(1, "Supplier code is required").max(50).trim(),
  contactEmail: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional(),
  address: z.string().max(1000).optional(),
  storeId: z.string().min(1, "Store is required"),
});

// ── Tool schemas ──────────────────────────────────────────────────────────────

export const createToolSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  toolName: z.string().min(1, "Tool name is required").max(255).trim(),
  toolType: z.string().max(100).optional(),
  operations: z.array(z.string()).default([]),
  supplierName: z.string().min(1, "Supplier name is required").max(255).trim(),
  supplierCode: z.string().min(1, "Supplier code is required").max(50).trim(),
  rate: z.number({ invalid_type_error: "Valid rate is required" }).min(0),
  storeId: z.string().optional(),
});

// ── Machine schemas ───────────────────────────────────────────────────────────

export const createMachineSchema = z.object({
  name: z.string().min(1, "Machine name is required").max(255).trim(),
  code: z.string().min(1, "Machine code is required").max(100).trim(),
  storeId: z.string().min(1, "Store is required"),
});

// ── Schedule schemas ──────────────────────────────────────────────────────────

export const createScheduleSchema = z.object({
  scheduleDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
  supplierId: z.string().min(1, "Supplier is required"),
  typeId: z.string().min(1, "Type is required"),
  itemId: z.string().min(1, "Item is required"),
  storeId: z.string().min(1, "Store is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  gstAmount: z.number().min(0),
  totalWithGst: z.number().min(0),
  orderDeliveryDate: z.string().min(1, "Order delivery date is required"),
  notes: z.string().max(5000).optional(),
});

// ── Production schemas ────────────────────────────────────────────────────────

export const createProductionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  machineId: z.string().optional(),
  machineName: z.string().min(1, "Machine name is required").max(255),
  machineCode: z.string().min(1, "Machine code is required").max(100),
  componentName: z.string().min(1, "Component name is required").max(255),
  componentCode: z.string().min(1, "Component code is required").max(100),
  operation: z.string().min(1, "Operation is required").max(255),
  toolName: z.string().min(1, "Tool name is required").max(255),
  productionQuantity: z.number().int().positive("Quantity must be a positive integer"),
  storeId: z.string().optional(),
});

// ── Login schema ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean().optional().default(false),
});

// ── Store schema ──────────────────────────────────────────────────────────────

export const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required").max(255).trim(),
  code: z.string().min(1, "Store code is required").max(50).trim(),
  isDefault: z.boolean().optional().default(false),
});

// ── Inward entry schema ───────────────────────────────────────────────────────

export const createInwardSchema = z.object({
  poNumber: z.string().max(100).optional(),
  invoiceNumber: z.string().max(100).optional(),
  invoiceDate: z.string().optional(),
  productDetails: z.record(z.unknown()),
  storeId: z.string().optional(),
});

// ── Helper: parse body and return a typed error response ─────────────────────

import { NextResponse } from "next/server";
import { ZodSchema } from "zod";

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return {
      error: NextResponse.json(
        {
          success: false,
          message: issues[0]?.message ?? "Validation failed",
          errors: issues,
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
