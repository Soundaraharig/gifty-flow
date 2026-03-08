import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";

type Tab = "styles" | "sizes" | "materials" | "colors" | "addons" | "orders";

const AdminPage = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("styles");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-semibold">Access denied. Admins only.</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Go Home</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "styles", label: "Editing Styles" },
    { id: "sizes", label: "Sizes" },
    { id: "materials", label: "Frame Materials" },
    { id: "colors", label: "Frame Colors" },
    { id: "addons", label: "Add-ons" },
    { id: "orders", label: "Orders" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Admin Dashboard</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "styles" && <AdminEditingStyles />}
        {tab === "sizes" && <AdminSizes />}
        {tab === "materials" && <AdminFrameMaterials />}
        {tab === "colors" && <AdminFrameColors />}
        {tab === "addons" && <AdminAddons />}
        {tab === "orders" && <AdminOrders />}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminCrudTable({
  tableName,
  queryKey,
  columns,
  renderForm,
  defaultValues,
}: {
  tableName: string;
  queryKey: string;
  columns: { key: string; label: string }[];
  renderForm: (values: Record<string, any>, onChange: (k: string, v: any) => void) => React.ReactNode;
  defaultValues: Record<string, any>;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName as any).select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (isNew) {
        const { error } = await supabase.from(tableName as any).insert(values as any);
        if (error) throw error;
      } else {
        const { id, ...rest } = values;
        const { error } = await supabase.from(tableName as any).update(rest as any).eq("id", id as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setEditing(null); setIsNew(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-bold text-foreground capitalize">{queryKey.replace("_", " ")}</h2>
        <button
          onClick={() => { setEditing(defaultValues); setIsNew(true); }}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          + Add New
        </button>
      </div>

      {editing && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-3">
          {renderForm(editing, (k, v) => setEditing((prev) => prev ? { ...prev, [k]: v } : prev))}
          <div className="flex gap-2">
            <button onClick={() => saveMutation.mutate(editing)} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={String(c.key)} className="text-left py-2 px-3 text-muted-foreground font-medium">{c.label}</th>
              ))}
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                {columns.map((c) => (
                  <td key={String(c.key)} className="py-2 px-3 text-foreground">{String((row as any)[c.key] ?? "")}</td>
                ))}
                <td className="py-2 px-3 text-right space-x-2">
                  <button onClick={() => { setEditing(row); setIsNew(false); }} className="text-primary text-xs hover:underline">Edit</button>
                  <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(row.id); }} className="text-destructive text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const AdminEditingStyles = () => (
  <AdminCrudTable
    tableName="editing_styles"
    queryKey="admin_editing_styles"
    columns={[
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", name: "", description: "", price: 0, image_url: "", sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          <input className={inputClass} placeholder="Slug" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <input className={inputClass} placeholder="Description" value={v.description || ""} onChange={(e) => set("description", e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} type="number" placeholder="Price" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          <input className={inputClass} type="number" placeholder="Sort Order" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          <input className={inputClass} placeholder="Image URL" value={v.image_url || ""} onChange={(e) => set("image_url", e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

const AdminSizes = () => (
  <AdminCrudTable
    tableName="sizes"
    queryKey="admin_sizes"
    columns={[
      { key: "name", label: "Name" },
      { key: "dimensions", label: "Dimensions" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active" },
    ]}
    defaultValues={{ slug: "", name: "", dimensions: "", price: 0, sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          <input className={inputClass} placeholder="Slug" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          <input className={inputClass} placeholder="Dimensions" value={v.dimensions || ""} onChange={(e) => set("dimensions", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" placeholder="Price" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          <input className={inputClass} type="number" placeholder="Sort Order" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

const AdminFrameMaterials = () => (
  <AdminCrudTable
    tableName="frame_materials"
    queryKey="admin_frame_materials"
    columns={[
      { key: "name", label: "Name" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active" },
    ]}
    defaultValues={{ slug: "", name: "", price: 0, sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          <input className={inputClass} placeholder="Slug" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" placeholder="Price" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          <input className={inputClass} type="number" placeholder="Sort Order" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

const AdminFrameColors = () => (
  <AdminCrudTable
    tableName="frame_colors"
    queryKey="admin_frame_colors"
    columns={[
      { key: "name", label: "Name" },
      { key: "hex", label: "Color" },
      { key: "is_active", label: "Active" },
    ]}
    defaultValues={{ slug: "", name: "", hex: "#000000", sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          <input className={inputClass} placeholder="Slug" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          <input className={inputClass} type="color" value={v.hex || "#000000"} onChange={(e) => set("hex", e.target.value)} />
        </div>
        <input className={inputClass} type="number" placeholder="Sort Order" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

const AdminAddons = () => (
  <AdminCrudTable
    tableName="addons"
    queryKey="admin_addons"
    columns={[
      { key: "name", label: "Name" },
      { key: "emoji", label: "Emoji" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active" },
    ]}
    defaultValues={{ slug: "", name: "", emoji: "", price: 0, sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          <input className={inputClass} placeholder="Slug" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          <input className={inputClass} placeholder="Emoji" value={v.emoji || ""} onChange={(e) => set("emoji", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" placeholder="Price" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          <input className={inputClass} type="number" placeholder="Sort Order" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

const AdminOrders = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, editing_styles(name), sizes(name), frame_materials(name), frame_colors(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">₹{order.total_price}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === "pending" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary"}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {order.editing_styles?.name} • {order.sizes?.name} • {order.frame_materials?.name} / {order.frame_colors?.name}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
