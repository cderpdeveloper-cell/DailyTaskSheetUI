import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Role {
  roleMasterId: number;
  roleName: string;
  companyId: number;
  activeStatus: number;
  roleTypeId: number;
  descriptions?: string;
}

export interface Permission {
  moduleId: number;
  name: string;
  parentId: number | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  children: Permission[];
}

export const roleService = {
  list: async (companyId: number): Promise<ApiResponse<Role[]>> => {
    const response = await axiosInstance.get<ApiResponse<Role[]>>(`/RoleMaster?companyId=${companyId}`);
    return response.data;
  },
  
  save: async (role: Partial<Role>): Promise<ApiResponse<any>> => {
    if (role.roleMasterId) {
      const response = await axiosInstance.put<ApiResponse<any>>(`/RoleMaster/${role.roleMasterId}`, role);
      return response.data;
    }
    const response = await axiosInstance.post<ApiResponse<any>>("/RoleMaster", role);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/RoleMaster/${id}`);
    return response.data;
  },

  getPermissions: async (roleId: number): Promise<ApiResponse<Permission[]>> => {
    const response = await axiosInstance.get<ApiResponse<Permission[]>>(`/RoleMasterSoftwareModules/hierarchy/${roleId}`);
    return response.data;
  },

  savePermissions: async (roleId: number, permissions: Permission[]): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>("/RoleMasterSoftwareModules/save", {
        roleId,
        permissions
    });
    return response.data;
  }
};
