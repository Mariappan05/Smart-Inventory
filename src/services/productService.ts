import type { ProductStatus, Prisma } from "@prisma/client";
import { ProductRepository } from "@/repositories/productRepository";
import { toServiceError } from "@/services/base/serviceError";

export class ProductService {
  constructor(private readonly productRepository = new ProductRepository()) {}

  async create(data: Prisma.ProductCreateInput) {
    try {
      return await this.productRepository.create(data);
    } catch (error) {
      throw toServiceError(error, "Failed to create product");
    }
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    try {
      return await this.productRepository.update(id, data);
    } catch (error) {
      throw toServiceError(error, "Failed to update product");
    }
  }

  async delete(id: string) {
    try {
      return await this.productRepository.delete(id);
    } catch (error) {
      throw toServiceError(error, "Failed to delete product");
    }
  }

  async findById(id: string) {
    try {
      return await this.productRepository.findById(id);
    } catch (error) {
      throw toServiceError(error, "Failed to find product by id");
    }
  }

  async findAll() {
    try {
      return await this.productRepository.findAll();
    } catch (error) {
      throw toServiceError(error, "Failed to fetch products");
    }
  }

  async search(term: string, options = {}, plantId?: string) {
    try {
      return await this.productRepository.search(term, options, plantId);
    } catch (error) {
      throw toServiceError(error, "Failed to search products");
    }
  }

  async paginate(options = {}, plantId?: string) {
    try {
      return await this.productRepository.paginate(options, plantId);
    } catch (error) {
      throw toServiceError(error, "Failed to paginate products");
    }
  }

  async updateStatus(id: string, status: ProductStatus) {
    try {
      return await this.productRepository.update(id, { status });
    } catch (error) {
      throw toServiceError(error, "Failed to update product status");
    }
  }

  async findByCategory(categoryId: string) {
    try {
      return await this.productRepository.findByCategory(categoryId);
    } catch (error) {
      throw toServiceError(error, "Failed to find products by category");
    }
  }

  async findByStatus(status: string) {
    try {
      return await this.productRepository.findByStatus(status);
    } catch (error) {
      throw toServiceError(error, "Failed to find products by status");
    }
  }
}
