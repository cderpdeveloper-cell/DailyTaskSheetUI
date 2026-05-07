"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, LogIn, ArrowRight, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await authService.login({
        Email: data.email,
        Password: data.password
      });
      if (response.success && response.data) {
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );
        router.push("/dashboard");
      } else {
        setError(response.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-500/5 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Welcome <span className="text-blue-600">Back</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 lowercase italic tracking-tight">
            Sign in to your DailyWorkReport account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-bounce">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            {...register("email")}
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
            icon={<Mail className="w-4 h-4" />}
            className="bg-slate-50/50 border-slate-100 h-12"
            error={errors.email?.message}
          />

          <Input
            {...register("password")}
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            className="bg-slate-50/50 border-slate-100 h-12"
            error={errors.password?.message}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              isLoading={isSubmitting}
            >
              Sign In
              <LogIn className="w-4 h-4 ml-3" />
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1 mx-auto mt-1"
              >
                Create Account <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          </div>
        </form>

        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          DailyWorkReport © {new Date().getFullYear()} All Rights Reserved
        </p>
      </div>
    </div>
  );
}
