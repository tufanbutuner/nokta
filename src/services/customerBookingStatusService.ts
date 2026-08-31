import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { mapCustomerBookingStatusRow } from "@/lib/customerBookingStatusMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { CustomerBookingStatus, CustomerBookingStatusRow } from "@/types/customerBookingStatus";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getCustomerBookingStatus(token: string): Promise<CustomerBookingStatus | null> {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_booking_request_status_by_token", { access_token: token });
  if (error) throw new Error(`Could not load booking status: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    trackEvent("customer_booking_status_invalid_token");
    return null;
  }
  const status = mapCustomerBookingStatusRow(row as CustomerBookingStatusRow);
  trackEvent("customer_booking_status_viewed", { venueId: status.venueId, status: status.status });
  trackVenueAnalyticsEvent({ venueId: status.venueId, eventName: "venue_booking_status_viewed", sourceSurface: "venue_page", metadata: { status: status.status } });
  return status;
}

export async function acceptCustomerBookingAlternative(input: { token: string; responseMessage?: string | null }): Promise<CustomerBookingStatus> {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("accept_booking_alternative_by_token", { access_token: input.token, response_message: nullableText(input.responseMessage) });
  if (error) throw new Error(`Could not accept alternative: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Could not accept alternative.");
  const status = mapCustomerBookingStatusRow(row as CustomerBookingStatusRow);
  trackEvent("customer_booking_alternative_accepted", { venueId: status.venueId, status: status.status });
  trackVenueAnalyticsEvent({ venueId: status.venueId, eventName: "venue_booking_alternative_accepted", sourceSurface: "venue_page", metadata: { status: status.status } });
  return status;
}

export async function declineCustomerBookingAlternative(input: { token: string; responseMessage?: string | null }): Promise<CustomerBookingStatus> {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("decline_booking_alternative_by_token", { access_token: input.token, response_message: nullableText(input.responseMessage) });
  if (error) throw new Error(`Could not decline alternative: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Could not decline alternative.");
  const status = mapCustomerBookingStatusRow(row as CustomerBookingStatusRow);
  trackEvent("customer_booking_alternative_declined", { venueId: status.venueId, status: status.status });
  trackVenueAnalyticsEvent({ venueId: status.venueId, eventName: "venue_booking_alternative_declined", sourceSurface: "venue_page", metadata: { status: status.status } });
  return status;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
