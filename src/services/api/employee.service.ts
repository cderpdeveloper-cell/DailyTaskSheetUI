import axiosInstance from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface Employee {
  employeeId: number;
  companyId: number;
  roleMasterId: number | null;
  employeeName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  mobileNo: string | null;
  genderId: number | null;
  activeStatus: number;
  employeeCode: number;
  employeePhotoFile: string | null;
  passwords?: string;
  isAllowLogin: boolean;
}

export const employeeService = {
  list: async (companyId: number): Promise<ApiResponse<Employee[]>> => {
    const response = await axiosInstance.get<ApiResponse<Employee[]>>(`/EmployeeMaster/list/${companyId}`);
    return response.data;
  },
  
  save: async (employee: Partial<Employee>): Promise<ApiResponse<any>> => {
    if (employee.employeeId && employee.employeeId > 0) {
        const response = await axiosInstance.put<ApiResponse<any>>("/EmployeeMaster/update", employee);
        return response.data;
    } else {
        const response = await axiosInstance.post<ApiResponse<any>>("/EmployeeMaster/save", employee);
        return response.data;
    }
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/EmployeeMaster/${id}`);
    return response.data;
  }
};
