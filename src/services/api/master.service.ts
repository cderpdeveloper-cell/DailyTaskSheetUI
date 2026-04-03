import axiosInstance from "./axiosInstance";
import { ApiResponse, LookupData } from "@/types/api.types";

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
  countryId: number;
}

export const masterService = {
  getCountries: async (): Promise<ApiResponse<Country[]>> => {
    const response = await axiosInstance.get<ApiResponse<Country[]>>("/MasterData/countries");
    return response.data;
  },
  
  getStates: async (countryId: number): Promise<ApiResponse<State[]>> => {
    const response = await axiosInstance.get<ApiResponse<State[]>>(`/MasterData/states/${countryId}`);
    return response.data;
  },

  getLookups: async (typeName: string): Promise<ApiResponse<LookupData[]>> => {
    const response = await axiosInstance.get<ApiResponse<LookupData[]>>(`/MasterData/lookups/${typeName}`);
    return response.data;
  }
};
