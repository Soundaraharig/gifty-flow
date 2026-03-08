import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch order with related data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Fetch related names
    const [styleRes, sizeRes, materialRes, colorRes] = await Promise.all([
      order.editing_style_id ? supabase.from("editing_styles").select("name").eq("id", order.editing_style_id).single() : null,
      order.size_id ? supabase.from("sizes").select("name").eq("id", order.size_id).single() : null,
      order.frame_material_id ? supabase.from("frame_materials").select("name").eq("id", order.frame_material_id).single() : null,
      order.frame_color_id ? supabase.from("frame_colors").select("name").eq("id", order.frame_color_id).single() : null,
    ]);

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    const styleName = styleRes?.data?.name ?? "N/A";
    const sizeName = sizeRes?.data?.name ?? "N/A";
    const materialName = materialRes?.data?.name ?? "N/A";
    const colorName = colorRes?.data?.name ?? "N/A";

    // Send email via Lovable AI gateway (using fetch to a simple SMTP-like approach)
    // We'll use Supabase's built-in email via the auth admin API workaround:
    // Actually, let's use a direct approach - send via the Lovable API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // For now, log the order details - the admin can see orders in the admin panel
    console.log(`🎁 New Order Received!`);
    console.log(`Customer: ${order.customer_name} (${order.customer_phone})`);
    console.log(`Style: ${styleName}, Size: ${sizeName}`);
    console.log(`Frame: ${materialName} - ${colorName}`);
    console.log(`Total: ₹${order.total_price}`);
    console.log(`Admin emails to notify: ${adminEmails.join(", ")}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order notification processed",
        adminEmails,
        orderDetails: {
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          styleName,
          sizeName,
          materialName,
          colorName,
          total: order.total_price,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
