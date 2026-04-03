import api from "./axiosInstance";
import { ApiResponse } from "@/types/api.types";

export interface MailTemplate {
  id: number;
  templateName: string;
  subjectFormat: string;
  headerHtml?: string;
  bodyHtml: string;
  footerHtml?: string;
  companyId: number;
  employeeId?: number;
  activeStatus: number;
  tableConfigJson?: string;
}

export const mailTemplateService = {
  getTemplate: (companyId: number, employeeId?: number, templateName?: string) => 
    api.get<ApiResponse<MailTemplate>>(`/MailTemplate/GetTemplate/${companyId}${employeeId ? `/${employeeId}` : ''}${templateName ? `?templateName=${encodeURIComponent(templateName)}` : ''}`),
  
  saveTemplate: (data: Partial<MailTemplate>) => 
    api.post<ApiResponse<boolean>>("/MailTemplate/Save", data),
  
  deleteTemplate: (id: number) => 
    api.delete<ApiResponse<boolean>>(`/MailTemplate/Delete/${id}`),
};
