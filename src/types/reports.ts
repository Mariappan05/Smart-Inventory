export type ReportType = "productHistory" | "schedule" | "request";

export type ReportFilters = {
  type: ReportType;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  storeId?: string;
  customerName?: string;
  supplierName?: string;
  componentName?: string;
  componentCode?: string;
  productName?: string;
  planNumber?: string;
  status?: string;
  userName?: string;
  machineName?: string;
};

export type ReportMeta = {
  type: ReportType;
  title: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  generatedAt: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type ProductHistoryRow = {
  storeName: string;
  storeCode: string;
  customerName: string;
  supplierName: string;
  componentName: string;
  componentCode: string;
  productName: string;
  productCode: string;
  rawMaterialType: string;
  rmSupplier: string;
  rmPrice: string;
  createdBy: string;
  createdDate: string;
};

export type ScheduleReportRow = {
  planNumber: string;
  storeName: string;
  customerName: string;
  supplierName: string;
  componentName: string;
  componentCode: string;
  toolName: string;
  quantity: number;
  planDate: string;
  status: string;
  createdBy: string;
  createdDate: string;
};

export type RequestReportRow = {
  requestNumber: string;
  storeName: string;
  storeCode: string;
  userName: string;
  componentName: string;
  componentCode: string;
  machineName: string;
  machineCode: string;
  requestedQuantity: number;
  approvedQuantity: string;
  status: string;
  createdDate: string;
};

export type ReportDataset =
  | { type: "productHistory"; rows: ProductHistoryRow[] }
  | { type: "schedule"; rows: ScheduleReportRow[] }
  | { type: "request"; rows: RequestReportRow[] };
