import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CheckoutConfig {
  editingStyleId: string | null;
  sizeId: string | null;
  frameMaterialId: string | null;
  frameColorId: string | null;
  addonIds: string[];
}

interface CheckoutStepProps {
  config: CheckoutConfig;
}

const ADMIN_WHATSAPP = "919999999999";

const CheckoutStep = ({ config }: CheckoutStepProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: summary } = useQuery({
    queryKey: ["checkout_summary", config],
    queryFn: async () => {
      let total = 0;
      let styleName = "N/A", sizeName = "N/A", materialName = "N/A", colorName = "N/A";
      let stylePrice = 0, sizePrice = 0;

      if (config.editingStyleId) {
        const { data } = await supabase.from("editing_styles").select("name, price").eq("id", config.editingStyleId).single();
        if (data) { styleName = data.name; stylePrice = data.price; total += data.price; }
      }
      if (config.sizeId) {
        const { data } = await supabase.from("sizes").select("name, price").eq("id", config.sizeId).single();
        if (data) { sizeName = data.name; sizePrice = data.price; total += data.price; }
      }
      if (config.frameMaterialId) {
        const { data } = await supabase.from("frame_materials").select("name, price").eq("id", config.frameMaterialId).single();
        if (data) { materialName = data.name; total += data.price; }
      }
      if (config.frameColorId) {
        const { data } = await supabase.from("frame_colors").select("name").eq("id", config.frameColorId).single();
        if (data) { colorName = data.name; }
      }
      if (config.addonIds.length > 0) {
        const { data } = await supabase.from("addons").select("price").in("id", config.addonIds);
        if (data) total += data.reduce((acc, a) => acc + a.price, 0);
      }

      return { total, styleName, stylePrice, sizeName, sizePrice, materialName, colorName };
    },
  });

  const handleOrder = () => {
    if (!name.trim() || !phone.trim()) return;
    const s = summary;
    const message = encodeURIComponent(
      `🎁 *New Order - Zero Gifts!*\n\n` +
      `👤 *Name:* ${name.trim()}\n📱 *WhatsApp:* ${phone.trim()}\n\n` +
      `🖼️ *Order Details:*\n• Size: ${s?.sizeName}\n• Style: ${s?.styleName}\n• Frame: ${s?.materialName} - ${s?.colorName}\n\n` +
      `💰 *Total: ₹${s?.total}*\n\n📸 Photo will be shared separately.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, "_blank");
  };

  const isValid = name.trim().length > 0 && phone.trim().length >= 10;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Complete Your Order</h2>
      <p className="text-muted-foreground mb-6">Fill in your details to place the order via WhatsApp</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Your Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={100} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={15} />
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

        <button onClick={handleOrder} disabled={!isValid} className="w-full mt-4 bg-primary text-primary-foreground py-4 rounded-full font-semibold text-base shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <span>💬</span> Order via WhatsApp
        </button>
      </div>
    </div>
  );
};

export default CheckoutStep;
