"use client";

import React, { useState } from "react";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/utils/cn";

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
      </div>

      <div className="flex items-center gap-4 relative">
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all relative",
            isMenuOpen && "bg-slate-50"
          )}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
            {user?.userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{user?.userName || "Admin"}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.roleName || "Owner"}</p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-300", isMenuOpen && "rotate-180")} />

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-[70] animate-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.userName}</p>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
