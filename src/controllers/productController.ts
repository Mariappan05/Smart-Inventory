import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthController } from "@/controllers/authController";
import { authCookieName } from "@/lib/auth/session";
import { ProductService } from "@/services/productService";
import { prisma } from "@/lib/prisma";
import { canAccessAllStores } from "@/lib/auth/permissions";
import {
  productCreateSchema,
  productUpdateSchema,
  productSearchSchema,
  productStatusSchema,
} from "@/validations/productSchemas";
import type { ProductCreateInput, ProductUpdateInput } from "@/validations/productSchemas";

const productService = new ProductService();
const authController = new AuthController();

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) return null;

  try {
    const payload = await authController.validateSession(token);
    return {
      id: payload.sub,
      role: payload.role,
      storeId: payload.storeId || null
    };
  } catch {
    return null;
  }
}

export class ProductController {
  async createProduct(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = productCreateSchema.parse(body);
      
      // Get current user to assign product to their store if not specified
      const user = await getCurrentUser();
      const storeId = validated.plantId || user?.storeId;
      
      if (!storeId) {
        return NextResponse.json(
          { success: false, message: "Store is required" },
          { status: 400 }
        );
      }

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not authenticated" },
          { status: 401 }
        );
      }
      
      // Check for duplicate serial number
      const existingProduct = await prisma.product.findUnique({
        where: { serial: validated.serial },
      });

      if (existingProduct) {
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate serial number",
            message: `Product with serial number "${validated.serial}" already exists. Please use a different serial number.`,
          },
          { status: 409 }
        );
      }
      
      const product = await productService.create({
        serial: validated.serial,
        status: "AVAILABLE",
        price: validated.price,
        type: { connect: { id: validated.typeId } },
        item: { connect: { id: validated.itemId } },
        supplier: { connect: { id: validated.supplierId } },
        store: { connect: { id: storeId } },
        createdBy: { connect: { id: user.id } }, // Save logged-in user ID
      });

      return NextResponse.json(
        { success: true, data: product },
        { status: 201 }
      );
    } catch (error) {
      console.error("Failed to create product:", error);
      if (error instanceof Error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to create product" },
        { status: 500 }
      );
    }
  }

  async updateProduct(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = productUpdateSchema.parse(body);

      const updateData: any = {};
      Object.assign(updateData, validated);

      if (validated.typeId) {
        updateData.type = { connect: { id: validated.typeId } };
        delete updateData.typeId;
      }
      if (validated.itemId) {
        updateData.item = { connect: { id: validated.itemId } };
        delete updateData.itemId;
      }
      if (validated.supplierId) {
        updateData.supplier = { connect: { id: validated.supplierId } };
        delete updateData.supplierId;
      }
      if (validated.plantId) {
        updateData.store = { connect: { id: validated.plantId } };
        delete updateData.plantId;
      }

      const product = await productService.update(id, updateData);

      return NextResponse.json(
        { success: true, data: product },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to update product" },
        { status: 500 }
      );
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await productService.delete(id);

      return NextResponse.json(
        { success: true, data: product },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to delete product" },
        { status: 500 }
      );
    }
  }

  async getProduct(id: string) {
    try {
      const product = await productService.findById(id);

      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: product },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch product" },
        { status: 500 }
      );
    }
  }

  async listProducts(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const search = url.searchParams.get("search") || "";
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

      // Get current user
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }

      // Determine storeId for filtering
      let storeId: string | undefined = undefined;
      
      if (!canAccessAllStores(user.role as any)) {
        // Non-admin users MUST have storeId assigned
        if (!user.storeId) {
          return NextResponse.json(
            { success: false, message: "User not assigned to any store. Please contact administrator." },
            { status: 403 }
          );
        }
        storeId = user.storeId;
      }
      // Admin/Admin_Manager: storeId remains undefined (see all stores)

      const result = await productService.search(search, { page, pageSize }, storeId);

      return NextResponse.json(
        { success: true, data: result },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch products" },
        { status: 500 }
      );
    }
  }

  async updateStatus(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validated = productStatusSchema.parse(body);

      const product = await productService.updateStatus(id, validated.status as any);

      return NextResponse.json(
        { success: true, data: product },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to update product status" },
        { status: 500 }
      );
    }
  }

  async getProductsByCategory(categoryId: string) {
    try {
      const products = await productService.findByCategory(categoryId);

      return NextResponse.json(
        { success: true, data: products },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch products" },
        { status: 500 }
      );
    }
  }

  async getProductsByStatus(status: string) {
    try {
      const products = await productService.findByStatus(status);

      return NextResponse.json(
        { success: true, data: products },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch products" },
        { status: 500 }
      );
    }
  }
}

export const productController = new ProductController();
