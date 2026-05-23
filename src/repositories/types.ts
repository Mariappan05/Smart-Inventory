import type {
  Prisma,
  User,
  Product,
  Type,
  Supplier,
  Store,
  QrScanLog,
  SecurityAlert,
  ProductOutLog,
  ProductInLog,
} from "@prisma/client";
import type { PageOptions, PageResult } from "@/repositories/base/baseRepository";

export interface CrudRepository<T, CreateInput, UpdateInput> {
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  search(term: string, options?: PageOptions): Promise<PageResult<T>>;
  paginate(options?: PageOptions): Promise<PageResult<T>>;
}

export interface IUserRepository extends CrudRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  findByEmail(email: string): Promise<User | null>;
}

export interface IProductRepository extends CrudRepository<Product, Prisma.ProductCreateInput, Prisma.ProductUpdateInput> {}

export interface ICategoryRepository
  extends CrudRepository<Type, Prisma.TypeCreateInput, Prisma.TypeUpdateInput> {}

export interface ISupplierRepository extends CrudRepository<Supplier, Prisma.SupplierCreateInput, Prisma.SupplierUpdateInput> {}

export interface IStoreRoomRepository
  extends CrudRepository<Store, Prisma.StoreCreateInput, Prisma.StoreUpdateInput> {}

export interface IQRRepository extends CrudRepository<QrScanLog, Prisma.QrScanLogCreateInput, Prisma.QrScanLogUpdateInput> {}

export interface IMovementRepository
  extends CrudRepository<ProductOutLog, Prisma.ProductOutLogCreateInput, Prisma.ProductOutLogUpdateInput> {
  createOutLog(data: Prisma.ProductOutLogCreateInput): Promise<ProductOutLog>;
  createInLog(data: Prisma.ProductInLogCreateInput): Promise<ProductInLog>;
  findByProductId(productId: string): Promise<(ProductOutLog | ProductInLog)[]>;
  findLatestByProductId(productId: string): Promise<(ProductOutLog | ProductInLog) | null>;
}

export interface IAlertRepository
  extends CrudRepository<SecurityAlert, Prisma.SecurityAlertCreateInput, Prisma.SecurityAlertUpdateInput> {}
