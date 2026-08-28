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

function getPlanFromStripePriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
  if (priceId === Deno.env.get("STRIPE_STARTER_PRICE_ID")) return "starter";
  if (priceId === Deno.env.get("STRIPE_GROWTH_PRICE_ID")) return "growth";
  if (priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")) return "pro";
  return null;
}

function mapStripeSubscriptionStatusToSheeshaStatus(status: string) {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecretKey || !webhookSecret) return jsonResponse({ error: "Stripe webhook is not configured." }, { status: 500 });

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-08-26.dahlia" });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Missing Stripe signature." }, { status: 400 });

  try {
    const body = await request.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    const supabase = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted({ supabase, stripe, eventId: event.id, session });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("stripe_checkout_sessions")
        .update({ status: "expired" })
        .eq("stripe_checkout_session_id", session.id);
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      await syncSubscription({ supabase, eventId: event.id, subscription: event.data.object as Stripe.Subscription });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("venue_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: false,
          last_stripe_event_id: event.id,
          last_synced_at: new Date().toISOString(),
        })
        .eq("billing_subscription_id", subscription.id);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (subscriptionId) {
        await supabase
          .from("venue_subscriptions")
          .update({ status: "past_due", last_stripe_event_id: event.id, last_synced_at: new Date().toISOString() })
          .eq("billing_subscription_id", subscriptionId);
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not handle Stripe webhook.";
    return jsonResponse({ error: message }, { status: 400 });
  }
});

async function handleCheckoutCompleted(input: {
  supabase: ReturnType<typeof createAdminClient>;
  stripe: Stripe;
  eventId: string;
  session: Stripe.Checkout.Session;
}) {
  const subscriptionId = typeof input.session.subscription === "string" ? input.session.subscription : input.session.subscription?.id;
  const customerId = typeof input.session.customer === "string" ? input.session.customer : input.session.customer?.id;
  const venueId = input.session.metadata?.venueId;

  await input.supabase
    .from("stripe_checkout_sessions")
    .update({
      status: "completed",
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", input.session.id);

  if (!subscriptionId || !venueId) return;
  const subscription = await input.stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription({ supabase: input.supabase, eventId: input.eventId, subscription, fallbackVenueId: venueId });
}

async function syncSubscription(input: {
  supabase: ReturnType<typeof createAdminClient>;
  eventId: string;
  subscription: Stripe.Subscription;
  fallbackVenueId?: string;
}) {
  const item = input.subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const productId = typeof item?.price.product === "string" ? item.price.product : item?.price.product?.id ?? null;
  const plan = getPlanFromStripePriceId(priceId);
  const venueId = input.subscription.metadata.venueId ?? input.fallbackVenueId;

  if (!plan || !venueId) return;

  const customerId = typeof input.subscription.customer === "string" ? input.subscription.customer : input.subscription.customer.id;
  const periodStart = item?.current_period_start ?? input.subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? input.subscription.current_period_end;

  await input.supabase.from("venue_subscriptions").upsert(
    {
      venue_id: venueId,
      plan,
      status: mapStripeSubscriptionStatusToSheeshaStatus(input.subscription.status),
      billing_provider: "stripe",
      billing_customer_id: customerId,
      billing_subscription_id: input.subscription.id,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      current_period_start: unixToIso(periodStart),
      current_period_end: unixToIso(periodEnd),
      cancel_at_period_end: input.subscription.cancel_at_period_end,
      cancelled_at: input.subscription.status === "canceled" ? new Date().toISOString() : null,
      last_stripe_event_id: input.eventId,
      last_synced_at: new Date().toISOString(),
      updated_by: null,
    },
    { onConflict: "venue_id" },
  );
}
