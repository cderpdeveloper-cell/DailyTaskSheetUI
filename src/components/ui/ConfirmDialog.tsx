"use client";

import React from "react";
import { AlertCircle, Trash2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Button } from "./Button";

export const ConfirmDialog = () => {
  const { isOpen, options, close } = useConfirmStore();

  if (!isOpen || !options) return null;

  const handleConfirm = () => {
    options.onConfirm();
    close();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    close();
  };

  const isDanger = options.variant === "danger";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-300"
        onClick={handleCancel}
      />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
              isDanger ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
            )}>
              {isDanger ? <Trash2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {options.title}
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                {options.message}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 pt-4 border-t border-gray-50">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              {options.cancelText || "Cancel"}
            </Button>
            <Button 
              variant={isDanger ? "danger" : "primary"}
              onClick={handleConfirm}
              className="flex-1"
            >
              {options.confirmText || (isDanger ? "Delete" : "Confirm")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
