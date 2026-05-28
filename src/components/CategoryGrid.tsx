import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CategoryCard from "./CategoryCard";
import photoFramesImg from "@/assets/category-photo-frames.jpg";
import resinArtImg from "@/assets/category-resin-art.jpg";
import customGiftsImg from "@/assets/category-custom-gifts.jpg";

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  "photo-frames": photoFramesImg,
  "resin-art": resinArtImg,
  "custom-gifts": customGiftsImg,
};

const defaultCategories = [
  {
    id: "photo-frames",
    slug: "photo-frames",
    title: "Photo Frames",
    description: "Custom frames with artistic editing styles",
    image_url: "",
    is_active: true,
    target_route: "/configure/photo-frames/styles",
  },
  {
    id: "resin-art",
    slug: "resin-art",
    title: "Resin Art",
    description: "Beautiful handcrafted resin artwork",
    image_url: "",
    is_active: true,
    target_route: "/configure/resin-art",
  },
  {
    id: "custom-gifts",
    slug: "custom-gifts",
    title: "Custom Gifts",
    description: "Personalized gifts for every occasion",
    image_url: "",
    is_active: true,
    target_route: "/configure/custom-gifts",
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  const { data: dbCategories, isLoading } = useQuery({
    queryKey: ["gift_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_categories" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    retry: 1,
  });

  // Use database categories if loaded successfully and not empty, otherwise fallback
  const displayCategories = dbCategories && dbCategories.length > 0
    ? dbCategories.filter((cat: any) => cat.is_active)
    : defaultCategories;

  const getCategoryImage = (cat: any) => {
    if (cat.image_url) return cat.image_url;
    return FALLBACK_CATEGORY_IMAGES[cat.slug] || "";
  };

  const isAvailable = (cat: any) => {
    if (cat.slug === "custom-gifts") return false;
    return !!cat.target_route && cat.target_route !== "#" && cat.target_route !== "" && cat.target_route !== "/configure/custom-gifts";
  };

  if (isLoading && !dbCategories) {
    return (
      <div className="py-16 md:py-24 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <section id="categories" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Our Collections
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose a category to start designing your perfect gift
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {displayCategories.map((cat) => {
            const available = isAvailable(cat);
            return (
              <CategoryCard
                key={cat.slug}
                title={cat.title}
                description={cat.description || ""}
                image={getCategoryImage(cat)}
                available={available}
                onClick={() => {
                  if (available && cat.target_route) {
                    navigate(cat.target_route);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;

