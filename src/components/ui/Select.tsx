import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className={cn("text-xs font-bold text-gray-500 uppercase tracking-widest ml-1")}>
            {label}
            {required && <span className="text-red-500 ml-1 font-bold text-lg">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-[11.5px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-gray-900 appearance-none bg-no-repeat bg-[right_1rem_center]",
              "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]",
              error && "border-red-500 focus:ring-red-200",
              className
            )}
            {...props}
          >
            {children}
          </select>
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

Select.displayName = "Select";
