import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ExternalLink, Trash2, Eye, ChevronDown } from "lucide-react";

const AdminSubscriptions = () => {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      const { error: updateErr } = await supabase
        .from("subscription_requests" as any)
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (updateErr) throw updateErr;

      const { data: existingRole, error: roleFetchErr } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", req.user_id)
        .maybeSingle();
      if (roleFetchErr) throw roleFetchErr;

      if (existingRole?.id) {
        const { error: roleUpdateErr } = await supabase
          .from("user_roles")
          .update({ role: "subscriber" } as any)
          .eq("id", existingRole.id);
        if (roleUpdateErr) throw roleUpdateErr;
      } else {
        const { error: roleInsertErr } = await supabase
          .from("user_roles")
          .insert({ user_id: req.user_id, role: "subscriber" } as any);
        if (roleInsertErr) throw roleInsertErr;
      }
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

  const revokeMutation = useMutation({
    mutationFn: async (req: any) => {
      // Revert role back to 'user'
      const { error: roleErr } = await supabase
        .from("user_roles")
        .update({ role: "user" } as any)
        .eq("user_id", req.user_id);
      if (roleErr) throw roleErr;

      // Update request status to 'revoked'
      const { error: reqErr } = await supabase
        .from("subscription_requests" as any)
        .update({ status: "revoked", reviewed_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (reqErr) throw reqErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_subscription_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Subscription revoked. User is back to normal.");
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
          <p className="text-2xl font-bold text-destructive">{requests.filter((r: any) => r.status === "rejected" || r.status === "revoked").length}</p>
          <p className="text-xs text-muted-foreground">Rejected/Revoked</p>
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
                  <div className="mt-3">
                    <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={req.screenshot_url} alt="Payment screenshot" className="w-full max-h-48 object-contain rounded-lg border border-border bg-background" />
                    </a>
                    <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink size={10} /> View full image
                    </a>
                  </div>
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

      {/* Reviewed / History with expandable screenshot */}
      {reviewed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">History</h3>
          <div className="space-y-2">
            {reviewed.map((req: any) => {
              const profile = getProfile(req.user_id);
              const isExpanded = expandedId === req.id;
              const statusColor =
                req.status === "approved"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive";

              return (
                <div key={req.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
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
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                      {req.status}
                    </span>
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 bg-muted/10">
                      {/* Screenshot */}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Payment Screenshot</p>
                        <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={req.screenshot_url} alt="Payment proof" className="w-full max-h-64 object-contain rounded-lg border border-border bg-background" />
                        </a>
                        <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink size={10} /> View full image
                        </a>
                      </div>

                      {/* Details */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Submitted:</span>{" "}
                          {new Date(req.created_at).toLocaleString()}
                        </div>
                        {req.reviewed_at && (
                          <div>
                            <span className="font-medium">Reviewed:</span>{" "}
                            {new Date(req.reviewed_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Revoke button for approved subscriptions */}
                      {req.status === "approved" && (
                        <button
                          onClick={() => {
                            if (confirm(`Revoke subscription for ${profile?.display_name || "this user"}? They will lose subscriber access.`))
                              revokeMutation.mutate(req);
                          }}
                          disabled={revokeMutation.isPending}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-destructive/30 text-destructive text-sm font-medium disabled:opacity-50 hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 size={14} /> Revoke Subscription
                        </button>
                      )}
                    </div>
                  )}
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
