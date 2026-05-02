"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  bodyClassName?: string;
  hideHeader?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName = "p-6",
  hideHeader = false,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
    "3xl": "max-w-7xl",
    full: "max-w-[95vw] h-[95vh]",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden outline-none animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          sizes[size]
        )}
      >
        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn(
          "overflow-y-auto", 
          size === "full" ? "flex-1" : (size === "xl" || size === "2xl" || size === "3xl" ? "max-h-[90vh]" : "max-h-[70vh]"),
          bodyClassName
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
