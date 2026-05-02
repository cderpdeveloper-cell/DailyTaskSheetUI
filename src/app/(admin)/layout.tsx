"use client";

import React, { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Cookies from "js-cookie";
import { Toaster } from "sonner";
import { PatchNotesModal } from "@/components/PatchNotesModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout } = useAuthStore();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
    
    // Fallback: check cookie if store is not yet ready
    const token = Cookies.get("accessToken");
    if (!isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Handle manual logout if token is missing
  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (isLoaded && !token && isAuthenticated) {
      logout();
      router.push("/login");
    }
  }, [isLoaded, isAuthenticated, logout, router]);

  // Loading state while checking authentication
  if (!isLoaded || (!isAuthenticated && !Cookies.get("accessToken"))) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest animate-pulse font-mono">Verifying Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-6 flex-1">
           <div className="max-w-6xl mx-auto space-y-6">
                {children}
           </div>
        </main>
        
        <footer className="px-8 py-6 border-t border-gray-100 bg-white/50 backdrop-blur-sm text-center">
             <p className="text-xs text-gray-400 font-medium">
                © 2026 DallyWorkReport. All rights reserved. Built with precision and modern technology.
             </p>
        </footer>
      </div>
      <Toaster richColors position="top-right" />
      <PatchNotesModal />
    </div>
  );
}
