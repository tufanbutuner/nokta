import { checkPromotedOfferSafety } from "@/lib/promotedOfferSafety";
import { mapPromotedOfferRowToOffer } from "@/lib/promotedOfferMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { PromotedOfferRow } from "@/types/database";
import type { PromotedOffer, PromotedOfferInput, PromotedOfferStatus } from "@/types/promotedOffers";

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminPromotedOffers(): Promise<PromotedOffer[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("promoted_offers").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load promoted offers: ${error.message}`);
  }

  return ((data ?? []) as PromotedOfferRow[]).map(mapPromotedOfferRowToOffer);
}

export async function createPromotedOffer(input: { offer: PromotedOfferInput; adminUserId: string }): Promise<PromotedOffer> {
  assertSafeActivation(input.offer);
  const client = ensureSupabase();
  const { data, error } = await client
    .from("promoted_offers")
    .insert({ ...toRowInput(input.offer), created_by: input.adminUserId, updated_by: input.adminUserId })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not create promoted offer: ${error.message}`);
  }

  return mapPromotedOfferRowToOffer(data as PromotedOfferRow);
}

export async function updatePromotedOffer(input: { offerId: string; offer: Partial<PromotedOfferInput>; adminUserId: string }): Promise<PromotedOffer> {
  assertSafeActivation(input.offer);
  const client = ensureSupabase();
  const { data, error } = await client
    .from("promoted_offers")
    .update({ ...toPartialRowInput(input.offer), updated_by: input.adminUserId })
    .eq("id", input.offerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update promoted offer: ${error.message}`);
  }

  return mapPromotedOfferRowToOffer(data as PromotedOfferRow);
}

export async function updatePromotedOfferStatus(input: { offerId: string; status: PromotedOfferStatus; adminUserId: string }): Promise<PromotedOffer> {
  if (input.status === "active") {
    const current = await getAdminPromotedOffer(input.offerId);
    assertSafeActivation({ title: current.title, description: current.description, terms: current.terms, status: input.status });
  }

  return updatePromotedOffer({ offerId: input.offerId, offer: { status: input.status }, adminUserId: input.adminUserId });
}

export async function deletePromotedOffer(offerId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("promoted_offers").delete().eq("id", offerId);

  if (error) {
    throw new Error(`Could not delete promoted offer: ${error.message}`);
  }
}

function assertSafeActivation(offer: Partial<PromotedOfferInput>) {
  if (offer.status !== "active") return;
  const safety = checkPromotedOfferSafety({ title: offer.title ?? "", description: offer.description, terms: offer.terms });
  if (safety.blockingReasons.length) {
    throw new Error(`Could not activate promoted offer: ${safety.blockingReasons[0]}`);
  }
}

async function getAdminPromotedOffer(offerId: string): Promise<PromotedOffer> {
  const client = ensureSupabase();
  const { data, error } = await client.from("promoted_offers").select("*").eq("id", offerId).single();

  if (error) {
    throw new Error(`Could not load promoted offer: ${error.message}`);
  }

  return mapPromotedOfferRowToOffer(data as PromotedOfferRow);
}

function toRowInput(offer: PromotedOfferInput) {
  return {
    venue_id: offer.venueId,
    title: offer.title.trim(),
    description: nullableText(offer.description),
    terms: nullableText(offer.terms),
    offer_type: offer.offerType,
    city: nullableText(offer.city),
    area: nullableText(offer.area),
    starts_at: offer.startsAt,
    ends_at: offer.endsAt,
    status: offer.status,
    priority: offer.priority ?? 0,
    cta_label: nullableText(offer.ctaLabel),
    cta_url: nullableText(offer.ctaUrl),
  };
}

function toPartialRowInput(offer: Partial<PromotedOfferInput>) {
  return Object.fromEntries(
    Object.entries({
      venue_id: offer.venueId,
      title: offer.title?.trim(),
      description: nullableText(offer.description),
      terms: nullableText(offer.terms),
      offer_type: offer.offerType,
      city: nullableText(offer.city),
      area: nullableText(offer.area),
      starts_at: offer.startsAt,
      ends_at: offer.endsAt,
      status: offer.status,
      priority: offer.priority,
      cta_label: nullableText(offer.ctaLabel),
      cta_url: nullableText(offer.ctaUrl),
    }).filter(([, value]) => value !== undefined),
  );
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
