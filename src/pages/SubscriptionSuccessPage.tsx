import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription status
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg text-center">
        <div className="animate-fade-in space-y-6">
          <CheckCircle size={64} className="text-primary mx-auto" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Subscription Active!
          </h1>
          <p className="text-muted-foreground">
            Welcome aboard! You now have full access to product management and order tracking.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => navigate("/admin")}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-rose hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/categories")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
