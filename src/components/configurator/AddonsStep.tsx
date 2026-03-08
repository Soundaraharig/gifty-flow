import { ADDONS } from "@/lib/pricing";

interface AddonsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

const AddonsStep = ({ selected, onToggle }: AddonsStepProps) => {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Add-ons
      </h2>
      <p className="text-muted-foreground mb-6">Enhance your order with extras</p>
      <div className="space-y-3">
        {ADDONS.map((addon) => (
          <button
            key={addon.id}
            onClick={() => onToggle(addon.id)}
            className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-200 ${
              selected.includes(addon.id)
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{addon.emoji}</span>
              <span className="font-medium text-foreground">{addon.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-primary">+₹{addon.price}</span>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected.includes(addon.id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground"
                }`}
              >
                {selected.includes(addon.id) && <span className="text-xs">✓</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddonsStep;
