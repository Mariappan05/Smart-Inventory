import { getDashboardSnapshot } from "@/repositories/productRepository";
import type { DashboardData } from "@/types/dashboard";

export class DashboardService {
  async fetchDashboardData(storeId: string): Promise<DashboardData> {
    return getDashboardSnapshot(storeId);
  }
}
