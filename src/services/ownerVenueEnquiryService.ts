import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { canAccessOwnerEnquiryInbox } from "@/lib/ownerEnquiryAccess";
import { mapVenueEnquiryRowToEnquiry } from "@/lib/venueEnquiryMappers";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenue, getMyClaimedVenues } from "@/services/ownerVenueService";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueEnquiryRow } from "@/types/database";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerVenueEnquiries(input: { userId: string; venueId?: string | null }): Promise<VenueEnquiry[]> {
  const client = ensureSupabase();
  const venueIds = await getAccessibleVenueIds(input);
  if (!venueIds.length) return [];

  const { data, error } = await client.from("venue_enquiries").select("*").in("venue_id", venueIds).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load owner enquiries: ${error.message}`);
  return ((data ?? []) as VenueEnquiryRow[]).map(mapVenueEnquiryRowToEnquiry);
}

export async function getOwnerVenueEnquiry(input: { userId: string; venueId: string; enquiryId: string }): Promise<VenueEnquiry | null> {
  const client = ensureSupabase();
  const venueIds = await getAccessibleVenueIds({ userId: input.userId, venueId: input.venueId });
  if (!venueIds.length) return null;

  const { data, error } = await client.from("venue_enquiries").select("*").eq("id", input.enquiryId).in("venue_id", venueIds).maybeSingle();
  if (error) throw new Error(`Could not load owner enquiry: ${error.message}`);
  return data ? mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow) : null;
}

export async function updateOwnerVenueEnquiryStatus(input: {
  userId: string;
  enquiryId: string;
  status: VenueEnquiryStatus;
  ownerNotes?: string | null;
  venueResponse?: string | null;
}): Promise<VenueEnquiry> {
  const existing = await getOwnerAccessibleEnquiry({ userId: input.userId, enquiryId: input.enquiryId });
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: input.status,
    owner_last_updated_by: input.userId,
    owner_last_updated_at: now,
  };

  if (input.ownerNotes !== undefined) updates.owner_notes = nullableText(input.ownerNotes);
  if (input.venueResponse !== undefined) updates.venue_response = nullableText(input.venueResponse);
  if (input.status === "contacted" && !existing.contactedVenueAt) updates.contacted_venue_at = now;
  if (["converted", "closed", "spam"].includes(input.status)) updates.resolved_at = now;

  const updated = await updateOwnerEnquiry(input.enquiryId, updates);
  trackEvent(input.status === "converted" ? "owner_enquiry_marked_converted" : "owner_enquiry_status_updated", {
    venueId: updated.venueId,
    enquiryId: updated.id,
    enquiryType: updated.enquiryType,
    previousStatus: existing.status,
    targetStatus: updated.status,
    status: updated.status,
  });

  if (input.status === "converted") {
    trackVenueAnalyticsEvent({
      venueId: updated.venueId,
      eventName: "venue_enquiry_converted",
      sourceSurface: "account",
      enquiryId: updated.id,
      metadata: { enquiryType: updated.enquiryType },
    });
  }

  return updated;
}

export async function updateOwnerVenueEnquiryNotes(input: { userId: string; enquiryId: string; ownerNotes?: string | null; venueResponse?: string | null }): Promise<VenueEnquiry> {
  await getOwnerAccessibleEnquiry({ userId: input.userId, enquiryId: input.enquiryId });
  return updateOwnerEnquiry(input.enquiryId, {
    owner_notes: nullableText(input.ownerNotes),
    venue_response: nullableText(input.venueResponse),
    owner_last_updated_by: input.userId,
    owner_last_updated_at: new Date().toISOString(),
  });
}

async function getAccessibleVenueIds(input: { userId: string; venueId?: string | null }) {
  const venues = input.venueId ? [await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId })].filter((venue): venue is Venue => Boolean(venue)) : await getMyClaimedVenues(input.userId);
  const checks = await Promise.all(venues.map(async (venue) => {
    const subscription = await getOwnerVenueSubscription({ userId: input.userId, venueId: venue.id });
    return canAccessOwnerEnquiryInbox(subscription) ? venue.id : null;
  }));
  return checks.filter((venueId): venueId is string => Boolean(venueId));
}

async function getOwnerAccessibleEnquiry(input: { userId: string; enquiryId: string }) {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_enquiries").select("*").eq("id", input.enquiryId).single();
  if (error) throw new Error(`Could not load enquiry: ${error.message}`);
  const enquiry = mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
  const venueIds = await getAccessibleVenueIds({ userId: input.userId, venueId: enquiry.venueId });
  if (!venueIds.includes(enquiry.venueId)) throw new Error("Owner enquiry inbox is available on the Growth plan.");
  return enquiry;
}

async function updateOwnerEnquiry(enquiryId: string, updates: Record<string, unknown>) {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_enquiries").update(updates).eq("id", enquiryId).select("*").single();
  if (error) throw new Error(`Could not update owner enquiry: ${error.message}`);
  return mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
