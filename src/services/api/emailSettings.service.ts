import api from './axiosInstance';
import { ApiResponse } from '@/types/api.types';
import { AxiosResponse } from 'axios';

export interface EmailRecipient {
    id: number;
    email: string;
    name?: string;
    recipientType: string;
    activeStatus: boolean;
    createDate: string;
    employeeId: number;
}

export interface EmailSetting {
    emailSettingsId: number;
    smtpServer: string;
    port: number;
    senderName: string;
    senderEmail: string;
    password?: string;
    activeStatus: boolean;
    createdAt: string;
    createDate?: string;
    employeeId: number;
}

export const emailSettingsService = {
    // Recipients
    getRecipients: (employeeId: number) => 
        api.get<ApiResponse<EmailRecipient[]>>(`/EmailSettings/Recipients/${employeeId}`),
    
    saveRecipient: (data: Partial<EmailRecipient>) =>
        api.post<ApiResponse<EmailRecipient>>('/EmailSettings/Recipient/Save', data),
    
    deleteRecipient: (id: number) =>
        api.delete<ApiResponse<boolean>>(`/EmailSettings/Recipient/Delete/${id}`),
    
    // SMTP Settings
    getSmtpSettings: (employeeId: number) =>
        api.get<ApiResponse<EmailSetting>>(`/EmailSettings/Smtp/${employeeId}`),
    
    saveSmtpSettings: (data: Partial<EmailSetting>) =>
        api.post<ApiResponse<EmailSetting>>('/EmailSettings/Smtp/Save', data),
};
