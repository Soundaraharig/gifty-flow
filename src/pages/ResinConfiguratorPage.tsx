import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchActiveResinTypes, ResinProductType } from "@/lib/resinQueries";

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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = products?.find((p) => p.id === selectedId);

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
      <div className="container mx-auto px-4 pt-20 max-w-6xl">
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
              onClick={() => setSelectedId(product.id)}
              className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 bg-card hover:shadow-lg ${
                selectedId === product.id
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-muted overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
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

              {/* Info */}
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
                  {selectedId === product.id && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      Selected ✓
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected product detail */}
        {selected && (
          <div className="mt-10 p-6 rounded-2xl border border-border bg-card max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {selected.name}
            </h2>
            <p className="text-muted-foreground mb-4">{selected.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">🚚</span>
                <p className="text-[11px] font-medium text-foreground">Free Delivery</p>
                <p className="text-[10px] text-muted-foreground">5-7 days</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">🛡️</span>
                <p className="text-[11px] font-medium text-foreground">Handcrafted</p>
                <p className="text-[10px] text-muted-foreground">Premium quality</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">💝</span>
                <p className="text-[11px] font-medium text-foreground">Gift Ready</p>
                <p className="text-[10px] text-muted-foreground">Premium wrap</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-display text-3xl font-bold text-foreground">₹{selected.price}</span>
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ₹{Math.round(selected.price * 1.25)}
                </span>
              </div>
              <button
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-lg">🛒</span> Buy Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResinConfiguratorPage;
