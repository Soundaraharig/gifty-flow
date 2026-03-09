import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Crown, Upload, CheckCircle, Clock, Copy, ExternalLink, Download } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: upiId } = useQuery({
    queryKey: ["site_settings_upi"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "upi_id")
        .maybeSingle();
      return (data as any)?.value || "";
    },
  });

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ["my_subscription_request", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscription_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      return (data as any)?.[0] || null;
    },
    enabled: !!user,
  });

  const { data: userRole } = useQuery({
    queryKey: ["my_role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.role || "user";
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `subscriptions/${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
      setScreenshotUrl(publicUrl);
      toast.success("Screenshot uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!screenshotUrl || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("subscription_requests" as any).insert({
        user_id: user.id,
        screenshot_url: screenshotUrl,
      } as any);
      if (error) throw error;
      toast.success("Request submitted! Admin will verify your payment.");
      setScreenshotUrl("");
      refetch();
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied!");
    }
  };

  const openUpiApp = () => {
    window.location.href = `upi://pay?pa=${upiId}&pn=ZeroGifts&am=29&cu=INR&tn=VIP+Subscription`;
  };

  const isApprovedOrSubscriber = userRole === "subscriber" || existingRequest?.status === "approved";

  if (isApprovedOrSubscriber) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg text-center">
          <div className="p-8 rounded-2xl border border-primary/30 bg-primary/5">
            <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">You're a VIP Subscriber!</h1>
            <p className="text-muted-foreground">You have access to product management and order tracking.</p>
            <button
              onClick={() => navigate("/admin")}
              className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = existingRequest?.status === "pending";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">VIP Subscription</h1>
          <p className="text-muted-foreground mt-2">Unlock product management & order tracking</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-primary">₹29</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Edit, add & update products</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Track all orders</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Manage gallery images</li>
          </ul>
        </div>

        {isPending ? (
          <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-center">
            <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Verification Pending</h3>
            <p className="text-sm text-muted-foreground">Your payment screenshot has been submitted. Admin will verify it shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Pay */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-3">Step 1: Pay ₹29 via UPI</h3>
              {upiId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <span className="text-sm font-mono text-foreground flex-1">{upiId}</span>
                    <button onClick={copyUpi} className="p-1.5 rounded-lg hover:bg-background transition-colors" title="Copy">
                      <Copy size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                  <button
                    onClick={openUpiApp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm"
                  >
                    <ExternalLink size={16} /> Open UPI App
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">UPI ID not configured yet.</p>
              )}
            </div>

            {/* Step 2: Upload screenshot */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-3">Step 2: Upload Payment Screenshot</h3>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              {screenshotUrl ? (
                <div className="space-y-3">
                  <img src={screenshotUrl} alt="Screenshot" className="w-full max-h-64 object-contain rounded-lg border border-border" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-primary hover:underline"
                  >
                    Replace screenshot
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors text-center"
                >
                  {uploading ? (
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Step 3: Submit */}
            <button
              onClick={handleSubmit}
              disabled={!screenshotUrl || submitting}
              className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
