import { useState } from "react";
import { Bug, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BugReportButton = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      // Send bug report via WhatsApp to admin
      const message = `🐛 *Bug Report*%0A%0A*Title:* ${encodeURIComponent(title.trim())}%0A*Description:* ${encodeURIComponent(description.trim())}%0A*User:* ${encodeURIComponent(user?.email || "Unknown")}%0A*Page:* ${encodeURIComponent(window.location.pathname)}`;
      window.open(`https://wa.me/919876543210?text=${message}`, "_blank");
      toast.success("Bug report sent!");
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch {
      toast.error("Failed to send report");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Report a bug"
      >
        <Bug size={22} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Bug size={20} className="text-destructive" />
                <h2 className="font-display text-lg font-bold text-card-foreground">Report a Bug</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1.5 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What did you expect?"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Send size={16} />
                {sending ? "Sending…" : "Send Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BugReportButton;
