"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  ChevronRight, 
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { roleService, Role, Permission } from "@/services/api/role.service";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { Switch } from "@/components/ui/Switch";

export default function AccessControlPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", companyId],
    queryFn: () => roleService.list(companyId),
    select: (res) => res.data || [],
  });

  const permissionQuery = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: () => roleService.getPermissions(selectedRoleId),
    enabled: selectedRoleId > 0,
    select: (res) => res.data || [],
  });

  useEffect(() => {
    if (permissionQuery.data) {
      setPermissions(permissionQuery.data);
    } else {
        setPermissions([]);
    }
  }, [permissionQuery.data]);

  const flattenPermissions = (perms: Permission[]): any[] => {
    let result: any[] = [];
    perms.forEach(p => {
      result.push({
        moduleId: p.moduleId,
        view: p.view,
        add: p.add,
        edit: p.edit,
        delete: p.delete
      });
      if (p.children && p.children.length > 0) {
        result = [...result, ...flattenPermissions(p.children)];
      }
    });
    return result;
  };

  const permissionMutation = useMutation({
    mutationFn: (perms: Permission[]) => {
        const flatList = flattenPermissions(perms);
        console.log("[AccessControl] Saving flat list:", flatList);
        return roleService.savePermissions(selectedRoleId, flatList);
    },
    onSuccess: () => {
      toast.success("Permissions updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to save permissions");
    }
  });

  const togglePermissionRecursive = (perms: Permission[], moduleId: number, type: keyof Permission): Permission[] => {
    return perms.map(p => {
      if (p.moduleId === moduleId) {
        return { ...p, [type]: !p[type] };
      }
      if (p.children && p.children.length > 0) {
        return { ...p, children: togglePermissionRecursive(p.children, moduleId, type) };
      }
      return p;
    });
  };

  const togglePermission = (moduleId: number, type: "view" | "add" | "edit" | "delete") => {
    setPermissions(prev => togglePermissionRecursive(prev, moduleId, type));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-primary" />
             Access Control
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Configure system access and security levels.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                onClick={() => permissionMutation.mutate(permissions)} 
                isLoading={permissionMutation.isPending} 
                disabled={selectedRoleId === 0}
                className="gap-2 shadow-xl shadow-primary/20"
            >
                <Save className="w-4 h-4" />
                Save Changes
            </Button>
        </div>
      </div>

      <div className="glass-card p-6 bg-white/50 backdrop-blur-sm border-primary/10">
          <div className="max-w-md">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Select User Role</label>
                <select 
                    value={String(selectedRoleId)}
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-semibold text-gray-700 bg-white"
                >
                    <option value="0">Choose a Role to Configure...</option>
                    {roles.map((role: any) => (
                        <option key={role.roleMasterId} value={String(role.roleMasterId)}>
                            {role.roleName || "Unnamed Role"}
                        </option>
                    ))}
                </select>
          </div>
      </div>

      {selectedRoleId > 0 ? (
        <div className="space-y-10">
            {permissions.length > 0 ? permissions.map((cat) => (
                <div key={cat.moduleId} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                    <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">{cat.name}</h3>
                        <div className="flex gap-16 px-4">
                            <HeaderLabel label="View" />
                            <HeaderLabel label="Create" />
                            <HeaderLabel label="Edit" />
                            <HeaderLabel label="Delete" />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {cat.children.map((mod) => (
                            <div key={mod.moduleId} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                     <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                                     <span className="text-sm font-bold text-gray-700">{mod.name}</span>
                                </div>
                                <div className="flex items-center gap-16 px-4">
                                    <Switch checked={mod.view} onChange={() => togglePermission(mod.moduleId, "view")} />
                                    <Switch checked={mod.add} onChange={() => togglePermission(mod.moduleId, "add")} />
                                    <Switch checked={mod.edit} onChange={() => togglePermission(mod.moduleId, "edit")} />
                                    <Switch checked={mod.delete} onChange={() => togglePermission(mod.moduleId, "delete")} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <ShieldCheck className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold">No modules found for this role.</p>
                </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 opacity-30 grayscale">
            <ShieldCheck className="w-24 h-24 mb-6" />
            <h2 className="text-2xl font-black tracking-tighter">SELECT A ROLE TO BEGIN</h2>
            <p className="font-medium italic mt-2">Choose from the dropdown above to manage system access</p>
        </div>
      )}
    </div>
  );
}

const HeaderLabel = ({ label }: { label: string }) => (
    <div className="w-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
);

