import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my_orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, editing_styles(name), sizes(name), frame_materials(name), frame_colors(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 max-w-lg pb-12">
        <button
          onClick={() => navigate("/categories")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Catalog
        </button>
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No orders yet</p>
            <p className="text-sm mt-1">Start by configuring your first gift!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-border bg-card shadow-sm animate-fade-in"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Style</span>
                    <span className="text-foreground font-medium">
                      {(order as any).editing_styles?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="text-foreground font-medium">
                      {(order as any).sizes?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frame</span>
                    <span className="text-foreground font-medium">
                      {(order as any).frame_materials?.name ?? "—"}, {(order as any).frame_colors?.name ?? "—"}
                    </span>
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">₹{order.total_price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
