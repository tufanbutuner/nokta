import type { VenueBookingBlackoutDate, VenueBookingSettings, VenueBookingWindow } from "@/types/bookingAvailability";
import type { VenueBookingBlackoutDateRow, VenueBookingSettingsRow, VenueBookingWindowRow } from "@/types/database";

export function mapVenueBookingSettingsRow(row: VenueBookingSettingsRow): VenueBookingSettings {
  return { id: row.id, venueId: row.venue_id, bookingRequestsEnabled: row.booking_requests_enabled, minPartySize: row.min_party_size, maxPartySize: row.max_party_size, minNoticeMinutes: row.min_notice_minutes, maxAdvanceDays: row.max_advance_days, defaultBookingDurationMinutes: row.default_booking_duration_minutes, bookingInstructions: row.booking_instructions, internalNotes: row.internal_notes, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function mapVenueBookingWindowRow(row: VenueBookingWindowRow): VenueBookingWindow {
  return { id: row.id, venueId: row.venue_id, dayOfWeek: row.day_of_week, startTime: row.start_time, endTime: row.end_time, isEnabled: row.is_enabled, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function mapVenueBookingBlackoutDateRow(row: VenueBookingBlackoutDateRow): VenueBookingBlackoutDate {
  return { id: row.id, venueId: row.venue_id, blackoutDate: row.blackout_date, reason: row.reason, isFullDay: row.is_full_day, startTime: row.start_time, endTime: row.end_time, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at };
}
