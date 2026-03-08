import { EDITING_STYLES } from "@/lib/pricing";
import styleOilPainting from "@/assets/style-oil-painting.jpg";
import styleMosaicCollage from "@/assets/style-mosaic-collage.jpg";
import styleMinimalistRetouch from "@/assets/style-minimalist-retouch.jpg";
import styleDigitalIllustration from "@/assets/style-digital-illustration.jpg";

const STYLE_IMAGES: Record<string, string> = {
  "oil-painting": styleOilPainting,
  "mosaic-collage": styleMosaicCollage,
  "minimalist-retouch": styleMinimalistRetouch,
  "digital-illustration": styleDigitalIllustration,
};

interface EditingStyleStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const EditingStyleStep = ({ selected, onSelect }: EditingStyleStepProps) => {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Choose Editing Style
      </h2>
      <p className="text-muted-foreground mb-6">Select how your photo will be artistically transformed</p>
      <div className="grid grid-cols-2 gap-4">
        {EDITING_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
              selected === style.id
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <img
              src={STYLE_IMAGES[style.id]}
              alt={style.name}
              className="w-full h-28 object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <h3 className="font-semibold text-foreground mb-1">{style.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{style.description}</p>
              <span className="text-sm font-semibold text-primary">+₹{style.price}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditingStyleStep;
