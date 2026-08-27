import { trackEvent } from "@/lib/analytics";
import { mapVenueEnquiryRowToEnquiry } from "@/lib/venueEnquiryMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { VenueEnquiryRow } from "@/types/database";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminVenueEnquiries(): Promise<VenueEnquiry[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from("venue_enquiries").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load venue enquiries: ${error.message}`);
  return ((data ?? []) as VenueEnquiryRow[]).map(mapVenueEnquiryRowToEnquiry);
}

export async function updateVenueEnquiryStatus(input: {
  enquiryId: string;
  status: VenueEnquiryStatus;
  adminNotes?: string | null;
  venueResponse?: string | null;
}): Promise<VenueEnquiry> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_enquiries")
    .update({
      status: input.status,
      admin_notes: nullableText(input.adminNotes),
      venue_response: nullableText(input.venueResponse),
    })
    .eq("id", input.enquiryId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not update enquiry: ${error.message}`);
  const enquiry = mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
  trackEvent("venue_enquiry_status_updated", { enquiryType: enquiry.enquiryType, venueId: enquiry.venueId });
  return enquiry;
}

export async function markVenueEnquiryContacted(input: { enquiryId: string; adminNotes?: string | null }): Promise<VenueEnquiry> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_enquiries")
    .update({ status: "contacted", contacted_venue_at: new Date().toISOString(), admin_notes: nullableText(input.adminNotes) })
    .eq("id", input.enquiryId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not mark enquiry contacted: ${error.message}`);
  return mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
}

export async function markVenueEnquiryResolved(input: {
  enquiryId: string;
  status: "converted" | "closed" | "spam";
  adminNotes?: string | null;
}): Promise<VenueEnquiry> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_enquiries")
    .update({ status: input.status, resolved_at: new Date().toISOString(), admin_notes: nullableText(input.adminNotes) })
    .eq("id", input.enquiryId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not resolve enquiry: ${error.message}`);
  return mapVenueEnquiryRowToEnquiry(data as VenueEnquiryRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
