import Stripe from "npm:stripe@22.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init.headers,
    },
  });
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function getUserFromRequest(request: Request) {
  const supabase = createAdminClient();
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Missing authorization token.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not verify user.");
  }

  return { supabase, user: data.user };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { supabase, user } = await getUserFromRequest(request);
    const { venueId } = await request.json();

    if (typeof venueId !== "string") {
      return jsonResponse({ error: "A venue is required." }, { status: 400 });
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueId)
      .eq("is_claimed", true)
      .eq("claimed_by", user.id)
      .maybeSingle();

    if (venueError) throw venueError;
    if (!venue) return jsonResponse({ error: "You can only manage billing for venues you own." }, { status: 403 });

    const { data: subscription, error: subscriptionError } = await supabase
      .from("venue_subscriptions")
      .select("billing_provider,billing_customer_id")
      .eq("venue_id", venue.id)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    if (subscription?.billing_provider !== "stripe" || !subscription.billing_customer_id) {
      return jsonResponse({ error: "This venue does not have Stripe billing yet." }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL") ?? Deno.env.get("VITE_APP_URL");
    if (!stripeSecretKey || !appUrl) return jsonResponse({ error: "Stripe billing portal is not configured." }, { status: 500 });

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-08-26.dahlia" });
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.billing_customer_id,
      return_url: `${appUrl}/owner/billing`,
    });

    return jsonResponse({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create billing portal session.";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
