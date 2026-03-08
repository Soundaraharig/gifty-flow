import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import StepIndicator from "@/components/configurator/StepIndicator";
import EditingStyleStep from "@/components/configurator/EditingStyleStep";
import SizeStep from "@/components/configurator/SizeStep";
import FrameStep from "@/components/configurator/FrameStep";
import AddonsStep from "@/components/configurator/AddonsStep";
import CheckoutStep from "@/components/configurator/CheckoutStep";
import PriceBar from "@/components/configurator/PriceBar";
import OrderSuccess from "@/components/configurator/OrderSuccess";

const STEP_LABELS = ["Style", "Size", "Frame", "Add-ons", "Checkout"];

interface ConfigState {
  editingStyleId: string | null;
  sizeId: string | null;
  frameMaterialId: string | null;
  frameColorId: string | null;
  addonIds: string[];
}

const ConfiguratorPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    editingStyleId: null,
    sizeId: null,
    frameMaterialId: null,
    frameColorId: null,
    addonIds: [],
  });

  const canProceed = () => {
    switch (step) {
      case 0: return config.editingStyleId !== null;
      case 1: return config.sizeId !== null;
      case 2: return config.frameMaterialId !== null && config.frameColorId !== null;
      case 3: return true;
      default: return false;
    }
  };

  const toggleAddon = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      addonIds: prev.addonIds.includes(id)
        ? prev.addonIds.filter((a) => a !== id)
        : [...prev.addonIds, id],
    }));
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 max-w-lg">
          <OrderSuccess />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="container mx-auto px-4 pt-24 max-w-lg">
        <button
          onClick={() => step === 0 ? navigate("/") : setStep(step - 1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          ← {step === 0 ? "Back to Home" : "Previous Step"}
        </button>

        <StepIndicator currentStep={step} totalSteps={5} labels={STEP_LABELS} />

        <div className="mb-8">
          {step === 0 && (
            <EditingStyleStep
              selected={config.editingStyleId}
              onSelect={(id) => setConfig((p) => ({ ...p, editingStyleId: id }))}
            />
          )}
          {step === 1 && (
            <SizeStep
              selected={config.sizeId}
              onSelect={(id) => setConfig((p) => ({ ...p, sizeId: id }))}
            />
          )}
          {step === 2 && (
            <FrameStep
              selectedMaterial={config.frameMaterialId}
              selectedColor={config.frameColorId}
              onSelectMaterial={(id) => setConfig((p) => ({ ...p, frameMaterialId: id }))}
              onSelectColor={(id) => setConfig((p) => ({ ...p, frameColorId: id }))}
            />
          )}
          {step === 3 && (
            <AddonsStep selected={config.addonIds} onToggle={toggleAddon} />
          )}
          {step === 4 && <CheckoutStep config={config} onOrderPlaced={() => setOrderPlaced(true)} />}
        </div>
      </div>

      {step < 4 && (
        <PriceBar
          selectedStyleId={config.editingStyleId}
          selectedSizeId={config.sizeId}
          selectedMaterialId={config.frameMaterialId}
          selectedAddonIds={config.addonIds}
          currentStep={step}
          totalSteps={5}
          canProceed={canProceed()}
          onNext={() => setStep((s) => s + 1)}
          onBack={() => setStep((s) => s - 1)}
        />
      )}
    </div>
  );
};

export default ConfiguratorPage;
