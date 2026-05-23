import { getDashboardSnapshot } from "@/repositories/productRepository";
import type { DashboardData } from "@/types/dashboard";

export class DashboardService {
  async fetchDashboardData(storeId: string | null): Promise<DashboardData> {
    return getDashboardSnapshot(storeId);
  }
}
