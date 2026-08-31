import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getPartySizeBucket, getRequestedDateBucket } from "@/lib/bookingRequestAnalytics";
import { mapBookingRequestRowToBookingRequest } from "@/lib/bookingRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { queueEmailDeliveryForNotification } from "@/services/emailDeliveryService";
import type { BookingRequest, BookingRequestStatus, OwnerBookingRequestActionInput, OwnerProposeAlternativeInput } from "@/types/bookingRequests";
import type { BookingRequestRow } from "@/types/database";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerBookingRequests(input: { ownerUserId: string; venueId?: string; status?: string }): Promise<BookingRequest[]> {
  const client = ensureSupabase();
  let query = client.from("booking_requests").select("*").order("requested_date", { ascending: true }).order("created_at", { ascending: false });
  if (input.venueId) query = query.eq("venue_id", input.venueId);
  if (input.status && input.status !== "all") query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load booking requests: ${error.message}`);
  return ((data ?? []) as BookingRequestRow[]).map(mapBookingRequestRowToBookingRequest);
}

export function acceptBookingRequest(input: OwnerBookingRequestActionInput): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, {
    status: "accepted",
    owner_response_message: nullableText(input.responseMessage),
    accepted_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
  }, "owner_booking_accepted", "venue_booking_confirmed");
}

export function declineBookingRequest(input: OwnerBookingRequestActionInput): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, {
    status: "declined",
    owner_response_message: nullableText(input.responseMessage),
    declined_at: new Date().toISOString(),
    confirmed_at: null,
  }, "owner_booking_declined", "venue_booking_request_declined");
}

export function proposeBookingAlternative(input: OwnerProposeAlternativeInput): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, {
    status: "alternative_proposed",
    proposed_date: input.proposedDate,
    proposed_time: input.proposedTime,
    proposed_message: nullableText(input.proposedMessage),
    proposed_at: new Date().toISOString(),
    confirmed_at: null,
  }, "owner_booking_alternative_proposed", "venue_booking_alternative_proposed");
}

export function markBookingCompleted(input: { bookingRequestId: string; ownerUserId: string }): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, { status: "completed" }, "owner_booking_completed");
}

export function markBookingNoShow(input: { bookingRequestId: string; ownerUserId: string }): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, { status: "no_show" }, "owner_booking_no_show");
}

export function cancelBookingRequest(input: OwnerBookingRequestActionInput): Promise<BookingRequest> {
  return updateOwnerBookingRequest(input.bookingRequestId, input.ownerUserId, {
    status: "cancelled",
    owner_response_message: nullableText(input.responseMessage),
    cancelled_at: new Date().toISOString(),
  });
}

async function updateOwnerBookingRequest(
  bookingRequestId: string,
  ownerUserId: string,
  updates: Partial<Record<"status" | "owner_response_message" | "proposed_date" | "proposed_time" | "proposed_message" | "accepted_at" | "declined_at" | "proposed_at" | "cancelled_at" | "confirmed_at", unknown>>,
  eventName?: Parameters<typeof trackEvent>[0],
  venueEventName?: Parameters<typeof trackVenueAnalyticsEvent>[0]["eventName"],
) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("booking_requests")
    .update({ ...updates, owner_last_updated_by: ownerUserId, owner_last_updated_at: new Date().toISOString() })
    .eq("id", bookingRequestId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not update booking request: ${error.message}`);
  const request = mapBookingRequestRowToBookingRequest(data as BookingRequestRow);
  if (eventName) {
    trackEvent(eventName, { venueId: request.venueId, status: request.status, partySizeBucket: getPartySizeBucket(request.partySize), requestedDateBucket: getRequestedDateBucket(request.requestedDate) });
  }
  if (venueEventName) {
    trackVenueAnalyticsEvent({
      venueId: request.venueId,
      eventName: venueEventName,
      sourceSurface: "owner_preview",
      metadata: {
        partySizeBucket: getPartySizeBucket(request.partySize),
        requestedDateBucket: getRequestedDateBucket(request.requestedDate),
        status: request.status as Extract<BookingRequestStatus, "pending" | "accepted" | "declined" | "alternative_proposed">,
      },
    });
  }
  queueEmailDeliveryForNotification({ bookingRequestId: request.id }).catch((error) => {
    if (import.meta.env.DEV) console.info("[email delivery]", error instanceof Error ? error.message : "Could not send booking email.");
  });
  return request;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
