"use client";

import React from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Calendar,
  Layers,
  FileText,
  Activity,
  ChevronDown,
  Search
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/api/dashboard.service";
import { menuService } from "@/services/api/menu.service";
import { format } from "date-fns";
import Link from "next/link";
import { MenuItem } from "@/types/api.types";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
// Generates [currentYear + 2, currentYear + 1, currentYear, currentYear - 1, currentYear - 2, ...]
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);
  const [selectedStatusId, setSelectedStatusId] = React.useState<number | null>(null);
  const [selectedStatusLabel, setSelectedStatusLabel] = React.useState<string | null>(null);

  // Fetch Dashboard Stats (re-fetches when month/year change)
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await dashboardService.getStats(selectedMonth, selectedYear);
      return res.data;
    }
  });

  // Fetch Detailed Tasks - Only triggered when a status card is clicked
  const { data: detailedTasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["detailedTasks", selectedStatusId, selectedMonth, selectedYear],
    queryFn: async () => {
      if (selectedStatusId === null) return [];
      const res = await dashboardService.getDetailedTasks(selectedStatusId, selectedMonth, selectedYear);
      return res.data || [];
    },
    enabled: selectedStatusId !== null, // Only fetch when an ID is selected
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 mins to avoid redundant calls
  });

  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTasks = React.useMemo(() => {
    return (detailedTasks || []).filter(task => {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.projectName?.toLowerCase().includes(searchLower) ||
        task.clientName?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.moduleName?.toLowerCase().includes(searchLower) ||
        task.employeeName?.toLowerCase().includes(searchLower)
      );
    });
  }, [detailedTasks, searchTerm]);

  // Fetch Menu to check permissions
  const roleId = user ? (user.roleId ?? 0) : 0;
  const isTenant = !!user?.isTenant;

  const { data: menuData = [] } = useQuery({
    queryKey: ["menu", roleId, isTenant],
    queryFn: async () => {
      const res = await menuService.getMenu(roleId, isTenant);
      return res.data || [];
    },
  });

  // Flatten menu to find sub-modules easily
  const allModules = React.useMemo(() => {
    const flatten = (items: MenuItem[]): MenuItem[] => {
      return items.reduce((acc: MenuItem[], item) => {
        return [...acc, item, ...(item.subMenus ? flatten(item.subMenus) : [])];
      }, []);
    };
    return flatten(menuData);
  }, [menuData]);

  const hasWorkReport = allModules.some(m => m.moduleId === 5044 || m.name.toLowerCase().includes("work report"));
  const hasTaskSheet = allModules.some(m => m.moduleId === 5043 || m.name.toLowerCase().includes("task sheet"));

  const isManager =
    user?.roleType?.toLowerCase().includes("manager") ||
    user?.roleName?.toLowerCase().includes("manager") ||
    user?.roleName?.toLowerCase().includes("admin") ||
    user?.isTenant;

  const stats = React.useMemo(() => {
    if (!isManager && statsData?.statusWiseCounts) {
      const statusCards = statsData.statusWiseCounts.map((s, i) => ({
        id: s.statusId,
        label: s.statusName,
        value: s.count,
        icon: s.statusName.toLowerCase().includes("complete") ? CheckCircle2 :
          s.statusName.toLowerCase().includes("run") ? Activity :
            s.statusName.toLowerCase().includes("hold") ? Clock : BarChart3,
        color: i === 0 ? "#10b981" : i === 1 ? "#3b82f6" : i === 2 ? "#f97316" : "#a855f7",
        bgClass: i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-orange-500" : "bg-purple-500",
        trend: ""
      }));

      if (statusCards.length < 4) {
        statusCards.push({
          id: 0,
          label: "Total Tasks",
          value: statusCards.reduce((sum, card) => sum + (Number(card.value) || 0), 0),
          icon: FileText,
          color: "#4f46e5",
          bgClass: "bg-indigo-600",
          trend: ""
        });
      }
      return statusCards.slice(0, 4);
    }

    return [
      { id: 0, label: isManager ? "Total Employees" : "My Reports", value: statsData?.totalEmployees || 0, icon: Users, color: "#3b82f6", bgClass: "bg-blue-500", trend: "" },
      { id: 0, label: isManager ? "Active Projects" : "My Projects", value: statsData?.activeProjects || 0, icon: Briefcase, color: "#a855f7", bgClass: "bg-purple-500", trend: "" },
      { id: 0, label: isManager ? "Total Modules" : "My Modules", value: statsData?.totalModules || 0, icon: Layers, color: "#f97316", bgClass: "bg-orange-500", trend: "" },
      { id: 0, label: isManager ? "Total Clients" : "My Clients", value: statsData?.totalClients || 0, icon: Layers, color: "#10b981", bgClass: "bg-emerald-500", trend: "" },
    ];
  }, [isManager, statsData]);

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Hello, {user?.userName || "Admin"} 👋
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">
            Check out the latest summary of your workspace activities.
          </p>
        </div>
      </div>

      {/* Main Action Modules for Reports */}
      {(hasWorkReport || hasTaskSheet) && (
        <div className={cn("grid gap-6", (hasWorkReport && hasTaskSheet) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {hasWorkReport && (
            <Link href="/workreport" className="relative overflow-hidden group glass-card p-8 border-l-4 border-blue-500 hover:shadow-xl transition-all hover:translate-y-[-4px]">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Work Report</h3>
                <p className="text-sm text-gray-500 font-medium">Create and manage your detailed technical daily activities and session logs.</p>
                <div className="mt-6 flex items-center text-blue-500 text-sm font-bold gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layers className="w-32 h-32" />
              </div>
            </Link>
          )}
          {hasTaskSheet && (
            <Link href="/dallytasksheet" className="relative overflow-hidden group glass-card p-8 border-l-4 border-orange-500 hover:shadow-xl transition-all hover:translate-y-[-4px]">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Daily Task Sheet</h3>
                <p className="text-sm text-gray-500 font-medium">Record tasks and efficiently track time distribution for institutional tracking.</p>
                <div className="mt-6 flex items-center text-orange-500 text-sm font-bold gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-32 h-32" />
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">
          <Calendar className="w-4 h-4" />
          Filter by period
        </div>

        <div className="relative">
          <select
            id="dashboard-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            id="dashboard-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Selected period badge */}
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-none">
          {selectedMonthLabel} {selectedYear}
        </span>
      </div>

      {/* Stats Grid - Visible to ALL, filtered by API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => {
              const newStatusId = stat.id || 0;
              setSelectedStatusId(newStatusId);
              setSelectedStatusLabel(stat.label);
              setSearchTerm("");
              // Small delay to ensure the section is rendered before scrolling
              setTimeout(() => {
                document.getElementById("task-details-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className={cn(
              "glass-card p-6 flex items-center gap-5 hover:translate-y-[-4px] transition-all cursor-pointer group rounded-none",
              isStatsLoading && "animate-pulse",
              selectedStatusId === stat.id && "ring-2 ring-primary ring-offset-4 shadow-xl"
            )}
          >
            <div className={cn("w-14 h-14 rounded-none flex items-center justify-center text-white shadow-lg", stat.bgClass)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-gray-900 leading-none">
                  {isStatsLoading ? "..." : stat.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integrated Task Details Section */}
      {selectedStatusId !== null && (
        <div id="task-details-section" className="animate-in slide-in-from-top-4 duration-700">
          <div className="bg-white rounded-none border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
            {/* Section Header - Notice Board Style */}
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Detailed Tasks</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-3 py-1 text-white text-[10px] font-black rounded-none uppercase tracking-wider"
                      style={{ backgroundColor: stats.find(s => s.id === selectedStatusId)?.color || "#3b82f6" }}
                    >
                      {selectedStatusLabel}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {selectedMonthLabel} {selectedYear}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-gray-100 hidden md:block"></div>

                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-4 py-2 border rounded-none"
                    style={{
                      borderColor: (stats.find(s => s.id === selectedStatusId)?.color || "#3b82f6") + "33",
                      backgroundColor: (stats.find(s => s.id === selectedStatusId)?.color || "#3b82f6") + "0D"
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stats.find(s => s.id === selectedStatusId)?.color || "#3b82f6" }}
                    ></div>
                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">
                      Tasks: <span className="text-gray-900">{filteredTasks.length}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search in results..."
                    className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setSelectedStatusId(null)}
                  className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-none transition-all"
                >
                  <ChevronDown className="w-6 h-6 rotate-180" />
                </button>
              </div>
            </div>

            {/* Section Body */}
            <div className="p-8">
              {!isTasksLoading && filteredTasks.length === 0 ? (
                <div className="py-4 px-6 text-center bg-rose-50 rounded-none border border-rose-100 flex items-center justify-center gap-3 animate-pulse">
                  <span className="text-rose-500 font-black">✕</span>
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">No Data Found!</h4>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Daily Task Sheet (5044) */}
                  {filteredTasks.some(t => t.moduleId === 5044) && (
                    <div className="space-y-4">
                      <div className="border border-gray-100 rounded-none overflow-hidden shadow-sm">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                          <Table
                            isLoading={isTasksLoading}
                            data={filteredTasks.filter(t => t.moduleId === 5044)}
                            columns={[
                              { header: "Sr No", accessor: (_, i) => i + 1, className: "w-16 font-bold text-gray-400 text-center" },
                              { header: "Project", accessor: "projectName", className: "font-black text-gray-900" },
                              { header: "Module Name", accessor: "moduleName", className: "font-medium text-gray-600" },
                              { header: "Task Description", accessor: "description", className: "min-w-[300px]" },
                              { header: "Date", accessor: (item) => format(new Date(item.date), "dd MMM yyyy"), className: "whitespace-nowrap" },
                              {
                                header: "Status",
                                accessor: (item) => (
                                  <span className="px-2.5 py-1 rounded-none text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: item.statusColor || "#cbd5e1" }}>
                                    {item.status}
                                  </span>
                                ),
                                className: "whitespace-nowrap"
                              }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Report (5043) */}
                  {filteredTasks.some(t => t.moduleId === 5043) && (
                    <div className="space-y-4">
                      <div className="border border-gray-100 rounded-none overflow-hidden shadow-sm">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                          <Table
                            isLoading={isTasksLoading}
                            data={filteredTasks.filter(t => t.moduleId === 5043)}
                            columns={[
                              { header: "Sr No", accessor: (_, i) => i + 1, className: "w-16 font-bold text-gray-400 text-center" },
                              { header: "Client Name", accessor: "clientName", className: "font-black text-gray-900" },
                              { header: "Task Description", accessor: "description", className: "min-w-[300px]" },
                              { header: "Date", accessor: (item) => format(new Date(item.date), "dd MMM yyyy"), className: "whitespace-nowrap" },
                              {
                                header: "Status",
                                accessor: (item) => (
                                  <span className="px-2.5 py-1 rounded-none text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: item.statusColor || "#cbd5e1" }}>
                                    {item.status}
                                  </span>
                                ),
                                className: "whitespace-nowrap"
                              }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{isManager ? "Workforce Monthly Overview" : "My Monthly Activity Overview"}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{isManager ? "Current Month Statistics" : "My Performance Stats"}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {statsData?.monthlyOverview?.[0]?.statusCounts.map((status, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shadow-sm transition-all hover:bg-white">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.statusColor }}></div> {status.statusName}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-4 pb-4">
            {(statsData?.monthlyOverview && statsData.monthlyOverview.length > 0) ? (
              statsData.monthlyOverview.map((monthData, idx) => {
                const maxValue = Math.max(...statsData.monthlyOverview.flatMap(m => m.statusCounts.map(s => s.count)), 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full flex items-end gap-1 px-1 h-48 relative">
                      {monthData.statusCounts.map((status, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex-1 rounded-t-sm transition-all cursor-help relative group/bar hover:brightness-110"
                          style={{
                            height: `${(status.count / maxValue) * 100}%`,
                            backgroundColor: status.statusColor,
                            opacity: 0.85
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl border border-white/10">
                            {status.statusName}: {status.count}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-widest">{monthData.month}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full flex items-center justify-center h-48 text-gray-400 font-medium">
                {isStatsLoading ? "Loading overview..." : "No data available"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
