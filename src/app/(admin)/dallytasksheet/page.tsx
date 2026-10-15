"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Send,
  Plus,
  Trash2,
  Calendar,
  Clock,
  History,
  CheckCircle2,
  Briefcase,
  Layers,
  Save,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Zap,
  Info,
  Pencil,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Eye,
  Settings,
  Coffee,
  GripVertical,
  Bot
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getLocalDateString } from "@/utils/dateUtils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { taskSheetService, WorkReport, SaveReportDTO } from "@/services/api/taskSheet.service";
import { projectService } from "@/services/api/project.service";
import { statusService } from "@/services/api/status.service";
import { moduleService } from "@/services/api/module.service";
import { emailSettingsService } from "@/services/api/emailSettings.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { Modal } from "@/components/ui/Modal";

interface FormTimeLog {
  inTime: string;
  outTime: string;
  is30MinBreak: boolean;
}

interface FormWorkEntry {
  id?: number;
  srNo: number;
  title: string;
  projectId: number;
  statusId: number;
  moduleId: number;
  description?: string;
  isAiUsed?: boolean;
  aiModel?: string | null;
  timeLogs: FormTimeLog[];
}

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  sortMode = "default"
}: {
  options: { id: number; name: string }[];
  value: number;
  onChange: (val: number) => void;
  placeholder: string;
  sortMode?: "default" | "recentFirst" | "recentLast";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const recentIds = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const json = localStorage.getItem("recent_projects_tasksheet");
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const recentSet = useMemo(() => new Set(recentIds.map((id: number) => id.toString())), [recentIds]);

  const sortedOptions = useMemo(() => {
    let filtered = options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (sortMode === "recentLast" && recentIds.length > 0) {
      return [...filtered].sort((a, b) => {
        const aRecent = recentIds.indexOf(a.id);
        const bRecent = recentIds.indexOf(b.id);
        if (aRecent !== -1 && bRecent === -1) return 1;
        if (aRecent === -1 && bRecent !== -1) return -1;
        if (aRecent !== -1 && bRecent !== -1) return bRecent - aRecent;
        return 0;
      });
    } else if (sortMode === "recentFirst" && recentIds.length > 0) {
      return [...filtered].sort((a, b) => {
        const aRecent = recentIds.indexOf(a.id);
        const bRecent = recentIds.indexOf(b.id);
        if (aRecent !== -1 && bRecent === -1) return -1;
        if (aRecent === -1 && bRecent !== -1) return 1;
        if (aRecent !== -1 && bRecent !== -1) return bRecent - aRecent;
        return 0;
      });
    }
    return filtered;
  }, [options, searchTerm, sortMode, recentIds]);

  const selectedOption = options.find(opt => opt.id === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < sortedOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < sortedOptions.length) {
          onChange(sortedOptions[activeIndex].id);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(-1);
      setSearchTerm("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <div
        className={cn(
          "w-full h-10 bg-white border border-slate-200 rounded-lg px-3 flex items-center justify-between cursor-pointer transition-all hover:border-slate-300",
          isOpen && "border-blue-500 ring-2 ring-blue-50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("text-xs font-semibold", !selectedOption ? "text-slate-400" : "text-slate-700")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-slate-50 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors placeholder:text-slate-300"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 no-scrollbar">
            {sortedOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-[10px] text-slate-400 italic">No results found</div>
            ) : (
              sortedOptions.map((opt, i) => (
                <div
                  key={opt.id}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                    value === opt.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
                    activeIndex === i && "bg-slate-100"
                  )}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.name}</span>
                    {recentSet.has(opt.id.toString()) && (
                      <Zap className="w-2.5 h-2.5 text-orange-400 opacity-60" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function TaskSheetPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore((state) => state.confirm);
  const employeeId = user?.employeeID || 0;
  const companyId = user?.companyId || 0;

  const { canCreate, canEdit, canDelete } = usePagePermissions("dailytasksheet");

  const [reportDate, setReportDate] = useState<string>(getLocalDateString());
  const [works, setWorks] = useState<FormWorkEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragEnabledIndex, setDragEnabledIndex] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<number | null>(null);
  const [breakDuration, setBreakDuration] = useState<number>(user?.defaultBreakDuration || 30);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isSavingRef = React.useRef(false);
  const historySearchInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0);

  const handleBreakDurationChange = async (val: number) => {
    setBreakDuration(val);
    if (employeeId && val >= 0) {
      try {
        await taskSheetService.updateBreakDuration(employeeId, val);
        if (user) {
          updateUser({ ...user, defaultBreakDuration: val });
        }
      } catch (error) {
        console.error("Failed to sync break duration with DB:", error);
      }
    }
  };

  // Sync state if user changes (e.g. on hydrate)
  React.useEffect(() => {
    if (user?.defaultBreakDuration) {
      setBreakDuration(user.defaultBreakDuration);
    }
  }, [user?.defaultBreakDuration]);

  // Queries (with 15-minute cache for static master tables)
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => projectService.list(companyId),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    select: (res) => res.data || [],
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses", companyId],
    queryFn: () => statusService.list(companyId),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    select: (res) => res.data || [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", companyId],
    queryFn: () => moduleService.list(companyId),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    select: (res) => res.data || [],
  });

  //  ROLE-BASED PROJECT AUTO-FILL
  React.useEffect(() => {
    if (projects.length > 0 && works.some(w => w.projectId === 0)) {
      const roleName = user?.roleName?.toLowerCase() || "";
      let defaultProjectId = 0;

      if (roleName.includes("support")) {
        const supportProj = projects.find((p: any) => p.projectName.toLowerCase().includes("support") || p.projectName.toLowerCase().includes("maintenance"));
        if (supportProj) defaultProjectId = supportProj.projectId;
      } else if (roleName.includes("developer")) {
        const devProj = projects.find((p: any) => p.projectName.toLowerCase().includes("internal development") || p.projectName.toLowerCase().includes("product"));
        if (devProj) defaultProjectId = devProj.projectId;
      } else if (roleName.includes("marketing") || roleName.includes("sales")) {
        const salesProj = projects.find((p: any) => p.projectName.toLowerCase().includes("marketing") || p.projectName.toLowerCase().includes("sales"));
        if (salesProj) defaultProjectId = salesProj.projectId;
      }

      if (defaultProjectId > 0) {
        setWorks(prev => prev.map(w => w.projectId === 0 ? { ...w, projectId: defaultProjectId } : w));
      }
    }
  }, [projects, user?.roleName]);

  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ["taskReports", employeeId],
    queryFn: () => taskSheetService.getReports(employeeId),
    enabled: !!employeeId,
    staleTime: 60 * 1000,
    select: (res) => {
      const data = res.data.data || [];
      return [...data].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    },
  });

  const { data: smtpSettings } = useQuery({
    queryKey: ["smtpSettings", employeeId],
    queryFn: () => emailSettingsService.getSmtpSettings(employeeId),
    enabled: !!employeeId,
    select: (res) => res.data?.data,
  });

  const isEmailServiceActive = !!smtpSettings?.activeStatus;

  const activePreviewReport = useMemo(() => {
    if (!activePreviewId) return null;
    return reports.find((r: any) => r.id === activePreviewId);
  }, [activePreviewId, reports]);

  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historySearch, setHistorySearch] = useState<string>("");
  const HISTORY_ITEMS_PER_PAGE = 3;

  const historyListRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    historyListRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [historyPage]);

  // Lock background body & html scrolling while history drawer is open to eliminate secondary scrollbar
  React.useEffect(() => {
    if (isHistoryModalOpen) {
      document.documentElement.classList.add("drawer-open");
      document.body.classList.add("drawer-open");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("drawer-open");
      document.body.classList.remove("drawer-open");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.classList.remove("drawer-open");
      document.body.classList.remove("drawer-open");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isHistoryModalOpen]);

  const filteredReports = useMemo(() => {
    if (!historySearch.trim()) return reports;
    const q = historySearch.toLowerCase().trim();
    return reports.filter((r: WorkReport) => {
      const dateFormatted = new Date(r.reportDate).toLocaleDateString('en-GB');
      const dateIso = r.reportDate.toString();
      return dateFormatted.toLowerCase().includes(q) || dateIso.includes(q);
    });
  }, [reports, historySearch]);

  const totalHistoryPages = Math.ceil(filteredReports.length / HISTORY_ITEMS_PER_PAGE) || 1;

  const paginatedReports = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + HISTORY_ITEMS_PER_PAGE);
  }, [filteredReports, historyPage]);

  React.useEffect(() => {
    setHistoryPage(1);
  }, [historySearch]);

  React.useEffect(() => {
    setSelectedHistoryIndex(0);
  }, [historyPage, historySearch, isHistoryModalOpen]);

  React.useEffect(() => {
    if (isHistoryModalOpen) {
      setTimeout(() => {
        historySearchInputRef.current?.focus();
      }, 100);
    }
  }, [isHistoryModalOpen]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: SaveReportDTO) => taskSheetService.saveReport(data),
    onSuccess: (res) => {
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
        addToast("Task sheet saved successfully.", "success");

        //  SMOOTH POST-SAVE EXPERIENCE
        setTimeout(() => {
          setWorks([]); // Clear for next report
          setExpandedIndex(null);
        }, 500);
      } else {
        addToast(res.data.message || "Failed to save the task sheet. Please try again.", "error");
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to save the task sheet. Please try again.", "error"),
    onSettled: () => {
      isSavingRef.current = false;
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: SaveReportDTO }) => taskSheetService.updateReport(id, data),
    onSuccess: (res) => {
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
        addToast(res.data.message || "Task sheet updated successfully.", "success");
        handleCancelEdit();
      } else {
        addToast(res.data.message || "Failed to update the task sheet. Please try again.", "error");
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to update the task sheet. Please try again.", "error"),
    onSettled: () => {
      isSavingRef.current = false;
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: number) => taskSheetService.sendEmail(id),
    onSuccess: (res) => {
      if (res.data.success) {
        addToast("Email report sent successfully.", "success");
        queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to send the email report. Please try again.", "error"),
  });

  const previewEmailMutation = useMutation({
    mutationFn: (id: number) => taskSheetService.previewEmail(id),
    onSuccess: (res, variables) => {
      if (res.data.success) {
        setPreviewHtml(res.data.data);
        setActivePreviewId(variables);
        setIsPreviewOpen(true);
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to generate email preview. Please try again.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskSheetService.deleteReport(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
      addToast(res.data.message || "Report deleted successfully.", "success");
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to delete the report. Please try again.", "error"),
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // We must set some data for Firefox to allow dragging
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newWorks = [...works];
    const draggedWork = newWorks[draggedIndex];
    newWorks.splice(draggedIndex, 1);
    newWorks.splice(dropIndex, 0, draggedWork);

    const reorderedWorks = newWorks.map((w, i) => ({ ...w, srNo: i + 1 }));
    setWorks(reorderedWorks);
    setDraggedIndex(null);

    if (expandedIndex === draggedIndex) {
      setExpandedIndex(dropIndex);
    } else if (expandedIndex !== null) {
      if (draggedIndex < expandedIndex && dropIndex >= expandedIndex) {
        setExpandedIndex(expandedIndex - 1);
      } else if (draggedIndex > expandedIndex && dropIndex <= expandedIndex) {
        setExpandedIndex(expandedIndex + 1);
      }
    }
  };

  // Dynamic Form Handlers
  const addWork = () => {
    const newIdx = works.length;
    const roleName = user?.roleName?.toLowerCase() || "";
    let defaultProjectId = 0;

    if (roleName.includes("support")) {
      const supportProj = projects.find((p: any) => p.projectName.toLowerCase().includes("support") || p.projectName.toLowerCase().includes("maintenance"));
      if (supportProj) defaultProjectId = supportProj.projectId;
    } else if (roleName.includes("developer")) {
      const devProj = projects.find((p: any) => p.projectName.toLowerCase().includes("internal development") || p.projectName.toLowerCase().includes("product"));
      if (devProj) defaultProjectId = devProj.projectId;
    } else if (roleName.includes("marketing") || roleName.includes("sales")) {
      const salesProj = projects.find((p: any) => p.projectName.toLowerCase().includes("marketing") || p.projectName.toLowerCase().includes("sales"));
      if (salesProj) defaultProjectId = salesProj.projectId;
    }

    setWorks([{
      srNo: works.length + 1,
      title: "",
      projectId: defaultProjectId || (projects[0]?.projectId || 0),
      statusId: statuses[0]?.statusId || 0,
      moduleId: modules[0]?.moduleId || 0,
      description: "",
      isAiUsed: false,
      aiModel: "",
      timeLogs: [{ inTime: "", outTime: "", is30MinBreak: false }]
    }, ...works]);
    setExpandedIndex(0);
  };

  const removeWork = (index: number) => {
    if (works.length > 1) {
      const newWorks = works.filter((_, i) => i !== index);
      setWorks(newWorks);
      if (expandedIndex === index) setExpandedIndex(Math.max(0, index - 1));
    } else {
      setWorks([]);
      setExpandedIndex(null);
    }
  };

  const updateWork = (index: number, field: keyof FormWorkEntry, value: any) => {
    const newWorks = [...works];
    newWorks[index] = { ...newWorks[index], [field]: value };
    setWorks(newWorks);

    if (field === 'projectId' && value) {
      const recentIdsJson = localStorage.getItem("recent_projects_tasksheet");
      let recentIds: number[] = recentIdsJson ? JSON.parse(recentIdsJson) : [];
      recentIds = [value, ...recentIds.filter(id => id !== value)].slice(0, 5);
      localStorage.setItem("recent_projects_tasksheet", JSON.stringify(recentIds));
    }
  };

  const addTimeLog = (workIndex: number) => {
    const newWorks = [...works];
    newWorks[workIndex].timeLogs.push({ inTime: "", outTime: "", is30MinBreak: false });
    setWorks(newWorks);
  };

  const removeTimeLog = (workIndex: number, logIndex: number) => {
    if (works[workIndex].timeLogs.length > 1) {
      const newWorks = [...works];
      newWorks[workIndex].timeLogs = newWorks[workIndex].timeLogs.filter((_, i) => i !== logIndex);
      setWorks(newWorks);
    }
  };

  const updateTimeLog = (workIndex: number, logIndex: number, field: keyof FormTimeLog, value: any) => {
    const newWorks = [...works];
    newWorks[workIndex].timeLogs[logIndex] = { ...newWorks[workIndex].timeLogs[logIndex], [field]: value };
    setWorks(newWorks);
  };

  const calculateTotalHours = (timeLogs: FormTimeLog[]) => {
    let totalMinutes = 0;
    timeLogs.forEach(log => {
      if (log.inTime && log.outTime) {
        const [inH, inM] = log.inTime.split(':').map(Number);
        const [outH, outM] = log.outTime.split(':').map(Number);
        let diff = (outH * 60 + outM) - (inH * 60 + inM);
        if (diff < 0) diff += 1440; // overnight
        if (log.is30MinBreak && diff >= breakDuration) diff -= breakDuration;
        totalMinutes += diff;
      }
    });
    return (totalMinutes / 60).toFixed(1) + "h";
  };

  const calculateReportTotalHours = (report: any) => {
    let totalMinutes = 0;
    report.works?.forEach((work: any) => {
      work.timeLogs?.forEach((log: any) => {
        if (log.inTime && log.outTime) {
          const inT = log.inTime.includes(':') ? log.inTime : log.inTime.substring(0, 5);
          const outT = log.outTime.includes(':') ? log.outTime : log.outTime.substring(0, 5);
          const [inH, inM] = inT.split(':').map(Number);
          const [outH, outM] = outT.split(':').map(Number);
          let diff = (outH * 60 + outM) - (inH * 60 + inM);
          if (diff < 0) diff += 1440;
          if (log.is30MinBreak && diff >= breakDuration) diff -= breakDuration;
          totalMinutes += diff;
        }
      });
    });
    return (totalMinutes / 60).toFixed(1) + "h";
  };

  const handleSave = () => {
    if (isSavingRef.current || saveMutation.isPending || updateMutation.isPending) return;

    if (works.length === 0) {
      addToast("Please add at least one work entry before saving.", "error");
      return;
    }

    isSavingRef.current = true;
    const payload: SaveReportDTO = {
      reportDate,
      works: works.map(w => ({
        srNo: w.srNo,
        title: w.title,
        projectId: Number(w.projectId),
        statusId: Number(w.statusId),
        moduleId: Number(w.moduleId),
        description: w.description,
        isAiUsed: !!w.isAiUsed,
        aiModel: w.isAiUsed ? (w.aiModel || "").trim() : null,
        timeLogs: w.timeLogs
      }))
    };

    if (editingReportId) {
      updateMutation.mutate({ id: editingReportId, data: payload });
    } else {
      saveMutation.mutate(payload);
    }
  };

  const handleEditReport = (report: WorkReport) => {
    setEditingReportId(report.id);
    setReportDate(report.reportDate.split('T')[0]);
    setWorks(report.works.map(w => ({
      id: w.id,
      srNo: w.srNo,
      title: w.title,
      projectId: w.projectId,
      statusId: w.statusId,
      moduleId: w.moduleId || (modules[0]?.moduleId || 0),
      description: w.description,
      isAiUsed: !!w.isAiUsed,
      aiModel: w.aiModel || "",
      timeLogs: w.timeLogs.map(l => ({
        inTime: l.inTime.substring(0, 5),
        outTime: l.outTime.substring(0, 5),
        is30MinBreak: l.is30MinBreak
      }))
    })));
    setExpandedIndex(0);
    setIsHistoryModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setWorks([]);
    setExpandedIndex(null);
  };

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes preview modal first, then history drawer
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        if (isPreviewOpen) {
          e.preventDefault();
          setIsPreviewOpen(false);
          return;
        }
        if (isHistoryModalOpen) {
          e.preventDefault();
          setIsHistoryModalOpen(false);
          return;
        }
      }

      // Archive Explorer specific keyboard shortcuts
      if (isHistoryModalOpen) {
        const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

        if (isInputFocused) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
            setSelectedHistoryIndex(0);
            return;
          }
          if (e.altKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport && canEdit) handleEditReport(currentReport);
            return;
          }
          if (e.altKey && (e.key === 'Delete' || e.key.toLowerCase() === 'd')) {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport && canDelete) {
              confirm({
                title: "Delete Report?",
                message: `Are you sure you want to delete the report for ${new Date(currentReport.reportDate).toLocaleDateString('en-GB')}? This action cannot be undone.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "danger",
                onConfirm: () => deleteMutation.mutate(currentReport.id)
              });
            }
            return;
          }
        } else {
          // Up / Down arrow to select record in Archive Explorer
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedHistoryIndex((prev) => Math.max(0, prev - 1));
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedHistoryIndex((prev) => Math.min(paginatedReports.length - 1, prev + 1));
            return;
          }

          // Direct number keys (1, 2, 3) to pick item index
          if (e.key === '1' && paginatedReports.length >= 1) { setSelectedHistoryIndex(0); return; }
          if (e.key === '2' && paginatedReports.length >= 2) { setSelectedHistoryIndex(1); return; }
          if (e.key === '3' && paginatedReports.length >= 3) { setSelectedHistoryIndex(2); return; }

          // Left / Right arrow for pagination
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setHistoryPage((p) => Math.max(1, p - 1));
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            setHistoryPage((p) => Math.min(totalHistoryPages, p + 1));
            return;
          }

          // 'E' or 'Enter' edits the currently selected report
          if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport && canEdit) {
              handleEditReport(currentReport);
            }
            return;
          }

          // 'Delete' or 'D' deletes the currently selected report
          if (e.key === 'Delete' || e.key.toLowerCase() === 'd') {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport && canDelete) {
              confirm({
                title: "Delete Report?",
                message: `Are you sure you want to delete the report for ${new Date(currentReport.reportDate).toLocaleDateString('en-GB')}? This action cannot be undone.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "danger",
                onConfirm: () => deleteMutation.mutate(currentReport.id)
              });
            }
            return;
          }

          // 'V' previews the email for the selected report
          if (e.key.toLowerCase() === 'v') {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport) {
              previewEmailMutation.mutate(currentReport.id);
            }
            return;
          }

          // 'M' sends email for the selected report (if not sent and email service active)
          if (isEmailServiceActive && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            const currentReport = paginatedReports[selectedHistoryIndex];
            if (currentReport && !currentReport.isEmailSent && !sendEmailMutation.isPending) {
              confirm({
                title: "Send Email Report?",
                message: "Are you sure you want to send this email report now?",
                confirmText: "Send Email",
                cancelText: "Cancel",
                variant: "primary",
                onConfirm: () => sendEmailMutation.mutate(currentReport.id)
              });
            }
            return;
          }

          // '/' to focus search input
          if (e.key === '/') {
            e.preventDefault();
            historySearchInputRef.current?.focus();
            historySearchInputRef.current?.select();
            return;
          }
        }
      }

      // Ctrl + S saves
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        if (!isSavingRef.current && !saveMutation.isPending && !updateMutation.isPending) {
          handleSave();
        }
        return;
      }

      // Alt + N adds entry
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addWork();
        return;
      }

      // Alt + H toggles Archive Explorer
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryModalOpen((prev) => {
          if (!prev) {
            setHistoryPage(1);
            setHistorySearch("");
          }
          return !prev;
        });
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [works, reportDate, editingReportId, isPreviewOpen, isHistoryModalOpen, projects, statuses, modules, saveMutation.isPending, updateMutation.isPending, totalHistoryPages, selectedHistoryIndex, paginatedReports, canEdit, canDelete, isEmailServiceActive]);

  const columns = [
    {
      header: "Date",
      accessor: (item: WorkReport) => <span className="font-bold text-slate-700">{new Date(item.reportDate).toLocaleDateString('en-GB')}</span>,
    },
    {
      header: "Actions",
      accessor: (item: WorkReport) => (
        <div className="flex items-center justify-end gap-2">
          {isEmailServiceActive && (
            <button
              className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
              onClick={() => {
                confirm({
                  title: "Send Email Report?",
                  message: "Are you sure you want to send this email report now?",
                  confirmText: "Send Email",
                  cancelText: "Cancel",
                  variant: "primary",
                  onConfirm: () => sendEmailMutation.mutate(item.id)
                });
              }}
              disabled={sendEmailMutation.isPending}
              title="Send Mail"
            >
              {sendEmailMutation.isPending && sendEmailMutation.variables === item.id ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </button>
          )}
          <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleEditReport(item)} title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
            onClick={() => {
              confirm({
                title: "Delete Report?",
                message: "Are you sure you want to delete this task report? This action cannot be undone.",
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "danger",
                onConfirm: () => deleteMutation.mutate(item.id)
              });
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "w-[180px] text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6 font-sans pb-10 animate-in fade-in duration-500">

      {/* 🟢 TOP NAV - FLOATING CARD */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl sticky top-2 z-[30] p-3 sm:px-6 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">WorkLog Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-medium sm:hidden">Daily Task Sheet</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 h-9 sm:h-10 px-2.5 sm:px-4 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 outline-none uppercase" />
            </div>
            <button
              onClick={() => { setIsHistoryModalOpen(true); setHistoryPage(1); setHistorySearch(""); }}
              className="h-9 sm:h-10 px-2.5 sm:px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center gap-1.5 sm:gap-2 hover:bg-slate-50 transition-all touch-manipulation"
              title="View Archive Explorer [ALT+H]"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Archive</span> <span className="hidden sm:inline opacity-40 text-[9px] font-mono">[ALT+H]</span>
            </button>

            {/*  BREAK SETTING */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg border border-slate-200 group/setting transition-all hover:border-blue-300 hover:bg-white shadow-xs">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded flex items-center justify-center text-white shadow-xs shadow-blue-100 shrink-0">
                <Coffee className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Break</span>
                <div className="flex items-baseline gap-0.5">
                  <input
                    type="number"
                    value={breakDuration}
                    onChange={(e) => handleBreakDurationChange(parseInt(e.target.value) || 0)}
                    className="bg-transparent border-none focus:ring-0 text-xs font-black text-slate-800 outline-none w-7 sm:w-8 p-0 hide-arrows text-center"
                  />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">m</span>
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saveMutation.isPending || updateMutation.isPending} className="h-9 sm:h-10 px-4 sm:px-6 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition-all group flex-1 sm:flex-none touch-manipulation">
              {(saveMutation.isPending || updateMutation.isPending) ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span>{editingReportId ? 'Update' : 'Save'} <span className="hidden sm:inline">Changes</span></span> <span className="hidden sm:inline opacity-40 ml-1 text-[9px] font-mono">[CTRL+S]</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 sm:space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Daily Task Sheet</h2>
          </div>
          {canCreate && (
            <button onClick={addWork} className="h-9 sm:h-10 px-4 sm:px-5 bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 sm:gap-3 hover:bg-slate-900 transition-all active:scale-95 touch-manipulation">
              <Plus className="w-4 h-4" /> Add Entry <span className="hidden sm:inline opacity-40 text-[9px] font-mono">[ALT+N]</span>
            </button>
          )}
        </div>

        {/* 🏗️ HIERARCHICAL TASK LIST */}
        <div className="space-y-4">
          {works.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl px-4 text-center">
              <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-slate-400 uppercase tracking-widest">No Active Sessions</h3>
              <p className="text-slate-300 text-xs mt-2">Add a new work entry to begin your daily log.</p>
            </div>
          ) : works.map((work, idx) => {
            const isExpanded = expandedIndex === idx;
            const projectName = projects.find((o: any) => o.projectId === work.projectId)?.projectName || "Project Pending";
            const duration = calculateTotalHours(work.timeLogs);

            return (
              <div
                key={work.srNo || idx}
                draggable={dragEnabledIndex === idx && !isExpanded}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragEnabledIndex(null);
                }}
                className={`bg-white border-2 ${isExpanded ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-slate-300'} rounded-2xl transition-all overflow-visible ${draggedIndex === idx ? 'opacity-40 border-dashed scale-[0.98]' : ''}`}
              >

                {/* COLLAPSED HEADER / SUMMARY TIER */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className={`flex items-center justify-between p-3.5 sm:px-6 sm:py-4 cursor-pointer select-none transition-colors rounded-t-xl gap-2 ${!isExpanded ? 'bg-white' : 'bg-slate-50 border-b border-slate-100'}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                    {!isExpanded && (
                      <div
                        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing px-1 sm:px-2 -ml-1 sm:-ml-2 shrink-0 hidden sm:block"
                        title="Drag to reorder"
                        onMouseEnter={() => setDragEnabledIndex(idx)}
                        onMouseLeave={() => setDragEnabledIndex(null)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>
                    )}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>#{idx + 1}</div>
                    {!isExpanded ? (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs min-w-0">
                        <span className="font-bold text-slate-700 uppercase tracking-wide truncate max-w-[130px] sm:max-w-xs">{work.title || "Untitled Task"}</span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span className="text-slate-500 italic truncate max-w-[110px] sm:max-w-none text-[11px] sm:text-xs">{projectName}</span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1 text-slate-400 font-bold text-[11px] sm:text-xs shrink-0"><Clock className="w-3.5 h-3.5" /> {duration}</div>
                        {work.isAiUsed && (
                          <>
                            <span className="text-slate-300 hidden sm:inline">|</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex items-center gap-1 border border-indigo-100 shrink-0">
                              <Bot className="w-3 h-3 text-indigo-600" /> {work.aiModel || "AI"}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <h3 className="font-bold text-slate-700 text-xs sm:text-sm italic tracking-tight truncate">Main Entry Mapping (Session #{idx + 1})</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {!isExpanded && (
                      <button onClick={(e) => { e.stopPropagation(); removeWork(idx); }} className="text-slate-300 hover:text-red-500 transition-colors p-1" aria-label="Delete Entry"><Trash2 className="w-4 h-4" /></button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* FULL EDIT VIEW (VISIBLE WHEN EXPANDED) */}
                {isExpanded && (
                  <div className="flex flex-col xl:flex-row animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* DETAIL TIER (LEFT) */}
                    <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-6 border-b xl:border-b-0 xl:border-r border-slate-200">
                      <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Task Title</label>
                        <input
                          className="w-full bg-transparent border-none px-1 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:font-normal placeholder:text-slate-300"
                          placeholder="What are you working on?"
                          value={work.title}
                          onChange={(e) => updateWork(idx, 'title', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Project Scope</label>
                          <SearchableSelect
                            options={projects.map(p => ({ id: p.projectId, name: p.projectName }))}
                            value={work.projectId}
                            onChange={(val) => updateWork(idx, 'projectId', val)}
                            placeholder="Select Project"
                            sortMode="recentLast"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Module</label>
                          <SearchableSelect
                            options={modules.map(m => ({ id: m.moduleId, name: m.moduleName }))}
                            value={work.moduleId}
                            onChange={(val) => updateWork(idx, 'moduleId', val)}
                            placeholder="Select Module"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Task Status</label>
                          <SearchableSelect
                            options={statuses.map(s => ({ id: s.statusId, name: s.statusName }))}
                            value={work.statusId}
                            onChange={(val) => updateWork(idx, 'statusId', val)}
                            placeholder="Select Status"
                          />
                        </div>
                      </div>

                      {/* AI Assistance Row - Slim & Compact */}
                      <div className="p-2 px-3 bg-slate-50/70 border border-slate-200/70 rounded-lg flex flex-wrap items-center justify-between gap-3 min-h-[38px]">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!work.isAiUsed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWorks((prev) => {
                                const next = [...prev];
                                next[idx] = {
                                  ...next[idx],
                                  isAiUsed: checked,
                                  aiModel: checked ? (next[idx].aiModel || "") : "",
                                };
                                return next;
                              });
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-indigo-500" />
                            AI Used
                          </span>
                        </label>

                        {work.isAiUsed && (
                          <div className="flex items-center gap-2 flex-1 sm:max-w-xs animate-in fade-in duration-150">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                              AI Model:
                            </span>
                            <input
                              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                              placeholder="e.g. GPT-4o, Claude 3.5, Gemini"
                              value={work.aiModel || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorks((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], aiModel: val };
                                  return next;
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all flex flex-col h-36 sm:h-48 overflow-hidden px-3.5 sm:px-4 pt-3 pb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Activity Narrative</label>
                        <textarea
                          className="w-full bg-transparent border-none text-xs sm:text-sm font-medium sm:font-bold text-slate-700 focus:ring-0 outline-none flex-1 resize-none placeholder:font-normal placeholder:text-slate-200 leading-relaxed no-scrollbar"
                          placeholder="Elaborate on work performed..."
                          value={work.description}
                          onChange={(e) => updateWork(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* TIME LOG TIER (RIGHT) */}
                    <div className="w-full xl:w-[400px] bg-slate-50/10 p-3.5 sm:p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Time Sessions</h4>
                        <button onClick={() => addTimeLog(idx)} className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all active:scale-95 touch-manipulation">
                          <Plus className="w-3.5 h-3.5" /> Append session
                        </button>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                        {work.timeLogs.map((log, lIdx) => (
                          <div key={lIdx} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3 relative group hover:shadow-md transition-all">
                            {work.timeLogs.length > 1 && (
                              <button onClick={() => removeTimeLog(idx, lIdx)} className="absolute top-2 right-2 p-1 text-slate-200 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            )}

                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">In Time</label>
                                <input type="time" value={log.inTime} onChange={(e) => updateTimeLog(idx, lIdx, 'inTime', e.target.value)} className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg px-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-300" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Out Time</label>
                                <input type="time" value={log.outTime} onChange={(e) => updateTimeLog(idx, lIdx, 'outTime', e.target.value)} className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg px-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-300" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-2 cursor-pointer group/label">
                                <input type="checkbox" checked={log.is30MinBreak} onChange={(e) => updateTimeLog(idx, lIdx, 'is30MinBreak', e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover/label:text-slate-600 transition-colors">{breakDuration}m Break</span>
                              </label>
                              {log.inTime && log.outTime && (
                                <div className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded">
                                  Session Point {lIdx + 1}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚀 HISTORY DRAWER */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-none" onClick={() => setIsHistoryModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-slate-800 underline decoration-blue-500 underline-offset-4 tracking-tight">Archive Explorer</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                  {filteredReports.length} {filteredReports.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</span>
                <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg" title="Close Archive Explorer [ESC]"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* 🔍 SEARCH / FILTER BAR */}
            <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={historySearchInputRef}
                  type="text"
                  placeholder="Filter by date (e.g. 14/10/2026)..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
                      e.stopPropagation();
                      if (isPreviewOpen) {
                        setIsPreviewOpen(false);
                        return;
                      }
                      if (historySearch) {
                        setHistorySearch("");
                      } else {
                        setIsHistoryModalOpen(false);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
                />
                {historySearch && (
                  <button type="button" onClick={() => setHistorySearch("")} className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div ref={historyListRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 space-y-2">
              {filteredReports.length === 0 ? (
                <div className="text-center py-20 text-slate-300 text-sm italic uppercase tracking-[0.3em] font-light">
                  {historySearch ? "NO MATCHING RECORDS" : "NO RECORDS FOUND"}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paginatedReports.map((report: WorkReport, rIdx: number) => {
                    const isSelected = selectedHistoryIndex === rIdx;
                    return (
                      <div
                        key={report.id}
                        onClick={() => setSelectedHistoryIndex(rIdx)}
                        className={`p-3 border rounded-xl transition-all space-y-2.5 shadow-xs hover:shadow-md bg-white group relative overflow-hidden cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        {/* 📧 EMAIL STATUS INDICATOR */}
                        {report.isEmailSent && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-bl-lg border-l border-b border-emerald-100 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Mail Sent
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {new Date(report.reportDate).toLocaleDateString('en-GB')}
                            <span className="text-slate-300 mx-0.5">|</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {calculateReportTotalHours(report)}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 ml-1">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 items-center">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleEditReport(report); }}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                  }`}
                                title="Edit Report [E]"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                {isSelected && <span className="text-[9px] font-mono font-bold">E</span>}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirm({
                                    title: "Delete Report?",
                                    message: `Are you sure you want to delete the report for ${new Date(report.reportDate).toLocaleDateString('en-GB')}? This action cannot be undone.`,
                                    confirmText: "Delete",
                                    cancelText: "Cancel",
                                    variant: "danger",
                                    onConfirm: () => deleteMutation.mutate(report.id)
                                  });
                                }}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${isSelected ? 'bg-red-600 text-white hover:bg-red-700 shadow-xs' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                  }`}
                                title="Delete Report [DEL]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isSelected && <span className="text-[9px] font-mono font-bold">DEL</span>}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => previewEmailMutation.mutate(report.id)}
                            disabled={previewEmailMutation.isPending}
                            className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            title="View Mail [V]"
                          >
                            {previewEmailMutation.isPending && previewEmailMutation.variables === report.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>View Mail</span>
                            {isSelected && <span className="text-[9px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">V</span>}
                          </button>
                          {isEmailServiceActive && !report.isEmailSent && (
                            <button
                              type="button"
                              onClick={() => {
                                confirm({
                                  title: "Send Email Report?",
                                  message: "Are you sure you want to send this email report now?",
                                  confirmText: "Send Email",
                                  cancelText: "Cancel",
                                  variant: "primary",
                                  onConfirm: () => sendEmailMutation.mutate(report.id)
                                });
                              }}
                              disabled={sendEmailMutation.isPending}
                              className="flex-1 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              title="Send Mail [M]"
                            >
                              {sendEmailMutation.isPending && sendEmailMutation.variables === report.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-blue-400" />
                              )}
                              <span>Send Mail</span>
                              {isSelected && <span className="text-[9px] font-mono font-bold text-blue-200 bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600 shadow-2xs">M</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ⌨️ KEYBOARD SHORTCUT HELPER BAR */}
            <div className="hidden sm:flex px-5 py-2 bg-slate-50 border-t border-slate-100 items-center justify-between text-[10px] text-slate-500 select-none overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-slate-700">↑/↓</kbd> Select
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-blue-600">E</kbd> Edit
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-red-600">DEL</kbd> Delete
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-slate-700">V</kbd> View
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-indigo-600">M</kbd> Send
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-slate-700">←/→</kbd> Page
                </span>
              </div>
              <span className="flex items-center gap-1 font-medium">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-2xs font-bold text-slate-700">/</kbd> Filter
              </span>
            </div>

            {/* 📄 PAGINATION FOOTER */}
            {filteredReports.length > 0 && (
              <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between gap-2 select-none">
                <div className="text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">
                    {(historyPage - 1) * HISTORY_ITEMS_PER_PAGE + 1}
                  </span>
                  -
                  <span className="font-bold text-slate-700">
                    {Math.min(historyPage * HISTORY_ITEMS_PER_PAGE, filteredReports.length)}
                  </span>
                  {" of "}
                  <span className="font-bold text-slate-700">{filteredReports.length}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalHistoryPages || Math.abs(p - historyPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="text-slate-400 text-xs px-0.5">...</span>}
                            <button
                              onClick={() => setHistoryPage(p)}
                              className={`min-w-6.5 h-6.5 px-1.5 text-xs font-bold rounded-lg transition-all ${historyPage === p
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎨 PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Email Preview"
        size="full"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Close
            </button>
            {isEmailServiceActive && !activePreviewReport?.isEmailSent && (
              <button
                type="button"
                onClick={() => {
                  if (activePreviewId) {
                    confirm({
                      title: "Send Email Report?",
                      message: "Are you sure you want to send this email report now?",
                      confirmText: "Send Email",
                      cancelText: "Cancel",
                      variant: "primary",
                      onConfirm: () => {
                        sendEmailMutation.mutate(activePreviewId);
                        setIsPreviewOpen(false);
                      }
                    });
                  }
                }}
                disabled={sendEmailMutation.isPending}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-100 disabled:opacity-50"
              >
                {sendEmailMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Report Now
              </button>
            )}
          </div>
        }
      >
        <div className="bg-white p-4 rounded-lg overflow-auto border border-slate-100 shadow-inner h-full flex flex-col">
          <div
            className="prose prose-sm max-w-none flex-1"
            dangerouslySetInnerHTML={{ __html: previewHtml || "" }}
          />
        </div>
      </Modal>
    </div>
  );
}
