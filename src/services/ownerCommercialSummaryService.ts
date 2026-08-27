import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getActiveVenueOffers } from "@/services/promotedOfferService";
import { supabase } from "@/lib/supabase";
import type { FeaturedPlacementRow } from "@/types/database";

export interface OwnerVenueCommercialSummary {
  venueId: string;
  isClaimed: boolean;
  partnerTier: string;
  monetisationStatus: string;
  activeFeaturedPlacements: number;
  activePromotedOffers: number;
  hasActiveFeaturedPlacement: boolean;
  hasActivePromotedOffer: boolean;
}

export async function getOwnerVenueCommercialSummary(input: { userId: string; venueId: string }): Promise<OwnerVenueCommercialSummary> {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You do not have access to this venue dashboard.");

  const [offers, featured] = await Promise.all([getActiveVenueOffers(input.venueId).catch(() => []), getActiveFeaturedPlacementCount(input.venueId)]);

  return {
    venueId: input.venueId,
    isClaimed: venue.isClaimed,
    partnerTier: venue.partnerTier,
    monetisationStatus: venue.monetisationStatus,
    activeFeaturedPlacements: featured,
    activePromotedOffers: offers.length,
    hasActiveFeaturedPlacement: featured > 0,
    hasActivePromotedOffer: offers.length > 0,
  };
}

async function getActiveFeaturedPlacementCount(venueId: string) {
  if (!supabase) return 0;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("featured_placements")
    .select("*")
    .eq("venue_id", venueId)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now);

  if (error) return 0;
  return ((data ?? []) as FeaturedPlacementRow[]).length;
}
