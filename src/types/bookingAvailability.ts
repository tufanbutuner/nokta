export interface VenueBookingSettings {
  id: string;
  venueId: string;
  bookingRequestsEnabled: boolean;
  minPartySize: number;
  maxPartySize: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  defaultBookingDurationMinutes: number;
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
