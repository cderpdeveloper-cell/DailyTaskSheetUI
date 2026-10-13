"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/utils/cn";

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
      </div>

      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all relative select-none",
            isMenuOpen && "bg-slate-50"
          )}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{user?.userName || "Admin"}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.roleName || "Owner"}</p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-300", isMenuOpen && "rotate-180")} />
        </div>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</p>
              <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.userName || "User"}</p>
              {user?.roleName && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                  {user.roleName}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
