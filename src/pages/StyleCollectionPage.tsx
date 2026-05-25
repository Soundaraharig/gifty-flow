import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useEditingStylesWithGallery } from "@/hooks/useProductData";
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, Image as ImageIcon, ArrowRight } from "lucide-react";

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

const StyleCollectionPage = () => {
  const navigate = useNavigate();
  const { data: styles = [], isLoading } = useEditingStylesWithGallery();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Keep track of hover/selected images for each style card dynamically
  const [hoveredImages, setHoveredImages] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filter & Sort Logic
  const filteredStyles = styles
    .filter((style) => {
      const matchesSearch =
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.description && style.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const isPopular = style.sort_order && style.sort_order <= 3;
      const matchesTag =
        selectedTag === "all" ||
        (selectedTag === "popular" && isPopular);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container mx-auto px-4 pt-24 max-w-6xl">
        {/* Breadcrumb / Navigation helper */}
        <button
          onClick={() => navigate("/categories")}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 transition-colors"
          id="back-to-categories-btn"
        >
          ← Back to Categories
        </button>

        {/* Hero Section */}
        <section className="text-center mb-12 relative overflow-hidden rounded-3xl py-12 px-6 bg-gradient-rose/20 border border-primary/10">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 animate-fade-in">
              <Sparkles size={12} /> Choose Your Art Style
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              Premium <span className="text-gradient-rose">Photo Frames</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              Select an editing style below to start. Every frame is custom crafted by our professional artists to create a stunning piece of memory.
            </p>
          </div>
        </section>

        {/* Search, Filter, Sort Bar */}
        <section className="glass-card rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search editing styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              id="search-styles-input"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Quick Tag Filters */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              {[
                { id: "all", label: "All Styles" },
                { id: "popular", label: "🔥 Popular" },
              ].map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedTag === tag.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  id={`filter-tag-${tag.id}`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Style Gallery Collections Grid */}
        {filteredStyles.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-3xl border border-dashed border-border">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">No matching styles found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Try adjusting your search queries or selecting "All Styles" to see more options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStyles.map((style) => {
              const defaultImage = style.image_url || FALLBACK_IMAGES[style.slug] || "";
              const currentPreviewImage = hoveredImages[style.id] || defaultImage;
              const hasModels = style.style_gallery_images && style.style_gallery_images.length > 0;
              const displayModels = (style.style_gallery_images ?? []).slice(0, 4);
              const isPopular = style.sort_order && style.sort_order <= 3;

              return (
                <article
                  key={style.id}
                  onClick={() => navigate(`/style-gallery/${style.id}`)}
                  className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border/80 hover:border-primary/40 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  id={`style-card-${style.slug}`}
                >
                  {/* Card Header Preview */}
                  <div className="relative aspect-video overflow-hidden bg-muted w-full">
                    {/* Main Preview Image */}
                    <img
                      src={currentPreviewImage}
                      alt={style.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Pop / Hot Badges */}
                    {isPopular && (
                      <span className="absolute top-3 left-3 bg-rose-500/90 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                        🔥 Popular
                      </span>
                    )}

                    {/* Starting Price Badge */}
                    <span className="absolute bottom-3 right-3 bg-background/95 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-border shadow-sm">
                      Editing: ₹{style.price}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {style.name}
                        </h2>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {style.description || "Transform your cherished photos into custom art frames designed by professional editors."}
                      </p>

                      {/* Dynamic Model Previews */}
                      {hasModels && (
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <ImageIcon size={12} /> Hover to preview models
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Main base preview thumbnail */}
                            <button
                              onMouseEnter={() => {
                                setHoveredImages((prev) => ({ ...prev, [style.id]: defaultImage }));
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoveredImages((prev) => ({ ...prev, [style.id]: defaultImage }));
                              }}
                              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                currentPreviewImage === defaultImage
                                  ? "border-primary scale-105 shadow-sm"
                                  : "border-border hover:border-primary/50"
                              }`}
                              title="Original Preview"
                              id={`thumb-default-${style.id}`}
                            >
                              <img src={defaultImage} alt="Base" className="w-full h-full object-cover" />
                            </button>

                            {/* Additional model thumbnails */}
                            {displayModels.map((thumb) => (
                              <button
                                key={thumb.id}
                                onMouseEnter={() => {
                                  setHoveredImages((prev) => ({ ...prev, [style.id]: thumb.image_url }));
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredImages((prev) => ({ ...prev, [style.id]: thumb.image_url }));
                                }}
                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                  currentPreviewImage === thumb.image_url
                                    ? "border-primary scale-105 shadow-sm"
                                    : "border-border hover:border-primary/50"
                                  }`}
                                title={thumb.title || "Model image"}
                                id={`thumb-${thumb.id}`}
                              >
                                <img src={thumb.image_url} alt={thumb.title || ""} className="w-full h-full object-cover" />
                              </button>
                            ))}

                            {/* View Full Gallery Link (if more than 3 models exist) */}
                            {style.style_gallery_images.length > 4 && (
                              <button
                                onClick={() => navigate(`/style-gallery/${style.id}`)}
                                className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center justify-center border border-border/80 transition-colors"
                                title="View all models"
                                id={`view-gallery-link-${style.id}`}
                              >
                                +{style.style_gallery_images.length - 4}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex flex-col gap-2 pt-5 mt-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/style-gallery/${style.id}`)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-rose hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-1.5"
                        id={`btn-view-models-${style.slug}`}
                      >
                        ✨ Explore Models & Customize <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StyleCollectionPage;
