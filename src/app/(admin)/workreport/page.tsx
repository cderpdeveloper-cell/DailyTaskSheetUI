"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import {
   Calendar, Plus, Trash2, Save, History, Clock, FileText, ChevronDown, Mail,
   Users, Activity, Edit2, ArrowRight, X, Search, Briefcase, Zap, CheckCircle, ChevronUp, ChevronRight, Eye, GripVertical
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { workLogService, WorkLogCreateDTO, WorkLog, WorkReportSessionDTO } from "@/services/api/workLog.service";
import { projectService } from "@/services/api/project.service";
import { clientService } from "@/services/api/client.service";
import { statusService } from "@/services/api/status.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";

// --- Clean Search Select Component ---

const SimpleSearchSelect = ({ label, options, value, onChange, placeholder, sortMode = "default", disabledOptions = [] }: any) => {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState("");
   const containerRef = useRef<HTMLDivElement>(null);
   const selectedOption = options.find((o: any) => o.id === value);

   // Context-aware sorting logic
   const sortedOptions = useMemo(() => {
      let filtered = options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase()));

      const recentIdsJson = localStorage.getItem("recent_clients_workreport");
      const recentIds: number[] = recentIdsJson ? JSON.parse(recentIdsJson) : [];

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
   }, [options, search, sortMode]);

   useEffect(() => {
      const click = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
      document.addEventListener("mousedown", click);
      return () => document.removeEventListener("mousedown", click);
   }, []);

   return (
      <div className="flex-1 min-w-[200px]" ref={containerRef}>
         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 ml-1">{label}</label>
         <div className="relative">
            <button
               type="button" onClick={() => setIsOpen(!isOpen)}
               className={`w-full h-11 px-4 bg-white border ${isOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-200'} rounded-lg flex items-center justify-between text-sm transition-all`}
            >
               <span className={!selectedOption ? 'text-slate-400' : 'text-slate-700 font-medium'}>{selectedOption ? selectedOption.name : placeholder}</span>
               <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
               <div className="absolute z-[1000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                     <input autoFocus placeholder="Search..." className="w-full h-8 px-3 text-xs bg-white rounded border border-slate-200 focus:outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                     {sortedOptions.map((opt: any) => {
                        const isDisabled = disabledOptions.includes(opt.id) && opt.id !== value;
                        return (
                           <button
                              key={opt.id} type="button"
                              disabled={isDisabled}
                              onClick={() => { if (!isDisabled) { onChange(opt.id); setIsOpen(false); setSearch(""); } }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-all ${value === opt.id ? 'bg-blue-50 text-blue-700 font-bold' : isDisabled ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                              <div className="flex items-center justify-between">
                                 <span className={isDisabled ? 'line-through' : ''}>{opt.name}</span>
                                 {isDisabled && (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">Selected</span>
                                 )}
                              </div>
                           </button>
                        );
                     })}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default function WorkReportPage() {
   const queryClient = useQueryClient();
   const { user } = useAuthStore();
   const { addToast } = useToastStore();
   const confirm = useConfirmStore((state) => state.confirm);
   const employeeId = user?.employeeID || 0;
   const companyId = user?.companyId || 0;

   const { canCreate, canEdit, canDelete } = usePagePermissions("workreport");

   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
   const [isHistoryOpen, setIsHistoryOpen] = useState(false);
   const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
   const [logs, setLogs] = useState<WorkLogCreateDTO[]>([
      { clientId: 0, projectId: 0, workDate: selectedDate, inputTime: 0, mode: "AnyDesk", statusId: 0, otherEmployeeIds: "", tasks: [{ description: "", statusId: 0, isCompleted: false }] }
   ]);
   const [previewHtml, setPreviewHtml] = useState<string | null>(null);
   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
   const [activePreviewId, setActivePreviewId] = useState<number | null>(null);
   const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
   const [dragEnabledIndex, setDragEnabledIndex] = useState<number | null>(null);

   const { data: clientsRaw = [] } = useQuery({ queryKey: ["clientsList", companyId], queryFn: () => clientService.list(companyId), select: (res) => res.data || [] });
   const { data: projectsRaw = [] } = useQuery({ queryKey: ["projectsList", companyId], queryFn: () => projectService.list(companyId), select: (res) => res.data || [] });
   const { data: statuses = [] } = useQuery({ queryKey: ["statusesList", companyId], queryFn: () => statusService.list(companyId), select: (res) => res.data || [] });
   const { data: history = [] } = useQuery({ queryKey: ["workLogs", employeeId], queryFn: () => workLogService.getLogs(employeeId), select: (res) => res.data.data || [] });

   const activePreviewReport = useMemo(() => {
      if (!activePreviewId) return null;
      return history.find((h: any) => h.workLogId === activePreviewId);
   }, [activePreviewId, history]);

   const clientOptions = useMemo(() => clientsRaw.map((c: any) => ({ id: c.clientId, name: c.clientName })), [clientsRaw]);
   const projectOptions = useMemo(() => projectsRaw.map((p: any) => ({ id: p.projectId, name: p.projectName })), [projectsRaw]);
   const statusOptions = useMemo(() => statuses.map((s: any) => ({ id: s.statusId, name: s.statusName })), [statuses]);
   const defaultStatusId = useMemo(() => statusOptions[0]?.id || 0, [statusOptions]);

   const isCurrentDateSent = useMemo(() => {
      return history.some((h: any) => h.workDate.split('T')[0] === selectedDate && h.isEmailSent);
   }, [history, selectedDate]);


   useEffect(() => {
      if (projectOptions.length > 0 && logs.some(l => l.projectId === 0)) {
         const roleName = user?.roleName?.toLowerCase() || "";
         let defaultProjectId = 0;

         if (roleName.includes("support")) {
            const supportProj = projectOptions.find(p => p.name.toLowerCase().includes("support") || p.name.toLowerCase().includes("maintenance"));
            if (supportProj) defaultProjectId = supportProj.id;
         } else if (roleName.includes("developer")) {
            const devProj = projectOptions.find(p => p.name.toLowerCase().includes("internal development") || p.name.toLowerCase().includes("product"));
            if (devProj) defaultProjectId = devProj.id;
         } else if (roleName.includes("marketing") || roleName.includes("sales")) {
            const salesProj = projectOptions.find(p => p.name.toLowerCase().includes("marketing") || p.name.toLowerCase().includes("sales"));
            if (salesProj) defaultProjectId = salesProj.id;
         }

         if (defaultProjectId > 0) {
            setLogs(prev => prev.map(l => l.projectId === 0 ? { ...l, projectId: defaultProjectId } : l));
         }
      }
   }, [projectOptions, user?.roleName]);

   // Update initial logs with default status when statuses become available
   useEffect(() => {
      if (defaultStatusId && logs.some(l => l.tasks.some(t => t.statusId === 0))) {
         const updatedLogs = logs.map(l => ({
            ...l,
            statusId: l.statusId === 0 ? defaultStatusId : l.statusId,
            tasks: l.tasks.map(t => t.statusId === 0 ? { ...t, statusId: defaultStatusId } : t)
         }));
         setLogs(updatedLogs);
      }
   }, [defaultStatusId]);

   const groupedHistory = useMemo(() => {
      const map: any = {};
      history.forEach((h: WorkLog) => {
         const d = h.workDate.split('T')[0];
         if (!map[d]) map[d] = h;
      });
      return Object.values(map).sort((a: any, b: any) => b.workDate.localeCompare(a.workDate));
   }, [history]);

   // --- Handlers ---
   const addClientSession = () => {
      const newIdx = logs.length;

      // ⚡ ROLE-BASED DEFAULT SELECTION
      let defaultProjectId = 0;
      const roleName = user?.roleName?.toLowerCase() || "";

      if (roleName.includes("support")) {
         const supportProj = projectOptions.find(p => p.name.toLowerCase().includes("support") || p.name.toLowerCase().includes("maintenance"));
         if (supportProj) defaultProjectId = supportProj.id;
      } else if (roleName.includes("developer")) {
         const devProj = projectOptions.find(p => p.name.toLowerCase().includes("internal development") || p.name.toLowerCase().includes("product"));
         if (devProj) defaultProjectId = devProj.id;
      } else if (roleName.includes("marketing") || roleName.includes("sales")) {
         const salesProj = projectOptions.find(p => p.name.toLowerCase().includes("marketing") || p.name.toLowerCase().includes("sales"));
         if (salesProj) defaultProjectId = salesProj.id;
      }

      setLogs([{ clientId: 0, projectId: defaultProjectId, workDate: selectedDate, inputTime: 0, mode: "AnyDesk", statusId: defaultStatusId, otherEmployeeIds: "", tasks: [{ description: "", statusId: defaultStatusId, isCompleted: false }] }, ...logs]);
      setExpandedIndex(0);
   };

   // Track recent clients
   const trackRecentClient = (clientId: number) => {
      if (!clientId) return;
      const recentIdsJson = localStorage.getItem("recent_clients_workreport");
      let recentIds: number[] = recentIdsJson ? JSON.parse(recentIdsJson) : [];
      recentIds = [clientId, ...recentIds.filter(id => id !== clientId)].slice(0, 5);
      localStorage.setItem("recent_clients_workreport", JSON.stringify(recentIds));
   };
   const removeClientSession = (idx: number) => {
      if (logs.length > 1) {
         setLogs(logs.filter((_, i) => i !== idx));
         if (expandedIndex === idx) setExpandedIndex(Math.max(0, idx - 1));
      }
   };
   const updateClientDetail = (idx: number, field: string, value: any) => {
      const next = [...logs];
      (next[idx] as any)[field] = value;
      setLogs(next);

      if (field === 'clientId') trackRecentClient(value);
   };
   const addSubActivity = (logIdx: number) => {
      const next = [...logs];
      next[logIdx].tasks = [{ description: "", statusId: defaultStatusId, isCompleted: false }, ...next[logIdx].tasks];
      setLogs(next);
   };
   const removeSubActivity = (logIdx: number, taskIdx: number) => { if (logs[logIdx].tasks.length > 1) { const next = [...logs]; next[logIdx].tasks = next[logIdx].tasks.filter((_, i) => i !== taskIdx); setLogs(next); } };
   const updateActivityParam = (logIdx: number, taskIdx: number, field: string, value: any) => { const next = [...logs]; (next[logIdx].tasks[taskIdx] as any)[field] = value; setLogs(next); };

   const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
   };

   const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
   };

   const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newLogs = [...logs];
      const draggedLog = newLogs[draggedIndex];
      newLogs.splice(draggedIndex, 1);
      newLogs.splice(dropIndex, 0, draggedLog);

      setLogs(newLogs);
      setDraggedIndex(null);
      setDragEnabledIndex(null);

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

   const sessionMutation = useMutation({
      mutationFn: (data: WorkReportSessionDTO) => workLogService.saveSession(data),
      onSuccess: (res) => {
         if (res.data.success) {
            addToast("All Work Logs Synchronized Successfully!", "success");
            queryClient.invalidateQueries({ queryKey: ["workLogs", employeeId] });

            // 🌟 SMOOTH POST-SAVE EXPERIENCE
            // Keep the data in the form so it stays in "Edit Mode"
            setTimeout(() => {
               setExpandedIndex(0);
            }, 500);
         }
      }
   });

   const deleteSessionMutation = useMutation({
      mutationFn: (date: string) => workLogService.deleteSession(date),
      onSuccess: (res) => { if (res.data.success) { addToast("Daily Audit Removed", "success"); queryClient.invalidateQueries({ queryKey: ["workLogs", employeeId] }); } }
   });

   const sendEmailMutation = useMutation({
      mutationFn: (id: number) => workLogService.sendEmail(id),
      onSuccess: (res) => {
         if (res.data.success) {
            addToast("Email Report Dispatched!", "success");
            queryClient.invalidateQueries({ queryKey: ["workLogs", employeeId] });
         }
      },
      onError: (err: any) => { addToast(err.response?.data?.message || "Failed to send email", "error"); }
   });

   const previewEmailMutation = useMutation({
      mutationFn: (id: number) => workLogService.previewEmail(id),
      onSuccess: (res, variables) => {
         if (res.data.success) {
            setPreviewHtml(res.data.data);
            setActivePreviewId(variables);
            setIsPreviewOpen(true);
         }
      },
      onError: (err: any) => {
         addToast(err.response?.data?.message || "Failed to generate preview", "error");
      }
   });

   const loadSessionForEdit = (date: string) => {
      const logsForDate = history.filter(h => h.workDate.split('T')[0] === date);
      if (logsForDate.length > 0) {
         setSelectedDate(date);
         setLogs(logsForDate.map(h => ({
            clientId: h.clientId,
            projectId: h.projectId,
            workDate: date,
            inputTime: h.inputTime,
            mode: h.mode,
            statusId: h.statusId || defaultStatusId,
            otherEmployeeIds: h.otherEmployeeIds || "",
            tasks: h.tasks.map(t => ({ description: t.description, statusId: t.statusId, isCompleted: t.isCompleted }))
         })));
         setExpandedIndex(0);
         setIsHistoryOpen(false);
         addToast("Log Loaded for Edit", "success");
      }
   };

   // AUTO-LOAD SESSION FOR SELECTED DATE
   useEffect(() => {
      if (history.length > 0 && selectedDate && defaultStatusId) {
         const logsForDate = history.filter(h => h.workDate.split('T')[0] === selectedDate);
         if (logsForDate.length > 0) {
            const isDifferentDate = logs.length > 0 && logs[0].workDate !== selectedDate;
            const isBlankSession = logs.length === 1 && logs[0].clientId === 0;

            if (isDifferentDate || isBlankSession) {
               setLogs(logsForDate.map(h => ({
                  clientId: h.clientId,
                  projectId: h.projectId,
                  workDate: selectedDate,
                  inputTime: h.inputTime,
                  mode: h.mode,
                  statusId: h.statusId || defaultStatusId,
                  otherEmployeeIds: h.otherEmployeeIds || "",
                  tasks: h.tasks.map(t => ({ description: t.description, statusId: t.statusId, isCompleted: t.isCompleted }))
               })));
               setExpandedIndex(0);
            }
         } else {
            // If no data for this date, but we are showing data from another date, reset to blank
            if (logs.length > 0 && logs[0].workDate !== selectedDate) {
               setLogs([{ clientId: 0, projectId: 0, workDate: selectedDate, inputTime: 0, mode: "AnyDesk", statusId: defaultStatusId, otherEmployeeIds: "", tasks: [{ description: "", statusId: defaultStatusId, isCompleted: false }] }]);
               setExpandedIndex(0);
            }
         }
      }
   }, [selectedDate, history, defaultStatusId]);

   // --- Keyboard Shortcuts ---
   useEffect(() => {
      const handleKeys = (e: KeyboardEvent) => {
         if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); addClientSession(); }
         if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); if (expandedIndex !== null) addSubActivity(expandedIndex); }
         if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); handleSaveSession(); }
      };
      window.addEventListener('keydown', handleKeys);
      return () => window.removeEventListener('keydown', handleKeys);
   }, [logs, expandedIndex, selectedDate]);

   const handleSaveSession = () => {
      if (logs.some(l => !l.clientId || !l.projectId || l.tasks.some(t => !t.description))) {
         addToast("Required fields are missing.", "error"); return;
      }
      sessionMutation.mutate({ workDate: selectedDate, logs: logs.map(l => ({ ...l, workDate: selectedDate })) });
   };

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
                     <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 outline-none uppercase" />
                  </div>
                  <button onClick={() => setIsHistoryOpen(true)} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all">
                     <History className="w-4 h-4" /> View Archive
                  </button>
                  <button onClick={handleSaveSession} disabled={sessionMutation.isPending || isCurrentDateSent} className={`h-10 px-6 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${isCurrentDateSent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}>
                     {sessionMutation.isPending ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : isCurrentDateSent ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                     {isCurrentDateSent ? 'Report Dispatched' : 'Save Changes'} {!isCurrentDateSent && <span className="opacity-40 ml-1 text-[9px]">[CTRL+S]</span>}
                  </button>
               </div>
            </div>
         </div>

         <div className="w-full space-y-6">

            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Daily Task Sheet</h2>
               </div>
               {canCreate && !isCurrentDateSent && (
                  <button onClick={addClientSession} className="h-10 px-5 bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-slate-900 transition-all active:scale-95">
                     <Plus className="w-4 h-4" /> Add Entry <span className="opacity-40 text-[9px] font-mono">[ALT+N]</span>
                  </button>
               )}
            </div>

            {/* 🏗️ WORKSPACE GRID */}
            <div className="space-y-4">
               {logs.map((log, logIdx) => {
                  const isExpanded = expandedIndex === logIdx;
                  const clientName = clientOptions.find(o => o.id === log.clientId)?.name || "New Client Log";
                  const projectName = projectOptions.find(o => o.id === log.projectId)?.name || "Project Pending";

                  return (
                     <div
                        key={logIdx}
                        draggable={dragEnabledIndex === logIdx && !isExpanded}
                        onDragStart={(e) => handleDragStart(e, logIdx)}
                        onDragOver={(e) => handleDragOver(e, logIdx)}
                        onDrop={(e) => handleDrop(e, logIdx)}
                        onDragEnd={() => {
                           setDraggedIndex(null);
                           setDragEnabledIndex(null);
                        }}
                        className={`bg-white border-2 ${isExpanded ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-slate-300'} rounded-xl transition-all overflow-visible ${draggedIndex === logIdx ? 'opacity-40 border-dashed scale-[0.98]' : ''}`}
                     >

                        {/* COLLAPSED HEADER / SUMMARY TIER */}
                        <div
                           onClick={() => setExpandedIndex(isExpanded ? null : logIdx)}
                           className={`flex items-center justify-between px-6 py-4 cursor-pointer select-none transition-colors rounded-t-lg ${!isExpanded ? 'bg-white' : 'bg-slate-50 border-b border-slate-100'}`}
                        >
                           <div className="flex items-center gap-4 flex-1">
                              {!isExpanded && (
                                 <div
                                    className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing px-2 -ml-2"
                                    title="Drag to reorder"
                                    onMouseEnter={() => setDragEnabledIndex(logIdx)}
                                    onMouseLeave={() => setDragEnabledIndex(null)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                 >
                                    <GripVertical className="w-5 h-5" />
                                 </div>
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>#{logIdx + 1}</div>
                              {!isExpanded ? (
                                 <div className="flex items-center gap-4 text-xs">
                                    <span className="font-bold text-slate-700 uppercase tracking-wide">{clientName}</span>
                                    <span className="text-slate-200">|</span>
                                    <span className="text-slate-500 italic">{projectName}</span>
                                    <span className="text-slate-200">|</span>
                                    <div className="flex items-center gap-1.2 text-slate-400"><Clock className="w-3 h-3" /> {log.inputTime}h</div>
                                 </div>
                              ) : (
                                 <h3 className="font-bold text-slate-700 text-sm italic tracking-tight">Main Entry Mapping (Session #{logIdx + 1})</h3>
                              )}
                           </div>
                           <div className="flex items-center gap-4">
                              {logs.length > 1 && !isExpanded && (
                                 <button onClick={(e) => { e.stopPropagation(); removeClientSession(logIdx); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              )}
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                           </div>
                        </div>

                        {/* FULL EDIT VIEW (VISIBLE WHEN EXPANDED) */}
                        {isExpanded && (
                           <div className="flex flex-col lg:flex-row bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">

                              {/* 📝 FORM SECTION (LEFT) */}
                              <div className="flex-[1.2] p-5 space-y-4 border-r border-slate-200">

                                 {/* Shrink Client/Project into a single row */}
                                 <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                       <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Client Profile</label>
                                       <SimpleSearchSelect
                                          options={clientOptions}
                                          value={log.clientId}
                                          onChange={(v: number) => updateClientDetail(logIdx, 'clientId', v)}
                                          placeholder="Select Client"
                                          sortMode="recentLast"
                                          disabledOptions={logs.map(l => l.clientId)}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Project Scope</label>
                                       <SimpleSearchSelect
                                          options={projectOptions}
                                          value={log.projectId}
                                          onChange={(v: number) => updateClientDetail(logIdx, 'projectId', v)}
                                          placeholder="Select Project"
                                       />
                                    </div>
                                 </div>

                                 {/* Twin Card Rows */}
                                 <div className="grid grid-cols-2 gap-3">
                                    {/* Main Status Card */}
                                    <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1.5">
                                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Main Status</label>
                                       <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                          <select
                                             value={log.statusId}
                                             onChange={(e) => updateClientDetail(logIdx, 'statusId', parseInt(e.target.value))}
                                             className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
                                          >
                                             {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                          </select>
                                       </div>
                                    </div>

                                    {/* Session Mode Card */}
                                    <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1.5">
                                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Session Mode</label>
                                       <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                          <input
                                             value={log.mode}
                                             onChange={(e) => updateClientDetail(logIdx, 'mode', e.target.value)}
                                             placeholder="AnyDesk"
                                             className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
                                          />
                                       </div>
                                    </div>

                                    {/* Total Time Card */}
                                    <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1.5">
                                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Time</label>
                                       <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                          <input
                                             type="number"
                                             step="0.01"
                                             value={log.inputTime}
                                             onChange={(e) => updateClientDetail(logIdx, 'inputTime', e.target.value)}
                                             placeholder="0"
                                             className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
                                          />
                                       </div>
                                    </div>

                                    {/* Team Card */}
                                    <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1.5">
                                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Team</label>
                                       <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                          <input
                                             value={log.otherEmployeeIds}
                                             onChange={(e) => updateClientDetail(logIdx, 'otherEmployeeIds', e.target.value)}
                                             placeholder="Employee Name"
                                             className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* ⚡ ACTIVITIES SECTION (RIGHT) */}
                              <div className="flex-1 p-5 bg-white flex flex-col">
                                 <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-slate-800">Activities</h4>
                                    <button onClick={() => addSubActivity(logIdx)} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                       <Plus className="w-3.5 h-3.5" /> Append <span className="opacity-40 text-[9px] font-mono">[ALT+A]</span>
                                    </button>
                                 </div>

                                 <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                                    {log.tasks.map((task, tIdx) => (
                                       <div key={tIdx} className="space-y-3 relative group">
                                          <button onClick={() => removeSubActivity(logIdx, tIdx)} className={`absolute -top-1.5 -right-1.5 p-1 bg-white border border-slate-200 rounded-full text-slate-300 hover:text-red-500 shadow-sm transition-all z-10 ${log.tasks.length === 1 ? 'hidden' : ''}`}><X className="w-3 h-3" /></button>

                                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-50 focus-within:border-blue-400 transition-all">
                                             <textarea
                                                value={task.description}
                                                onChange={(e) => updateActivityParam(logIdx, tIdx, 'description', e.target.value)}
                                                placeholder="Elaborate on work performed..."
                                                className="w-full h-60 p-3 bg-white border-none text-sm text-slate-700 focus:ring-0 outline-none resize-none placeholder:text-slate-300 leading-relaxed"
                                             />
                                          </div>

                                          <div className="flex items-center gap-3">
                                             <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-tighter">Audit Point {tIdx + 1}</span>
                                             <div className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex items-center">
                                                <select
                                                   value={task.statusId}
                                                   onChange={(e) => updateActivityParam(logIdx, tIdx, 'statusId', parseInt(e.target.value))}
                                                   className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
                                                >
                                                   {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                                </select>
                                             </div>
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

         {/* 🚀 HISTORY DRAWER - SIMPLE */}
         {
            isHistoryOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-end">
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-none" onClick={() => setIsHistoryOpen(false)} />
                  <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                     <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 underline decoration-blue-500 underline-offset-4">Audit Archive</h2>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {groupedHistory.length === 0 ? <div className="text-center py-20 text-slate-300 text-sm italic uppercase tracking-[0.3em]">NO RECORDS FOUND</div> : groupedHistory.map((h: any) => (
                           <div key={h.workLogId} className="p-5 border border-slate-200 rounded-lg hover:border-blue-300 transition-all space-y-4 shadow-sm hover:shadow-md relative overflow-hidden">
                              {/* 📧 EMAIL STATUS INDICATOR */}
                              {h.isEmailSent && (
                                 <div className="absolute top-0 right-0">
                                    <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-bl-lg border-l border-b border-emerald-100 flex items-center gap-1">
                                       <CheckCircle className="w-2.5 h-2.5" /> Mail Dispatched
                                    </div>
                                 </div>
                              )}

                              <div className="flex items-center justify-between">
                                 <div className="font-bold text-slate-700 text-sm flex items-center gap-3"><Calendar className="w-4 h-4 text-blue-500" /> {new Date(h.workDate).toLocaleDateString('en-GB')}</div>
                                 <div className="flex gap-2">
                                    {canEdit && !h.isEmailSent && (
                                       <button onClick={() => loadSessionForEdit(h.workDate.split('T')[0])} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                                    )}
                                    {canDelete && !h.isEmailSent && (
                                       <button
                                          onClick={() => {
                                             confirm({
                                                title: "Delete Audit?",
                                                message: "Are you sure you want to delete this daily audit permanently?",
                                                variant: "danger",
                                                onConfirm: () => deleteSessionMutation.mutate(h.workDate.split('T')[0])
                                             });
                                          }}
                                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    )}
                                 </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                 <button
                                    onClick={() => previewEmailMutation.mutate(h.workLogId)}
                                    disabled={previewEmailMutation.isPending}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                 >
                                    {previewEmailMutation.isPending && previewEmailMutation.variables === h.workLogId ? (
                                       <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    ) : (
                                       <Eye className="w-4 h-4 text-slate-500" />
                                    )}
                                    View Mail
                                 </button>
                                 {!h.isEmailSent && (
                                    <button
                                       onClick={() => {
                                          confirm({
                                             title: "Dispatch Report?",
                                             message: "Are you sure you want to send this work report via email now?",
                                             variant: "primary",
                                             onConfirm: () => sendEmailMutation.mutate(h.workLogId)
                                          });
                                       }}
                                       disabled={sendEmailMutation.isPending}
                                       className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                       {sendEmailMutation.isPending && sendEmailMutation.variables === h.workLogId ? (
                                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                       ) : (
                                          <Mail className="w-4 h-4 text-blue-400" />
                                       )}
                                       Send Mail
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )
         }

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
                  {!activePreviewReport?.isEmailSent && (
                     <button
                        onClick={() => {
                           if (activePreviewId) {
                              sendEmailMutation.mutate(activePreviewId);
                              setIsPreviewOpen(false);
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
      </div >
   );
}
