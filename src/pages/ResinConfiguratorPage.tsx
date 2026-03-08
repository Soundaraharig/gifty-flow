import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchActiveResinTypes, ResinProductType } from "@/lib/resinQueries";
import { toast } from "sonner";

import resinCoastersImg from "@/assets/resin-coasters.jpg";
import resinKeychainsImg from "@/assets/resin-keychains.jpg";
import resinTraysImg from "@/assets/resin-trays.jpg";
import resinBookmarksImg from "@/assets/resin-bookmarks.jpg";
import resinPhoneGripsImg from "@/assets/resin-phone-grips.jpg";
import resinWallClocksImg from "@/assets/resin-wall-clocks.jpg";

const FALLBACK_IMAGES: Record<string, string> = {
  "resin-coasters": resinCoastersImg,
  "resin-keychains": resinKeychainsImg,
  "resin-trays": resinTraysImg,
  "resin-bookmarks": resinBookmarksImg,
  "resin-phone-grips": resinPhoneGripsImg,
  "resin-wall-clocks": resinWallClocksImg,
};

const ResinConfiguratorPage = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useQuery({
    queryKey: ["resin_product_types"],
    queryFn: fetchActiveResinTypes,
  });

  const [modalProduct, setModalProduct] = useState<ResinProductType | null>(null);

  const getImage = (product: ResinProductType) =>
    product.image_url || FALLBACK_IMAGES[product.slug] || "";

  const handleAddToCart = (product: ResinProductType) => {
    toast.success(`${product.name} added to cart!`);
    setModalProduct(null);
  };

  const handleBuyNow = (product: ResinProductType) => {
    // TODO: wire up full checkout
    toast.success(`Proceeding to buy ${product.name}!`);
    setModalProduct(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-20 max-w-6xl pb-12">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          ← Back to Home
        </button>

        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Resin Art Products
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose from our handcrafted resin art collection
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <button
              key={product.id}
              onClick={() => setModalProduct(product)}
              className="group relative rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 bg-card hover:shadow-lg border-border hover:border-primary/40"
            >
              <div className="aspect-square bg-muted overflow-hidden">
                {getImage(product) ? (
                  <img
                    src={getImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">🎨</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-primary">₹{product.price}</span>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{Math.round(product.price * 1.25)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {modalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setModalProduct(null)}
        >
          <div
            className="relative bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-fade-in my-auto max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setModalProduct(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
            >
              ✕
            </button>

            {/* Product image */}
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              {getImage(modalProduct) ? (
                <img
                  src={getImage(modalProduct)}
                  alt={modalProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎨</span>
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {modalProduct.name}
                </h2>
                {modalProduct.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {modalProduct.description}
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-foreground">
                  ₹{modalProduct.price}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ₹{Math.round(modalProduct.price * 1.25)}
                </span>
                <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full font-medium ml-1">
                  20% OFF
                </span>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-muted/50">
                  <span className="text-lg mb-0.5">🚚</span>
                  <p className="text-[10px] font-medium text-foreground">Free Delivery</p>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-muted/50">
                  <span className="text-lg mb-0.5">🛡️</span>
                  <p className="text-[10px] font-medium text-foreground">Handcrafted</p>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-muted/50">
                  <span className="text-lg mb-0.5">💝</span>
                  <p className="text-[10px] font-medium text-foreground">Gift Ready</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddToCart(modalProduct)}
                  className="flex-1 px-6 py-3.5 rounded-full border-2 border-primary text-primary font-semibold text-base hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>🛒</span> Add to Cart
                </button>
                <button
                  onClick={() => handleBuyNow(modalProduct)}
                  className="flex-1 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>⚡</span> Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResinConfiguratorPage;
