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
    if (!orderId) {
      throw new Error("Missing orderId");
    }

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
      throw new Error(`Order not found for ID: ${orderId}`);
    }

    // Fetch related names
    const [styleRes, sizeRes, materialRes, colorRes] = await Promise.all([
      order.editing_style_id ? supabase.from("editing_styles").select("name").eq("id", order.editing_style_id).single() : null,
      order.size_id ? supabase.from("sizes").select("name").eq("id", order.size_id).single() : null,
      order.frame_material_id ? supabase.from("frame_materials").select("name").eq("id", order.frame_material_id).single() : null,
      order.frame_color_id ? supabase.from("frame_colors").select("name").eq("id", order.frame_color_id).single() : null,
    ]);

    const styleName = styleRes?.data?.name ?? "N/A";
    const sizeName = sizeRes?.data?.name ?? "N/A";
    const materialName = materialRes?.data?.name ?? "N/A";
    const colorName = colorRes?.data?.name ?? "N/A";

    // Fetch addon names if applicable
    let addonNames: string[] = [];
    if (order.addon_ids && order.addon_ids.length > 0) {
      const { data: addonsData } = await supabase
        .from("addons")
        .select("name")
        .in("id", order.addon_ids);
      if (addonsData) {
        addonNames = addonsData.map((a: any) => a.name);
      }
    }

    // Fetch customer email from auth
    let customerEmail = "";
    if (order.user_id) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);
      if (!userError && userData?.user?.email) {
        customerEmail = userData.user.email;
      }
    }

    // Fetch admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    if (adminRoles && adminRoles.length > 0) {
      for (const role of adminRoles) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(role.user_id);
        if (!userError && userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }
    }

    // Fallback default admin email if none are registered
    if (adminEmails.length === 0) {
      adminEmails.push("admin@zerogifts.com");
    }

    // --- HTML Email Template: Customer ---
    const customerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header banner -->
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #c084fc, #8b5cf6);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">🎁 Zero Gifts</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Handcrafted memories, delivered with love</p>
      </td>
    </tr>
    <!-- Celebration Message -->
    <tr>
      <td style="padding: 30px 40px 10px 40px; text-align: center;">
        <div style="display: inline-block; font-size: 40px; line-height: 1; margin-bottom: 12px;">🎉</div>
        <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">Order Confirmed!</h2>
        <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px; line-height: 1.5;">Hi ${order.customer_name}, thank you for choosing us. We have received your order and our artisans are already preparing it!</p>
      </td>
    </tr>
    <!-- Order Card -->
    <tr>
      <td style="padding: 20px 40px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
          <tr>
            <td>
              <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; tracking-wider;">Order ID</p>
              <p style="color: #0f172a; font-family: monospace; font-size: 14px; font-weight: 700; margin: 0 0 16px 0;">#ZG-${order.id.slice(0, 8).toUpperCase()}</p>
            </td>
          </tr>
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">🎨 Style:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${styleName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">📐 Size:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${sizeName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">🖼 Frame Details:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${colorName} (${materialName})</td>
                </tr>
                ${addonNames.length > 0 ? `
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px; vertical-align: top;">✨ Add-ons:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${addonNames.join(", ")}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px;"></td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Payment Method:</td>
                  <td style="color: #8b5cf6; text-align: right; font-weight: 700;">${order.payment_method ? order.payment_method.toUpperCase() : "COD"}</td>
                </tr>
                <tr>
                  <td style="color: #0f172a; font-weight: 700; font-size: 16px; padding-top: 8px;">Total Paid:</td>
                  <td style="color: #8b5cf6; text-align: right; font-weight: 800; font-size: 18px; padding-top: 8px;">₹${order.total_price}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Delivery Address -->
    <tr>
      <td style="padding: 0 40px 20px 40px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
          <tr>
            <td>
              <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 14px; font-weight: 700;">📍 Delivery Details</h3>
              <p style="color: #334155; margin: 0; font-size: 13px; line-height: 1.6;">
                <strong>${order.customer_name}</strong><br>
                ${order.notes ? order.notes.split('|')[0]?.trim() || "Address on file" : "Address on file"}<br>
                📞 Phone: ${order.customer_phone}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer CTA -->
    <tr>
      <td style="padding: 10px 40px 40px 40px; text-align: center;">
        <a href="https://wa.me/919876543210" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 700; font-size: 14px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(37,211,102,0.2);">
          💬 Chat with us on WhatsApp
        </a>
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
          If you have any questions or would like to submit/modify images, feel free to reply directly to this email or contact us on WhatsApp.
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0 0;">
          © 2026 Zero Gifts. Handcrafted with ❤️
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // --- HTML Email Template: Shop Owner (Admin) ---
    const adminHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fffbeb; margin: 0; padding: 20px 0; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #fde68a; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header banner -->
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f59e0b, #d97706);">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">🚨 New Order Received!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Order ID: #ZG-${order.id.slice(0, 8).toUpperCase()}</p>
      </td>
    </tr>
    <!-- Customer Info card -->
    <tr>
      <td style="padding: 30px 40px 10px 40px;">
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">👤 Customer Information</h2>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6;">
          <tr>
            <td style="color: #64748b; width: 120px; padding-bottom: 6px;">Name:</td>
            <td style="color: #0f172a; font-weight: 600; padding-bottom: 6px;">${order.customer_name}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Phone:</td>
            <td style="color: #0f172a; font-weight: 600; padding-bottom: 6px;"><a href="tel:${order.customer_phone}" style="color: #d97706; text-decoration: none;">${order.customer_phone}</a></td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Email:</td>
            <td style="color: #0f172a; font-weight: 600; padding-bottom: 6px;">${customerEmail || "Guest Checkout (No account email)"}</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Order items card -->
    <tr>
      <td style="padding: 10px 40px 10px 40px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px;">
          <tr>
            <td>
              <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px; font-weight: 700;">📦 Product Details</h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">🎨 Style:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${styleName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">📐 Size:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${sizeName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">🖼 Frame Details:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${colorName} (${materialName})</td>
                </tr>
                ${addonNames.length > 0 ? `
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">✨ Add-ons:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 8px;">${addonNames.join(", ")}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="border-top: 1px dashed #d6d3d1; padding-top: 12px; margin-top: 12px;"></td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Payment Method:</td>
                  <td style="color: #d97706; text-align: right; font-weight: 700;">${order.payment_method ? order.payment_method.toUpperCase() : "COD"}</td>
                </tr>
                <tr>
                  <td style="color: #0f172a; font-weight: 700; font-size: 16px; padding-top: 8px;">Total Price:</td>
                  <td style="color: #d97706; text-align: right; font-weight: 800; font-size: 18px; padding-top: 8px;">₹${order.total_price}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Special Notes & Instructions -->
    <tr>
      <td style="padding: 10px 40px 10px 40px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px;">
          <tr>
            <td>
              <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 14px; font-weight: 700;">📝 Special Notes & Delivery Address</h3>
              <p style="color: #44403c; margin: 0; font-size: 13px; line-height: 1.6; font-style: italic; background-color: #f5f5f4; padding: 12px; border-radius: 8px; border-left: 4px solid #d97706;">
                ${order.notes || "No special instructions provided."}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Action button for Shop Owner -->
    <tr>
      <td style="padding: 20px 40px 40px 40px; text-align: center;">
        <a href="https://gifty-flow.vercel.app/admin" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px rgba(217,119,6,0.2);">
          💼 Open Admin Dashboard
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // --- Sending Email via Resend ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let customerEmailStatus = "Not attempted (no email address)";
    let adminEmailStatus = "Not attempted";

    if (resendApiKey) {
      console.log("Resend API Key found! Attempting email delivery...");

      // 1. Send confirmation to the Customer (if email is available)
      if (customerEmail) {
        try {
          const customerRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Zero Gifts <onboarding@resend.dev>",
              to: customerEmail,
              subject: `🎁 Order Confirmed! #${order.id.slice(0, 8).toUpperCase()}`,
              html: customerHtml,
            }),
          });

          if (customerRes.ok) {
            customerEmailStatus = `Sent successfully to ${customerEmail}`;
            console.log(`Customer email sent successfully to ${customerEmail}`);
          } else {
            const errText = await customerRes.text();
            customerEmailStatus = `Failed: ${errText}`;
            console.error(`Resend customer email failed: ${errText}`);
          }
        } catch (e) {
          customerEmailStatus = `Error: ${e.message}`;
          console.error("Error calling Resend for customer email:", e);
        }
      } else {
        console.log("Skipping customer email (guest or no email on auth file)");
      }

      // 2. Send notification to the Shop Owner(s) (Admins)
      if (adminEmails.length > 0) {
        try {
          const adminRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Zero Gifts Orders <onboarding@resend.dev>",
              to: adminEmails,
              subject: `🚨 New Order Alert! ZG-${order.id.slice(0, 8).toUpperCase()}`,
              html: adminHtml,
            }),
          });

          if (adminRes.ok) {
            adminEmailStatus = `Sent successfully to ${adminEmails.join(", ")}`;
            console.log(`Admin email sent successfully to: ${adminEmails.join(", ")}`);
          } else {
            const errText = await adminRes.text();
            adminEmailStatus = `Failed: ${errText}`;
            console.error(`Resend admin email failed: ${errText}`);
          }
        } catch (e) {
          adminEmailStatus = `Error: ${e.message}`;
          console.error("Error calling Resend for admin email:", e);
        }
      }
    } else {
      console.warn("⚠️ No RESEND_API_KEY found in Supabase environment secrets.");
      console.log(`🎁 MOCK EMAIL - CUSTOMER CONFIRMATION TO: ${customerEmail || "N/A"}`);
      console.log(customerHtml);
      console.log(`🚨 MOCK EMAIL - ADMIN NOTIFICATION TO: ${adminEmails.join(", ")}`);
      console.log(adminHtml);
      customerEmailStatus = "Mocked (No RESEND_API_KEY, printed to logs)";
      adminEmailStatus = "Mocked (No RESEND_API_KEY, printed to logs)";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order notification email processing finished",
        customerEmail,
        customerEmailStatus,
        adminEmails,
        adminEmailStatus,
        orderDetails: {
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          styleName,
          sizeName,
          materialName,
          colorName,
          addonNames,
          total: order.total_price,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fatal Error processing send-order-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
