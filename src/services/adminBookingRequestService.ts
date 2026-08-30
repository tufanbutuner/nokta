import { trackEvent } from "@/lib/analytics";
import { mapBookingRequestRowToBookingRequest } from "@/lib/bookingRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingRequestRow } from "@/types/database";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getAdminBookingRequests(input?: { status?: string; venueId?: string; dateFrom?: string; dateTo?: string }): Promise<BookingRequest[]> {
  const client = ensureSupabase();
  let query = client.from("booking_requests").select("*").order("created_at", { ascending: false });
  if (input?.status && input.status !== "all") query = query.eq("status", input.status);
  if (input?.venueId && input.venueId !== "all") query = query.eq("venue_id", input.venueId);
  if (input?.dateFrom) query = query.gte("requested_date", input.dateFrom);
  if (input?.dateTo) query = query.lte("requested_date", input.dateTo);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load booking requests: ${error.message}`);
  return ((data ?? []) as BookingRequestRow[]).map(mapBookingRequestRowToBookingRequest);
}

export async function markBookingRequestSpam(input: { bookingRequestId: string; adminUserId: string; adminNotes?: string | null }): Promise<BookingRequest> {
  const request = await updateBookingRequestAdminFields(input.bookingRequestId, { status: "spam", admin_notes: nullableText(input.adminNotes) });
  trackEvent("admin_booking_marked_spam", { venueId: request.venueId, status: request.status });
  return request;
}

export function updateBookingRequestAdminNotes(input: { bookingRequestId: string; adminUserId: string; adminNotes: string }): Promise<BookingRequest> {
  return updateBookingRequestAdminFields(input.bookingRequestId, { admin_notes: nullableText(input.adminNotes) });
}

async function updateBookingRequestAdminFields(bookingRequestId: string, updates: Record<string, unknown>) {
  const client = ensureSupabase();
  const { data, error } = await client.from("booking_requests").update(updates).eq("id", bookingRequestId).select("*").single();
  if (error) throw new Error(`Could not update booking request: ${error.message}`);
  return mapBookingRequestRowToBookingRequest(data as BookingRequestRow);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
