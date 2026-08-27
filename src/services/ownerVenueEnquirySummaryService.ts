import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { supabase } from "@/lib/supabase";

export interface OwnerVenueEnquirySummary {
  venueId: string;
  totalEnquiries: number;
  newEnquiries: number;
  contactedEnquiries: number;
  respondedEnquiries: number;
  convertedEnquiries: number;
  closedEnquiries: number;
  spamEnquiries: number;
}

interface OwnerVenueEnquirySummaryRow {
  total_enquiries: number;
  new_enquiries: number;
  contacted_enquiries: number;
  responded_enquiries: number;
  converted_enquiries: number;
  closed_enquiries: number;
  spam_enquiries: number;
}

export async function getOwnerVenueEnquirySummary(input: { userId: string; venueId: string }): Promise<OwnerVenueEnquirySummary> {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You do not have access to this venue dashboard.");
  if (!supabase) return emptySummary(input.venueId);

  const { data, error } = await supabase.rpc("get_owner_venue_enquiry_summary", { target_venue_id: input.venueId });
  if (error) throw new Error(`Could not load enquiry summary: ${error.message}`);

  const row = (Array.isArray(data) ? data[0] : data) as OwnerVenueEnquirySummaryRow | undefined;
  if (!row) return emptySummary(input.venueId);

  return {
    venueId: input.venueId,
    totalEnquiries: Number(row.total_enquiries ?? 0),
    newEnquiries: Number(row.new_enquiries ?? 0),
    contactedEnquiries: Number(row.contacted_enquiries ?? 0),
    respondedEnquiries: Number(row.responded_enquiries ?? 0),
    convertedEnquiries: Number(row.converted_enquiries ?? 0),
    closedEnquiries: Number(row.closed_enquiries ?? 0),
    spamEnquiries: Number(row.spam_enquiries ?? 0),
  };
}

function emptySummary(venueId: string): OwnerVenueEnquirySummary {
  return { venueId, totalEnquiries: 0, newEnquiries: 0, contactedEnquiries: 0, respondedEnquiries: 0, convertedEnquiries: 0, closedEnquiries: 0, spamEnquiries: 0 };
}
