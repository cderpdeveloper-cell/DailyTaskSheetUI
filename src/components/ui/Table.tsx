"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

export const Table = <T extends { [key: string]: any }>({
  data,
  columns,
  isLoading,
}: TableProps<T>) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={cn(
                    "px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 leading-none",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4 border-b border-gray-50">
                      <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
                <tr>
                    <td 
                      colSpan={columns.length} 
                      className="px-6 py-12 text-center text-gray-400 font-medium italic"
                    >
                      No records found matching your criteria.
                    </td>
                </tr>
            ) : (
              data.map((item, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                  {columns.map((col, j) => (
                    <td 
                      key={j} 
                      className={cn(
                        "px-6 py-4 text-sm text-gray-700 transition-all font-medium",
                        col.className
                      )}
                    >
                      {typeof col.accessor === "function" 
                        ? col.accessor(item) 
                        : item[col.accessor as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
