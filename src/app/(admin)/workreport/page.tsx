"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import {
   Calendar, Plus, Trash2, Save, History, Clock, FileText, ChevronDown, Mail,
   Users, Activity, Edit2, ArrowRight, X, Search, Briefcase, Zap, CheckCircle, ChevronUp, ChevronRight
} from "lucide-react";
import { workLogService, WorkLogCreateDTO, WorkLog, WorkReportSessionDTO } from "@/services/api/workLog.service";
import { projectService } from "@/services/api/project.service";
import { clientService } from "@/services/api/client.service";
import { statusService } from "@/services/api/status.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useConfirmStore } from "@/store/useConfirmStore";

// --- Clean Search Select Component ---

const SimpleSearchSelect = ({ label, options, value, onChange, placeholder }: any) => {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState("");
   const containerRef = useRef<HTMLDivElement>(null);
   const selectedOption = options.find((o: any) => o.id === value);

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
                     {options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase())).map((opt: any) => (
                        <button
                           key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}
                           className={`w-full text-left px-4 py-2.5 text-xs transition-all ${value === opt.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                           {opt.name}
                        </button>
                     ))}
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

   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
   const [isHistoryOpen, setIsHistoryOpen] = useState(false);
   const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
   const [logs, setLogs] = useState<WorkLogCreateDTO[]>([
      { clientId: 0, projectId: 0, workDate: selectedDate, inputTime: 0, mode: "AnyDesk", statusId: 0, otherEmployeeIds: "", tasks: [{ description: "", statusId: 0, isCompleted: false }] }
   ]);

   const { data: clientsRaw = [] } = useQuery({ queryKey: ["clientsList", companyId], queryFn: () => clientService.list(companyId), select: (res) => res.data || [] });
   const { data: projectsRaw = [] } = useQuery({ queryKey: ["projectsList", companyId], queryFn: () => projectService.list(companyId), select: (res) => res.data || [] });
   const { data: statuses = [] } = useQuery({ queryKey: ["statusesList", companyId], queryFn: () => statusService.list(companyId), select: (res) => res.data || [] });
   const { data: history = [] } = useQuery({ queryKey: ["workLogs", employeeId], queryFn: () => workLogService.getLogs(employeeId), select: (res) => res.data.data || [] });

   const clientOptions = useMemo(() => clientsRaw.map((c: any) => ({ id: c.clientId, name: c.clientName })), [clientsRaw]);
   const projectOptions = useMemo(() => projectsRaw.map((p: any) => ({ id: p.projectId, name: p.projectName })), [projectsRaw]);
   const statusOptions = useMemo(() => statuses.map((s: any) => ({ id: s.statusId, name: s.statusName })), [statuses]);
   const defaultStatusId = useMemo(() => statusOptions[0]?.id || 0, [statusOptions]);

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
      setLogs([...logs, { clientId: 0, projectId: 0, workDate: selectedDate, inputTime: 0, mode: "AnyDesk", statusId: defaultStatusId, otherEmployeeIds: "", tasks: [{ description: "", statusId: defaultStatusId, isCompleted: false }] }]);
      setExpandedIndex(newIdx);
   };
   const removeClientSession = (idx: number) => {
      if (logs.length > 1) {
         setLogs(logs.filter((_, i) => i !== idx));
         if (expandedIndex === idx) setExpandedIndex(Math.max(0, idx - 1));
      }
   };
   const updateClientDetail = (idx: number, field: string, value: any) => { const next = [...logs]; (next[idx] as any)[field] = value; setLogs(next); };
   const addSubActivity = (logIdx: number) => { const next = [...logs]; next[logIdx].tasks.push({ description: "", statusId: defaultStatusId, isCompleted: false }); setLogs(next); };
   const removeSubActivity = (logIdx: number, taskIdx: number) => { if (logs[logIdx].tasks.length > 1) { const next = [...logs]; next[logIdx].tasks = next[logIdx].tasks.filter((_, i) => i !== taskIdx); setLogs(next); } };
   const updateActivityParam = (logIdx: number, taskIdx: number, field: string, value: any) => { const next = [...logs]; (next[logIdx].tasks[taskIdx] as any)[field] = value; setLogs(next); };

   const sessionMutation = useMutation({
      mutationFn: (data: WorkReportSessionDTO) => workLogService.saveSession(data),
      onSuccess: (res) => {
         if (res.data.success) {
            addToast("Audit Session Saved!", "success");
            queryClient.invalidateQueries({ queryKey: ["workLogs", employeeId] });

            // Reset logs to a single empty entry with the default status ID
            setLogs([{
               clientId: 0,
               projectId: 0,
               workDate: selectedDate,
               inputTime: 0,
               mode: "AnyDesk",
               statusId: defaultStatusId,
               otherEmployeeIds: "",
               tasks: [{ description: "", statusId: defaultStatusId, isCompleted: false }]
            }]);
            setExpandedIndex(0);
         }
      }
   });

   const deleteSessionMutation = useMutation({
      mutationFn: (date: string) => workLogService.deleteSession(date),
      onSuccess: (res) => { if (res.data.success) { addToast("Daily Audit Removed", "success"); queryClient.invalidateQueries({ queryKey: ["workLogs", employeeId] }); } }
   });

   const sendEmailMutation = useMutation({
      mutationFn: (id: number) => workLogService.sendEmail(id),
      onSuccess: (res) => { if (res.data.success) { addToast("Email Report Dispatched!", "success"); } },
      onError: (err: any) => { addToast(err.response?.data?.message || "Failed to send email", "error"); }
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
                  <button onClick={handleSaveSession} disabled={sessionMutation.isPending} className="h-10 px-6 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all group">
                     {sessionMutation.isPending ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                     Save Changes <span className="opacity-40 ml-1 text-[9px]">[CTRL+S]</span>
                  </button>
               </div>
            </div>
         </div>

         <div className="w-full space-y-6">

            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Daily Task Sheet</h2>
               </div>
               <button onClick={addClientSession} className="h-10 px-5 bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-slate-900 transition-all active:scale-95">
                  <Plus className="w-4 h-4" /> Add Entry <span className="opacity-40 text-[9px] font-mono">[ALT+N]</span>
               </button>
            </div>

            {/* 🏗️ WORKSPACE GRID */}
            <div className="space-y-4">
               {logs.map((log, logIdx) => {
                  const isExpanded = expandedIndex === logIdx;
                  const clientName = clientOptions.find(o => o.id === log.clientId)?.name || "New Client Log";
                  const projectName = projectOptions.find(o => o.id === log.projectId)?.name || "Project Pending";

                  return (
                     <div key={logIdx} className={`bg-white border-2 ${isExpanded ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-slate-300'} rounded-xl transition-all overflow-visible`}>

                        {/* COLLAPSED HEADER / SUMMARY TIER */}
                        <div
                           onClick={() => setExpandedIndex(isExpanded ? null : logIdx)}
                           className={`flex items-center justify-between px-6 py-4 cursor-pointer select-none transition-colors rounded-t-lg ${!isExpanded ? 'bg-white' : 'bg-slate-50 border-b border-slate-100'}`}
                        >
                           <div className="flex items-center gap-4 flex-1">
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
                           <div className="flex flex-col md:flex-row animate-in fade-in slide-in-from-top-2 duration-300">
                              {/* DETAIL TIER (LEFT) - NOW INCLUDES TEAM ID */}
                              <div className="flex-1 p-6 space-y-6 border-b md:border-b-0 md:border-r border-slate-200">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <SimpleSearchSelect label="Client Profile" options={clientOptions} value={log.clientId} onChange={(v: number) => updateClientDetail(logIdx, 'clientId', v)} placeholder="Select Client" />
                                    <SimpleSearchSelect label="Project Scope" options={projectOptions} value={log.projectId} onChange={(v: number) => updateClientDetail(logIdx, 'projectId', v)} placeholder="Select Project" />
                                 </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Main Status</label>
                                       <select value={log.statusId} onChange={(e) => updateClientDetail(logIdx, 'statusId', parseInt(e.target.value))} className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer">
                                          {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                       </select>
                                    </div>
                                    <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Session Mode</label>
                                       <input value={log.mode} onChange={(e) => updateClientDetail(logIdx, 'mode', e.target.value)} placeholder="AnyDesk..." className="w-full bg-transparent border-none px-1 text-sm font-bold text-slate-700 focus:ring-0 outline-none" />
                                    </div>
                                    <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wide">Total Time</label>
                                       <input type="number" step="0.01" value={log.inputTime} onChange={(e) => updateClientDetail(logIdx, 'inputTime', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none px-1 text-sm font-bold text-slate-700 focus:ring-0 outline-none" />
                                    </div>
                                    {/* 📍 TEAM ID MOVED TO MAIN TABLE AS REQUESTED */}
                                    <div className="space-y-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                       <label className="text-[10px] font-bold text-blue-600 uppercase ml-1 tracking-wide flex items-center gap-1.5"><Users className="w-3 h-3" /> Team</label>
                                       <input value={log.otherEmployeeIds} onChange={(e) => updateClientDetail(logIdx, 'otherEmployeeIds', e.target.value)} placeholder="EMP-101, ..." className="w-full bg-transparent border-none px-1 text-sm font-bold text-slate-700 focus:ring-0 outline-none italic placeholder:font-normal" />
                                    </div>
                                 </div>
                              </div>

                              {/* SUB-DETAIL TIER (RIGHT) - NO TEAM ID HERE */}
                              <div className="w-full md:w-[450px] bg-slate-50/10 p-6 flex flex-col">
                                 <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3" /> Activities</h4>
                                    <button onClick={() => addSubActivity(logIdx)} className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all active:scale-95">
                                       <Plus className="w-3.5 h-3.5" /> Append <span className="opacity-40 text-[9px] font-mono">[ALT+A]</span>
                                    </button>
                                 </div>

                                 <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                    {log.tasks.map((task, tIdx) => (
                                       <div key={tIdx} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3 relative group transition-all hover:bg-white/80">
                                          <button onClick={() => removeSubActivity(logIdx, tIdx)} className={`absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-all ${log.tasks.length === 1 ? 'hidden' : ''}`}><X className="w-4 h-4" /></button>
                                          <div className="bg-white border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all flex flex-col h-32 overflow-hidden">
                                             <div className="px-4 pt-3 pb-1 border-b border-slate-50">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Activity Narrative</label>
                                             </div>
                                             <textarea
                                                value={task.description} onChange={(e) => updateActivityParam(logIdx, tIdx, 'description', e.target.value)}
                                                placeholder="Elaborate on work performed..."
                                                className="w-full bg-transparent border-none px-4 py-2 text-sm font-bold text-slate-700 focus:ring-0 outline-none flex-1 resize-none placeholder:font-normal placeholder:text-slate-200 leading-relaxed"
                                             />
                                          </div>
                                          <div className="flex justify-between items-center pt-2">
                                             <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">Audit Point {tIdx + 1}</span>
                                             </div>
                                             <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-500 uppercase">
                                                <select value={task.statusId} onChange={(e) => updateActivityParam(logIdx, tIdx, 'statusId', parseInt(e.target.value))} className="bg-transparent border-none focus:ring-0 outline-none cursor-pointer">
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
         {isHistoryOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-end">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-none" onClick={() => setIsHistoryOpen(false)} />
               <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                     <h2 className="font-bold text-slate-800 underline decoration-blue-500 underline-offset-4">Audit Archive</h2>
                     <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {groupedHistory.length === 0 ? <div className="text-center py-20 text-slate-300 text-sm italic uppercase tracking-[0.3em]">NO RECORDS FOUND</div> : groupedHistory.map((h: any) => (
                        <div key={h.workLogId} className="p-5 border border-slate-200 rounded-lg hover:border-blue-300 transition-all space-y-4 shadow-sm hover:shadow-md">
                           <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-700 text-sm flex items-center gap-3"><Calendar className="w-4 h-4 text-blue-500" /> {new Date(h.workDate).toLocaleDateString()}</div>
                              <div className="flex gap-2">
                                 <button onClick={() => loadSessionForEdit(h.workDate.split('T')[0])} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
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
                              </div>
                           </div>
                           <button
                               onClick={() => sendEmailMutation.mutate(h.workLogId)}
                               disabled={sendEmailMutation.isPending}
                               className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                               {sendEmailMutation.isPending && sendEmailMutation.variables === h.workLogId ? (
                                 <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                 <Mail className="w-4 h-4 text-blue-400" />
                              )}
                              Send Mail
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
