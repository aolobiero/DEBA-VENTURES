import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend@4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const sender = Deno.env.get("NEWSLETTER_FROM_EMAIL");

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expectedSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET");
  if (!expectedSecret || request.headers.get("x-webhook-secret") !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await request.json();
  const email = payload.record?.email;
  if (!email || !sender) {
    return new Response("Invalid newsletter event configuration", { status: 400 });
  }

  const result = await resend.emails.send({
    from: sender,
    to: email,
    subject: "You are subscribed to Deba Ventures updates",
    html: `
      <div style="background:#f5f7fa;padding:40px 20px;font-family:Arial,sans-serif;color:#10233d">
        <div style="background:#ffffff;margin:auto;max-width:560px;padding:40px;border-top:5px solid #c5a052">
          <p style="color:#8d671d;font-size:12px;font-weight:700;letter-spacing:2px">DEBA VENTURES LTD</p>
          <h1 style="font-size:30px;margin:24px 0 12px">You are on the list.</h1>
          <p style="font-size:16px;line-height:1.6">Thank you for subscribing to tender announcements, RFQ opportunities, and venture communications from Deba Ventures Ltd.</p>
          <p style="color:#52657a;font-size:14px;line-height:1.6">We will only send relevant business updates. You can contact us at any time to update your subscription preferences.</p>
        </div>
      </div>
    `
  });

  if (result.error) {
    console.error(result.error);
    return new Response("Email delivery failed", { status: 502 });
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "content-type": "application/json" }
  });
});
