import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import OrderSuccess from "@/components/configurator/OrderSuccess";
import CheckoutStep from "@/components/configurator/CheckoutStep";
import { useEditingStyles, useSizes, useFrameMaterials } from "@/hooks/useProductData";
import { useQuery } from "@tanstack/react-query";
import { fetchCheckoutTotal } from "@/lib/productQueries";

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
}

const ConfiguratorPage = () => {
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    editingStyleId: null,
    sizeId: null,
    frameMaterialId: null,
    frameColorId: null,
    addonIds: []
  });

  const { data: styles, isLoading: loadingStyles } = useEditingStyles();
  const { data: sizes, isLoading: loadingSizes } = useSizes();
  const { data: materials, isLoading: loadingMaterials } = useFrameMaterials();

  const selectedStyle = styles?.find((s: any) => s.id === config.editingStyleId);
  const heroImage = selectedStyle ?
  selectedStyle.image_url || FALLBACK_IMAGES[selectedStyle.slug] :
  null;

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
          <CheckoutStep config={config} onOrderPlaced={() => setOrderPlaced(true)} />
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
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          
          ← Back to Home
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-4 lg:gap-6">
          {/* Left: Vertical Thumbnails (Amazon style) */}
          <div className="hidden lg:flex flex-col gap-2">
            {styles?.map((style: any) => {
              const img = style.image_url || FALLBACK_IMAGES[style.slug];
              return (
                <button
                  key={style.id}
                  onClick={() => setConfig((p) => ({ ...p, editingStyleId: style.id }))}
                  className={`w-[58px] h-[58px] rounded-md overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                    config.editingStyleId === style.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {img && <img src={img} alt={style.name} className="w-full h-full object-cover" loading="lazy" />}
                </button>
              );
            })}
          </div>

          {/* Big Preview */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border max-w-[480px]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={selectedStyle?.name || "Select a style"}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎨</div>
                    <p className="font-medium">Select a style to preview</p>
                  </div>
                </div>
              )}
            </div>
            {selectedStyle && (
              <p className="text-sm text-primary mt-3 cursor-pointer hover:underline text-center">Click to see full view</p>
            )}
            {/* Mobile: horizontal thumbnails */}
            <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto pb-1">
              {styles?.map((style: any) => {
                const img = style.image_url || FALLBACK_IMAGES[style.slug];
                return (
                  <button
                    key={style.id}
                    onClick={() => setConfig((p) => ({ ...p, editingStyleId: style.id }))}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      config.editingStyleId === style.id
                        ? "border-primary ring-2 ring-primary/30 scale-105"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {img && <img src={img} alt={style.name} className="w-full h-full object-cover" loading="lazy" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {selectedStyle?.name || "Custom Art Frame"}
              </h1>
              {selectedStyle?.description &&
              <p className="text-muted-foreground mt-2">{selectedStyle.description}</p>
              }
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm">❤️</span>
                <span className="text-sm text-muted-foreground font-medium">120+ people loved this style</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Size
              </h3>
              <div className="flex gap-3 flex-wrap">
                {sizes?.map((size) =>
                <button
                  key={size.id}
                  onClick={() => setConfig((p) => ({ ...p, sizeId: size.id }))}
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

            {/* Frame Material */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Frame Material
              </h3>
              <div className="flex gap-3 flex-wrap">
                {materials?.map((mat) =>
                <button
                  key={mat.id}
                  onClick={() => setConfig((p) => ({ ...p, frameMaterialId: mat.id }))}
                  className={`px-5 py-3 rounded-xl border-2 text-center transition-all duration-200 min-w-[100px] ${
                  config.frameMaterialId === mat.id ?
                  "border-primary bg-primary/5 shadow-sm" :
                  "border-border bg-card hover:border-primary/40"}`
                  }>
                  
                    <p className="font-medium text-foreground">{mat.name}</p>
                    {mat.price > 0 && <p className="text-xs text-primary font-semibold mt-0.5">+₹{mat.price}</p>}
                  </button>
                )}
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

      {/* Sticky Buy Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-foreground">₹{total}</span>
            {total > 0 &&
            <span className="text-xs text-muted-foreground line-through">₹{Math.round(total * 1.25)}</span>
            }
          </div>
          <div className="flex flex-col items-end gap-1">
            {!canBuy &&
            <p className="text-[10px] text-destructive font-medium">
                {!config.editingStyleId ? "Select a style" : !config.sizeId ? "Select a size" : "Select frame material"}
              </p>
            }
            <button
              onClick={() => setShowCheckout(true)}
              disabled={!canBuy}
              className="relative px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2">
              
              <span className="text-lg">🛒</span>
              {canBuy ? "Buy Now" : "Select Options"}
            </button>
          </div>
        </div>
      </div>
    </div>);

};

export default ConfiguratorPage;