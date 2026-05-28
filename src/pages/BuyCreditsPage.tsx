import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { ArrowLeft, Coins, Upload, CheckCircle, Clock, XCircle, Copy, ExternalLink, Download } from "lucide-react";

const BuyCreditsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch user's profile to display current AR Video credits
  const { data: profile } = useQuery({
    queryKey: ["my_profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 2. Fetch global UPI ID from site_settings
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

  // 3. Fetch global QR code image URL from site_settings
  const { data: qrImage } = useQuery({
    queryKey: ["site_settings_upi_qr"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "upi_qr_image")
        .maybeSingle();
      return (data as any)?.value || "";
    },
  });

  // 4. Fetch the user's past credit requests to trace history
  const { data: creditRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["my_credit_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("credit_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `credits/${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;

      // Dynamically fetch public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setScreenshotUrl(publicUrl);
      toast.success("Screenshots uploaded successfully!");
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
      const { error } = await supabase.from("credit_requests" as any).insert({
        user_id: user.id,
        amount_paid: 50,
        screenshot_url: screenshotUrl,
        status: "pending",
      } as any);
      
      if (error) throw error;
      toast.success("Credit request submitted! Admin will verify your payment.");
      setScreenshotUrl("");
      refetchRequests();
    } catch (err: any) {
      toast.error("Submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied to clipboard!");
    }
  };

  const openUpiApp = () => {
    window.location.href = `upi://pay?pa=${upiId}&pn=ZeroGifts&am=50&cu=INR&tn=AR+Video+Credit`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>

        {/* Header Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20">
            <Coins className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">AR Video Credits</h1>
          <p className="text-muted-foreground mt-2">Buy credits to unlock magical AR videos on your photo frames</p>
        </div>

        {/* Credits Status Card */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Balance</h3>
            <p className="text-3xl font-bold text-foreground mt-1 flex items-center gap-2">
              <span>{profile?.ar_credits ?? 0}</span>
              <span className="text-sm font-medium text-rose-500">Credit{(profile?.ar_credits ?? 0) !== 1 ? "s" : ""}</span>
            </p>
          </div>
          <Coins size={36} className="text-rose-500 opacity-80" />
        </div>

        {/* Offer Details Box */}
        <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] mb-6 shadow-inner">
          <div className="text-center mb-3">
            <span className="text-sm font-medium text-rose-500 uppercase tracking-widest">Special Price</span>
            <div className="text-4xl font-extrabold text-foreground mt-1">₹50</div>
            <span className="text-xs text-muted-foreground">per AR Video Frame target</span>
          </div>
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Includes high-performance MindAR custom spatial tracking compilation, unconstrained uploaded aspect proportions, and dynamic modes!
          </p>
        </div>

        {/* Purchase Steps */}
        <div className="space-y-4">
          {/* Step 1: Pay */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-3">Step 1: Pay ₹50 via UPI</h3>
            {upiId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <span className="text-sm font-mono text-foreground flex-1 break-all">{upiId}</span>
                  <button onClick={copyUpi} className="p-1.5 rounded-lg hover:bg-background transition-colors" title="Copy UPI ID">
                    <Copy size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <button
                  onClick={openUpiApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-rose-500/20"
                >
                  <ExternalLink size={16} /> Open UPI App
                </button>
                {qrImage && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground font-semibold text-center">Or scan QR code</p>
                    <img src={qrImage} alt="UPI QR Code" className="w-48 h-48 mx-auto object-contain rounded-lg border border-border bg-background" />
                    <a
                      href={qrImage}
                      download="upi-qr-code.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-sm text-rose-500 hover:underline font-medium"
                    >
                      <Download size={14} /> Download QR Code
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">UPI ID not configured by admin yet.</p>
            )}
          </div>

          {/* Step 2: Upload Screenshot */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-3">Step 2: Upload Payment Screenshot</h3>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {screenshotUrl ? (
              <div className="space-y-3">
                <img src={screenshotUrl} alt="Payment Verification Screenshot" className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-sm font-semibold text-rose-500 hover:underline block mx-auto"
                >
                  Replace Screenshot
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-rose-500/30 transition-all text-center group"
              >
                {uploading ? (
                  <div className="animate-spin h-6 w-6 border-4 border-rose-500 border-t-transparent rounded-full mx-auto" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-rose-500 mx-auto mb-2 transition-colors" />
                    <p className="text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">Tap to select screenshot</p>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Step 3: Submit */}
          <button
            onClick={handleSubmit}
            disabled={!screenshotUrl || submitting}
            className="w-full px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-600 disabled:bg-muted text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md shadow-rose-500/10 mb-8"
          >
            {submitting ? "Submitting Request..." : "Submit Payment Verification"}
          </button>
        </div>

        {/* Requests Logs History List */}
        {creditRequests.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Request Log History</h3>
            <div className="space-y-3">
              {creditRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-border bg-card/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">₹{req.amount_paid} • 1 AR Credit</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {req.status === "approved" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} /> Approved
                      </span>
                    )}
                    {req.status === "pending" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {req.status === "rejected" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyCreditsPage;
