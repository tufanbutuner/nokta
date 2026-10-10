export interface VenueBookingSettings {
  id: string;
  venueId: string;
  bookingRequestsEnabled: boolean;
  minPartySize: number;
  maxPartySize: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  defaultBookingDurationMinutes: number;
  /** How many separate parties may hold the same date+time slot. */
  slotCapacity: number;
  bookingInstructions: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueBookingWindow {
  id: string;
  venueId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueBookingBlackoutDate {
  id: string;
  venueId: string;
  blackoutDate: string;
  reason: string | null;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueBookingAvailability {
  settings: VenueBookingSettings;
  windows: VenueBookingWindow[];
  blackoutDates: VenueBookingBlackoutDate[];
  bookedSlots: VenueBookingBookedSlot[];
}

/**
 * An occupied slot: the date+time of an accepted booking (its effective slot —
 * an agreed alternative counts at the proposed time, see getEffectiveBookingSlot).
 */
export interface VenueBookingBookedSlot {
  date: string;
  time: string;
}

export interface BookingAvailabilityCheckInput {
  availability: VenueBookingAvailability;
  requestedDate: string;
  requestedTime: string;
  partySize: number;
  now?: Date;
}

export interface BookingAvailabilityCheckResult {
  isAvailable: boolean;
  errors: string[];
  warnings: string[];
}

export type VenueBookingState = "live" | "unclaimed" | "disabled";

export interface VenueBookingGate {
  venueId: string;
  isClaimed: boolean;
  bookingRequestsEnabled: boolean;
  responsive: boolean;
  state: VenueBookingState;
}
