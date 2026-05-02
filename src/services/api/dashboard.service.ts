import api from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  totalClients: number;
  reportsPending: number;
  recentActivities: RecentActivity[];
  monthlyOverview: MonthlyOverview[];
  statusWiseCounts: StatusCount[];
}

export interface MonthlyOverview {
  month: string;
  statusCounts: StatusCount[];
}

export interface StatusCount {
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
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>("/Dashboard/Stats");
    return response.data;
  },
};
