import api from './axiosInstance';
import { ApiResponse } from '@/types/api.types';

export interface WorkLogTask {
    workLogTaskId?: number;
    description: string;
    statusId: number;
    isCompleted: boolean;
    status?: { statusId: number; statusName: string; statusColor?: string };
}

export interface WorkLog {
    workLogId: number;
    employeeId: number;
    companyId: number;
    clientId: number;
    projectId: number;
    workDate: string;
    inputTime: number;
    totalDuration: number;
    totalMinutes: number;
    mode: string;
    remarks?: string;
    otherEmployeeIds?: string;
    statusId: number;
    activeStatus: number;
    createDate: string;
    isEmailSent: boolean;
    emailSentDate?: string;
    client?: { clientId: number; clientName: string };
    project?: { projectId: number; projectName: string; projectColor?: string };
    tasks: WorkLogTask[];
}

export interface WorkLogCreateDTO {
    clientId: number;
    projectId: number;
    workDate: string;
    inputTime: number;
    mode: string;
    statusId: number;
    remarks?: string;
    otherEmployeeIds?: string;
    tasks: { description: string; statusId: number; isCompleted: boolean }[];
}

export interface WorkReportSessionDTO {
    workDate: string;
    logs: WorkLogCreateDTO[];
}

export const workLogService = {
    getLogs: (employeeId?: number) => 
        api.get<ApiResponse<WorkLog[]>>(`/WorkLogs/List${employeeId ? `/${employeeId}` : ''}`),
    
    getLogsByDate: (date: string, employeeId?: number) =>
        api.get<ApiResponse<WorkLog[]>>(`/WorkLogs/ByDate/${date}${employeeId ? `/${employeeId}` : ''}`),
    
    getLog: (id: number) =>
        api.get<ApiResponse<WorkLog>>(`/WorkLogs/${id}`),
    
    saveLog: (data: WorkLogCreateDTO) =>
        api.post<ApiResponse<WorkLog>>('/WorkLogs/Save', data),
    
    saveSession: (data: WorkReportSessionDTO) =>
        api.post<ApiResponse<boolean>>('/WorkLogs/SaveSession', data),
    
    deleteSession: (date: string) =>
        api.delete<ApiResponse<boolean>>(`/WorkLogs/DeleteSession/${date}`),
    
    updateLog: (id: number, data: WorkLogCreateDTO) =>
        api.put<ApiResponse<boolean>>(`/WorkLogs/Update/${id}`, data),
    
    deleteLog: (id: number) =>
        api.delete<ApiResponse<boolean>>(`/WorkLogs/Delete/${id}`),
    
    sendEmail: (id: number) =>
        api.post<ApiResponse<boolean>>(`/WorkLogs/${id}/send-email`),

    previewEmail: (id: number) =>
        api.get<ApiResponse<string>>(`/WorkLogs/${id}/preview-email`),
};
