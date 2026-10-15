"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  LogOut,
  Layers,
  LayoutDashboard,
  X
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { useSidebarStore } from "@/store/useSidebarStore";
import { menuService } from "@/services/api/menu.service";
import { MenuItem } from "@/types/api.types";
import { getIcon } from "@/utils/iconMapper";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { isOpen: isMobileOpen, close: closeMobileSidebar } = useSidebarStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileSidebar();
      }
    };
    if (isMobileOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, closeMobileSidebar]);

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

  // Coordinated accordion: only one top-level menu open at a time
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const isItemOrChildActive = useMemo(() => {
    const checkActive = (item: MenuItem, currentPath: string): boolean => {
      if (getPath(item) === currentPath) return true;
      if (item.subMenus && item.subMenus.length > 0) {
        return item.subMenus.some((child) => checkActive(child, currentPath));
      }
      return false;
    };
    return checkActive;
  }, []);

  // Sync open menu with active route on load or route change
  useEffect(() => {
    if (!menuData || menuData.length === 0) return;
    const activeRoot = menuData.find((item: MenuItem) =>
      item.subMenus && item.subMenus.length > 0 && isItemOrChildActive(item, pathname)
    );
    if (activeRoot) {
      setOpenMenuId(activeRoot.moduleId);
    }
  }, [pathname, menuData, isItemOrChildActive]);

  const handleToggleRoot = (id: number) => {
    setOpenMenuId((current) => (current === id ? null : id));
  };

  interface NavItemProps {
    item: MenuItem;
    depth?: number;
    isOpen?: boolean;
    onToggle?: (id: number) => void;
  }

  const NavItem = ({ item, depth = 0, isOpen = false, onToggle }: NavItemProps) => {
    const hasChildren = item.subMenus && item.subMenus.length > 0;
    const path = getPath(item);
    const isCurrent = pathname === path;
    const isChildActive = useMemo(() =>
      hasChildren && item.subMenus.some((child) => isItemOrChildActive(child, pathname)),
      [hasChildren, item.subMenus, pathname]
    );

    // If depth > 0 has children, coordinate nested sub-menus too
    const [openSubId, setOpenSubId] = useState<number | null>(null);
    useEffect(() => {
      if (hasChildren && depth > 0) {
        const activeSub = item.subMenus.find((child) => isItemOrChildActive(child, pathname));
        if (activeSub) {
          setOpenSubId(activeSub.moduleId);
        }
      }
    }, [hasChildren, depth, item.subMenus, pathname]);

    const IconComponent = getIcon(item.icon);

    const handleClick = () => {
      if (hasChildren) {
        if (onToggle) {
          onToggle(item.moduleId);
        }
      } else {
        router.push(path);
        closeMobileSidebar();
      }
    };

    return (
      <div className="w-full">
        <div
          className={cn(
            "w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-all duration-200 cursor-pointer group mb-1 touch-manipulation select-none active:scale-[0.99]",
            isCurrent
              ? "bg-primary/10 text-primary font-bold shadow-xs"
              : isChildActive
              ? "text-primary font-bold bg-primary/5"
              : isOpen
              ? "text-slate-900 bg-slate-50/80 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
          onClick={handleClick}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "transition-colors shrink-0",
              (isCurrent || isChildActive) ? "text-primary" : isOpen ? "text-primary" : "text-slate-400 group-hover:text-primary"
            )}>
              <IconComponent className={cn(depth > 0 ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "tracking-tight truncate",
              depth > 0 ? "text-[12.5px]" : "text-sm",
              isCurrent ? "font-bold" : (isChildActive || isOpen) ? "font-semibold" : "font-medium"
            )}>
              {item.name.replace("Dally", "Daily")}
            </span>
          </div>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-300 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1.5",
                isOpen && "rotate-90 text-primary group-hover:text-primary"
              )}
            />
          )}
        </div>

        {hasChildren && (
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            )}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col ml-5 pl-1 border-l border-slate-100 mt-0.5 mb-2 space-y-0.5">
                {item.subMenus
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((sub) => (
                    <NavItem
                      key={sub.moduleId}
                      item={sub}
                      depth={depth + 1}
                      isOpen={openSubId === sub.moduleId}
                      onToggle={(subId) => setOpenSubId((prev) => (prev === subId ? null : subId))}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          >
            <div className="p-2 bg-primary rounded-lg shadow-sm">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">
              Daily<span className="text-primary font-black">Work</span>
            </span>
          </Link>

          {/* Close button for mobile & tablet */}
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg"></div>)}
            </div>
          ) : menuData
            .sort((a: MenuItem, b: MenuItem) => a.displayOrder - b.displayOrder)
            .map((item: MenuItem) => (
              <NavItem
                key={item.moduleId}
                item={item}
                depth={0}
                isOpen={openMenuId === item.moduleId}
                onToggle={handleToggleRoot}
              />
            ))}
        </nav>
      </aside>
    </>
  );
};
