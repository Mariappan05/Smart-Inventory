import { DashboardService } from "@/services/dashboardService";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(storeId: string): Promise<DashboardData> {
  const dashboardService = new DashboardService();
  return dashboardService.fetchDashboardData(storeId);
}
