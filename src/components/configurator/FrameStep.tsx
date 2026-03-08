import { useFrameMaterials, useFrameColors } from "@/hooks/useProductData";

interface FrameStepProps {
  selectedMaterial: string | null;
  selectedColor: string | null;
  onSelectMaterial: (id: string) => void;
  onSelectColor: (id: string) => void;
}

const FrameStep = ({ selectedMaterial, selectedColor, onSelectMaterial, onSelectColor }: FrameStepProps) => {
  const { data: materials, isLoading: loadingMat } = useFrameMaterials();
  const { data: colors, isLoading: loadingCol } = useFrameColors();

  if (loadingMat || loadingCol) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Frame Type & Color</h2>
      <p className="text-muted-foreground mb-6">Choose your frame material and color</p>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Material</h3>
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

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Color</h3>
        <div className="flex gap-4">
          {colors?.map((color) => (
            <button
              key={color.id}
              onClick={() => onSelectColor(color.id)}
              className={`flex flex-col items-center gap-2 transition-all duration-200 ${
                selectedColor === color.id ? "scale-110" : "hover:scale-105"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full border-4 transition-colors ${
                  selectedColor === color.id ? "border-primary" : "border-border"
                }`}
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs font-medium text-foreground">{color.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrameStep;
