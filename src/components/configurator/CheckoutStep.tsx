import { useState } from "react";
import { OrderConfig, calculateTotal, EDITING_STYLES, SIZES, FRAME_MATERIALS, FRAME_COLORS } from "@/lib/pricing";

interface CheckoutStepProps {
  config: OrderConfig;
}

const ADMIN_WHATSAPP = "919999999999"; // Replace with actual admin number

const CheckoutStep = ({ config }: CheckoutStepProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  

  const total = calculateTotal(config);
  const style = EDITING_STYLES.find((s) => s.id === config.editingStyle);
  const size = SIZES.find((s) => s.id === config.size);
  const material = FRAME_MATERIALS.find((m) => m.id === config.frameMaterial);
  const color = FRAME_COLORS.find((c) => c.id === config.frameColor);

  const handleOrder = () => {
    if (!name.trim() || !phone.trim()) return;

    const message = encodeURIComponent(
      `🎁 *New Order - Zero Gifts!*\n\n` +
      `👤 *Name:* ${name.trim()}\n` +
      `📱 *WhatsApp:* ${phone.trim()}\n\n` +
      `🖼️ *Order Details:*\n` +
      `• Size: ${size?.name || "N/A"}\n` +
      `• Editing Style: ${style?.name || "N/A"}\n` +
      `• Frame: ${material?.name || "N/A"} - ${color?.name || "N/A"}\n\n` +
      `💰 *Total: ₹${total}*\n\n` +
      `📸 Photo will be shared separately.`
    );

    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, "_blank");
  };

  const isValid = name.trim().length > 0 && phone.trim().length >= 10;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Complete Your Order
      </h2>
      <p className="text-muted-foreground mb-6">Fill in your details to place the order via WhatsApp</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={15}
          />
        </div>


        {/* Order Summary */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="text-foreground">{size?.name} — ₹{size?.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Style</span>
              <span className="text-foreground">{style?.name} — ₹{style?.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame</span>
              <span className="text-foreground">{material?.name}, {color?.name}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span className="text-foreground">Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={!isValid}
          className="w-full mt-4 bg-primary text-primary-foreground py-4 rounded-full font-semibold text-base shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>💬</span> Order via WhatsApp
        </button>
      </div>
    </div>
  );
};

export default CheckoutStep;
