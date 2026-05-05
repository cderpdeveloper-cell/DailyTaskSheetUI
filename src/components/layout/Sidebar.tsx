"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  LogOut,
  Layers,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { menuService } from "@/services/api/menu.service";
import { MenuItem } from "@/types/api.types";
import { getIcon } from "@/utils/iconMapper";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Dynamic roleID logic: try from user object fields or default to 1, but allow 0
  const roleId = useMemo(() => {
    if (!user) return 1;
    // @ts-ignore - Handle various API field naming conventions
    const id = user.roleId !== undefined && user.roleId !== null ? user.roleId : (user.RoleId ?? user.RoleMasterId ?? user.EmployeeID);
    const finalRole = id !== undefined && id !== null ? Number(id) : 1;
    return finalRole;
  }, [user]);

  const isTenant = !!user?.isTenant;

  const { data: menuData = [], isLoading, error } = useQuery({
    queryKey: ["menu", roleId, isTenant],
    queryFn: async () => {
      const res = await menuService.getMenu(roleId, isTenant);
      return res.data || [];
    },
    enabled: true, // Always fetch if Sidebar is mounted
  });

  if (error) {
    console.error("[Sidebar] Menu Fetch Error:", error);
  }

  // Handle path mapping
  const getPath = (item: MenuItem) => {
    if (item.url && item.url !== "/" && item.url !== "#") {
      return (item.url.startsWith("/") ? item.url : "/" + item.url);
    }

    const ctrl = item.controller?.toLowerCase() || "";
    if (ctrl === "companymaster") return "/company";
    if (ctrl === "employeemaster") return "/employee";
    if (ctrl === "rolemaster" || ctrl === "rolemastersoftwaremodules") return "/rolesoftwaremodules";
    if (ctrl === "projectmaster") return "/project";
    if (ctrl === "statusmaster") return "/status";
    if (ctrl === "clientmaster") return "/client";
    if (ctrl === "modulemaster") return "/module";
    if (ctrl === "emailsettings" || ctrl === "mailtemplate") return "/emailsettings";
    if (ctrl === "reports" || ctrl === "dailytasksheet" || ctrl === "workreport") return "/dallytasksheet";
    if (ctrl === "home") return "/dashboard";

    return "/" + ctrl.replace("master", "");
  };

  const NavItem = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
    const hasChildren = item.subMenus && item.subMenus.length > 0;
    const path = getPath(item);
    const isCurrent = pathname === path;
    const isChildActive = useMemo(() =>
      hasChildren && item.subMenus.some(child => pathname === getPath(child)),
      [hasChildren, item.subMenus, pathname]
    );

    const [isOpen, setIsOpen] = useState(isChildActive);
    const IconComponent = getIcon(item.icon);

    return (
      <div className="w-full">
        <div
          className={cn(
            "w-full px-3 py-2 flex items-center justify-between rounded-lg transition-colors cursor-pointer group mb-1",
            isCurrent ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50",
            (isChildActive && !isCurrent) && "text-primary font-bold",
          )}
          onClick={() => hasChildren ? setIsOpen(!isOpen) : router.push(path)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "transition-colors",
              (isCurrent || isChildActive) ? "text-primary" : "text-slate-400 group-hover:text-primary"
            )}>
              <IconComponent className={cn(depth > 0 ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "tracking-tight",
              depth > 0 ? "text-[12.5px]" : "text-sm",
              isCurrent ? "font-bold" : "font-medium"
            )}>
              {item.name.replace("Dally", "Daily")}
            </span>
          </div>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-300 text-slate-400",
                isOpen && "rotate-90"
              )}
            />
          )}
        </div>

        {hasChildren && isOpen && (
          <div className="flex flex-col ml-5 pl-1 border-l border-slate-100 mt-1 mb-2 animate-in fade-in duration-300">
            {item.subMenus
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((sub) => (
                <NavItem key={sub.moduleId} item={sub} depth={depth + 1} />
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 z-50 flex flex-col">
      <div className="p-6 border-b border-slate-50">
        <Link href="/dashboard" className="flex items-center gap-2 mb-2 cursor-pointer transition-opacity hover:opacity-80">
          <div className="p-2 bg-primary rounded-lg shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            Daily<span className="text-primary font-black">Work</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg"></div>)}
          </div>
        ) : menuData
          .sort((a: MenuItem, b: MenuItem) => a.displayOrder - b.displayOrder)
          .map((item: MenuItem) => (
            <NavItem key={item.moduleId} item={item} />
          ))}
      </nav>

    </aside>
  );
};
