import { useEditingStyles } from "@/hooks/useProductData";

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
  "vintage-retro": styleVintageRetro,
};

interface EditingStyleStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const EditingStyleStep = ({ selected, onSelect }: EditingStyleStepProps) => {
  const { data: styles, isLoading } = useEditingStyles();

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading styles...</div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Choose Editing Style
      </h2>
      <p className="text-muted-foreground mb-6">Select how your photo will be artistically transformed</p>
      <div className="grid grid-cols-2 gap-4">
        {styles?.map((style: any) => {
          const imgSrc = style.image_url || FALLBACK_IMAGES[style.slug];
          return (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              className={`rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
                selected === style.id
                  ? "border-primary bg-rose-gold-light shadow-rose"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {imgSrc && (
                <img
                  src={imgSrc}
                  alt={style.name}
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold text-foreground mb-1">{style.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{style.description}</p>
                <span className="text-sm font-semibold text-primary">+₹{style.price}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EditingStyleStep;
