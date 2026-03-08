import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, User, Trash2, ChevronDown } from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type UserWithRole = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "user";
  role_id: string;
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];

      return profiles.map((p) => {
        const role = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          role: role?.role ?? "user",
          role_id: role?.id ?? "",
        } as UserWithRole;
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId, newRole }: { userId: string; roleId: string; newRole: "admin" | "user" }) => {
      if (roleId) {
        const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Role updated");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      setEditingId(null);
      toast.success("Name updated");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      // Delete role and profile (can't delete auth.users from client)
      if (roleId) {
        await supabase.from("user_roles").delete().eq("id", roleId);
      }
      await supabase.from("profiles").delete().eq("user_id", userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("User removed from system");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading users...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Users ({users.length})</h2>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.user_id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editingId === u.user_id ? (
                <div className="flex gap-2 items-center">
                  <input
                    className={inputClass}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") updateNameMutation.mutate({ userId: u.user_id, name: editName });
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => updateNameMutation.mutate({ userId: u.user_id, name: editName })}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:underline shrink-0">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(u.user_id); setEditName(u.display_name || ""); }}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left truncate block"
                  title="Click to edit name"
                >
                  {u.display_name || "Unnamed User"}
                </button>
              )}
              <p className="text-xs text-muted-foreground truncate">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Role selector */}
            <div className="relative shrink-0">
              <select
                value={u.role}
                onChange={(e) =>
                  changeRoleMutation.mutate({
                    userId: u.user_id,
                    roleId: u.role_id,
                    newRole: e.target.value as "admin" | "user",
                  })
                }
                className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                  u.role === "admin"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm(`Remove "${u.display_name || "this user"}" from the system? This deletes their profile and role.`))
                  deleteUserMutation.mutate({ userId: u.user_id, roleId: u.role_id });
              }}
              className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
              title="Remove user"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
