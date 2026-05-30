"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { emailSettingsService, EmailRecipient, EmailSetting } from "@/services/api/emailSettings.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { Switch } from "@/components/ui/Switch";
import {
  Mail, Settings, Plus, Trash2, Shield, Server, Hash, User, Lock, Send, AlertCircle,
  Layout, FileText, Code, Eye, Layers, Palette, User as UserIcon, Info, Save
} from "lucide-react";
import { mailTemplateService, MailTemplate } from "@/services/api/mailTemplate.service";
import { menuService } from "@/services/api/menu.service";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { MenuItem } from "@/types/api.types";

// Zod Schemas
const smtpSchema = z.object({
  smtpServer: z.string().min(2, "SMTP Server is required"),
  port: z.coerce.number().min(1, "Port is required"),
  senderName: z.string().min(2, "Sender Name is required"),
  senderEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  activeStatus: z.boolean().default(true),
});

const recipientSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  recipientType: z.string().min(1, "Type is required"),
  activeStatus: z.boolean().default(true),
});

const templateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  subjectFormat: z.string().min(1, "Subject format is required"),
  bodyHtml: z.string().min(10, "Template content is too short"),
  tableConfigJson: z.string().optional(),
});

type SmtpFormValues = z.infer<typeof smtpSchema>;
type RecipientFormValues = z.infer<typeof recipientSchema>;
type TemplateFormValues = z.infer<typeof templateSchema>;

