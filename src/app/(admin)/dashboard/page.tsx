"use client";

import React from "react";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  FileText,
  Activity
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/api/dashboard.service";
import { menuService } from "@/services/api/menu.service";
import { format } from "date-fns";
import Link from "next/link";
import { MenuItem } from "@/types/api.types";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Fetch Dashboard Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await dashboardService.getStats();
      return res.data;
    }
  });

  // Fetch Menu to check permissions
  // Dynamic roleID logic
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
        label: s.statusName,
        value: s.count,
        icon: s.statusName.toLowerCase().includes("complete") ? CheckCircle2 : 
              s.statusName.toLowerCase().includes("run") ? Activity : 
              s.statusName.toLowerCase().includes("hold") ? Clock : BarChart3,
        color: i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-orange-500" : "bg-purple-500",
        trend: ""
      }));

      // Add a total card if we have space
      if (statusCards.length < 4) {
        statusCards.push({
          label: "Total Reports",
          value: statsData?.totalEmployees || 0,
          icon: FileText,
          color: "bg-indigo-600",
          trend: ""
        });
      }
      return statusCards.slice(0, 4);
    }

    return [
      { label: isManager ? "Total Employees" : "My Reports", value: statsData?.totalEmployees || 0, icon: Users, color: "bg-blue-500", trend: "" },
      { label: isManager ? "Active Projects" : "My Projects", value: statsData?.activeProjects || 0, icon: Briefcase, color: "bg-purple-500", trend: "" },
      { label: isManager ? "Reports Pending" : "Today's Pending", value: statsData?.reportsPending || 0, icon: Clock, color: "bg-orange-500", trend: "" },
      { label: isManager ? "Total Clients" : "My Clients", value: statsData?.totalClients || 0, icon: Layers, color: "bg-emerald-500", trend: "" },
    ];
  }, [isManager, statsData]);

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

      {/* Stats Grid - Visible to ALL, filtered by API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={cn(
             "glass-card p-6 flex items-center gap-5 hover:translate-y-[-4px] transition-all cursor-pointer group",
             isStatsLoading && "animate-pulse"
          )}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
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

        <div className={cn("glass-card p-8 overflow-hidden", !isManager && "lg:col-span-3")}>
           <h3 className="text-xl font-bold text-gray-900 mb-6 font-primary">Recent Notifications</h3>
           <div className="space-y-6">
                {(statsData?.recentActivities && statsData.recentActivities.length > 0) ? statsData.recentActivities.map((activity, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-50 last:border-0 pb-4">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 ring-4 ring-primary/10"></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{activity.title}</p>
                            <p className="text-xs text-blue-500 font-bold mt-0.5">{activity.detail}</p>
                            <p className="text-xs text-gray-400 mt-1">{format(new Date(activity.activityDate), "MMM dd, HH:mm")}</p>
                        </div>
                    </div>
                )) : (
                   [1,2,3].map(i => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl opacity-40">
                         <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                         <div className="flex-1 space-y-2">
                             <div className="h-3 bg-gray-200 w-3/4 rounded-full"></div>
                             <div className="h-2 bg-gray-100 w-1/2 rounded-full"></div>
                         </div>
                    </div>
                   ))
                )}
           </div>
        </div>
      </div>
    </div>
  );
}
