import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCheckoutSummary, type CheckoutConfig } from "@/lib/productQueries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { MapPin, Plus, Check } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

interface CheckoutStepProps {
  config: CheckoutConfig;
  onOrderPlaced?: () => void;
}

interface SavedAddress {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string | null;
}

const CheckoutStep = ({ config, onOrderPlaced }: CheckoutStepProps) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  // Saved addresses
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "select" | "new">("loading");

  const { data: savedAddresses } = useQuery({
    queryKey: ["customer_addresses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("customer_addresses")
        .select("id, customer_name, customer_phone, address")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as SavedAddress[];
    },
    enabled: !!user?.id,
  });

  // Once addresses load, decide mode
  useEffect(() => {
    if (savedAddresses === undefined) return;
    if (savedAddresses.length > 0) {
      setMode("select");
      // Auto-select first
      const first = savedAddresses[0];
      setSelectedAddressId(first.id);
      setName(first.customer_name);
      setPhone(first.customer_phone);
      setAddress(first.address || "");
    } else {
      setMode("new");
    }
  }, [savedAddresses]);

  const selectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.customer_name);
    setPhone(addr.customer_phone);
    setAddress(addr.address || "");
  };

  const switchToNew = () => {
    setMode("new");
    setSelectedAddressId(null);
    setName(user?.user_metadata?.full_name || "");
    setPhone("");
    setAddress("");
  };

  const switchToSelect = () => {
    setMode("select");
    if (savedAddresses?.length) {
      selectAddress(savedAddresses[0]);
    }
  };

  const { data: summary } = useQuery({
    queryKey: ["checkout_summary", config],
    queryFn: () => fetchCheckoutSummary(config),
  });

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim() || placing) return;
    setPlacing(true);

    try {
      // Save address if new
      if (mode === "new" && user?.id) {
        await supabase.from("customer_addresses").insert({
          user_id: user.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          address: address.trim() || null,
        });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          editing_style_id: config.editingStyleId,
          size_id: config.sizeId,
          frame_material_id: config.frameMaterialId,
          frame_color_id: config.frameColorId,
          addon_ids: config.addonIds,
          total_price: summary?.total ?? 0,
          notes: [address.trim(), notes.trim()].filter(Boolean).join(" | ") || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Fetch editing style image URL
      let styleImageUrl: string | null = null;
      if (config.editingStyleId) {
        const { data: styleData } = await supabase
          .from("editing_styles")
          .select("image_url")
          .eq("id", config.editingStyleId)
          .maybeSingle();
        styleImageUrl = styleData?.image_url ?? null;
      }

      // Send WhatsApp notification with order details
      const orderText = [
        `🎁 *New Order #${order.id.slice(0, 8)}*`,
        `👤 ${name.trim()}`,
        `📱 ${phone.trim()}`,
        summary?.styleName ? `🎨 Style: ${summary.styleName}` : null,
        styleImageUrl ? `🖼️ Style Image: ${styleImageUrl}` : null,
        summary?.sizeName ? `📐 Size: ${summary.sizeName}` : null,
        summary?.materialName ? `🖼 Frame: ${summary.materialName}` : null,
        address.trim() ? `📍 ${address.trim()}` : null,
        notes.trim() ? `📝 ${notes.trim()}` : null,
        `💰 Total: ₹${summary?.total ?? 0}`,
      ].filter(Boolean).join("\n");

      // Fetch admin WhatsApp number from settings
      const { data: settingRow } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "admin_whatsapp")
        .maybeSingle();
      const adminPhone = (settingRow as any)?.value || "919876543210";
      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(orderText)}`;

      // Direct page redirect to WhatsApp (works reliably on all devices)
      window.location.href = waUrl;

      onOrderPlaced?.();
    } catch (err: any) {
      toast({
        title: "Error placing order",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  const isValid = name.trim().length > 0 && phone.trim().length >= 10;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Complete Your Order</h2>
      <p className="text-muted-foreground mb-6">Fill in your details to place the order</p>

      {/* Address selection mode */}
      {savedAddresses && savedAddresses.length > 0 && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={switchToSelect}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              mode === "select"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            <MapPin className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            Saved Address
          </button>
          <button
            onClick={switchToNew}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              mode === "new"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            <Plus className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            New Address
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Saved addresses list */}
        {mode === "select" && savedAddresses && (
          <div className="space-y-2.5">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => selectAddress(addr)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAddressId === addr.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm">{addr.customer_name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{addr.customer_phone}</p>
                    {addr.address && (
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{addr.address}</p>
                    )}
                  </div>
                  {selectedAddressId === addr.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-2 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* New address form */}
        {mode === "new" && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={15} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Delivery Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your delivery address" rows={2} className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" maxLength={300} />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Special Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" maxLength={500} />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="text-foreground">{summary?.sizeName} — ₹{summary?.sizePrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Style</span><span className="text-foreground">{summary?.styleName} — ₹{summary?.stylePrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frame</span><span className="text-foreground">{summary?.materialName}</span></div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-semibold text-base"><span className="text-foreground">Total</span><span className="text-primary">₹{summary?.total}</span></div>
          </div>
        </div>

        <button onClick={handleOrder} disabled={!isValid || placing} className="w-full mt-4 bg-primary text-primary-foreground py-4 rounded-full font-semibold text-base shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {placing ? "Placing Order..." : "🎁 Place Order"}
        </button>
      </div>
    </div>
  );
};

export default CheckoutStep;
