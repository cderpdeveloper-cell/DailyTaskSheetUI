import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Status {
  statusId: number;
  companyId: number;
  statusName: string;
  statusColor: string | null;
  activeStatus: number;
}

export const statusService = {
  list: async (companyId: number): Promise<ApiResponse<Status[]>> => {
    const response = await axiosInstance.get<ApiResponse<Status[]>>(`/StatusMaster/List/${companyId}`);
    return response.data;
  },
  
  save: async (status: Partial<Status>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>("/StatusMaster/Save", status);
    return response.data;
  },

  update: async (status: Partial<Status>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put<ApiResponse<any>>("/StatusMaster/Update", status);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/StatusMaster/Delete/${id}`);
    return response.data;
  }
};
