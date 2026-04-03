import axiosInstance from "./axiosInstance";
import { ApiResponse, Company } from "@/types/api.types";

export const companyService = {
  getById: async (id: number): Promise<ApiResponse<Company>> => {
    const response = await axiosInstance.get<ApiResponse<Company>>(`/CompanyMaster/${id}`);
    return response.data;
  },
  
  save: async (formData: FormData): Promise<ApiResponse<any>> => {
    // Multipart upload for logo
    const response = await axiosInstance.post<ApiResponse<any>>("/CompanyMaster", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  update: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put<ApiResponse<any>>("/CompanyMaster", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
};
