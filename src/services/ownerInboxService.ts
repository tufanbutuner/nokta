import { supabase, supabaseConfigError } from "@/lib/supabase";
import { getOwnerVenueEnquiries } from "@/services/ownerVenueEnquiryService";
import type { OwnerInboxEnquirySummary } from "@/types/ownerInbox";
import type { VenueEnquiry } from "@/types/venueEnquiries";

interface OwnerInboxEnquiryRow {
  id: string;
  venue_id: string;
  enquiry_type: OwnerInboxEnquirySummary["enquiryType"];
  party_size: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  message: string | null;
  status: OwnerInboxEnquirySummary["status"];
  venue_response: string | null;
  created_at: string;
  updated_at: string;
  has_full_access: boolean;
}

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerInboxEnquiries(userId: string): Promise<OwnerInboxEnquirySummary[]> {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_owner_inbox_enquiries");

  if (!error) return ((data ?? []) as OwnerInboxEnquiryRow[]).map(mapSummaryRow);

  // During a rolling deploy, keep entitled owners functional until the summary
  // RPC migration reaches the database. Locked summaries appear after migration.
  const enquiries = await getOwnerVenueEnquiries({ userId });
  return enquiries.map(mapFullEnquiry);
}

function mapSummaryRow(row: OwnerInboxEnquiryRow): OwnerInboxEnquirySummary {
  return {
    id: row.id,
    venueId: row.venue_id,
    enquiryType: row.enquiry_type,
    partySize: row.party_size,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    message: row.message,
    status: row.status,
    venueResponse: row.venue_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hasFullAccess: row.has_full_access,
  };
}

function mapFullEnquiry(enquiry: VenueEnquiry): OwnerInboxEnquirySummary {
  return {
    id: enquiry.id,
    venueId: enquiry.venueId,
    enquiryType: enquiry.enquiryType,
    partySize: enquiry.partySize,
    preferredDate: enquiry.preferredDate,
    preferredTime: enquiry.preferredTime,
    customerName: enquiry.customerName,
    customerEmail: enquiry.customerEmail,
    customerPhone: enquiry.customerPhone,
    message: enquiry.message,
    status: enquiry.status,
    venueResponse: enquiry.venueResponse,
    createdAt: enquiry.createdAt,
    updatedAt: enquiry.updatedAt,
    hasFullAccess: true,
  };
}
