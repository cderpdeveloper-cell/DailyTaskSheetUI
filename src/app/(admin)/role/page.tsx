"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Settings,
  Plus,
  CheckCircle2,
  X,
  ChevronRight,
  Lock,
  Eye,
  PlusSquare,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { roleService, Role, Permission } from "@/services/api/role.service";
import { masterService } from "@/services/api/master.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

export default function RoleMasterPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const { canCreate, canEdit, canDelete } = usePagePermissions("rolemaster");

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Role Form State
  const [roleMasterId, setRoleMasterId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleTypeId, setNewRoleTypeId] = useState<number>(0);
  const [newDescription, setNewDescription] = useState("");

  // Track which card's menu is open
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", companyId],
    queryFn: () => roleService.list(companyId),
    select: (res) => res.data || [],
  });

  const { data: roleTypes = [] } = useQuery({
    queryKey: ["lookups", "Role Type"],
    queryFn: () => masterService.getLookups("Role Type"),
    select: (res) => res.data || [],
  });

  const roleMutation = useMutation({
    mutationFn: (role: Partial<Role>) => roleService.save(role),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });
      toast.success(roleMasterId ? "Role updated successfully" : "Role created successfully");
      closeRoleModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });
      toast.success(res.message || "Role deleted successfully");
      setOpenMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cannot delete role");
    }
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setRoleMasterId(null);
    setNewRoleName("");
    setNewRoleTypeId(0);
    setNewDescription("");
  };

  const handleEdit = (role: Role) => {
    setRoleMasterId(role.roleMasterId);
    setNewRoleName(role.roleName);
    setNewRoleTypeId(role.roleTypeId);
    setNewDescription(role.descriptions || "");
    setIsRoleModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete);
      setIsDeleteModalOpen(false);
    }
  };

  const permissionQuery = useQuery({
    queryKey: ["permissions", selectedRole?.roleMasterId],
    queryFn: () => roleService.getPermissions(selectedRole!.roleMasterId),
    enabled: !!selectedRole,
    select: (res) => res.data || [],
  });

  useEffect(() => {
    if (permissionQuery.data) {
      setPermissions(permissionQuery.data);
    }
  }, [permissionQuery.data]);

  const permissionMutation = useMutation({
    mutationFn: (perms: Permission[]) => roleService.savePermissions(selectedRole!.roleMasterId, perms),
    onSuccess: () => {
      toast.success("Permissions saved successfully!");
      setIsPermissionModalOpen(false);
    },
  });

  const togglePermission = (moduleId: number, type: "View" | "Add" | "Edit" | "Delete") => {
    setPermissions(prev => prev.map(p => {
      if (p.moduleId === moduleId) {
        return {
          ...p,
          [type.toLowerCase()]: !p[type.toLowerCase() as keyof Permission]
        } as unknown as Permission;
      }
      return p;
    }));
  };

  const handleOpenPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Role Master
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Define organizational roles and set granular permissions.</p>
        </div>

        {canCreate && (
          <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" />
            Create New Role
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rolesLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl"></div>)
        ) : roles.map((role) => (
          <div key={role.roleMasterId} className="glass-card p-6 border-l-4 border-l-primary hover:translate-x-1 transition-all relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === role.roleMasterId ? null : role.roleMasterId)}
                  className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {openMenuId === role.roleMasterId && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-in zoom-in-95 duration-200">
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(role)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Edit Role
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteClick(role.roleMasterId)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Role
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">{role.roleName}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 h-10">{role.descriptions || "No description available"}</p>
          </div>
        ))}
      </div>

      {/* Role Creation / Edit Modal */}
      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={closeRoleModal} 
        title={roleMasterId ? "Edit Role" : "Create New Role"} 
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={closeRoleModal}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => roleMutation.mutate({
                roleMasterId: roleMasterId || undefined,
                roleName: newRoleName,
                roleTypeId: newRoleTypeId,
                descriptions: newDescription,
                companyId
              })}
              isLoading={roleMutation.isPending}
              disabled={!newRoleName || newRoleTypeId === 0}
            >
              {roleMasterId ? "Update Role" : "Save Role"}
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <Input
            label="Role Name"
            placeholder="Enter role name"
            value={newRoleName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoleName(e.target.value)}
            required
          />

          <Select
            label="Role Type"
            value={newRoleTypeId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewRoleTypeId(Number(e.target.value))}
            required
          >
            <option value={0}>Choose...</option>
            {roleTypes.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </Select>

          <Input
            label="Description"
            placeholder="Enter role description"
            value={newDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        size="sm"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. This role will be removed or deactivated.
            </p>
          </div>
        </div>
      </Modal>

      {/* Permission Matrix Modal */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title={`Permission Tree: ${selectedRole?.roleName}`}
        size="xl"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsPermissionModalOpen(false)}>Discard</Button>
            <Button variant="success" onClick={() => permissionMutation.mutate(permissions)} isLoading={permissionMutation.isPending}>
              Save All Permissions
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 font-medium text-sm text-primary">
            Set View/Add/Edit/Delete access for each software module. Changes are saved globally for this role.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">View</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Add</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Edit</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permissions.map((module) => (
                  <tr key={module.moduleId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {module.parentId && <ChevronRight className="w-3 h-3 text-gray-300 ml-4" />}
                        <span className={cn(
                          "text-sm font-semibold text-gray-700",
                          !module.parentId ? "text-primary font-bold" : "text-gray-600"
                        )}>
                          {module.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PermissionCheckbox checked={module.view} onChange={() => togglePermission(module.moduleId, "View")} icon={<Eye className="w-3.5 h-3.5" />} color="text-blue-500" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PermissionCheckbox checked={module.add} onChange={() => togglePermission(module.moduleId, "Add")} icon={<PlusSquare className="w-3.5 h-3.5" />} color="text-emerald-500" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PermissionCheckbox checked={module.edit} onChange={() => togglePermission(module.moduleId, "Edit")} icon={<Edit className="w-3.5 h-3.5" />} color="text-orange-500" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PermissionCheckbox checked={module.delete} onChange={() => togglePermission(module.moduleId, "Delete")} icon={<Trash2 className="w-3.5 h-3.5" />} color="text-red-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const PermissionCheckbox = ({ checked, onChange, icon, color }: any) => (
  <button
    onClick={onChange}
    className={cn(
      "w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all border-2",
      checked ? cn("bg-white shadow-sm border-2", color.replace('text', 'border')) : "bg-gray-50 border-gray-100 text-gray-300"
    )}
  >
    {checked ? React.cloneElement(icon, { className: cn(icon.props.className, color) }) : icon}
  </button>
);
