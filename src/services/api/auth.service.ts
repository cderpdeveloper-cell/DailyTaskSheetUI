import axiosInstance from "./axiosInstance";
import { AuthResponse, ApiResponse } from "@/types/api.types";

export const authService = {
  login: async (credentials: any): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/Auth/login",
      credentials
    );
    return response.data;
  },
  
  signup: async (userData: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      "/Auth/SignUp",
      userData
    );
    return response.data;
  },

  refreshToken: async (accessToken: string, refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/Auth/Refresh",
      { accessToken, refreshToken }
    );
    return response.data;
  }
};
