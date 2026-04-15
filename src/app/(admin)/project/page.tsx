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
  MoreVertical,
  Briefcase,
  Layers,
  Calendar,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { projectService, Project } from "@/services/api/project.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { toast } from "sonner";

const getErrorMessage = (err: any) => {
    if (err.response?.data?.errors) {
        return Object.values(err.response.data.errors).flat().join(", ");
    }
    return err.response?.data?.message || err.message || "An unexpected error occurred";
};

const projectSchema = z.object({
  projectName: z.string().min(2, "Project Name is required"),
  projectColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please select a valid color"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectMasterPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const { canCreate, canEdit, canDelete } = usePagePermissions("projectmaster");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => projectService.list(companyId),
    select: (res) => res.data || [],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectColor: "#3B82F6"
    }
  });

  const selectedColor = watch("projectColor");

  const mutation = useMutation({
    mutationFn: (data: Partial<Project>) =>
      editingProject
        ? projectService.update({ ...editingProject, ...data })
        : projectService.save({ ...data, companyId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["projects", companyId] });
      setIsModalOpen(false);
      reset();
      setEditingProject(null);
      toast.success(res.message || (editingProject ? "Project updated successfully!" : "Project created successfully!"));
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["projects", companyId] });
      toast.success(res.message || "Project deleted successfully!");
    },
    onError: (err: any) => {
        toast.error(getErrorMessage(err));
    }
  });

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    reset({
      projectName: project.projectName,
      projectColor: project.projectColor || "#3B82F6"
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingProject(null);
    reset({
      projectName: "",
      projectColor: "#3B82F6"
    });
    setIsModalOpen(true);
  };


  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    p.projectName.trim().toLowerCase() !== "work"
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Project Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Coordinate and track all organizational projects.</p>
        </div>

        {canCreate && (
          <Button onClick={handleOpenAdd} className="gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" />
            Create New Project
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name..."
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.projectId} className="glass-card p-6 group hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white"
                  style={{ backgroundColor: project.projectColor || "#3B82F6" }}
                >
                  {project.projectName[0].toUpperCase()}
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => handleEdit(project)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMutation.mutate(project.projectId)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-6 truncate">{project.projectName}</h3>

            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Update Project" : "Create New Project"}
        size="lg"
        footer={(
          <>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="project-form" isLoading={mutation.isPending}>
              {editingProject ? "Update Project" : "Create Project"}
            </Button>
          </>
        )}
      >
        <form 
          id="project-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))} 
          className="space-y-6"
        >
          <Input
            {...register("projectName")}
            label="Project Name"
            placeholder="e.g., Marketing Campaign 2026"
            error={errors.projectName?.message}
            icon={<Briefcase className="w-4 h-4" />}
            required
            autoFocus
          />

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Project Color Theme
            </label>
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border-4 border-white shadow-sm">
                <input
                  type="color"
                  {...register("projectColor")}
                  className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700 font-mono tracking-wider">{selectedColor?.toUpperCase()}</span>
                <span className="text-[10px] text-gray-400 font-medium">Click square to customize project branding</span>
              </div>
            </div>
            {errors.projectColor && <p className="text-xs text-red-500 mt-1">{errors.projectColor.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
