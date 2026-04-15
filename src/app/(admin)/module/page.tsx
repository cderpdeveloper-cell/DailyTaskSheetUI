"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  FolderTree,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { moduleService, Module } from "@/services/api/module.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { toast } from "sonner";

const getErrorMessage = (err: any) => {
    if (err.response?.data?.errors) {
        return Object.values(err.response.data.errors).flat().join(", ");
    }
    return err.response?.data?.message || err.message || "An unexpected error occurred";
};

const moduleSchema = z.object({
  moduleName: z.string().min(2, "Module Name is required"),
  parentModuleId: z.string().optional().or(z.literal("")),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function ModuleMasterPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const { canCreate, canEdit, canDelete } = usePagePermissions("modulemaster");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules", companyId],
    queryFn: () => moduleService.list(companyId),
    select: (res) => res.data || [],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ModuleFormValues) =>
      editingModule
        ? moduleService.update({ ...editingModule, ...data, parentModuleId: data.parentModuleId ? Number(data.parentModuleId) : null })
        : moduleService.save({ ...data, companyId, parentModuleId: data.parentModuleId ? Number(data.parentModuleId) : null }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["modules", companyId] });
      setIsModalOpen(false);
      reset();
      setEditingModule(null);
      toast.success(res.message || (editingModule ? "Module updated successfully!" : "Module created successfully!"));
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => moduleService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["modules", companyId] });
      toast.success(res.message || "Module deleted successfully!");
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const handleEdit = (mod: Module) => {
    setEditingModule(mod);
    reset({
      moduleName: mod.moduleName,
      parentModuleId: mod.parentModuleId?.toString() || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingModule(null);
    reset({
      moduleName: "",
      parentModuleId: ""
    });
    setIsModalOpen(true);
  };

  const filteredModules = modules.filter(m =>
    m.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" />
            Module Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Standardize features and hierarchy across projects.</p>
        </div>

        {canCreate && (
          <Button onClick={handleOpenAdd} className="gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" />
            Define New Module
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredModules.map((mod) => (
            <div key={mod.moduleId} className="glass-card p-5 group hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Layers className="w-5 h-5" />
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => handleEdit(mod)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMutation.mutate(mod.moduleId)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-1 truncate">{mod.moduleName}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <FolderTree className="w-3 h-3" />
                {mod.parentModuleId ? modules.find(m => m.moduleId === mod.parentModuleId)?.moduleName : "Root Module"}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? "Update Module" : "Define New Module"}
        size="lg"
        footer={(
          <>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="module-form" isLoading={mutation.isPending}>
              {editingModule ? "Update Module" : "Define Module"}
            </Button>
          </>
        )}
      >
        <form 
          id="module-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))} 
          className="space-y-6"
        >
          <Input
            {...register("moduleName")}
            label="Module Name"
            placeholder="e.g., Auth, Payments, Inventory"
            error={errors.moduleName?.message}
            icon={<Layers className="w-4 h-4" />}
            required
            autoFocus
          />

          <Select
            {...register("parentModuleId")}
            label="Parent Module (Optional)"
            error={errors.parentModuleId?.message}
          >
            <option value="">None (Root Module)</option>
            {modules.filter(m => m.moduleId !== editingModule?.moduleId).map(m => (
              <option key={m.moduleId} value={m.moduleId.toString()}>{m.moduleName}</option>
            ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
