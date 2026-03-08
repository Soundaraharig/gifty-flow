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
import type { OrderConfig } from "@/lib/pricing";

const STEP_LABELS = ["Style", "Size", "Frame", "Add-ons", "Checkout"];

const ConfiguratorPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<OrderConfig>({
    editingStyle: null,
    size: null,
    frameMaterial: null,
    frameColor: null,
    addons: [],
  });

  const canProceed = () => {
    switch (step) {
      case 0: return config.editingStyle !== null;
      case 1: return config.size !== null;
      case 2: return config.frameMaterial !== null && config.frameColor !== null;
      case 3: return true; // addons are optional
      default: return false;
    }
  };

  const toggleAddon = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((a) => a !== id)
        : [...prev.addons, id],
    }));
  };

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
              selected={config.editingStyle}
              onSelect={(id) => setConfig((p) => ({ ...p, editingStyle: id }))}
            />
          )}
          {step === 1 && (
            <SizeStep
              selected={config.size}
              onSelect={(id) => setConfig((p) => ({ ...p, size: id }))}
            />
          )}
          {step === 2 && (
            <FrameStep
              selectedMaterial={config.frameMaterial}
              selectedColor={config.frameColor}
              onSelectMaterial={(id) => setConfig((p) => ({ ...p, frameMaterial: id }))}
              onSelectColor={(id) => setConfig((p) => ({ ...p, frameColor: id }))}
            />
          )}
          {step === 3 && (
            <AddonsStep selected={config.addons} onToggle={toggleAddon} />
          )}
          {step === 4 && <CheckoutStep config={config} />}
        </div>
      </div>

      {step < 4 && (
        <PriceBar
          config={config}
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
