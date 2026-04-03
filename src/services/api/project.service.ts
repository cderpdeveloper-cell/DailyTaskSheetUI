import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Project {
  projectId: number;
  companyId: number;
  projectName: string;
  projectColor: string | null;
  activeStatus: number;
  createDate: string | null;
}

export const projectService = {
  list: async (companyId: number): Promise<ApiResponse<Project[]>> => {
    const response = await axiosInstance.get<ApiResponse<Project[]>>(`/ProjectMaster/List/${companyId}`);
    return response.data;
  },
  
  save: async (project: Partial<Project>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>("/ProjectMaster/Save", project);
    return response.data;
  },

  update: async (project: Partial<Project>): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put<ApiResponse<any>>("/ProjectMaster/Update", project);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/ProjectMaster/Delete/${id}`);
    return response.data;
  }
};
