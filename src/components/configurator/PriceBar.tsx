import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

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
  const { data: total = 0 } = useQuery({
    queryKey: ["price_total", selectedStyleId, selectedSizeId, selectedMaterialId, selectedAddonIds],
    queryFn: async () => {
      let sum = 0;
      const fetchPrice = async (table: string, id: string) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=price`, { headers });
        const data = await res.json();
        return data?.[0]?.price ?? 0;
      };
      if (selectedStyleId) sum += await fetchPrice("editing_styles", selectedStyleId);
      if (selectedSizeId) sum += await fetchPrice("sizes", selectedSizeId);
      if (selectedMaterialId) sum += await fetchPrice("frame_materials", selectedMaterialId);
      if (selectedAddonIds.length > 0) {
        const ids = selectedAddonIds.map(id => `"${id}"`).join(',');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/addons?id=in.(${ids})&select=price`, { headers });
        const data = await res.json();
        if (data) sum += data.reduce((acc: number, a: any) => acc + a.price, 0);
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
