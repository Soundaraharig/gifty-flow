

## Automatic Email Notifications to Admin

### What We'll Build
Three types of automatic email notifications sent to admin whenever relevant events happen — no manual action needed.

1. **Order notification email** — sent immediately when any new order is placed
2. **UPI payment alert** — sent when an order is marked as "paid via UPI"
3. **Daily order summary** — a scheduled digest of all orders from that day

### How It Works

**Edge Function: `send-order-email`** (already exists, needs rewriting)
- Update to use Lovable AI's email-sending capabilities via the `LOVABLE_API_KEY` (already configured)
- Accept a `type` parameter: `"new_order"`, `"upi_payment"`, or `"daily_summary"`
- Fetch admin emails from `user_roles` + auth admin API
- Compose and send HTML emails with order details

**Trigger from Checkout:**
- After successful order insert in `CheckoutStep.tsx` and `CartPage.tsx`, invoke the edge function with `type: "new_order"` (and `"upi_payment"` if UPI was selected)

**Daily Summary:**
- Use Supabase's `pg_cron` or a scheduled edge function (via `cron` in config.toml) to run daily, query that day's orders, and email admin

### Technical Steps

1. **Rewrite `send-order-email` edge function** to actually send emails using Resend (requires `RESEND_API_KEY` secret) or a simple SMTP approach. Since Lovable doesn't have a built-in transactional email sender, we'll need a third-party service.
   
2. **Add Resend integration** — Resend is the simplest option. We'd need the user to provide a `RESEND_API_KEY` and a verified sender domain/email.

3. **Call the function from checkout flows** — add `supabase.functions.invoke("send-order-email", ...)` after order creation in both `CheckoutStep.tsx` and `CartPage.tsx`.

4. **Add daily cron schedule** in `supabase/config.toml` for the daily summary.

5. **Add admin settings** — option to configure notification email address in the admin settings tab (fallback: admin's login email).

### What You'll Need
- A **Resend account** (free tier: 100 emails/day) — sign up at resend.com
- A **verified sender email** (or domain) in Resend
- Your **Resend API key** which we'll store securely as a backend secret

Shall I proceed with this approach?

