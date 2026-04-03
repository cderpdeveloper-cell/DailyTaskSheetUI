"use client";

import React from "react";
import { useToastStore } from "@/store/useToastStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = {
          success: CheckCircle2,
          error: XCircle,
          info: Info,
        }[toast.type];

        const colors = {
          success: "border-emerald-500 bg-emerald-50 text-emerald-800",
          error: "border-red-500 bg-red-50 text-red-800",
          info: "border-blue-500 bg-blue-50 text-blue-800",
        }[toast.type];

        return (
          <div 
            key={toast.id} 
            className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 shadow-2xl animate-in slide-in-from-right-10 duration-500",
                colors
            )}
          >
            <div className="flex-shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-sm font-bold tracking-tight">
                {toast.message}
            </div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
