import api from './axiosInstance';
import { ApiResponse } from '@/types/api.types';

export interface TimeLog {
    id: number;
    inTime: string;
    outTime: string;
    totalMinutes: number;
    decimalHours: number;
    hours: number;
    minutes: number;
    is30MinBreak: boolean;
}

export interface WorkEntry {
    id: number;
    srNo: number;
    title: string;
    projectId: number;
    statusId: number;
    moduleId?: number;
    description: string;
    timeLogs: TimeLog[];
    project?: { projectId: number; projectName: string; projectColor?: string };
    status?: { statusId: number; statusName: string; statusColor?: string };
}

export interface WorkReport {
    id: number;
    reportDate: string;
    works: WorkEntry[];
    createdAt: string;
    updatedAt?: string;
}

export interface SaveReportDTO {
    reportDate: string;
    works: {
        srNo: number;
        title: string;
        projectId: number;
        statusId: number;
        moduleId?: number;
        description?: string;
        timeLogs: { inTime: string; outTime: string; is30MinBreak: boolean }[];
    }[];
}

export const taskSheetService = {
    getReports: (employeeId: number) => 
        api.get<ApiResponse<WorkReport[]>>(`/Reports/List/${employeeId}`),
    
    getReport: (id: number) =>
        api.get<ApiResponse<WorkReport>>(`/Reports/${id}`),
    
    saveReport: (data: SaveReportDTO) =>
        api.post<ApiResponse<WorkReport>>('/Reports/Save', data),
    
    updateReport: (id: number, data: SaveReportDTO) =>
        api.put<ApiResponse<boolean>>(`/Reports/Update/${id}`, data),
    
    deleteReport: (id: number) =>
        api.delete<ApiResponse<boolean>>(`/Reports/Delete/${id}`),
    
    sendEmail: (id: number) =>
        api.post<ApiResponse<boolean>>(`/Reports/${id}/send-email`),
};
