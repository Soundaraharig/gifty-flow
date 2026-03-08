import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PriceBarProps {
  selectedStyleId: string | null;
  selectedSizeId: string | null;
  selectedMaterialId: string | null;
  selectedAddonIds: string[];
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
}

const PriceBar = ({ selectedStyleId, selectedSizeId, selectedMaterialId, selectedAddonIds, currentStep, totalSteps, canProceed, onNext, onBack }: PriceBarProps) => {
  // Calculate total from DB prices
  const { data: total = 0 } = useQuery({
    queryKey: ["price_total", selectedStyleId, selectedSizeId, selectedMaterialId, selectedAddonIds],
    queryFn: async () => {
      let sum = 0;
      if (selectedStyleId) {
        const { data } = await supabase.from("editing_styles").select("price").eq("id", selectedStyleId).single();
        if (data) sum += data.price;
      }
      if (selectedSizeId) {
        const { data } = await supabase.from("sizes").select("price").eq("id", selectedSizeId).single();
        if (data) sum += data.price;
      }
      if (selectedMaterialId) {
        const { data } = await supabase.from("frame_materials").select("price").eq("id", selectedMaterialId).single();
        if (data) sum += data.price;
      }
      if (selectedAddonIds.length > 0) {
        const { data } = await supabase.from("addons").select("price").in("id", selectedAddonIds);
        if (data) sum += data.reduce((acc, a) => acc + a.price, 0);
      }
      return sum;
    },
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Live Total</p>
          <p className="font-display text-2xl font-bold text-foreground">₹{total}</p>
        </div>
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button onClick={onBack} className="px-6 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Back
            </button>
          )}
          {currentStep < totalSteps - 1 && (
            <button onClick={onNext} disabled={!canProceed} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceBar;
