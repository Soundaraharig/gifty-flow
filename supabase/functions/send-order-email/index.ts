import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, orderId, orderDetails } = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    for (const role of adminRoles || []) {
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) adminEmails.push(userData.user.email);
    }

    // Also check site_settings for notification email
    const { data: emailSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "notification_email")
      .maybeSingle();
    if (emailSetting?.value && !adminEmails.includes(emailSetting.value)) {
      adminEmails.push(emailSetting.value);
    }

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "No admin emails found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let htmlBody = "";

    if (type === "new_order") {
      const d = orderDetails;
      subject = `🎁 New Order from ${d.customerName}`;
      htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e11d48;">🎁 New Order Received!</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Customer</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.customerPhone}</td></tr>
            ${d.styleName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Style</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.styleName}</td></tr>` : ""}
            ${d.sizeName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Size</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.sizeName}</td></tr>` : ""}
            ${d.materialName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Frame</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.materialName}</td></tr>` : ""}
            ${d.address ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Address</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.address}</td></tr>` : ""}
            ${d.notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Notes</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d.notes}</td></tr>` : ""}
            <tr><td style="padding: 8px; font-weight: bold; font-size: 18px;">Total</td><td style="padding: 8px; font-size: 18px; color: #e11d48; font-weight: bold;">₹${d.total}</td></tr>
          </table>
          ${d.paymentMethod === "upi" ? '<p style="background: #fef3c7; padding: 12px; border-radius: 8px; font-weight: bold;">💳 Customer marked as PAID via UPI</p>' : '<p style="background: #f0f0f0; padding: 12px; border-radius: 8px;">💵 Payment: Cash on Delivery</p>'}
          ${d.items ? `<h3>Cart Items:</h3><ul>${d.items.map((i: any) => `<li>${i.name} x${i.quantity} — ₹${i.price * i.quantity}</li>`).join("")}</ul>` : ""}
        </div>`;
    } else if (type === "upi_payment") {
      const d = orderDetails;
      subject = `💳 UPI Payment Alert — ${d.customerName}`;
      htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">💳 UPI Payment Received</h2>
          <p><strong>${d.customerName}</strong> (${d.customerPhone}) has marked their order as <strong>Paid via UPI</strong>.</p>
          <p style="font-size: 24px; font-weight: bold; color: #e11d48;">₹${d.total}</p>
          <p>Please verify the payment in your UPI app.</p>
        </div>`;
    } else if (type === "daily_summary") {
      // Fetch today's orders
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay)
        .order("created_at", { ascending: false });

      const orderCount = orders?.length ?? 0;
      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0) ?? 0;
      const upiOrders = orders?.filter((o: any) => o.payment_method === "upi").length ?? 0;

      subject = `📊 Daily Summary — ${orderCount} orders, ₹${totalRevenue}`;
      htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">📊 Daily Order Summary</h2>
          <p style="color: #666;">${today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div style="display: flex; gap: 16px; margin: 20px 0;">
            <div style="background: #f0f9ff; padding: 16px; border-radius: 12px; flex: 1; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${orderCount}</p>
              <p style="color: #666; margin: 4px 0 0;">Orders</p>
            </div>
            <div style="background: #fef2f2; padding: 16px; border-radius: 12px; flex: 1; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; color: #e11d48;">₹${totalRevenue}</p>
              <p style="color: #666; margin: 4px 0 0;">Revenue</p>
            </div>
            <div style="background: #fefce8; padding: 16px; border-radius: 12px; flex: 1; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${upiOrders}</p>
              <p style="color: #666; margin: 4px 0 0;">UPI Paid</p>
            </div>
          </div>
          ${orderCount > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9fafb;"><th style="padding: 8px; text-align: left;">Customer</th><th style="padding: 8px;">Phone</th><th style="padding: 8px;">Amount</th><th style="padding: 8px;">Payment</th></tr>
            ${orders!.map((o: any) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${o.customer_name}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${o.customer_phone}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">₹${o.total_price}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${o.payment_method === "upi" ? "💳 UPI" : "💵 COD"}</td></tr>`).join("")}
          </table>` : "<p>No orders today.</p>"}
        </div>`;
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Orders <onboarding@resend.dev>",
        to: adminEmails,
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log(`✅ Email sent (${type}) to: ${adminEmails.join(", ")}`);

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
