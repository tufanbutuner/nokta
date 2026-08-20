export type VenueId = string;

export interface UserVenuePreferences {
  favouriteVenueIds: VenueId[];
  recentlyViewedVenueIds: VenueId[];
}
