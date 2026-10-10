import type { BookingRequest, BookingRequestStatus } from "@/types/bookingRequests";

/**
 * Statuses that actually occupy a slot. Pending requests are only a queue —
 * they never hold capacity — and a proposed alternative holds nothing until
 * the customer agrees to it.
 */
export const OCCUPYING_BOOKING_STATUSES: BookingRequestStatus[] = ["accepted", "customer_accepted_alternative"];

export interface BookingSlot {
  date: string;
  time: string;
}

/**
 * The date+time a request occupies. When the venue offered an alternative and
 * the customer took it, the booking lives at the proposed slot — the original
 * requested slot is free again. Every availability, capacity and calendar
 * calculation must read the slot through here or the two drift apart.
 *
 * The same rule exists in SQL as `public.effective_booking_slot` (sprint 51),
 * which enforces capacity at write time.
 */
export function getEffectiveBookingSlot(request: Pick<BookingRequest, "status" | "requestedDate" | "requestedTime" | "proposedDate" | "proposedTime">): BookingSlot {
  const occupiesAlternative = (OCCUPYING_BOOKING_STATUSES as readonly string[]).includes(request.status);
  if (occupiesAlternative && request.proposedDate && request.proposedTime) {
    return { date: request.proposedDate, time: normaliseSlotTime(request.proposedTime) };
  }
  return { date: request.requestedDate, time: normaliseSlotTime(request.requestedTime) };
}

/** Slots are keyed to the minute shown in the picker, so "18:00:00" == "18:00". */
export function normaliseSlotTime(time: string): string {
  return time.slice(0, 5);
}

/** How many accepted bookings already hold this exact slot. */
export function countBookingsAtSlot(bookedSlots: readonly BookingSlot[], date: string, time: string): number {
  const wanted = normaliseSlotTime(time);
  return bookedSlots.reduce((total, slot) => (slot.date === date && normaliseSlotTime(slot.time) === wanted ? total + 1 : total), 0);
}
