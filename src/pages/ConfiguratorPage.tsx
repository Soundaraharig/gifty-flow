import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import OrderSuccess from "@/components/configurator/OrderSuccess";
import CheckoutStep from "@/components/configurator/CheckoutStep";
// StyleGalleryModal removed — now uses /style-gallery/:styleId route
import { useEditingStyles, useSizes, useFrameMaterials } from "@/hooks/useProductData";
import { useQuery } from "@tanstack/react-query";
import { fetchCheckoutTotal } from "@/lib/productQueries";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

import styleOilPainting from "@/assets/style-oil-painting.jpg";
import styleMosaicCollage from "@/assets/style-mosaic-collage.jpg";
import styleMinimalistRetouch from "@/assets/style-minimalist-retouch.jpg";
import styleDigitalIllustration from "@/assets/style-digital-illustration.jpg";
import styleWatercolor from "@/assets/style-watercolor.jpg";
import stylePopArt from "@/assets/style-pop-art.jpg";
import stylePencilSketch from "@/assets/style-pencil-sketch.jpg";
import styleVintageRetro from "@/assets/style-vintage-retro.jpg";

const FALLBACK_IMAGES: Record<string, string> = {
  "oil-painting": styleOilPainting,
  "mosaic-collage": styleMosaicCollage,
  "minimalist-retouch": styleMinimalistRetouch,
  "digital-illustration": styleDigitalIllustration,
  "watercolor": styleWatercolor,
  "pop-art": stylePopArt,
  "pencil-sketch": stylePencilSketch,
  "vintage-retro": styleVintageRetro
};

interface ConfigState {
  editingStyleId: string | null;
  sizeId: string | null;
  frameMaterialId: string | null;
  frameColorId: string | null;
  addonIds: string[];
  selectedGalleryImage: string | null;
}

const ConfiguratorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const preSelectedStyle = searchParams.get("style");
  const preSelectedImg = searchParams.get("img");
  const [config, setConfig] = useState<ConfigState>({
    editingStyleId: preSelectedStyle || null,
    sizeId: null,
    frameMaterialId: null,
    frameColorId: null,
    addonIds: [],
    selectedGalleryImage: preSelectedImg ? decodeURIComponent(preSelectedImg) : null,
  });
  const { data: styles, isLoading: loadingStyles } = useEditingStyles();
  const { data: sizes, isLoading: loadingSizes } = useSizes();
  const { data: materials, isLoading: loadingMaterials } = useFrameMaterials();

  const selectedStyle = styles?.find((s: any) => s.id === config.editingStyleId);

  // Determine which style to show in preview
  const previewStyle = styles?.find((s: any) => s.id === config.editingStyleId);
  // Use gallery-selected image if available, otherwise fall back to style image
  const heroImage = config.selectedGalleryImage
    ? config.selectedGalleryImage
    : previewStyle
      ? previewStyle.image_url || FALLBACK_IMAGES[previewStyle.slug]
      : null;

  const { data: total = 0 } = useQuery({
    queryKey: ["price_total", config.editingStyleId, config.sizeId, config.frameMaterialId, config.addonIds],
    queryFn: () =>
    fetchCheckoutTotal({
      editingStyleId: config.editingStyleId,
      sizeId: config.sizeId,
      frameMaterialId: config.frameMaterialId,
      frameColorId: null,
      addonIds: []
    })
  });

  const canBuy = config.editingStyleId && config.sizeId && config.frameMaterialId;

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 max-w-lg">
          <OrderSuccess />
        </div>
      </div>);

  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 max-w-lg">
          <button
            onClick={() => setShowCheckout(false)}
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1">
            
            ← Back to customization
          </button>
          <CheckoutStep config={config} selectedGalleryImage={config.selectedGalleryImage} onOrderPlaced={() => setOrderPlaced(true)} />
        </div>
      </div>);

  }

  const isLoading = loadingStyles || loadingSizes || loadingMaterials;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <div className="container mx-auto px-4 pt-20 max-w-5xl">
        <button
          onClick={() => navigate("/categories")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          
          ← Back to Categories
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8">
          {/* Big Preview */}
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-xl overflow-hidden bg-muted border border-border w-full max-w-[480px] aspect-[4/5] flex items-center justify-center shadow-sm"
            >
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={previewStyle?.name || "Selected style"}
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎨</div>
                    <p className="font-medium">Selected style preview</p>
                  </div>
                </div>
              )}
            </div>
            {previewStyle && (
              <p className="text-sm font-semibold text-foreground mt-3 text-center">{previewStyle.name}</p>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {previewStyle?.name || selectedStyle?.name || "Custom Art Frame"}
              </h1>
              {(previewStyle?.description || selectedStyle?.description) &&
              <p className="text-muted-foreground mt-2">{previewStyle?.description || selectedStyle?.description}</p>
              }
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm">❤️</span>
                <span className="text-sm text-muted-foreground font-medium">120+ people loved this style</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Size Selection */}
            <div id="size-section">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Size
              </h3>
              <div className="flex gap-3 flex-wrap">
                {sizes?.map((size) =>
                <button
                  key={size.id}
                  onClick={() => {
                    setConfig((p) => ({ ...p, sizeId: size.id }));
                    setTimeout(() => {
                      document.getElementById("frame-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 200);
                  }}
                  className={`px-5 py-3 rounded-xl border-2 text-center transition-all duration-200 min-w-[90px] ${
                  config.sizeId === size.id ?
                  "border-primary bg-primary/5 shadow-sm" :
                  "border-border bg-card hover:border-primary/40"}`
                  }>
                  
                    <p className="font-display text-lg font-bold text-foreground">{size.name}</p>
                    <p className="text-[10px] text-muted-foreground">{size.dimensions}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">₹{size.price}</p>
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Frame Colour */}
            <div id="frame-section">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Frame Colour
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {materials?.map((mat: any) => {
                  const isOutOfStock = mat.stock === 0;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => !isOutOfStock && setConfig((p) => ({ ...p, frameMaterialId: mat.id }))}
                      disabled={isOutOfStock}
                      className={`relative rounded-xl border-2 text-center transition-all duration-200 overflow-hidden ${
                      isOutOfStock ?
                      "border-border bg-muted cursor-not-allowed opacity-60" :
                      config.frameMaterialId === mat.id ?
                      "border-primary bg-primary/5 shadow-sm" :
                      "border-border bg-card hover:border-primary/40"}`
                      }>
                      
                      {mat.image_url ?
                      <div className="relative">
                          <img
                          src={mat.image_url}
                          alt={mat.name}
                          className={`w-full h-24 object-cover ${isOutOfStock ? "grayscale blur-[1px]" : ""}`}
                          loading="lazy" />
                        
                          {isOutOfStock &&
                        <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary-foreground bg-destructive/80 px-2 py-0.5 rounded-full">
                                Sold Out
                              </span>
                            </div>
                        }
                        </div> :

                      <div className={`w-full h-24 flex items-center justify-center bg-muted ${isOutOfStock ? "grayscale" : ""}`}>
                          <span className="text-2xl">🖼️</span>
                        </div>
                      }
                      <div className="p-2">
                        <p className="font-medium text-sm text-foreground">{mat.name}</p>
                        {mat.price > 0 && <p className="text-xs text-primary font-semibold">+₹{mat.price}</p>}
                      </div>
                    </button>);

                })}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Delivery & Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">🚚</span>
                <p className="text-[11px] font-medium text-foreground">Free Delivery</p>
                <p className="text-[10px] text-muted-foreground">5-7 days</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">🛡️</span>
                <p className="text-[11px] font-medium text-foreground">Quality Assured</p>
                <p className="text-[10px] text-muted-foreground">Handcrafted</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <span className="text-xl mb-1">💝</span>
                <p className="text-[11px] font-medium text-foreground">Gift Ready</p>
                <p className="text-[10px] text-muted-foreground">Premium wrap</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery now on separate page */}

      {/* Sticky Buy Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-foreground">₹{total}</span>
            {total > 0 &&
            <span className="text-xs text-muted-foreground line-through">₹{Math.round(total * 1.25)}</span>
            }
          </div>
          <div className="flex items-center gap-2">
            {!canBuy &&
            <p className="text-[10px] text-destructive font-medium">
                {!config.editingStyleId ? "Select a style" : !config.sizeId ? "Select a size" : "Select frame colour"}
              </p>
            }
            {canBuy && (
              <button
                onClick={() => {
                  const style = styles?.find((s: any) => s.id === config.editingStyleId);
                  const size = sizes?.find((s: any) => s.id === config.sizeId);
                  const mat = materials?.find((m: any) => m.id === config.frameMaterialId);
                  addItem({
                    type: "frame",
                    name: style?.name || "Custom Frame",
                    image: style?.image_url || FALLBACK_IMAGES[style?.slug || ""] || "",
                    price: total,
                    quantity: 1,
                    editingStyleId: config.editingStyleId!,
                    sizeId: config.sizeId!,
                    sizeName: size?.name,
                    frameMaterialId: config.frameMaterialId!,
                    materialName: mat?.name,
                  });
                  toast.success("Added to cart!");
                }}
                className="px-6 py-3.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
              >
                🛒 Add to Cart
              </button>
            )}
            <button
              onClick={() => setShowCheckout(true)}
              disabled={!canBuy}
              className="relative px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2">
              
              <span className="text-lg">⚡</span>
              {canBuy ? "Buy Now" : "Select Options"}
            </button>
          </div>
        </div>
      </div>
    </div>);

};

export default ConfiguratorPage;