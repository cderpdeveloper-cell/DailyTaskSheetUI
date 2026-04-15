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
  UserCircle2,
  Fingerprint,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { clientService, Client } from "@/services/api/client.service";
import { useAuthStore } from "@/store/useAuthStore";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { toast } from "sonner";

const getErrorMessage = (err: any) => {
  if (err.response?.data?.errors) {
    return Object.values(err.response.data.errors).flat().join(", ");
  }
  return err.response?.data?.message || err.message || "An unexpected error occurred";
};

const clientSchema = z.object({
  clientName: z.string().min(1, "Client Name is required"),
  clientShortCode: z.string().min(1, "Client Short Code is required"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientMasterPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId || 1;

  const { canCreate, canEdit, canDelete } = usePagePermissions("clientmaster");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => clientService.list(companyId),
    select: (res) => res.data || [],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Client>) =>
      editingClient
        ? clientService.update({ ...editingClient, ...data })
        : clientService.save({ ...data, companyId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      setIsModalOpen(false);
      reset();
      setEditingClient(null);
      toast.success(res.message || (editingClient ? "Client updated successfully!" : "Client created successfully!"));
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success(res.message || "Client deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    }
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    reset({
      clientName: client.clientName,
      clientShortCode: client.clientShortCode || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    reset({
      clientName: "",
      clientShortCode: ""
    });
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c =>
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientShortCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <UserCircle2 className="w-8 h-8 text-primary" />
            Client Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage your external client partnerships.</p>
        </div>

        {canCreate && (
          <Button onClick={handleOpenAdd} className="gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" />
            Register New Client
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or code..."
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.clientId} className="glass-card p-6 group hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                  {client.clientName[0]}
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => handleEdit(client)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMutation.mutate(client.clientId)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{client.clientName}</h3>

              <div className="space-y-1.5">
                {client.clientShortCode && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Fingerprint className="w-3.5 h-3.5" />
                    Code: {client.clientShortCode}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? "Update Client" : "Register New Client"}
        size="lg"
      >
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <Input
            {...register("clientName")}
            label="Client Name"
            placeholder="e.g., Acme Corporation"
            error={errors.clientName?.message}
            icon={<UserCircle2 className="w-4 h-4" />}
            required
            autoFocus
          />

          <Input
            {...register("clientShortCode")}
            label="Client Short Code"
            placeholder="e.g., ACME"
            error={errors.clientShortCode?.message}
            icon={<Fingerprint className="w-4 h-4" />}
            required
          />

          <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-50">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="px-6">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending} className="px-8 shadow-lg">
              {editingClient ? "Update Client" : "Register Client"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
