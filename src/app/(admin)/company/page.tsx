"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Upload, 
  Save, 
  Building 
} from "lucide-react";
import { companyService } from "@/services/api/company.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { getFullUrl } from "@/services/api/apiConfig";
import { toast } from "sonner";

const companySchema = z.object({
  companyName: z.string().min(2, "Company Name is required"),
  fullAddress: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNo: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

// Company Profile component to manage core organization data
export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1; 

  const { canEdit } = usePagePermissions("companymaster");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: companyData, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => companyService.getById(companyId),
    select: (res) => res.data,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (companyData) {
      setValue("companyName", companyData.companyName);
      setValue("fullAddress", companyData.fullAddress || "");
      setValue("email", companyData.email || "");
      setValue("phoneNo", companyData.phoneNo || "");
      setValue("website", companyData.website || "");
      if (companyData.logoUrl) {
          setLogoPreview(getFullUrl(companyData.logoUrl));
      }
    }
  }, [companyData, setValue]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => companyService.update(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      toast.success("Company details updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update company");
    }
  });

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data: CompanyFormValues) => {
    const formData = new FormData();
    formData.append("companyId", String(companyId));
    formData.append("companyName", data.companyName);
    formData.append("fullAddress", data.fullAddress || "");
    formData.append("email", data.email || "");
    formData.append("phoneNo", data.phoneNo || "");
    formData.append("website", data.website || "");
    if (logoFile) {
      formData.append("LogoFile", logoFile);
    }
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="animate-pulse flex items-center justify-center p-20 text-gray-400 font-bold">Loading Profile...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Building className="w-8 h-8 text-primary" />
             Company Profile
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Manage your organization's core information.</p>
        </div>
        {canEdit && (
          <Button onClick={handleSubmit(onSubmit)} className="gap-2 px-6 shadow-xl shadow-primary/20" isLoading={mutation.isPending}>
            <Save className="w-5 h-5" />
            Update Settings
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative group p-1 rounded-full ring ring-primary ring-offset-2 overflow-hidden bg-gray-50 flex items-center justify-center">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo" 
                  className="w-32 h-32 rounded-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center text-gray-300">
                  <Building2 className="w-16 h-16" />
                </div>
              )}
              {canEdit && (
                <>
                  <label 
                    htmlFor="logo-upload" 
                    className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] py-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest font-bold font-mono"
                  >
                    Change Logo
                  </label>
                  <input 
                    id="logo-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={onLogoChange} 
                  />
                </>
              )}
            </div>
            
            <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">{companyData?.companyName}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Organization Entity</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
               General Information
          </h3>
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <Input
                    {...register("companyName")}
                    label="Company Name"
                    placeholder="Tech Solutions Ltd"
                    icon={<Building2 className="w-4 h-4" />}
                    error={errors.companyName?.message}
                />
            </div>

            <div className="md:col-span-2">
                <Input
                    {...register("fullAddress")}
                    label="Address"
                    placeholder="123 Main St, New York"
                    icon={<MapPin className="w-4 h-4" />}
                    error={errors.fullAddress?.message}
                />
            </div>

            <Input
              {...register("email")}
              label="Contact Email"
              type="email"
              placeholder="contact@company.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
            />

            <Input
              {...register("phoneNo")}
              label="Phone Number"
              placeholder="+1 234 567 890"
              icon={<Phone className="w-4 h-4" />}
              error={errors.phoneNo?.message}
            />

            <div className="md:col-span-2">
                <Input
                {...register("website")}
                label="Website URL"
                placeholder="https://company.com"
                icon={<Globe className="w-4 h-4" />}
                error={errors.website?.message}
                />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
