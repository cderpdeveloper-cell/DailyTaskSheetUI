import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Module {
  moduleId: number;
  companyId: number;
  moduleName: string;
  parentModuleId: number | null;
  activeStatus: number;
}

export const moduleService = {
  list: async (companyId: number): Promise<ApiResponse<Module[]>> => {
    const response = await axiosInstance.get<ApiResponse<Module[]>>(`/ModuleMaster/List/${companyId}`);
    return response.data;
  },
  
  save: async (module: Partial<Module>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>("/ModuleMaster/Save", module);
    return response.data;
  },

  update: async (module: Partial<Module>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put<ApiResponse<any>>("/ModuleMaster/Update", module);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/ModuleMaster/Delete/${id}`);
    return response.data;
  }
};
