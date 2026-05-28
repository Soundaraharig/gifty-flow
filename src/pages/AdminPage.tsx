import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { toast } from "sonner";

import AdminUsers from "@/components/admin/AdminUsers";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";

type Tab = "categories" | "styles" | "sizes" | "materials" | "orders" | "gallery" | "resin" | "settings" | "users" | "subscriptions" | "video-frames" | "credit-requests";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AdminPage = () => {
  const { user, isAdmin, isSubscriber, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("categories");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
        <p className="text-muted-foreground">Sign in with your Google account to access the dashboard.</p>
        <button onClick={signInWithGoogle} className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-rose hover:opacity-90 transition-opacity">
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!isAdmin && !isSubscriber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-semibold">Access denied.</p>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Go Home</button>
      </div>
    );
  }

  // Subscriber sees limited tabs; admin sees all
  const adminTabs: { id: Tab; label: string }[] = [
    { id: "categories", label: "Gift Categories" },
    { id: "styles", label: "Editing Styles" },
    { id: "sizes", label: "Sizes" },
    { id: "materials", label: "Frame Materials" },
    { id: "resin", label: "Resin Types" },
    { id: "orders", label: "Orders" },
    { id: "gallery", label: "Gallery Images" },
    { id: "video-frames", label: "Video Frames" },
    { id: "credit-requests", label: "Credit Requests" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "users", label: "Users" },
    { id: "settings", label: "Settings" },
  ];

  const subscriberTabs: { id: Tab; label: string }[] = [
    { id: "categories", label: "Gift Categories" },
    { id: "styles", label: "Editing Styles" },
    { id: "sizes", label: "Sizes" },
    { id: "materials", label: "Frame Materials" },
    { id: "resin", label: "Resin Types" },
    { id: "orders", label: "Orders" },
    { id: "gallery", label: "Gallery Images" },
    { id: "video-frames", label: "Video Frames" },
  ];

  const tabs = isAdmin ? adminTabs : subscriberTabs;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {isAdmin ? "Admin Dashboard" : "Subscriber Dashboard"}
          </h1>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>

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

        {tab === "categories" && <AdminGiftCategories />}
        {tab === "styles" && <AdminEditingStyles />}
        {tab === "sizes" && <AdminSizes />}
        {tab === "materials" && <AdminFrameMaterials />}
        {tab === "resin" && <AdminResinTypes />}
        {tab === "orders" && <AdminOrders />}
        {tab === "gallery" && <AdminGalleryImages />}
        {tab === "video-frames" && (isAdmin || isSubscriber) && <AdminVideoFrames isAdmin={isAdmin} />}
        {tab === "credit-requests" && isAdmin && <AdminCreditRequests />}
        {tab === "subscriptions" && isAdmin && <AdminSubscriptions />}
        {tab === "users" && isAdmin && <AdminUsers />}
        {tab === "settings" && isAdmin && <AdminSettings />}
      </div>
    </div>
  );
};

// --- Image Upload Helper ---
function ImageUploadField({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
      onChange(publicUrl);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <img src={value} alt="Preview" className="w-24 h-16 object-cover rounded-lg border border-border" />
      )}
      <div className="flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
        </button>
        <input
          className={inputClass}
          placeholder="Or paste image URL"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// --- Generic CRUD Table ---
