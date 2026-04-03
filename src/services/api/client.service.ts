import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Client {
  clientId: number;
  companyId: number;
  clientName: string;
  clientShortCode: string | null;
  activeStatus: number;
}

export const clientService = {
  list: async (companyId: number): Promise<ApiResponse<Client[]>> => {
    const response = await axiosInstance.get<ApiResponse<Client[]>>(`/ClientMaster/List/${companyId}`);
    return response.data;
  },
  
  save: async (client: Partial<Client>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>("/ClientMaster/Save", client);
    return response.data;
  },

  update: async (client: Partial<Client>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put<ApiResponse<any>>("/ClientMaster/Update", client);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/ClientMaster/Delete/${id}`);
    return response.data;
  }
};
