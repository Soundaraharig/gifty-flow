import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import Header from "@/components/Header";
import { Crown, Check, Loader2 } from "lucide-react";

const SubscriptionPage = () => {
  const { user, isSubscriber, subscriptionEnd, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      alert("Failed to start checkout: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      alert("Failed to open portal: " + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const features = [
    "Add & edit editing styles, sizes, and frame materials",
    "Manage resin product types",
    "View and track all customer orders",
    "Receive order notifications via WhatsApp",
    "Upload gallery images for styles",
    "Manage add-ons and frame colors",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <button
          onClick={() => navigate("/categories")}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          ← Back to Categories
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Crown size={18} />
            <span className="text-sm font-semibold">Subscriber Plan</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Become a Subscriber
          </h1>
          <p className="text-muted-foreground mt-2">
            Get full product management access and order tracking
          </p>
        </div>

        <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-foreground">
              ₹499<span className="text-lg text-muted-foreground font-normal">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>

          {isSubscriber ? (
            <div className="space-y-3">
              <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-semibold text-primary">Active Subscription</p>
                {subscriptionEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews on {new Date(subscriptionEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <button
                onClick={handleManage}
                disabled={portalLoading}
                className="w-full px-6 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {portalLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Manage Subscription"}
              </button>
              <button
                onClick={() => { checkSubscription(); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Refresh Status
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-rose hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Subscribe Now — ₹499/mo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
