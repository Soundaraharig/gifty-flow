import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  id: string; // unique cart item id
  type: "frame" | "resin";
  name: string;
  image: string;
  price: number;
  quantity: number;
  // Frame-specific
  editingStyleId?: string;
  sizeId?: string;
  sizeName?: string;
  frameMaterialId?: string;
  materialName?: string;
  // Resin-specific
  resinProductId?: string;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "zero_gifts_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // For resin: check if same product already in cart
      if (item.type === "resin" && item.resinProductId) {
        const existing = prev.find(
          (i) => i.type === "resin" && i.resinProductId === item.resinProductId
        );
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
      }
      // For frame: check if same config already in cart
      if (item.type === "frame" && item.editingStyleId && item.sizeId && item.frameMaterialId) {
        const existing = prev.find(
          (i) =>
            i.type === "frame" &&
            i.editingStyleId === item.editingStyleId &&
            i.sizeId === item.sizeId &&
            i.frameMaterialId === item.frameMaterialId
        );
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
      }
      const id = crypto.randomUUID();
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
