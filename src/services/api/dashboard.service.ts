import api from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  totalClients: number;
  totalModules: number;
  recentActivities: RecentActivity[];
  monthlyOverview: MonthlyOverview[];
  statusWiseCounts: StatusCount[];
}

export interface MonthlyOverview {
  month: string;
  statusCounts: StatusCount[];
}

export interface StatusCount {
  statusId: number;
  statusName: string;
  statusColor: string;
  count: number;
}

export interface RecentActivity {
  title: string;
  detail: string;
  activityDate: string;
  type: string;
}

export const dashboardService = {
  getStats: async (month?: number, year?: number): Promise<ApiResponse<DashboardStats>> => {
    const params: Record<string, number> = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;
    const response = await api.get<ApiResponse<DashboardStats>>("/Dashboard/Stats", { params });
    return response.data;
  },
  getDetailedTasks: async (statusId: number, month: number, year: number): Promise<ApiResponse<any[]>> => {
    const params = { statusId, month, year };
    const response = await api.get<ApiResponse<any[]>>("/Dashboard/DetailedTasks", { params });
    return response.data;
  }
};
