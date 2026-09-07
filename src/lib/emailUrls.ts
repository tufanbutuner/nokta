export function buildAbsoluteAppUrl(path: string): string {
  const appUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appUrl.replace(/\/$/, "")}${normalisedPath}`;
}

export function buildBookingStatusUrl(token: string): string {
  return buildAbsoluteAppUrl(`/booking-status/${token}`);
}

export function buildOwnerBookingsUrl(): string {
  return buildAbsoluteAppUrl("/owner/bookings");
}

export function buildOwnerEnquiriesUrl(): string {
  return buildAbsoluteAppUrl("/owner/inbox");
}

export function buildOwnerVenueMediaUrl(venueId: string): string {
  return buildAbsoluteAppUrl(`/owner/venues/${venueId}/photos`);
}

export function buildOwnerPromotionsUrl(venueId?: string): string {
  return buildAbsoluteAppUrl(venueId ? `/owner/venues/${venueId}/promotions` : "/owner/promotions");
}

export function buildOwnerVenueUpdatesUrl(venueId?: string): string {
  return buildAbsoluteAppUrl(venueId ? `/owner/venues/${venueId}/profile` : "/owner/venues");
}
