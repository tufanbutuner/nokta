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

type StripeMode = "test" | "live";

function getPlanFromStripePriceId(priceId: string | null | undefined, mode: StripeMode) {
  if (!priceId) return null;
  const prefix = mode === "test" ? "STRIPE_TEST" : "STRIPE_LIVE";
  if (priceId === Deno.env.get(`${prefix}_STARTER_PRICE_ID`) || (mode === "live" && priceId === Deno.env.get("STRIPE_STARTER_PRICE_ID"))) return "starter";
  if (priceId === Deno.env.get(`${prefix}_GROWTH_PRICE_ID`) || (mode === "live" && priceId === Deno.env.get("STRIPE_GROWTH_PRICE_ID"))) return "growth";
  if (priceId === Deno.env.get(`${prefix}_PRO_PRICE_ID`) || (mode === "live" && priceId === Deno.env.get("STRIPE_PRO_PRICE_ID"))) return "pro";
  return null;
}

function getStripeSecretKey(mode: StripeMode) {
  return Deno.env.get(mode === "test" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_LIVE_SECRET_KEY") ?? (mode === "live" ? Deno.env.get("STRIPE_SECRET_KEY") : null);
}

function getWebhookSecret(mode: StripeMode) {
  return Deno.env.get(mode === "test" ? "STRIPE_TEST_WEBHOOK_SECRET" : "STRIPE_LIVE_WEBHOOK_SECRET") ?? (mode === "live" ? Deno.env.get("STRIPE_WEBHOOK_SECRET") : null);
}

async function constructStripeEvent(input: { body: string; signature: string }) {
  for (const mode of ["test", "live"] as StripeMode[]) {
    const stripeSecretKey = getStripeSecretKey(mode);
    const webhookSecret = getWebhookSecret(mode);
    if (!stripeSecretKey || !webhookSecret) continue;

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-08-26.dahlia" });
    try {
      const event = await stripe.webhooks.constructEventAsync(input.body, input.signature, webhookSecret);
      return { event, stripe, stripeMode: mode };
    } catch {
      continue;
    }
  }

  throw new Error("Could not verify Stripe webhook signature.");
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

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Missing Stripe signature." }, { status: 400 });

  try {
    const body = await request.text();
    const { event, stripe, stripeMode } = await constructStripeEvent({ body, signature });
    const supabase = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted({ supabase, stripe, stripeMode, eventId: event.id, session });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("stripe_checkout_sessions")
        .update({ status: "expired" })
        .eq("stripe_checkout_session_id", session.id);
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      await syncSubscription({ supabase, eventId: event.id, subscription: event.data.object as Stripe.Subscription, stripeMode });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const venueId = subscription.metadata.venueId;
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

      if (venueId) {
        await supabase
          .from("venues")
          .update({
            partner_tier: "none",
            monetisation_status: "churned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", venueId);
      }
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
  stripeMode: StripeMode;
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
      stripe_mode: input.stripeMode,
      completed_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", input.session.id);

  if (!subscriptionId || !venueId) return;
  const subscription = await input.stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription({ supabase: input.supabase, eventId: input.eventId, subscription, fallbackVenueId: venueId, stripeMode: input.stripeMode });
}

async function syncSubscription(input: {
  supabase: ReturnType<typeof createAdminClient>;
  eventId: string;
  subscription: Stripe.Subscription;
  fallbackVenueId?: string;
  stripeMode?: StripeMode;
}) {
  const item = input.subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const productId = typeof item?.price.product === "string" ? item.price.product : item?.price.product?.id ?? null;
  const stripeMode = input.stripeMode ?? (input.subscription.livemode ? "live" : "test");
  const plan = getPlanFromStripePriceId(priceId, stripeMode);
  const venueId = input.subscription.metadata.venueId ?? input.fallbackVenueId;

  if (!plan || !venueId) return;

  const customerId = typeof input.subscription.customer === "string" ? input.subscription.customer : input.subscription.customer.id;
  const periodStart = item?.current_period_start ?? input.subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? input.subscription.current_period_end;
  const sheeshaStatus = mapStripeSubscriptionStatusToSheeshaStatus(input.subscription.status);
  const hasPaidAccess = sheeshaStatus === "active" || sheeshaStatus === "trial" || sheeshaStatus === "past_due";
  const cancelsAtPeriodEnd = input.subscription.cancel_at_period_end || Boolean(input.subscription.cancel_at);

  await input.supabase.from("venue_subscriptions").upsert(
    {
      venue_id: venueId,
      plan,
      status: sheeshaStatus,
      billing_provider: "stripe",
      billing_customer_id: customerId,
      billing_subscription_id: input.subscription.id,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      stripe_mode: stripeMode,
      current_period_start: unixToIso(periodStart),
      current_period_end: unixToIso(periodEnd),
      cancel_at_period_end: cancelsAtPeriodEnd,
      cancelled_at: input.subscription.status === "canceled" ? new Date().toISOString() : null,
      last_stripe_event_id: input.eventId,
      last_synced_at: new Date().toISOString(),
      updated_by: null,
    },
    { onConflict: "venue_id" },
  );

  await input.supabase
    .from("venues")
    .update({
      partner_tier: hasPaidAccess ? plan : "none",
      monetisation_status: sheeshaStatus === "cancelled" ? "churned" : hasPaidAccess ? "paying" : "not-contacted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", venueId);
}
