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
  ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { taskSheetService, WorkReport, SaveReportDTO } from "@/services/api/taskSheet.service";
import { projectService } from "@/services/api/project.service";
import { statusService } from "@/services/api/status.service";
import { moduleService } from "@/services/api/module.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useConfirmStore } from "@/store/useConfirmStore";
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
  timeLogs: FormTimeLog[];
}

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: { id: number; name: string }[]; 
  value: number; 
  onChange: (val: number) => void; 
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => 
    options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

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
        setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onChange(filteredOptions[activeIndex].id);
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
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-[10px] text-slate-400 italic">No results found</div>
            ) : (
                filteredOptions.map((opt, i) => (
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
                  {opt.name}
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

  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [works, setWorks] = useState<FormWorkEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Queries
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => projectService.list(companyId),
    enabled: !!companyId,
    select: (res) => res.data || [],
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses", companyId],
    queryFn: () => statusService.list(companyId),
    enabled: !!companyId,
    select: (res) => res.data || [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", companyId],
    queryFn: () => moduleService.list(companyId),
    enabled: !!companyId,
    select: (res) => res.data || [],
  });

  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ["taskReports", employeeId],
    queryFn: () => taskSheetService.getReports(employeeId),
    enabled: !!employeeId,
    select: (res) => {
      const data = res.data.data || [];
      return [...data].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: SaveReportDTO) => taskSheetService.saveReport(data),
    onSuccess: (res) => {
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
        addToast(res.data.message || "Task sheet saved successfully!", "success");
        setWorks([]); // Clear for next report
      } else {
        addToast(res.data.message || "Validation Failed", "error");
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to save report", "error"),
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: SaveReportDTO }) => taskSheetService.updateReport(id, data),
    onSuccess: (res) => {
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
        addToast(res.data.message || "Task sheet updated successfully!", "success");
        handleCancelEdit();
      } else {
        addToast(res.data.message || "Validation Failed", "error");
      }
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to update report", "error"),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: number) => taskSheetService.sendEmail(id),
    onSuccess: (res) => addToast(res.data.message || "Email Report Dispatched!", "success"),
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to send email", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskSheetService.deleteReport(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["taskReports", employeeId] });
      addToast(res.data.message || "Report deleted successfully", "success");
    },
    onError: (err: any) => addToast(err.response?.data?.message || "Failed to delete report", "error"),
  });

  // Dynamic Form Handlers
  const addWork = () => {
    const newIdx = works.length;
    setWorks([...works, {
      srNo: works.length + 1,
      title: "",
      projectId: projects[0]?.projectId || 0,
      statusId: statuses[0]?.statusId || 0,
      moduleId: modules[0]?.moduleId || 0,
      description: "",
      timeLogs: [{ inTime: "", outTime: "", is30MinBreak: false }]
    }]);
    setExpandedIndex(newIdx);
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
        if (log.is30MinBreak && diff >= 30) diff -= 30;
        totalMinutes += diff;
      }
    });
    return (totalMinutes / 60).toFixed(1) + "h";
  };

  const handleSave = () => {
    if (works.length === 0) {
      addToast("Please add at least one work entry", "error");
      return;
    }

    const payload: SaveReportDTO = {
      reportDate,
      works: works.map(w => ({
        srNo: w.srNo,
        title: w.title,
        projectId: Number(w.projectId),
        statusId: Number(w.statusId),
        moduleId: Number(w.moduleId),
        description: w.description,
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
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.altKey && e.key === 'n') { e.preventDefault(); addWork(); }
      if (e.altKey && e.key === 'h') { e.preventDefault(); setIsHistoryModalOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [works, reportDate, editingReportId, isHistoryModalOpen, projects, statuses, modules]);

  const columns = [
    { 
      header: "Date", 
      accessor: (item: WorkReport) => <span className="font-bold text-slate-700">{new Date(item.reportDate).toLocaleDateString()}</span>,
    },
    { 
      header: "Actions", 
      accessor: (item: WorkReport) => (
        <div className="flex items-center justify-end gap-2">
            <button 
                className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50" 
                onClick={() => sendEmailMutation.mutate(item.id)}
                disabled={sendEmailMutation.isPending}
                title="Send Mail"
            >
                {sendEmailMutation.isPending && sendEmailMutation.variables === item.id ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
            </button>
            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleEditReport(item)} title="Edit">
                <Pencil className="w-4 h-4" />
            </button>
            <button 
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all" 
                onClick={() => {
                    confirm({
                        title: "Delete Report?",
                        message: "Are you sure you want to delete this task report? This action cannot be undone.",
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
      <div className="w-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl sticky top-2 z-[30]">
        <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"><FileText className="w-5 h-5" /></div>
               <h1 className="text-lg font-bold text-slate-800">WorkLog Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-slate-100 h-10 px-4 rounded-lg border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 outline-none uppercase" />
               </div>
               <button onClick={() => setIsHistoryModalOpen(true)} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all">
                  <History className="w-4 h-4" /> View Archive
               </button>
               <button onClick={handleSave} disabled={saveMutation.isPending || updateMutation.isPending} className="h-10 px-6 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all group">
                  {(saveMutation.isPending || updateMutation.isPending) ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingReportId ? 'Update Changes' : 'Save Changes'} <span className="opacity-40 ml-1 text-[9px] font-mono">[CTRL+S]</span>
               </button>
            </div>
        </div>
      </div>

      <div className="w-full space-y-6">
         
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Daily Task Sheet</h2>
            </div>
            <button onClick={addWork} className="h-10 px-5 bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-slate-900 transition-all active:scale-95">
               <Plus className="w-4 h-4" /> Add Entry <span className="opacity-40 text-[9px] font-mono">[ALT+N]</span>
            </button>
         </div>

         {/* 🏗️ HIERARCHICAL TASK LIST */}
         <div className="space-y-4">
            {works.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                    <Briefcase className="w-12 h-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No Active Sessions</h3>
                    <p className="text-slate-300 text-xs mt-2">Add a new work entry to begin your daily log.</p>
                </div>
            ) : works.map((work, idx) => {
               const isExpanded = expandedIndex === idx;
               const projectName = projects.find((o: any) => o.projectId === work.projectId)?.projectName || "Project Pending";
               const duration = calculateTotalHours(work.timeLogs);

               return (
                  <div key={idx} className={`bg-white border-2 ${isExpanded ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-slate-300'} rounded-2xl transition-all overflow-visible`}>
                     
                     {/* COLLAPSED HEADER / SUMMARY TIER */}
                     <div 
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className={`flex items-center justify-between px-6 py-4 cursor-pointer select-none transition-colors rounded-t-xl ${!isExpanded ? 'bg-white' : 'bg-slate-50 border-b border-slate-100'}`}
                     >
                        <div className="flex items-center gap-4 flex-1">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>#{idx + 1}</div>
                           {!isExpanded ? (
                              <div className="flex items-center gap-4 text-xs">
                                 <span className="font-bold text-slate-700 uppercase tracking-wide">{work.title || "Untitled Task"}</span>
                                 <span className="text-slate-200">|</span>
                                 <span className="text-slate-500 italic">{projectName}</span>
                                 <span className="text-slate-200">|</span>
                                 <div className="flex items-center gap-1.5 text-slate-400 font-bold"><Clock className="w-3.5 h-3.5" /> {duration}</div>
                              </div>
                           ) : (
                              <h3 className="font-bold text-slate-700 text-sm italic tracking-tight">Main Entry Mapping (Session #{idx + 1})</h3>
                           )}
                        </div>
                        <div className="flex items-center gap-4">
                           {!isExpanded && (
                                <button onClick={(e) => { e.stopPropagation(); removeWork(idx); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                           )}
                           {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                     </div>

                     {/* FULL EDIT VIEW (VISIBLE WHEN EXPANDED) */}
                     {isExpanded && (
                        <div className="flex flex-col md:flex-row animate-in fade-in slide-in-from-top-2 duration-300">
                           {/* DETAIL TIER (LEFT) */}
                           <div className="flex-1 p-6 space-y-6 border-b md:border-b-0 md:border-r border-slate-200">
                              <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Task Title</label>
                                <input 
                                    className="w-full bg-transparent border-none px-1 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:font-normal placeholder:text-slate-300"
                                    placeholder="What are you working on?"
                                    value={work.title}
                                    onChange={(e) => updateWork(idx, 'title', e.target.value)}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Project Scope</label>
                                    <SearchableSelect 
                                        options={projects.map(p => ({ id: p.projectId, name: p.projectName }))}
                                        value={work.projectId}
                                        onChange={(val) => updateWork(idx, 'projectId', val)}
                                        placeholder="Select Project"
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

                              <div className="bg-white border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all flex flex-col h-32 overflow-hidden px-4 pt-3 pb-1">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Activity Narrative</label>
                                 <textarea 
                                   className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none flex-1 resize-none placeholder:font-normal placeholder:text-slate-200 leading-relaxed no-scrollbar" 
                                   placeholder="Elaborate on work performed..." 
                                   value={work.description}
                                   onChange={(e) => updateWork(idx, 'description', e.target.value)}
                                 />
                              </div>
                           </div>

                           {/* TIME LOG TIER (RIGHT) */}
                           <div className="w-full md:w-[420px] bg-slate-50/10 p-6 flex flex-col">
                              <div className="flex items-center justify-between mb-4">
                                 <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Time Sessions</h4>
                                 <button onClick={() => addTimeLog(idx)} className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all active:scale-95">
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
                                             <span className="text-[10px] font-bold text-slate-400 group-hover/label:text-slate-600 transition-colors">30m Break</span>
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
         <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-none" onClick={() => setIsHistoryModalOpen(false)} />
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                   <h2 className="font-bold text-slate-800 underline decoration-blue-500 underline-offset-4 tracking-tight">Archive Explorer</h2>
                   <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                   {reports.length === 0 ? (
                       <div className="text-center py-20 text-slate-300 text-sm italic uppercase tracking-[0.3em] font-light">NO RECORDS FOUND</div>
                   ) : (
                       <div className="space-y-4">
                           {reports.map((report: WorkReport) => (
                              <div key={report.id} className="p-5 border border-slate-200 rounded-xl hover:border-blue-300 transition-all space-y-5 shadow-sm hover:shadow-md bg-white group">
                                 <div className="flex items-center justify-between">
                                     <div className="font-bold text-slate-700 text-sm flex items-center gap-3">
                                         <Calendar className="w-4 h-4 text-blue-500" /> 
                                         {new Date(report.reportDate).toLocaleDateString()}
                                     </div>
                                     <div className="flex gap-2">
                                        <button onClick={() => handleEditReport(report)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => {
                                                confirm({
                                                    title: "Delete Report?",
                                                    message: "Are you sure you want to delete this task report?",
                                                    variant: "danger",
                                                    onConfirm: () => deleteMutation.mutate(report.id)
                                                });
                                            }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                                  <button 
                                     onClick={() => sendEmailMutation.mutate(report.id)}
                                     disabled={sendEmailMutation.isPending}
                                     className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                  >
                                      {sendEmailMutation.isPending && sendEmailMutation.variables === report.id ? (
                                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                      ) : (
                                          <Mail className="w-4 h-4 text-blue-400" />
                                      )}
                                      Send Mail
                                  </button>
                              </div>
                           ))}
                       </div>
                   )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