function AdminCrudTable({
  tableName,
  queryKey,
  columns,
  renderForm,
  defaultValues,
}: {
  tableName: string;
  queryKey: string;
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[];
  renderForm: (values: Record<string, any>, onChange: (k: string, v: any) => void) => React.ReactNode;
  defaultValues: Record<string, any>;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const { data: rows = [], isLoading } = useQuery({
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
        const { id, created_at, updated_at, ...rest } = values;
        const { error } = await supabase.from(tableName as any).insert(rest as any);
        if (error) throw error;
      } else {
        const { id, created_at, updated_at, ...rest } = values;
        const { error } = await supabase.from(tableName as any).update(rest as any).eq("id", id as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setEditing(null); setIsNew(false); },
    onError: (err: any) => alert("Save failed: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    onError: (err: any) => alert("Delete failed: " + err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: Record<string, any>[]) => {
      const updates = reordered.map((row, i) =>
        supabase.from(tableName as any).update({ sort_order: i } as any).eq("id", row.id as any)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    onError: (err: any) => alert("Reorder failed: " + err.message),
  });

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const reordered = [...rows];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    reorderMutation.mutate(reordered);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-bold text-foreground capitalize">{queryKey.replace(/admin_/g, "").replace(/_/g, " ")}</h2>
        <button
          onClick={() => { setEditing({ ...defaultValues }); setIsNew(true); }}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          + Add New
        </button>
      </div>

      {editing && (
        <div className="mb-6 p-5 rounded-xl border border-border bg-card space-y-4">
          <h3 className="font-semibold text-foreground text-sm">{isNew ? "Add New Item" : "Edit Item"}</h3>
          {renderForm(editing, (k, v) => setEditing((prev) => prev ? { ...prev, [k]: v } : prev))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-5 py-2 rounded-full border border-border text-sm font-medium text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-2 text-muted-foreground font-medium w-8"></th>
                {columns.map((c) => (
                  <th key={c.key} className="text-left py-2 px-3 text-muted-foreground font-medium">{c.label}</th>
                ))}
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-b border-border/50 transition-colors cursor-grab active:cursor-grabbing ${
                    dragIndex === index ? "opacity-40" : ""
                  } ${overIndex === index && dragIndex !== index ? "bg-primary/10 border-primary" : "hover:bg-muted/30"}`}
                >
                  <td className="py-2 px-2 text-muted-foreground">
                    <span className="text-base select-none">⠿</span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 px-3 text-foreground">
                      {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right space-x-2">
                    <button onClick={() => { setEditing({ ...row }); setIsNew(false); }} className="text-primary text-xs hover:underline">Edit</button>
                    <button onClick={() => { if (confirm("Delete this item?")) deleteMutation.mutate(row.id); }} className="text-destructive text-xs hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No items yet.</p>}
          {reorderMutation.isPending && <p className="text-center text-muted-foreground text-xs py-2">Saving order...</p>}
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// --- Gift Categories (with image upload) ---
const AdminGiftCategories = () => (
  <AdminCrudTable
    tableName="gift_categories"
    queryKey="admin_gift_categories"
    columns={[
      {
        key: "image_url", label: "Image",
        render: (val: string) => val ? <img src={val} alt="" className="w-12 h-8 object-cover rounded" /> : <span className="text-muted-foreground text-xs">No image</span>
      },
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "target_route", label: "Target Route" },
      { key: "is_active", label: "Active", render: (val: boolean) => val ? "✅" : "❌" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", title: "", description: "", image_url: "", sort_order: 0, target_route: "", is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <input className={inputClass} placeholder="Title" value={v.title || ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input className={inputClass} placeholder="Slug (e.g. photo-frames)" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <input className={inputClass} placeholder="Short description" value={v.description || ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target Route (URL)</label>
          <input className={inputClass} placeholder="e.g. /configure/photo-frames/styles" value={v.target_route || ""} onChange={(e) => set("target_route", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category Image</label>
          <ImageUploadField value={v.image_url || ""} onChange={(url) => set("image_url", url)} folder="categories" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
            <input className={inputClass} type="number" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          </div>
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              Active / Available
            </label>
          </div>
        </div>
      </>
    )}
  />
);

// --- Editing Styles (with image upload) ---
const AdminEditingStyles = () => (
  <AdminCrudTable
    tableName="editing_styles"
    queryKey="admin_editing_styles"
    columns={[
      {
        key: "image_url", label: "Image",
        render: (val: string) => val ? <img src={val} alt="" className="w-12 h-8 object-cover rounded" /> : <span className="text-muted-foreground text-xs">No image</span>
      },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active", render: (val: boolean) => val ? "✅" : "❌" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", name: "", description: "", price: 0, image_url: "", sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input className={inputClass} placeholder="Slug (e.g. oil-painting)" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <input className={inputClass} placeholder="Short description" value={v.description || ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Style Image</label>
          <ImageUploadField value={v.image_url || ""} onChange={(url) => set("image_url", url)} folder="styles" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price (₹)</label>
            <input className={inputClass} type="number" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
            <input className={inputClass} type="number" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

// --- Resin Product Types (with image upload) ---
const AdminResinTypes = () => (
  <AdminCrudTable
    tableName="resin_product_types"
    queryKey="admin_resin_product_types"
    columns={[
      {
        key: "image_url", label: "Image",
        render: (val: string) => val ? <img src={val} alt="" className="w-12 h-8 object-cover rounded" /> : <span className="text-muted-foreground text-xs">No image</span>
      },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active", render: (val: boolean) => val ? "✅" : "❌" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", name: "", description: "", price: 0, image_url: "", sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input className={inputClass} placeholder="Name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input className={inputClass} placeholder="Slug (e.g. resin-coasters)" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <input className={inputClass} placeholder="Short description" value={v.description || ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Product Image</label>
          <ImageUploadField value={v.image_url || ""} onChange={(url) => set("image_url", url)} folder="resin" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price (₹)</label>
            <input className={inputClass} type="number" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
            <input className={inputClass} type="number" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

// --- Sizes ---
const AdminSizes = () => (
  <AdminCrudTable
    tableName="sizes"
    queryKey="admin_sizes"
    columns={[
      { key: "name", label: "Name" },
      { key: "dimensions", label: "Dimensions" },
      { key: "price", label: "Price (₹)" },
      { key: "is_active", label: "Active", render: (val: boolean) => val ? "✅" : "❌" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", name: "", dimensions: "", price: 0, sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input className={inputClass} placeholder="e.g. A4" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input className={inputClass} placeholder="e.g. a4" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dimensions</label>
            <input className={inputClass} placeholder="e.g. 210 × 297 mm" value={v.dimensions || ""} onChange={(e) => set("dimensions", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price (₹)</label>
            <input className={inputClass} type="number" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
            <input className={inputClass} type="number" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);

// --- Frame Materials ---
const AdminFrameMaterials = () => (
  <AdminCrudTable
    tableName="frame_materials"
    queryKey="admin_frame_materials"
    columns={[
      {
        key: "image_url", label: "Image",
        render: (val: string) => val ? <img src={val} alt="" className="w-12 h-8 object-cover rounded" /> : <span className="text-muted-foreground text-xs">No image</span>
      },
      { key: "name", label: "Name" },
      { key: "price", label: "Price (₹)" },
      { key: "stock", label: "Stock" },
      { key: "is_active", label: "Active", render: (val: boolean) => val ? "✅" : "❌" },
      { key: "sort_order", label: "Order" },
    ]}
    defaultValues={{ slug: "", name: "", price: 0, image_url: "", stock: 10, sort_order: 0, is_active: true }}
    renderForm={(v, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input className={inputClass} placeholder="e.g. Wood" value={v.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input className={inputClass} placeholder="e.g. wood" value={v.slug || ""} onChange={(e) => set("slug", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Frame Image</label>
          <ImageUploadField value={v.image_url || ""} onChange={(url) => set("image_url", url)} folder="materials" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price (₹)</label>
            <input className={inputClass} type="number" value={v.price || 0} onChange={(e) => set("price", +e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
            <input className={inputClass} type="number" value={v.stock ?? 10} onChange={(e) => set("stock", +e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
            <input className={inputClass} type="number" value={v.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active
        </label>
      </>
    )}
  />
);


// --- Gallery Images (per editing style) ---
const AdminGalleryImages = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [editingTitle, setEditingTitle] = useState<{ id: string; title: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: styles = [] } = useQuery({
    queryKey: ["admin_editing_styles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("editing_styles").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: galleryImages = [], isLoading } = useQuery({
    queryKey: ["admin_gallery", selectedStyleId],
    queryFn: async () => {
      if (!selectedStyleId) return [];
      const { data, error } = await supabase
        .from("style_gallery_images" as any)
        .select("*")
        .eq("editing_style_id", selectedStyleId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!selectedStyleId,
  });

  const uploadFiles = async (files: FileList | File[]) => {
    if (!selectedStyleId || files.length === 0) return;
    setUploading(true);
    const fileArr = Array.from(files);
    let uploaded = 0;
    try {
      for (const file of fileArr) {
        setUploadProgress(`Uploading ${++uploaded}/${fileArr.length}...`);
        const ext = file.name.split(".").pop();
        const path = `gallery/${selectedStyleId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
        if (error) throw error;
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
        const { error: insertError } = await supabase.from("style_gallery_images" as any).insert({
          editing_style_id: selectedStyleId,
          image_url: publicUrl,
          sort_order: galleryImages.length + uploaded,
        } as any);
        if (insertError) throw insertError;
      }
      qc.invalidateQueries({ queryKey: ["admin_gallery", selectedStyleId] });
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const deleteImage = async (id: string) => {
    if (!confirm("Delete this gallery image?")) return;
    const { error } = await supabase.from("style_gallery_images" as any).delete().eq("id", id);
    if (error) alert("Delete failed: " + error.message);
    else qc.invalidateQueries({ queryKey: ["admin_gallery", selectedStyleId] });
  };

  const updateTitle = async (id: string, title: string) => {
    const { error } = await supabase.from("style_gallery_images" as any).update({ title } as any).eq("id", id);
    if (error) alert("Update failed: " + error.message);
    else {
      qc.invalidateQueries({ queryKey: ["admin_gallery", selectedStyleId] });
      setEditingTitle(null);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">Gallery Images</h2>
      <p className="text-sm text-muted-foreground mb-4">Upload model images per editing style. Drag & drop multiple images at once.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {styles.map((s: any) => (
          <button
            key={s.id}
            onClick={() => setSelectedStyleId(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedStyleId === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {!selectedStyleId ? (
        <p className="text-muted-foreground text-sm">Select a style above to manage its gallery images.</p>
      ) : (
        <>
          {/* Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`mb-6 p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm font-medium text-foreground">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm font-medium text-foreground">Drag & drop images here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse • Multiple files supported</p>
              </>
            )}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : galleryImages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No gallery images for this style yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryImages.map((img: any) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border bg-card">
                  <img src={img.image_url} alt={img.title || ""} className="w-full aspect-square object-cover" />
                  <div className="p-2 space-y-1">
                    {editingTitle?.id === img.id ? (
                      <div className="flex gap-1">
                        <input
                          className={inputClass}
                          value={editingTitle.title}
                          onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                          placeholder="Title"
                        />
                        <button onClick={() => updateTitle(img.id, editingTitle.title)} className="text-primary text-xs">✓</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingTitle({ id: img.id, title: img.title || "" })}
                        className="text-xs text-muted-foreground hover:text-foreground truncate block w-full text-left"
                      >
                        {img.title || "Add title..."}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/80 text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- Orders ---
const AdminOrders = () => {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_orders"] }),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_orders"] }),
    onError: (err: any) => alert("Delete failed: " + err.message),
  });

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">Orders</h2>

      {/* UPI Stats */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
          </div>
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-center">
            <p className="text-2xl font-bold text-primary">
              {orders.filter((o: any) => o.payment_method === "upi").length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Paid via UPI</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <p className="text-2xl font-bold text-foreground">
              ₹{orders.filter((o: any) => o.payment_method === "upi").reduce((s: number, o: any) => s + (o.total_price || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">UPI Revenue</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
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
                  {order.payment_method === "upi" && (
                    <span className="inline-block text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full mt-0.5">
                      💳 UPI
                    </span>
                  )}
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-background text-foreground mt-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {order.editing_styles?.name} • {order.sizes?.name} • {order.frame_materials?.name} / {order.frame_colors?.name}
              </p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                <button
                  onClick={() => { if (confirm("Delete this order permanently?")) deleteOrder.mutate(order.id); }}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Settings ---
const SETTINGS_FIELDS = [
  { key: "store_name", label: "Store Name", placeholder: "e.g. Zero GIF", hint: "Displayed in headers and order messages" },
  { key: "admin_whatsapp", label: "Admin WhatsApp Number", placeholder: "e.g. 919876543210", hint: "International format without + sign" },
  { key: "currency_symbol", label: "Currency Symbol", placeholder: "e.g. ₹ or $", hint: "Shown next to all prices" },
  { key: "min_order_amount", label: "Minimum Order Amount", placeholder: "e.g. 500", hint: "Set to 0 for no minimum", type: "number" },
  { key: "upi_id", label: "UPI ID", placeholder: "e.g. yourname@upi", hint: "Customers will see this at checkout to pay via UPI" },
];

const AdminSettings = () => {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings" as any).select("*");
      if (error) throw error;
      return data as unknown as { key: string; value: string }[];
    },
  });

  useEffect(() => {
    if (settings && !loaded) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
      setLoaded(true);
    }
  }, [settings, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = [
        ...SETTINGS_FIELDS.map((f) => ({
          key: f.key,
          value: (values[f.key] ?? "").trim(),
          updated_at: new Date().toISOString(),
        })),
        {
          key: "upi_qr_image",
          value: (values["upi_qr_image"] ?? "").trim(),
          updated_at: new Date().toISOString(),
        },
      ];
      const { error } = await supabase
        .from("site_settings" as any)
        .upsert(rows as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      alert("Settings saved!");
    },
    onError: (err: any) => alert("Save failed: " + err.message),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">Settings</h2>
      <div className="p-5 rounded-xl border border-border bg-card space-y-4 max-w-md">
        {SETTINGS_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={f.placeholder}
              type={f.type || "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
          </div>
        ))}

        {/* UPI QR Code Image Upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">UPI QR Code Image</label>
          <ImageUploadField
            value={values["upi_qr_image"] || ""}
            onChange={(url) => setValues((prev) => ({ ...prev, upi_qr_image: url }))}
            folder="settings"
          />
          <p className="text-xs text-muted-foreground mt-1">Upload a QR code image for UPI payments. Customers can download and scan it.</p>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

// --- Video Frames AR Admin Curation Panel ---
const AdminVideoFrames = ({ isAdmin }: { isAdmin: boolean }) => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Retrieve current user ID on mount for ownership checks
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Fetch user's profile to display and check ar_credits
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["admin_profile", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUserId,
  });

  const hasNoCredits = !isAdmin && (profile?.ar_credits ?? 0) <= 0;

  // Dynamically load MindAR compiler script on mount
  useEffect(() => {
    const scriptSrc = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.type = "module"; // Load as ES module to resolve relative CDN chunks (controller/ui)
    script.onload = () => console.log("MindAR Image Compiler ES module loaded successfully.");
    document.head.appendChild(script);
  }, []);

  // Fetch AR Frame records (Admins see all; Subscribers see only their own)
  const { data: frames = [], isLoading } = useQuery({
    queryKey: ["admin_video_frames", isAdmin, currentUserId],
    queryFn: async () => {
      let query = supabase.from("video_frames" as any).select("*");
      
      if (!isAdmin && currentUserId) {
        query = query.eq("created_by", currentUserId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: currentUserId !== null || isAdmin, // Enable query once auth context is resolved or if admin
  });

  const syncCompiledTargets = async (showProgress = false) => {
    try {
      // 1. Fetch all existing active frame records in chronological order
      const { data: activeRows, error: fetchErr } = await supabase
        .from("video_frames" as any)
        .select("*")
        .order("created_at", { ascending: true }); // Chronological!
      
      if (fetchErr) throw fetchErr;

      if (!activeRows || activeRows.length === 0) {
        console.log("No active frames remaining to compile.");
        return;
      }

      // Check if MindAR compiler is loaded on window object
      if (!(window as any).MINDAR?.IMAGE?.Compiler) {
        console.warn("AR Image Compiler not loaded yet.");
        return;
      }

      // 2. Load all images into HTML Image elements to prepare for compilation
      const loadImg = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image target for compilation."));
        });
      };

      const imageElements: HTMLImageElement[] = [];
      const validRows: any[] = [];

      for (const row of activeRows) {
        const rawTargetUrl = row.target_mind_url;
        let photoUrl = "";
        if (rawTargetUrl) {
          if (rawTargetUrl.includes("|")) {
            photoUrl = rawTargetUrl.split("|")[1];
          } else if (rawTargetUrl.includes(".jpg") || rawTargetUrl.includes(".png") || rawTargetUrl.includes(".jpeg")) {
            photoUrl = rawTargetUrl; // Newly inserted before compile
          }
        }

        if (photoUrl) {
          try {
            const img = await loadImg(photoUrl);
            imageElements.push(img);
            validRows.push({ ...row, extractedPhotoUrl: photoUrl });
          } catch (err) {
            console.warn("Could not load photo for combined compile, skipping row:", row.id, err);
          }
        }
      }

      if (imageElements.length === 0) {
        console.log("No valid photo targets found to compile.");
        return;
      }

      // 3. Compile all targets together programmatically on-the-fly in browser
      if (showProgress) setUploadProgress(`Compiling ${imageElements.length} targets together (0%)...`);
      const compiler = new (window as any).MINDAR.IMAGE.Compiler();
      
      await compiler.compileImageTargets(imageElements, (progress: number) => {
        if (showProgress) {
          setUploadProgress(`Compiling targets (${progress.toFixed(0)}%)...`);
        }
      });

      if (showProgress) setUploadProgress("Exporting compiled AR coordinates...");
      const exportedBuffer = await compiler.exportData();
      const mindBlob = new Blob([exportedBuffer], { type: "application/octet-stream" });

      // 4. Upload compiled combined targets.mind to Supabase Storage
      if (showProgress) setUploadProgress("Uploading compiled target (.mind)...");
      const mindPath = `video-frames/targets/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mind`;
      
      const { error: mindUploadError } = await supabase.storage
        .from("product-images")
        .upload(mindPath, mindBlob, { contentType: "application/octet-stream" });
      
      if (mindUploadError) throw mindUploadError;
      const targetMindUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${mindPath}`;

      // 5. Update all rows in the database to point to this new combined .mind file while preserving their unique photo_urls
      if (showProgress) setUploadProgress("Propagating compiled coordinates to active targets...");
      for (const row of validRows) {
        const combinedValue = `${targetMindUrl}|${row.extractedPhotoUrl}`;
        await supabase
          .from("video_frames" as any)
          .update({ target_mind_url: combinedValue } as any)
          .eq("id", row.id);
      }

      console.log("Successfully recompiled and synchronized all AR target coordinates!");
    } catch (err: any) {
      console.error("Failed to synchronize compiled AR targets:", err);
      if (showProgress) alert("AR targets synchronization failed: " + err.message);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("video_frames" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await syncCompiledTargets(false);
      qc.invalidateQueries({ queryKey: ["admin_video_frames"] });
      alert("AR frame entry deleted successfully.");
    },
    onError: (err: any) => alert("Delete failed: " + err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !photoFile || !videoFile) {
      alert("Please fill in the frame name, upload a frame photo and select an overlay video (.mp4) file.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active authenticated user session was found.");

      // Check if MindAR compiler is loaded on window object
      if (!(window as any).MINDAR?.IMAGE?.Compiler) {
        throw new Error("The AR Image Compiler is still loading in the background. Please wait a few seconds and try clicking submit again.");
      }

      // 1. Upload the raw target photo image file to Supabase Storage
      setUploadProgress("Uploading raw frame photo...");
      const rawPhotoExt = photoFile.name.split(".").pop();
      const rawPhotoPath = `video-frames/photos/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${rawPhotoExt}`;
      const { error: rawPhotoUploadError } = await supabase.storage
        .from("product-images")
        .upload(rawPhotoPath, photoFile);
      
      if (rawPhotoUploadError) throw rawPhotoUploadError;
      const targetPhotoUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${rawPhotoPath}`;

      // 2. Upload .mp4 video file
      setUploadProgress("Uploading overlay video (.mp4)...");
      const videoExt = videoFile.name.split(".").pop();
      const videoPath = `video-frames/videos/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${videoExt}`;
      const { error: videoUploadError } = await supabase.storage
        .from("product-images")
        .upload(videoPath, videoFile);
      
      if (videoUploadError) throw videoUploadError;
      const videoUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${videoPath}`;

      // 3. Insert new row into public.video_frames (holding raw photo URL temporarily as target_mind_url)
      setUploadProgress("Registering frame details in database...");
      const { error: insertError } = await supabase
        .from("video_frames" as any)
        .insert({
          frame_name: name.trim(),
          target_mind_url: targetPhotoUrl,
          video_url: videoUrl,
          created_by: user.id,
        } as any);

      if (insertError) throw insertError;

      // 3.5 Decrement non-admin's AR credits balance
      if (!isAdmin) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ ar_credits: (profile?.ar_credits ?? 1) - 1 } as any)
          .eq("user_id", user.id);
        
        if (creditError) {
          console.warn("Credit decrement failed but frame registered:", creditError);
        } else {
          refetchProfile();
        }
      }

      // 4. Trigger synchronous combined compilation and propagation
      await syncCompiledTargets(true);

      alert("AR Frame created successfully with dynamically compiled multi-target coordinates!");
      setName("");
      setPhotoFile(null);
      setVideoFile(null);
      
      // Reset file input elements manually
      const photoInput = document.getElementById("photo-file-input") as HTMLInputElement;
      const videoInput = document.getElementById("video-file-input") as HTMLInputElement;
      if (photoInput) photoInput.value = "";
      if (videoInput) videoInput.value = "";

      qc.invalidateQueries({ queryKey: ["admin_video_frames"] });
    } catch (err: any) {
      alert("AR Frame compilation or upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-xl font-bold text-foreground">Video Frames (AR)</h2>
            {!isAdmin && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                🪙 {profile?.ar_credits ?? 0} Credit{(profile?.ar_credits ?? 0) !== 1 ? "s" : ""} Available
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage and configure custom AR target layouts for physical gift frames.</p>
        </div>
      </div>

      {/* Creation Form (Visible to both Admins and Subscribers) */}
      <form onSubmit={handleCreate} className="p-5 rounded-xl border border-border bg-card space-y-4 text-left">
        <h3 className="font-semibold text-foreground text-sm">Add New AR Video Frame</h3>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Frame Name</label>
          <input
            className={inputClass}
            placeholder="e.g. Anniversary Frame A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Upload Frame Photo</label>
            <input
              id="photo-file-input"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              disabled={uploading}
            />
            {photoFile && <p className="text-xs text-muted-foreground truncate font-mono">Selected: {photoFile.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Overlay Video (.mp4)</label>
            <input
              id="video-file-input"
              type="file"
              accept="video/mp4"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              disabled={uploading}
            />
            {videoFile && <p className="text-xs text-muted-foreground truncate font-mono">Selected: {videoFile.name}</p>}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <button
            type="submit"
            disabled={uploading || hasNoCredits}
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-95 transition-opacity"
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                <span>{uploadProgress || "Uploading..."}</span>
              </>
            ) : (
              "Create AR Frame Asset"
            )}
          </button>
          
          {hasNoCredits && (
            <p className="text-xs text-rose-500 font-semibold mt-2">
              ⚠️ You have 0 AR Video Credits.{" "}
              <a href="/buy-credits" className="underline hover:text-rose-600 transition-colors">
                Buy Credits (₹50) to create a new frame
              </a>
            </p>
          )}
        </div>
      </form>

      {/* Frame Cards List */}
      <div>
        <h3 className="font-semibold text-foreground text-sm mb-3 text-left">Active AR Frames</h3>
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-left">Loading frames...</p>
        ) : frames.length === 0 ? (
          <p className="text-muted-foreground text-sm bg-muted/20 p-4 rounded-xl text-center border border-dashed border-border">No AR frames registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {frames.map((frame) => (
              <div key={frame.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-bold text-foreground truncate">{frame.frame_name}</h4>
                  <div className="text-xs text-muted-foreground space-y-1 font-mono bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="truncate">
                      <strong>Target:</strong>{" "}
                      {(() => {
                        const rawTarget = frame.target_mind_url;
                        const targetUrl = rawTarget.includes("|") ? rawTarget.split("|")[0] : rawTarget;
                        const filename = targetUrl.split("/").pop();
                        return (
                          <a href={targetUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {filename}
                          </a>
                        );
                      })()}
                    </p>
                    <p className="truncate"><strong>Video:</strong> <a href={frame.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{frame.video_url.split('/').pop()}</a></p>
                    <p className="font-sans text-[10px] text-muted-foreground/80 mt-1 block"><strong>Created:</strong> {new Date(frame.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {(isAdmin || frame.created_by === currentUserId) && (
                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <button
                      onClick={() => { if (confirm("Are you sure you want to delete this frame and RLS records?")) deleteMutation.mutate(frame.id); }}
                      className="px-4 py-2 rounded-full border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-bold text-destructive transition-all flex items-center justify-center gap-1.5"
                      title="Delete Frame"
                    >
                      <span>🗑️ Delete Frame</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Credit Requests Manager ---
function AdminCreditRequests() {
  const queryClient = useQueryClient();

  // 1. Fetch pending credit requests along with profiles
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["admin_credit_requests"],
    queryFn: async () => {
      const { data: reqs, error: reqsError } = await supabase
        .from("credit_requests" as any)
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (reqsError) throw reqsError;
      if (!reqs || reqs.length === 0) return [];

      // Fetch profiles in batch for user accounts
      const userIds = reqs.map((r: any) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);
      return reqs.map((req: any) => ({
        ...req,
        profile: profileMap.get(req.user_id) || null,
      }));
    },
  });

  // 2. Transactional Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error: rpcError } = await supabase.rpc("approve_credit_request", {
        target_request_id: requestId,
      });
      if (rpcError) throw rpcError;
      return data;
    },
    onSuccess: () => {
      toast.success("Credit request approved! Credits successfully granted.");
      queryClient.invalidateQueries({ queryKey: ["admin_credit_requests"] });
    },
    onError: (err: any) => {
      toast.error("Approval failed: " + err.message);
    },
  });

  if (isLoading) return <p className="text-muted-foreground text-sm text-left">Loading credit requests...</p>;
  if (error) return <p className="text-destructive text-sm text-left">Error loading requests: {error.message}</p>;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Pending Credit Requests</h2>
          <p className="text-xs text-muted-foreground">Verify payments and grant AR video frame credits atomically</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 text-center">
          <p className="text-muted-foreground text-sm">No pending credit requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {req.profile?.avatar_url ? (
                    <img src={req.profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
                      {req.profile?.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground text-sm truncate max-w-[200px]">
                      {req.profile?.display_name || "Anonymous User"}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      ID: {req.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2">
                  <p><strong>Amount Paid:</strong> <span className="text-foreground font-bold">₹{req.amount_paid}</span></p>
                  <p><strong>Request ID:</strong> <span className="font-mono">{req.id}</span></p>
                  <p><strong>Submitted:</strong> {new Date(req.created_at).toLocaleString()}</p>
                  <p><strong>Active Credits:</strong> <span className="text-rose-500 font-semibold">{req.profile?.ar_credits ?? 0} Credits</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
                {req.screenshot_url ? (
                  <a
                    href={req.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    🔍 View Receipt
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No receipt uploaded</span>
                )}

                <button
                  onClick={() => approveMutation.mutate(req.id)}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-all shadow-md shadow-green-500/10 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-1"
                >
                  {approveMutation.isPending && approveMutation.variables === req.id ? "Approving..." : "✓ Approve Request"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
