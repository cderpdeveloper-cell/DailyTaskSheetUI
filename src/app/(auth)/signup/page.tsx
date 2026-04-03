"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, User, UserPlus, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api/auth.service";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  companyName: z.string().min(2, "Company Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    try {
      const response = await authService.signup(data);
      if (response.success) {
        router.push("/login?signup=success");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during registration");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-500/5 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>

        <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                Create <span className="text-blue-600">Account</span>
            </h1>
            <p className="text-sm font-medium text-slate-400 lowercase italic tracking-tight">
                Establish your organization dashboard
            </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-bounce">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
              <Input
                {...register("fullName")}
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={<User className="w-4 h-4" />}
                className="bg-slate-50/50 border-slate-100 h-12"
                error={errors.fullName?.message}
              />

              <Input
                {...register("companyName")}
                label="Organization / Company Name"
                type="text"
                placeholder="Acme Corp"
                icon={<Building2 className="w-4 h-4" />}
                className="bg-slate-50/50 border-slate-100 h-12"
                error={errors.companyName?.message}
              />
          </div>

          <Input
            {...register("email")}
            label="Professional Email"
            type="email"
            placeholder="john@example.com"
            icon={<Mail className="w-4 h-4" />}
            className="bg-slate-50/50 border-slate-100 h-12"
            error={errors.email?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                {...register("password")}
                label="Access Key"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                className="bg-slate-50/50 border-slate-100 h-12"
                error={errors.password?.message}
              />

              <Input
                {...register("confirmPassword")}
                label="Verify Key"
                type="password"
                placeholder="••••••••"
                icon={<CheckCircle2 className="w-4 h-4" />} // I'll import CheckCircle2
                className="bg-slate-50/50 border-slate-100 h-12"
                error={errors.confirmPassword?.message}
              />
          </div>

          <div className="pt-2">
            <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]" 
                isLoading={isSubmitting}
            >
                Initialize Account
                <UserPlus className="w-4 h-4 ml-3" />
            </Button>
          </div>
        </form>

        <div className="space-y-2">
            <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                By creating an account, you agree to our <span className="text-slate-400 underline cursor-pointer">Terms of Service</span>
            </p>
            <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                DailyWorkReport © {new Date().getFullYear()} All Rights Reserved
            </p>
        </div>
      </div>
    </div>
  );
}
