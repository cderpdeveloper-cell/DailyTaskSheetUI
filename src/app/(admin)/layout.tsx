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
  const { isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const token = Cookies.get("accessToken") || Cookies.get("refreshToken");
    if (_hasHydrated && !isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isLoaded, _hasHydrated, isAuthenticated, router]);

  const hasToken = typeof window !== "undefined" && (Cookies.get("accessToken") || Cookies.get("refreshToken"));

  // Loading state while checking authentication
  if (!isLoaded || (!_hasHydrated && !hasToken)) {
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
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-3 sm:p-5 md:p-6 flex-1">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>

        <footer className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-white/50 backdrop-blur-sm text-center">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 DallyWorkReport. All rights reserved.
          </p>
        </footer>
      </div>
      <Toaster richColors position="top-right" />
      <PatchNotesModal />
    </div>
  );
}
