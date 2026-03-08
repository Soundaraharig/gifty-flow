import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

const AdminSubscriptions = () => {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin_subscription_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_profiles_for_subs"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, avatar_url");
      return data ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (req: any) => {
      // Update request status
      const { error: updateErr } = await supabase
        .from("subscription_requests" as any)
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (updateErr) throw updateErr;

      // Update user role to subscriber
      const { error: roleErr } = await supabase
        .from("user_roles")
        .update({ role: "subscriber" } as any)
        .eq("user_id", req.user_id);
      if (roleErr) throw roleErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_subscription_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Subscription approved! User is now a subscriber.");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_requests" as any)
        .update({ status: "rejected", reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_subscription_requests"] });
      toast.success("Request rejected.");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  const pending = requests.filter((r: any) => r.status === "pending");
  const reviewed = requests.filter((r: any) => r.status !== "pending");

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-4">
        Subscription Requests
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-primary">{requests.filter((r: any) => r.status === "approved").length}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <p className="text-2xl font-bold text-destructive">{requests.filter((r: any) => r.status === "rejected").length}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={14} className="text-yellow-500" /> Pending Verification
          </h3>
          <div className="space-y-3">
            {pending.map((req: any) => {
              const profile = getProfile(req.user_id);
              return (
                <div key={req.id} className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{profile?.display_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Screenshot */}
                  <div className="mt-3">
                    <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={req.screenshot_url}
                        alt="Payment screenshot"
                        className="w-full max-h-48 object-contain rounded-lg border border-border bg-background"
                      />
                    </a>
                    <a
                      href={req.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink size={10} /> View full image
                    </a>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approveMutation.mutate(req)}
                      disabled={approveMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { if (confirm("Reject this request?")) rejectMutation.mutate(req.id); }}
                      disabled={rejectMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-destructive/30 text-destructive text-sm font-medium disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">History</h3>
          <div className="space-y-2">
            {reviewed.map((req: any) => {
              const profile = getProfile(req.user_id);
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    req.status === "approved"
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">No subscription requests yet.</p>
      )}
    </div>
  );
};

export default AdminSubscriptions;
