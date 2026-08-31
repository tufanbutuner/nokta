import { mapBookingRequestRowToBookingRequest } from "@/lib/bookingRequestMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { BookingRequest } from "@/types/bookingRequests";
import type { BookingRequestRow } from "@/types/database";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getMyCustomerBookings(input: { userId: string }): Promise<BookingRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("booking_requests")
    .select("*")
    .eq("submitted_by", input.userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load your bookings: ${error.message}`);
  return ((data ?? []) as BookingRequestRow[]).map(mapBookingRequestRowToBookingRequest);
}
