import { useSizes } from "@/hooks/useProductData";

interface SizeStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const SizeStep = ({ selected, onSelect }: SizeStepProps) => {
  const { data: sizes, isLoading } = useSizes();

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading sizes...</div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Select Size
      </h2>
      <p className="text-muted-foreground mb-6">Choose the perfect size for your frame</p>
      <div className="grid grid-cols-3 gap-4">
        {sizes?.map((size) => (
          <button
            key={size.id}
            onClick={() => onSelect(size.id)}
            className={`p-6 rounded-xl border-2 text-center transition-all duration-200 ${
              selected === size.id
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <h3 className="font-display text-2xl font-bold text-foreground mb-1">{size.name}</h3>
            <p className="text-xs text-muted-foreground mb-2">{size.dimensions}</p>
            <span className="text-sm font-semibold text-primary">₹{size.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeStep;
