import React, { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, showPasswordToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className={cn("text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1 mb-1.5 block")}>
            {label}
            {props.required && <span className="text-rose-500 ml-1.5 font-black text-[14px] leading-none">*</span>}
          </label>
        )}
        <div className="relative flex items-center group/input">
          {icon && (
            <div className="absolute left-4 text-slate-400 transition-colors group-focus-within/input:text-primary pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-sm",
              icon && "pl-11",
              isPassword && showPasswordToggle && "pr-11",
              error && "border-rose-500 focus:ring-rose-50",
              className
            )}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-700" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 ml-1 mt-1 animate-pulse">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
