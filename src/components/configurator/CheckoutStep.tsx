import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCheckoutSummary, type CheckoutConfig } from "@/lib/productQueries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CheckoutStepProps {
  config: CheckoutConfig;
}

const CheckoutStep = ({ config }: CheckoutStepProps) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["checkout_summary", config],
    queryFn: () => fetchCheckoutSummary(config),
  });

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim() || placing) return;
    setPlacing(true);

    try {
      // Insert order into DB
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

      // Notify admin via edge function
      await supabase.functions.invoke("send-order-email", {
        body: { orderId: order.id },
      });

      toast({
        title: "Order placed! 🎉",
        description: "We've received your order. You'll hear from us soon!",
      });
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

      <div className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Special Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" maxLength={500} />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="text-foreground">{summary?.sizeName} — ₹{summary?.sizePrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Style</span><span className="text-foreground">{summary?.styleName} — ₹{summary?.stylePrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frame</span><span className="text-foreground">{summary?.materialName}, {summary?.colorName}</span></div>
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
