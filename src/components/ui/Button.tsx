import React from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "info" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-[0.98]",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    outline: "bg-white border border-slate-200 text-blue-600 hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-[0.98]",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-md transition-all active:scale-[0.98]",
    success: "bg-[#81D9BC] hover:bg-[#6ecbb0] text-white shadow-md transition-all active:scale-[0.98]",
    info: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md transition-all active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg font-semibold",
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
