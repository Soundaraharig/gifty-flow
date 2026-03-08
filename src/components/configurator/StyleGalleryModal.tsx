import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StyleGalleryModalProps {
  styleId: string;
  styleName: string;
  onClose: () => void;
  onSelectAndBuy: () => void;
}

const StyleGalleryModal = ({ styleId, styleName, onClose, onSelectAndBuy }: StyleGalleryModalProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["style_gallery", styleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("style_gallery_images")
        .select("*")
        .eq("editing_style_id", styleId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-[95vw] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{styleName}</h2>
            <p className="text-sm text-muted-foreground">Browse model images & pick your favourite</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-muted-foreground font-medium">No model images yet</p>
              <p className="text-sm text-muted-foreground mt-1">Our team is adding more samples soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.id === selectedImage ? null : img.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                    selectedImage === img.id
                      ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.title || styleName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedImage === img.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Selected
                      </span>
                    </div>
                  )}
                  {img.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium truncate">{img.title}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Buy button */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedImage ? "Great choice! Proceed to customize." : "Tap an image to select it"}
          </p>
          <button
            onClick={onSelectAndBuy}
            disabled={!selectedImage && images.length > 0}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-rose hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            <span>🛒</span>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleGalleryModal;
