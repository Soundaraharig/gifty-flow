import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";

type Tab = "styles" | "sizes" | "materials" | "orders" | "gallery" | "settings";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AdminPage = () => {
  const { user, isAdmin, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("styles");

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-semibold">Access denied. Admins only.</p>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Go Home</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "styles", label: "Editing Styles" },
    { id: "sizes", label: "Sizes" },
    { id: "materials", label: "Frame Materials" },
    { id: "orders", label: "Orders" },
    { id: "gallery", label: "Gallery Images" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
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

        {tab === "styles" && <AdminEditingStyles />}
        {tab === "sizes" && <AdminSizes />}
        {tab === "materials" && <AdminFrameMaterials />}
        {tab === "orders" && <AdminOrders />}
        {tab === "gallery" && <AdminGalleryImages />}
        {tab === "settings" && <AdminSettings />}
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
                {columns.map((c) => (
                  <th key={c.key} className="text-left py-2 px-3 text-muted-foreground font-medium">{c.label}</th>
                ))}
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
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
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
  const [editingTitle, setEditingTitle] = useState<{ id: string; title: string } | null>(null);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStyleId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `gallery/${selectedStyleId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
      const { error: insertError } = await supabase.from("style_gallery_images" as any).insert({
        editing_style_id: selectedStyleId,
        image_url: publicUrl,
        sort_order: galleryImages.length,
      } as any);
      if (insertError) throw insertError;
      qc.invalidateQueries({ queryKey: ["admin_gallery", selectedStyleId] });
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
      <p className="text-sm text-muted-foreground mb-4">Upload model images per editing style. Users can browse these from the "View More" button.</p>

      {/* Style Selector */}
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
          {/* Upload button */}
          <div className="mb-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "+ Upload Image"}
            </button>
          </div>

          {/* Grid of images */}
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

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">Orders</h2>
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
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
