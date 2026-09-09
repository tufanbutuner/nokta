import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

/**
 * Where a gap is fixed. "profile" gaps are fields on this page, so the rail
 * focuses them instead of linking to the tab the owner is already on.
 */
export type ProfileGapTarget = "photos" | "bookings" | "profile" | "plan";

export interface ProfileGap {
  id: string;
  label: string;
  target: ProfileGapTarget;
  /** Field to focus when target is "profile". */
  field?: "description" | "phone";
}

interface ScoreComponent {
  weight: number;
  met: boolean;
  gap?: ProfileGap;
}

function getScoreComponents(venue: Venue, subscription: VenueSubscription | null): ScoreComponent[] {
  const hasContact = Boolean(venue.phone?.trim() || venue.website?.trim() || venue.instagram?.trim());

  return [
    { weight: 15, met: Boolean(venue.description?.trim()), gap: { id: "description", label: "Add a description", target: "profile", field: "description" } },
    { weight: 15, met: venue.openingHours.length > 0, gap: { id: "hours", label: "Set your opening hours", target: "bookings" } },
    { weight: 20, met: venue.images.length > 0, gap: { id: "photos", label: "Add photos", target: "photos" } },
    { weight: 10, met: Boolean(venue.address?.trim()) },
    { weight: 10, met: hasContact, gap: { id: "contact", label: "Add a contact detail", target: "profile", field: "phone" } },
    { weight: 10, met: Boolean(subscription?.plan && subscription.plan !== "free"), gap: { id: "plan", label: "Upgrade your plan", target: "plan" } },
    { weight: 10, met: venue.openingHours.length > 0 },
    { weight: 10, met: venue.vibes.length > 0 || venue.secondaryCategories.length > 0 },
  ];
}

export function getProfileCompletenessScore(venue: Venue, subscription: VenueSubscription | null) {
  const score = getScoreComponents(venue, subscription).reduce((total, item) => (item.met ? total + item.weight : total), 0);
  return Math.min(score, 100);
}

/**
 * Unmet components that have somewhere to send the owner. Components without a
 * gap (address, category) are scored but never listed — the owner cannot fix
 * them from the dashboard.
 */
export function getProfileGaps(venue: Venue, subscription: VenueSubscription | null): ProfileGap[] {
  return getScoreComponents(venue, subscription)
    .filter((item) => !item.met && item.gap)
    .map((item) => item.gap as ProfileGap);
}
