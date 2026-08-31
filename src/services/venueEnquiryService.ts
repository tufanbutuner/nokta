import { mapVenueEnquiryRowToEnquiry } from "@/lib/venueEnquiryMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { queueEmailDeliveryForNotification } from "@/services/emailDeliveryService";
import type { VenueEnquiryRow } from "@/types/database";
import type { VenueEnquiry, VenueEnquiryInput } from "@/types/venueEnquiries";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function createVenueEnquiry(input: { userId: string; enquiry: VenueEnquiryInput }): Promise<VenueEnquiry> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_enquiries")
    .insert({
      venue_id: input.enquiry.venueId,
      submitted_by: input.userId,
      enquiry_type: input.enquiry.enquiryType,
      party_size: input.enquiry.partySize ?? null,
      preferred_date: nullableText(input.enquiry.preferredDate),
      preferred_time: nullableText(input.enquiry.preferredTime),
      customer_name: input.enquiry.customerName.trim(),
      customer_email: input.enquiry.customerEmail.trim(),
      customer_phone: nullableText(input.enquiry.customerPhone),
      message: nullableText(input.enquiry.message),
      status: "new",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not send enquiry: ${error.message}`);
  const enquiry = mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
  queueEmailDeliveryForNotification({ enquiryId: enquiry.id }).catch((caughtError) => {
    if (import.meta.env.DEV) console.info("[email delivery]", caughtError instanceof Error ? caughtError.message : "Could not send enquiry email.");
  });
  return enquiry;
}

export async function getMyVenueEnquiries(userId: string): Promise<VenueEnquiry[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_enquiries").select("*").eq("submitted_by", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load enquiries: ${error.message}`);
  return ((data ?? []) as VenueEnquiryRow[]).map(mapVenueEnquiryRowToEnquiry);
}

export async function getMyVenueEnquiriesForVenue(input: { userId: string; venueId: string }): Promise<VenueEnquiry[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_enquiries")
    .select("*")
    .eq("submitted_by", input.userId)
    .eq("venue_id", input.venueId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load venue enquiries: ${error.message}`);
  return ((data ?? []) as VenueEnquiryRow[]).map(mapVenueEnquiryRowToEnquiry);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
