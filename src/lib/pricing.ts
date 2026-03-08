export const EDITING_STYLES = [
  { id: "oil-painting", name: "Oil Painting", price: 80, description: "Classic oil painting effect" },
  { id: "mosaic-collage", name: "Mosaic Collage", price: 60, description: "Beautiful mosaic pattern" },
  { id: "minimalist-retouch", name: "Minimalist Retouch", price: 50, description: "Clean, subtle editing" },
  { id: "digital-illustration", name: "Digital Illustration", price: 100, description: "Hand-drawn digital art" },
];

export const SIZES = [
  { id: "a5", name: "A5", price: 250, dimensions: "148 × 210 mm" },
  { id: "a4", name: "A4", price: 350, dimensions: "210 × 297 mm" },
  { id: "a3", name: "A3", price: 500, dimensions: "297 × 420 mm" },
];

export const FRAME_MATERIALS = [
  { id: "wood", name: "Wood", price: 0 },
  { id: "acrylic", name: "Acrylic", price: 50 },
  { id: "plastic", name: "Plastic", price: 0 },
];

export const FRAME_COLORS = [
  { id: "black", name: "Black", hex: "#1a1a1a" },
  { id: "white", name: "White", hex: "#f5f5f5" },
  { id: "gold", name: "Gold", hex: "#c5a44e" },
];

export const ADDONS = [
  { id: "gift-wrap", name: "Gift Wrap", price: 30, emoji: "🎁" },
  { id: "express-delivery", name: "Express Delivery", price: 60, emoji: "🚀" },
];

export interface OrderConfig {
  editingStyle: string | null;
  size: string | null;
  frameMaterial: string | null;
  frameColor: string | null;
  addons: string[];
}

export function calculateTotal(config: OrderConfig): number {
  let total = 0;
  const style = EDITING_STYLES.find((s) => s.id === config.editingStyle);
  if (style) total += style.price;
  const size = SIZES.find((s) => s.id === config.size);
  if (size) total += size.price;
  const material = FRAME_MATERIALS.find((m) => m.id === config.frameMaterial);
  if (material) total += material.price;
  config.addons.forEach((addonId) => {
    const addon = ADDONS.find((a) => a.id === addonId);
    if (addon) total += addon.price;
  });
  return total;
}
