import { useFrameMaterials } from "@/hooks/useProductData";

interface FrameStepProps {
  selectedMaterial: string | null;
  onSelectMaterial: (id: string) => void;
}

const FrameStep = ({ selectedMaterial, onSelectMaterial }: FrameStepProps) => {
  const { data: materials, isLoading } = useFrameMaterials();

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Frame Type</h2>
      <p className="text-muted-foreground mb-6">Choose your frame material</p>

      <div className="grid grid-cols-3 gap-3">
        {materials?.map((mat) => (
          <button
            key={mat.id}
            onClick={() => onSelectMaterial(mat.id)}
            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
              selectedMaterial === mat.id
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="font-medium text-foreground">{mat.name}</span>
            {mat.price > 0 && <p className="text-xs text-primary mt-1">+₹{mat.price}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrameStep;
