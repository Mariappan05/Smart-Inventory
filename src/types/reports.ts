export type ReportType = "machines" | "movement" | "alerts" | "employees";

export type ReportFilters = {
  type: ReportType;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
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

export type MachineReportRow = {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  category: string;
  supplier: string;
  storeRoom: string;
  serial: string;
  purchaseDate: string | null;
  updatedAt: string;
};

export type MovementReportRow = {
  id: string;
  machine: string;
  assetTag: string;
  movementType: string;
  fromStoreRoom: string;
  toStoreRoom: string;
  employee: string;
  notes: string;
  movedAt: string;
};

export type AlertReportRow = {
  id: string;
  machine: string;
  assetTag: string;
  title: string;
  severity: string;
  status: string;
  reportedBy: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type EmployeeActivityRow = {
  id: string;
  employee: string;
  employeeNo: string;
  activityType: string;
  machine: string;
  detail: string;
  occurredAt: string;
};

export type ReportDataset =
  | { type: "machines"; rows: MachineReportRow[] }
  | { type: "movement"; rows: MovementReportRow[] }
  | { type: "alerts"; rows: AlertReportRow[] }
  | { type: "employees"; rows: EmployeeActivityRow[] };
