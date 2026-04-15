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
  Tag,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { statusService, Status } from "@/services/api/status.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { toast } from "sonner";

const getErrorMessage = (err: any) => {
    if (err.response?.data?.errors) {
        return Object.values(err.response.data.errors).flat().join(", ");
    }
    return err.response?.data?.message || err.message || "An unexpected error occurred";
};

const statusSchema = z.object({
  statusName: z.string().min(2, "Status Name is required"),
  statusColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please select a valid color"),
});

type StatusFormValues = z.infer<typeof statusSchema>;

export default function StatusMasterPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const { canCreate, canEdit, canDelete } = usePagePermissions("statusmaster");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["statuses", companyId],
    queryFn: () => statusService.list(companyId),
    select: (res) => res.data || [],
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      statusColor: "#3B82F6"
    }
  });

  const selectedColor = watch("statusColor");

  const mutation = useMutation({
    mutationFn: (data: Partial<Status>) =>
      editingStatus
        ? statusService.update({ ...editingStatus, ...data })
        : statusService.save({ ...data, companyId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["statuses", companyId] });
      setIsModalOpen(false);
      reset();
      setEditingStatus(null);
      toast.success(res.message || (editingStatus ? "Status updated successfully!" : "Status created successfully!"));
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => statusService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["statuses", companyId] });
      toast.success(res.message || "Status deleted successfully!");
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    reset({
      statusName: status.statusName,
      statusColor: status.statusColor || "#3B82F6"
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStatus(null);
    reset({
      statusName: "",
      statusColor: "#3B82F6"
    });
    setIsModalOpen(true);
  };

  const filteredStatuses = statuses.filter(s =>
    s.statusName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" />
            Status Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Define task and project status categories.</p>
        </div>

        {canCreate && (
          <Button onClick={handleOpenAdd} className="gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" />
            Create New Status
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search statuses..."
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStatuses.map((status) => (
            <div key={status.statusId} className="glass-card p-4 group hover:translate-y-[-4px] transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: status.statusColor || "#3B82F6" }}
                />
                <h3 className="font-bold text-gray-900 truncate">{status.statusName}</h3>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button onClick={() => handleEdit(status)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => deleteMutation.mutate(status.statusId)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStatus ? "Update Status" : "Create New Status"}
        size="lg"
        footer={(
          <>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="status-form" isLoading={mutation.isPending}>
              {editingStatus ? "Update Status" : "Create Status"}
            </Button>
          </>
        )}
      >
        <form 
          id="status-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))} 
          className="space-y-6"
        >
          <Input
            {...register("statusName")}
            label="Status Name"
            placeholder="e.g., In Progress, Completed"
            error={errors.statusName?.message}
            icon={<Tag className="w-4 h-4" />}
            required
            autoFocus
          />

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Status Color</label>
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border-4 border-white shadow-sm">
                <input
                  type="color"
                  {...register("statusColor")}
                  className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700 font-mono tracking-wider">{selectedColor?.toUpperCase()}</span>
                <span className="text-[10px] text-gray-400">Visual indicator for this status</span>
              </div>
            </div>
            {errors.statusColor && <p className="text-xs text-red-500 mt-1">{errors.statusColor.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
