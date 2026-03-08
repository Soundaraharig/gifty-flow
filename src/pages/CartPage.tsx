import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Trash2, MapPin, Check } from "lucide-react";

interface SavedAddress {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string | null;
}

const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [upiId, setUpiId] = useState("");
  const [showUpi, setShowUpi] = useState(false);

  // Address mode
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "select" | "new">("loading");

  // Fetch saved addresses
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

  // Fetch UPI ID
  useEffect(() => {
    supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "upi_id")
      .maybeSingle()
      .then(({ data }) => {
        if ((data as any)?.value) setUpiId((data as any).value);
      });
  }, []);

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || placing || items.length === 0) return;
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

      // Create order for each item
      for (const item of items) {
        await supabase.from("orders").insert({
          user_id: user?.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          editing_style_id: item.editingStyleId || null,
          size_id: item.sizeId || null,
          frame_material_id: item.frameMaterialId || null,
          total_price: item.price * item.quantity,
          notes: [
            item.type === "resin" ? `Resin: ${item.name} x${item.quantity}` : null,
            address.trim(),
            notes.trim(),
          ].filter(Boolean).join(" | ") || null,
        });
      }

      // WhatsApp message
      const itemsList = items
        .map((i) => `• ${i.name} x${i.quantity} — ₹${i.price * i.quantity}`)
        .join("\n");

      const orderText = [
        `🛒 *New Cart Order*`,
        `👤 ${name.trim()}`,
        `📱 ${phone.trim()}`,
        `\n${itemsList}`,
        address.trim() ? `\n📍 ${address.trim()}` : null,
        notes.trim() ? `📝 ${notes.trim()}` : null,
        `\n💰 *Total: ₹${totalPrice}*`,
      ].filter(Boolean).join("\n");

      const { data: settingRow } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "admin_whatsapp")
        .maybeSingle();
      const adminPhone = (settingRow as any)?.value || "919876543210";
      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(orderText)}`;

      clearCart();
      window.location.href = waUrl;
    } catch (err: any) {
      toast.error("Failed to place order: " + (err.message || "Please try again"));
    } finally {
      setPlacing(false);
    }
  };

  const isValid = name.trim().length > 0 && phone.trim().length >= 10;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          ← Back
        </button>

        <h1 className="font-display text-3xl font-bold text-foreground mb-6">
          Your Cart {totalItems > 0 && <span className="text-primary">({totalItems})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🛒</span>
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate("/categories")}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              🛍️ Shop Now
            </button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                    {item.type === "frame" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[item.sizeName, item.materialName].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    {item.type === "resin" && item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                    <p className="text-primary font-bold mt-1">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold text-foreground w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">{item.name} x{item.quantity}</span>
                    <span className="text-foreground shrink-0">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🚚 Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary text-lg">₹{totalPrice}</span>
                </div>
              </div>
            </div>

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

            {/* Saved addresses list */}
            {mode === "select" && savedAddresses && (
              <div className="space-y-2.5 mb-6">
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
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Delivery Details</h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (e.g. 9876543210)"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery address"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            )}

            {/* Notes (always visible) */}
            <div className="mb-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes (optional)"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* UPI Payment Section */}
            {upiId && (
              <div className="mb-6">
                <button
                  onClick={() => setShowUpi(!showUpi)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    💳 Pay via UPI
                  </span>
                  <span className="text-muted-foreground text-xs">{showUpi ? "Hide" : "Show"}</span>
                </button>
                {showUpi && (
                  <div className="mt-3 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                    <p className="text-sm text-foreground">
                      Send <span className="font-bold text-primary">₹{totalPrice}</span> to the UPI ID below:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm font-mono select-all">
                        {upiId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(upiId);
                          toast.success("UPI ID copied!");
                        }}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Copy
                      </button>
                    </div>
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(upiId)}&am=${totalPrice}&cu=INR`}
                      className="block w-full text-center py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      📱 Open UPI App
                    </a>
                    <p className="text-xs text-muted-foreground">
                      After payment, click "Place Order" below to confirm via WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <button
              onClick={handlePlaceOrder}
              disabled={!isValid || placing}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold text-base shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placing ? "Placing Order..." : "🎁 Place Order"}
            </button>
            <button
              onClick={() => navigate("/categories")}
              className="w-full mt-3 py-3.5 rounded-full border-2 border-primary text-primary font-semibold text-base hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              🛍️ Shop More
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
