import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, User, Trash2, ChevronDown, Phone, ShoppingBag, Mail, MapPin, Search } from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type UserWithRole = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscriber_phone: string | null;
  created_at: string;
  role: "admin" | "user";
  role_id: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  address: string | null;
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [profilesRes, rolesRes, ordersRes, addressesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("orders").select("user_id, total_price, created_at"),
        supabase.from("customer_addresses").select("user_id, customer_phone, address, is_default"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const addresses = addressesRes.data ?? [];

      return profiles.map((p) => {
        const role = roles.find((r) => r.user_id === p.user_id);
        const userOrders = orders.filter((o) => o.user_id === p.user_id);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const lastOrder = userOrders.length > 0
          ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        const defaultAddr = addresses.find((a) => a.user_id === p.user_id && a.is_default);
        const anyAddr = addresses.find((a) => a.user_id === p.user_id);
        const addr = defaultAddr || anyAddr;

        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          subscriber_phone: p.subscriber_phone || addr?.customer_phone || null,
          created_at: p.created_at,
          role: role?.role ?? "user",
          role_id: role?.id ?? "",
          order_count: userOrders.length,
          total_spent: totalSpent,
          last_order_date: lastOrder,
          address: addr?.address || null,
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

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (u.display_name || "").toLowerCase().includes(q) ||
      (u.subscriber_phone || "").includes(q) ||
      u.role.includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Users ({users.length})</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search by name, phone or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === "admin").length}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-primary">₹{users.reduce((s, u) => s + u.total_spent, 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.user_id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 p-4">
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
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                  {u.order_count > 0 && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <ShoppingBag size={10} /> {u.order_count} orders
                    </span>
                  )}
                </div>
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

              {/* Expand toggle */}
              <button
                onClick={() => setExpandedId(expandedId === u.user_id ? null : u.user_id)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="More details"
              >
                <ChevronDown size={16} className={`transition-transform ${expandedId === u.user_id ? "rotate-180" : ""}`} />
              </button>

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

            {/* Expanded details */}
            {expandedId === u.user_id && (
              <div className="px-4 pb-4 pt-0 border-t border-border/50 bg-muted/20">
                <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={12} />
                    <span>{u.subscriber_phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag size={12} />
                    <span>₹{u.total_spent.toLocaleString()} spent</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin size={12} />
                    <span>{u.address || "No address saved"}</span>
                  </div>
                  {u.last_order_date && (
                    <div className="col-span-2 text-muted-foreground">
                      Last order: {new Date(u.last_order_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
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
