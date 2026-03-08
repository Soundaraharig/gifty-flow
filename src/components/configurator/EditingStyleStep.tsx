import { EDITING_STYLES } from "@/lib/pricing";

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
            className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
              selected === style.id
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <h3 className="font-semibold text-foreground mb-1">{style.name}</h3>
            <p className="text-xs text-muted-foreground mb-2">{style.description}</p>
            <span className="text-sm font-semibold text-primary">+₹{style.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditingStyleStep;
