import axiosInstance from "./axiosInstance";
import { ApiResponse, MenuItem } from "@/types/api.types";

export const menuService = {
  getMenu: async (roleId: number, isTenant: boolean = false): Promise<ApiResponse<MenuItem[]>> => {
    // Explicitly pass isTenant as boolean in the path
    const response = await axiosInstance.get<ApiResponse<MenuItem[]>>(`/Menu/${roleId}/${isTenant}`);
    return response.data;
  }
};