const getErrorMessage = (err: any) => {
  if (err.response?.data?.errors) {
    return Object.values(err.response.data.errors).flat().join(", ");
  }
  return err.response?.data?.message || err.message || "An unexpected error occurred";
};

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const employeeId = user?.employeeID || 1;
  const companyId = user?.companyId || 1;
  const confirm = useConfirmStore((state) => state.confirm);

  const { canCreate, canEdit, canDelete } = usePagePermissions("emailsettings");

  const roleId = useMemo(() => {
    if (!user) return 1;
    // @ts-ignore
    const id = user.roleId !== undefined && user.roleId !== null ? user.roleId : (user.RoleId ?? user.RoleMasterId ?? user.EmployeeID);
    return id !== undefined && id !== null ? Number(id) : 1;
  }, [user]);

  const isTenant = !!user?.isTenant;

  const { data: menuData = [], isSuccess: isMenuSuccess } = useQuery({
    queryKey: ["menu", roleId, isTenant],
    queryFn: async () => {
      const res = await menuService.getMenu(roleId, isTenant);
      return res.data || [];
    },
  });

  const hasModuleRight = (moduleId: number, menus: MenuItem[] = []): boolean => {
    for (const menu of menus) {
      if (menu.moduleId === moduleId) return true;
      if (menu.subMenus && menu.subMenus.length > 0) {
        if (hasModuleRight(moduleId, menu.subMenus)) return true;
      }
    }
    return false;
  };

  const hasWorkReportRight = hasModuleRight(5044, menuData);
  const hasDailyTaskRight = hasModuleRight(5043, menuData);

  const [activeTab, setActiveTab] = useState<'general' | 'template'>('template');
  const [reportContext, setReportContext] = useState<'workReport' | 'dailyTask'>('workReport');

  useEffect(() => {
    if (isMenuSuccess) {
      if (!hasWorkReportRight && !hasDailyTaskRight) {
        if (activeTab === 'template') setActiveTab('general');
      } else if (!hasWorkReportRight && hasDailyTaskRight && reportContext === 'workReport') {
        setReportContext('dailyTask');
      } else if (!hasDailyTaskRight && hasWorkReportRight && reportContext === 'dailyTask') {
        setReportContext('workReport');
      }
    }
  }, [isMenuSuccess, hasWorkReportRight, hasDailyTaskRight, reportContext, activeTab]);

  const CONTEXT_LABELS = {
    workReport: "Daily Work Report",
    dailyTask: "Daily Task Sheet"
  };
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

  // Queries
  const { data: smtpData } = useQuery({
    queryKey: ["smtpSettings", employeeId],
    queryFn: () => emailSettingsService.getSmtpSettings(employeeId),
    select: (res) => res.data.data,
  });

  const { data: recipients = [], isLoading: isRecipientsLoading } = useQuery({
    queryKey: ["emailRecipients", employeeId],
    queryFn: () => emailSettingsService.getRecipients(employeeId),
    select: (res) => res.data.data || [],
  });

  const { data: templateData } = useQuery({
    queryKey: ["mailTemplate", companyId, employeeId, reportContext],
    queryFn: () => mailTemplateService.getTemplate(companyId, employeeId, CONTEXT_LABELS[reportContext]),
    select: (res) => res.data.data,
    enabled: activeTab === 'template'
  });

  // Forms
  const smtpForm = useForm<SmtpFormValues>({ resolver: zodResolver(smtpSchema) });
  const recipientForm = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientSchema),
    defaultValues: { recipientType: 'To', activeStatus: true }
  });
  const templateForm = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema) });

  // Populate SMTP form
  useEffect(() => {
    if (smtpData) {
      smtpForm.reset({
        smtpServer: smtpData.smtpServer || "",
        port: smtpData.port || 587,
        senderName: smtpData.senderName || "",
        senderEmail: smtpData.senderEmail || "",
        password: smtpData.password || "",
        activeStatus: smtpData.activeStatus ?? true,
      });
    }
  }, [smtpData, smtpForm]);

  // Mutations
  const smtpMutation = useMutation({
    mutationFn: (data: SmtpFormValues) =>
      emailSettingsService.saveSmtpSettings({ ...data, employeeId, emailSettingsId: smtpData?.emailSettingsId || 0 }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["smtpSettings", employeeId] });
      toast.success(res.data.message || "SMTP settings updated!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const recipientMutation = useMutation({
    mutationFn: (data: RecipientFormValues) =>
      emailSettingsService.saveRecipient({ ...data, employeeId, id: 0 }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["emailRecipients", employeeId] });
      setIsRecipientModalOpen(false);
      recipientForm.reset();
      toast.success(res.data.message || "Recipient added!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const lastLoadedContextRef = useRef<string | null>(null);

  const DEFAULT_WORK_REPORT_HTML = `
<table border="1" style="width:100%; border-collapse: collapse; border: 1.5px solid #333; font-family: Arial, sans-serif; font-size: 14px;">
  <thead>
    <tr style="background:#fff; font-weight: bold;">
      <th style="border: 1.5px solid #333; padding: 12px; width: 40px; text-align: center;">SR</th>
      <th style="border: 1.5px solid #333; padding: 12px; text-align: left;">Client Name</th>
      <th style="border: 1.5px solid #333; padding: 12px; text-align: left;">Task Description</th>
      <th style="border: 1.5px solid #333; padding: 12px; width: 110px; text-align: center;">Status</th>
      <th style="border: 1.5px solid #333; padding: 12px; width: 80px; text-align: center;">Time</th>
    </tr>
  </thead>
  <tbody>
    {{#Rows}}
      {{#FirstLog}}
      <tr>
        <td rowspan="{{RowSpan}}" style="border: 1.5px solid #333; padding: 12px; text-align: center; vertical-align: top;">{{SrNo}}</td>
        <td rowspan="{{RowSpan}}" style="border: 1.5px solid #333; padding: 12px; vertical-align: top;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #b91c1c;">
               {{ClientName}} 
            </div>
            <div style="font-size: 13px; color: #333;">
               <span style="color: #3b82f6;">({{Mode}})</span>
            </div>
            <div style="font-size: 13px; color: #333;">
               <span style="color: #3b82f6;">{{Team}}</span>
            </div>
        </td>
        <td style="border: 1.5px solid #333; padding: 12px; vertical-align: top;">
            <div style="color: #1e293b; font-size: 14px;">
               {{Description}}
            </div>
        </td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center; vertical-align: top;">
            {{StatusName}}
        </td>
        <td rowspan="{{RowSpan}}" style="border: 1.5px solid #333; padding: 12px; text-align: center; font-weight: bold; vertical-align: top;">{{Time}}</td>
      </tr>
      {{/FirstLog}}
      {{#OtherLogs}}
      <tr>
        <td style="border: 1.5px solid #333; padding: 12px; vertical-align: top;">
            <div style="color: #1e293b; font-size: 14px;">
               {{Description}}
            </div>
        </td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center; vertical-align: top;">
            {{StatusName}}
        </td>
      </tr>
      {{/OtherLogs}}
    {{/Rows}}
  </tbody>
</table>
  `.trim();

  const DEFAULT_DAILY_TASK_HTML = `
<table border="1" style="width:100%; border-collapse: collapse; border: 1.5px solid #333; font-family: Arial, sans-serif; font-size: 16px;">
  <thead>
    <tr style="background:#fff; font-weight: bold;">
      <th style="border: 1.5px solid #333; padding: 12px; width: 40px; text-align: center;">SR</th>
      <th style="border: 1.5px solid #333; padding: 12px; text-align: left;">Work</th>
      <th style="border: 1.5px solid #333; padding: 12px; width: 80px; text-align: center;">Start</th>
      <th style="border: 1.5px solid #333; padding: 12px; width: 80px; text-align: center;">End</th>
      <th style="border: 1.5px solid #333; padding: 12px; width: 80px; text-align: center;">Hours</th>
    </tr>
  </thead>
  <tbody>
    {{#Rows}}
      {{#FirstLog}}
      <tr>
        <td rowspan="{{RowSpan}}" style="border: 1.5px solid #333; padding: 12px; text-align: center; vertical-align: top;">{{SrNo}}</td>
        <td rowspan="{{RowSpan}}" style="border: 1.5px solid #333; padding: 12px; vertical-align: top;">
            <div style="font-weight: bold; margin-bottom: 5px;">
               {{Title}} 
               <span style="color: #2ecc71;">{{Project}}</span>
               <span style="color: #3b82f6;">{{Status}}</span>
            </div>
            <div style="font-size: 14px; color: #333;">
               {{Description}}
            </div>
        </td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center;">{{StartTime}}</td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center;">{{EndTime}}</td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center; font-weight: bold;">{{Duration}}</td>
      </tr>
      {{/FirstLog}}
      {{#OtherLogs}}
      <tr>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center;">{{StartTime}}</td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center;">{{EndTime}}</td>
        <td style="border: 1.5px solid #333; padding: 12px; text-align: center; font-weight: bold;">{{Duration}}</td>
      </tr>
      {{/OtherLogs}}
    {{/Rows}}
  </tbody>
</table>
`.trim();

  const templateMutation = useMutation({
    mutationFn: (data: TemplateFormValues) =>
      mailTemplateService.saveTemplate({
        ...data,
        companyId,
        employeeId,
        id: templateData?.id || 0
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailTemplate", companyId, employeeId] });
      toast.success("Personal template saved successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  useEffect(() => {
    // Populate or reset form when data arrives or context switches
    const currentContext = `personal-${reportContext}-${templateData?.id || 'new'}`;
    if (lastLoadedContextRef.current !== currentContext) {
      templateForm.reset({
        templateName: templateData?.templateName || CONTEXT_LABELS[reportContext],
        subjectFormat: templateData?.subjectFormat || (reportContext === 'workReport' ? "Daily Work Report - {{Date}}" : "Daily Task Sheet - {{Date}}"),
        bodyHtml: templateData?.bodyHtml || (reportContext === 'workReport' ? DEFAULT_WORK_REPORT_HTML : DEFAULT_DAILY_TASK_HTML),
        tableConfigJson: templateData?.tableConfigJson || JSON.stringify({ srNo: true, project: true, status: true, title: true, description: true, inTime: true, outTime: true, duration: true, mode: true, team: true }),
      });
      lastLoadedContextRef.current = currentContext;
    }
  }, [templateData, templateForm, reportContext]);

  const headerFields = [
    { label: 'Report Date', placeholder: '{{Date}}' },
    { label: 'Employee Name', placeholder: '{{EmployeeName}}' },
  ];

  const workReportFields = [
    { label: 'Client', placeholder: '{{ClientName}}' },
    { label: 'Project', placeholder: '{{ProjectName}}' },
    { label: 'Input Time', placeholder: '{{Time}}' },
    { label: 'Session Mode', placeholder: '{{Mode}}' },
    { label: 'Team Members', placeholder: '{{Team}}' },
    { label: 'Description', placeholder: '{{Description}}' },
    { label: 'Status', placeholder: '{{StatusName}}' },
    { label: 'Desc + Status', placeholder: '{{DescriptionStatus}}' }
  ];

  const dailyTaskFields = [
    { label: 'Project', placeholder: '{{Project}}' },
    { label: 'Work Title', placeholder: '{{Title}}' },
    { label: 'Work Description', placeholder: '{{Description}}' },
    { label: 'Status', placeholder: '{{Status}}' },
    { label: 'Start Time', placeholder: '{{StartTime}}' },
    { label: 'End Time', placeholder: '{{EndTime}}' },
    { label: 'Duration', placeholder: '{{Duration}}' },
    { label: 'Desc + Status', placeholder: '{{DescriptionStatus}}' }
  ];

  const loopTags = [
    { label: 'Start Rows', placeholder: '{{#Rows}}' },
    { label: 'End Rows', placeholder: '{{/Rows}}' },
    { label: 'Print Once Only', placeholder: '{{#FirstLog}}' },
    { label: 'End Once Only', placeholder: '{{/FirstLog}}' },
    { label: 'Start Other Logs', placeholder: '{{#OtherLogs}}' },
    { label: 'End Other Logs', placeholder: '{{/OtherLogs}}' },
    { label: 'Row Span', placeholder: '{{RowSpan}}' },
    { label: 'Serial No', placeholder: '{{SrNo}}' }
  ];

  const insertPlaceholder = (placeholder: string) => {
    const current = templateForm.getValues("bodyHtml");
    templateForm.setValue("bodyHtml", current + placeholder);
    toast.info(`Inserted ${placeholder}`);
  };

  const columns = [
    {
      header: "Recipient Name & Email",
      accessor: (item: EmailRecipient) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {item.name?.[0] || item.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">{item.name || "Unnamed Recipient"}</div>
            <div className="text-[10px] text-gray-400 font-mono tracking-widest leading-none mt-1 uppercase">{item.email}</div>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      accessor: (item: EmailRecipient) => (
        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${item.recipientType === 'CC' ? 'bg-orange-50 text-orange-600' :
          item.recipientType === 'BCC' ? 'bg-purple-50 text-purple-600' :
            'bg-blue-50 text-blue-600'
          }`}>
          {item.recipientType}
        </span>
      )
    },
    {
      header: "Status",
      accessor: (item: EmailRecipient) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
          item.activeStatus ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        )}>
          {item.activeStatus ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (item: EmailRecipient) => {

        return (
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => {
                  confirm({
                    title: "Remove Recipient?",
                    message: `Are you sure you want to remove ${item.email}? They will no longer receive automated reports.`,
                    variant: "danger",
                    confirmText: "Remove Now",
                    onConfirm: () => {
                      emailSettingsService.deleteRecipient(item.id).then(() => {
                        queryClient.invalidateQueries({ queryKey: ["emailRecipients", employeeId] });
                        toast.success("Recipient removed successfully");
                      });
                    }
                  });
                }}
                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Delivery Control
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure SMTP, target recipients, and dynamic email styling.</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            General Settings
          </button>
          {(hasWorkReportRight || hasDailyTaskRight) && (
            <button
              onClick={() => setActiveTab('template')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'template' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Output Template
            </button>
          )}
        </div>
      </div>

      {activeTab === 'general' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">SMTP Gateway</h3>
              </div>
              <form onSubmit={smtpForm.handleSubmit((data) => smtpMutation.mutate(data))} className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", smtpForm.watch("activeStatus") ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-400")}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Email Service</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{smtpForm.watch("activeStatus") ? "Active & Ready" : "Currently Paused"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={smtpForm.watch("activeStatus")}
                    onChange={(checked: boolean) => smtpForm.setValue("activeStatus", checked)}
                  />
                </div>
                <Input {...smtpForm.register("smtpServer")} label="SMTP Server" placeholder="smtp.gmail.com" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Input {...smtpForm.register("port")} label="Port" type="number" />
                  </div>
                  <div className="col-span-2">
                    <Input {...smtpForm.register("senderName")} label="Display Name" />
                  </div>
                </div>
                <Input {...smtpForm.register("senderEmail")} label="Sender Email" />
                <Input {...smtpForm.register("password")} label="App Password" type="password" />
                {canEdit && (
                  <Button type="submit" className="w-full h-12 text-xs font-bold bg-slate-800 rounded-xl shadow-lg shadow-slate-200" isLoading={smtpMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" /> Save Configuration
                  </Button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Broadcast Targets</h3>
                {canCreate && (
                  <Button variant="outline" size="sm" onClick={() => setIsRecipientModalOpen(true)} className="h-8 text-[9px] font-black tracking-[0.2em]"><Plus className="w-3 h-3" /> ADD TARGET</Button>
                )}
              </div>
              <Table data={recipients} columns={columns} isLoading={isRecipientsLoading} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Template Studio</h3>
                {canEdit && (
                  <Button onClick={templateForm.handleSubmit(data => templateMutation.mutate(data))} isLoading={templateMutation.isPending} className="bg-slate-800 hover:bg-slate-900 text-white h-8 px-4 rounded text-[9px] font-black uppercase tracking-widest gap-2">
                    <Save className="w-3.5 h-3.5" /> Save Format
                  </Button>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-4 p-1 bg-slate-100 rounded-lg w-full">
                  {hasWorkReportRight && (
                    <button
                      onClick={() => setReportContext('workReport')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                        reportContext === 'workReport' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Work Report Mode
                    </button>
                  )}
                  {hasDailyTaskRight && (
                    <button
                      onClick={() => setReportContext('dailyTask')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                        reportContext === 'dailyTask' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Daily Task Sheet Mode
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Internal Format Name</label>
                    <input {...templateForm.register("templateName")} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-slate-800 focus:ring-0 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Automatic Email Subject</label>
                    <input {...templateForm.register("subjectFormat")} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-slate-800 focus:ring-0 outline-none" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 text-slate-400">Step 1: Universal Headers & Logic</p>
                      <div className="flex flex-wrap gap-1.5">
                        {headerFields.map((f, i) => (
                          <button key={i} type="button" onClick={() => insertPlaceholder(f.placeholder)} className="px-3 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-400 hover:border-slate-800 transition-all">
                            {f.label}
                          </button>
                        ))}
                        {loopTags.map((f, i) => (
                          <button key={i} type="button" onClick={() => insertPlaceholder(f.placeholder)} className="px-3 py-1 bg-slate-800 text-white rounded-md text-[10px] font-bold hover:bg-black transition-all">
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest mb-3 ml-1",
                        reportContext === 'workReport' ? "text-blue-600" : "text-emerald-600"
                      )}>
                        Step 2: {reportContext === 'workReport' ? 'Entries (Work Report)' : 'Tasks (Daily Sheet)'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(reportContext === 'workReport' ? workReportFields : dailyTaskFields).map((f, i) => (
                          <button key={i} type="button" onClick={() => insertPlaceholder(f.placeholder)} className={cn(
                            "px-3 py-1 bg-white border rounded-md text-[10px] font-bold transition-all",
                            reportContext === 'workReport' ? "text-blue-600 border-blue-100 hover:border-blue-600" : "text-emerald-600 border-emerald-100 hover:border-emerald-600"
                          )}>
                            {f.label} <span className="opacity-40 font-mono font-medium ml-1">{f.placeholder}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <textarea
                    {...templateForm.register("bodyHtml")}
                    className="w-full min-h-[450px] p-6 font-mono text-xs bg-slate-50 text-slate-600 rounded-xl border border-slate-200 focus:ring-1 focus:ring-slate-800 shadow-inner resize-none"
                    placeholder="<html>...</html>"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col gap-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context Guide</div>
              <div className="space-y-4">
                {reportContext === 'workReport' ? (
                  <section className="animate-in slide-in-from-right-4 duration-300">
                    <h4 className="text-[10px] font-bold text-blue-300 uppercase mb-2">Work Report Context</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">Focus on Client, Project, and Session Mode tags. This matches your high-level WorkLog entries.</p>
                  </section>
                ) : (
                  <section className="animate-in slide-in-from-right-4 duration-300">
                    <h4 className="text-[10px] font-bold text-emerald-300 uppercase mb-2">Daily Task Context</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">Focus on Project Name and individual Task Titles. This matches your detailed activity list.</p>
                  </section>
                )}
                <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 leading-relaxed">
                  Click a tag to insert it. Both modes use the same HTML body.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Live Output</h3>
              </div>
              <div className="p-4 flex-1 bg-slate-100/30 overflow-auto">
                <div className="bg-white shadow-sm rounded-lg mx-auto w-full border border-slate-100 overflow-hidden">
                  <div className="p-3 border-b border-slate-50 text-[9px] font-bold bg-slate-50/50 text-slate-400">
                    {reportContext === 'workReport' ? 'Preview: Work Report' : 'Preview: Daily Task Sheet'}
                  </div>
                  <div className="p-6">
                    <div className="transform scale-[0.8] origin-top" dangerouslySetInnerHTML={{
                      __html: templateForm.watch("bodyHtml")
                        ?.replace(/{{Date}}/g, "30/03/2026")
                        ?.replace(/{{ClientName}}/g, "Client Name")
                        ?.replace(/{{ProjectName}}/g, "Project Name")
                        ?.replace(/{{Time}}/g, "2.5")
                        ?.replace(/{{StatusName}}/g, "Running")
                        ?.replace(/{{Description}}/g, "• Task detail here...")
                        ?.replace(/{{DescriptionStatus}}/g, "• Task detail here... - Running")
                        ?.replace(/{{Status}}/g, "Running")
                        ?.replace(/{{TasksTable}}/g, "Table Preview...") || ""
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isRecipientModalOpen} onClose={() => setIsRecipientModalOpen(false)} title="Add Email Target" size="md">
        <form onSubmit={recipientForm.handleSubmit((data) => recipientMutation.mutate(data))} className="space-y-4">
          <Input {...recipientForm.register("email")} label="Recipient Address" icon={<Mail className="w-4 h-4" />} error={recipientForm.formState.errors.email?.message} />
          <Input {...recipientForm.register("name")} label="Alias" icon={<UserIcon className="w-4 h-4" />} error={recipientForm.formState.errors.name?.message} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-8 italic">DELIVERY PRIORITY</label>
            <select {...recipientForm.register("recipientType")} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold transition-all text-gray-600">
              <option value="To">Normal (To)</option>
              <option value="CC">Carbon Copy (CC)</option>
              <option value="BCC">Blind Copy (BCC)</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className={cn("w-4 h-4", recipientForm.watch("activeStatus") ? "text-emerald-500" : "text-gray-300")} />
              <span className="text-xs font-bold text-gray-600">Active Status</span>
            </div>
            <Switch
              checked={recipientForm.watch("activeStatus")}
              onChange={(checked: boolean) => recipientForm.setValue("activeStatus", checked)}
            />
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsRecipientModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={recipientMutation.isPending} className="px-8 flex-1">Onboard</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
