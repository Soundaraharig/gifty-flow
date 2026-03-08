import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EditingStyleStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const EditingStyleStep = ({ selected, onSelect }: EditingStyleStepProps) => {
  const [styles, setStyles] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    console.log("[EditingStyleStep] ENV:", { url, key: key?.substring(0, 20) });
    
    // Test raw fetch first
    fetch(`${url}/rest/v1/editing_styles?is_active=eq.true&select=*&order=sort_order`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      }
    })
    .then(r => {
      console.log("[EditingStyleStep] fetch status:", r.status);
      return r.json();
    })
    .then(data => {
      console.log("[EditingStyleStep] fetch data:", data?.length, "items");
      setStyles(data);
      setIsLoading(false);
    })
    .catch(e => {
      console.error("[EditingStyleStep] fetch error:", e);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading styles...</div>;
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Choose Editing Style
      </h2>
      <p className="text-muted-foreground mb-6">Select how your photo will be artistically transformed</p>
      <div className="grid grid-cols-2 gap-4">
        {styles?.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
              selected === style.id
                ? "border-primary bg-rose-gold-light shadow-rose"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {style.image_url && (
              <img
                src={style.image_url}
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
        ))}
      </div>
    </div>
  );
};

export default EditingStyleStep;
