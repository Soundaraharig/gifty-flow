import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

const StyleGalleryPage = () => {
  const { styleId } = useParams<{styleId: string;}>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addItem } = useCart();

  const { data: style, isLoading: loadingStyle } = useQuery({
    queryKey: ["editing_style", styleId],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("editing_styles").
      select("*").
      eq("id", styleId!).
      single();
      if (error) throw error;
      return data;
    },
    enabled: !!styleId
  });

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: ["style_gallery", styleId],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("style_gallery_images").
      select("*").
      eq("editing_style_id", styleId!).
      eq("is_active", true).
      order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!styleId
  });

  const mainImage = selectedImage ?
  images.find((img) => img.id === selectedImage) :
  images[0];

  const isLoading = loadingStyle || loadingImages;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-6xl">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          
          ← Back to customization
        </button>

        {images.length === 0 ?
        <div className="text-center py-20">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">No model images yet</h2>
            <p className="text-muted-foreground">Our team is adding more samples soon!</p>
          </div> :

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8">
            {/* Main Image */}
            <div className="lg:col-span-1">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border max-w-[560px]">
                {mainImage &&
              <img
                key={mainImage.id}
                src={mainImage.image_url}
                alt={mainImage.title || style?.name || "Gallery image"}
                className="w-full h-full object-cover animate-fade-in" />

              }
              </div>
              {mainImage?.title &&
            <p className="text-sm text-muted-foreground mt-2 text-center">{mainImage.title}</p>
            }
            </div>

            {/* Vertical Thumbnails */}
            <div className="hidden lg:flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
              {images.map((img) =>
            <button
              key={img.id}
              onClick={() => setSelectedImage(img.id)}
              className={`w-[64px] h-[64px] rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0 ${
              (selectedImage || images[0]?.id) === img.id ?
              "border-primary ring-2 ring-primary/30" :
              "border-border hover:border-primary/40"}`
              }>
              
                  <img
                src={img.image_url}
                alt={img.title || ""}
                className="w-full h-full object-cover"
                loading="lazy" />
              
                </button>
            )}
            </div>

            {/* Mobile horizontal thumbnails */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mt-2">
              {images.map((img) =>
            <button
              key={img.id}
              onClick={() => setSelectedImage(img.id)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              (selectedImage || images[0]?.id) === img.id ?
              "border-primary ring-2 ring-primary/30 scale-105" :
              "border-border hover:border-primary/40"}`
              }>
              
                  <img
                src={img.image_url}
                alt={img.title || ""}
                className="w-full h-full object-cover"
                loading="lazy" />
              
                </button>
            )}
            </div>

            {/* Product Details */}
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  {style?.name || "Style Gallery"}
                </h1>
                {style?.description &&
              <p className="text-muted-foreground mt-2">{style.description}</p>
              }
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm">❤️</span>
                  <span className="text-sm text-muted-foreground font-medium">120+ people loved this style</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <p className="text-sm text-muted-foreground mb-1">
</p>
                <p className="font-display text-3xl font-bold text-primary">₹{style?.price || 0}</p>
              </div>

              <div className="h-px bg-border" />

              {/* Image count */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <p className="font-medium text-foreground">{images.length} Model Images</p>
                  <p className="text-xs text-muted-foreground">Browse samples of this editing style</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">Quality Assured</p>
                    <p className="text-[10px] text-muted-foreground">Handcrafted</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <span className="text-lg">🚚</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">Free Delivery</p>
                    <p className="text-[10px] text-muted-foreground">5-7 days</p>
                  </div>
                </div>
              </div>

              {/* Select button */}
              <button onClick={() => {
              const imgUrl = mainImage?.image_url || style?.image_url || "";
              navigate(`/configure/photo-frames?style=${styleId}&img=${encodeURIComponent(imgUrl)}`);
            }}
            className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
              
                ✨ Select
              </button>
            </div>
          </div>
        }

        {/* Full Gallery Grid below */}
        {images.length > 0 &&
        <div className="mt-12">
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((img) =>
            <button
              key={img.id}
              onClick={() => {
                setSelectedImage(img.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
              (selectedImage || images[0]?.id) === img.id ?
              "border-primary ring-2 ring-primary/30 scale-[1.02]" :
              "border-border hover:border-primary/40"}`
              }>
              
                  <img
                src={img.image_url}
                alt={img.title || style?.name || ""}
                className="w-full h-full object-cover"
                loading="lazy" />
              
                  {img.title &&
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium truncate">{img.title}</p>
                    </div>
              }
                </button>
            )}
            </div>
          </div>
        }
      </div>
    </div>);

};

export default StyleGalleryPage;