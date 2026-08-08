import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.3";

const PUBLIC_VAPID_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const PRIVATE_VAPID_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:admin@societytracker.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record; // Row inserted into 'notifications' table

    if (!record || !record.recipient_id) {
      return new Response("No recipient specified.", { status: 400 });
    }

    // Initialize Supabase Admin Client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Retrieve active push subscriptions for recipient_id
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", record.recipient_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      return new Response("No registered push subscriptions found for this user.", { status: 200 });
    }

    // Format Push Payload
    const pushPayload = JSON.stringify({
      title: record.title || "Society Tracker",
      body: record.message || "You received a new update.",
      url: record.route || "/notifications",
    });

    // Send notifications to all active user browser tokens
    const sendPromises = subscriptions.map((sub) =>
      webpush.sendNotification(sub.subscription, pushPayload).catch((err) => {
        console.error("Push delivery error:", err);
      })
    );

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});