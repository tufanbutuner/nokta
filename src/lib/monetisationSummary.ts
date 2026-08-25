import type { Venue } from "@/types/venue";
import type { PartnerTier } from "@/types/monetisation";

const MONTHLY_TIER_VALUE: Record<PartnerTier, number> = {
  none: 0,
  starter: 99,
  growth: 199,
  pro: 349,
};

export interface MonetisationSummary {
  totalVenues: number;
  claimedCount: number;
  unclaimedCount: number;
  featuredEligibleCount: number;
  notContactedCount: number;
  contactedCount: number;
  interestedCount: number;
  trialCount: number;
  payingCount: number;
  churnedCount: number;
  notFitCount: number;
  starterCount: number;
  growthCount: number;
  proCount: number;
  pipelineCount: number;
  payingMrr: number;
  claimedPercentage: number;
  featuredEligiblePercentage: number;
}

export function getMonetisationSummary(venues: Venue[]): MonetisationSummary {
  const summary = venues.reduce<MonetisationSummary>(
    (summary, venue) => {
      summary.totalVenues += 1;
      summary.claimedCount += venue.isClaimed ? 1 : 0;
      summary.unclaimedCount += venue.isClaimed ? 0 : 1;
      summary.featuredEligibleCount += venue.featuredEligible ? 1 : 0;
      summary.notContactedCount += venue.monetisationStatus === "not-contacted" ? 1 : 0;
      summary.contactedCount += venue.monetisationStatus === "contacted" ? 1 : 0;
      summary.interestedCount += venue.monetisationStatus === "interested" ? 1 : 0;
      summary.trialCount += venue.monetisationStatus === "trial" ? 1 : 0;
      summary.payingCount += venue.monetisationStatus === "paying" ? 1 : 0;
      summary.churnedCount += venue.monetisationStatus === "churned" ? 1 : 0;
      summary.notFitCount += venue.monetisationStatus === "not-fit" ? 1 : 0;
      summary.starterCount += venue.partnerTier === "starter" ? 1 : 0;
      summary.growthCount += venue.partnerTier === "growth" ? 1 : 0;
      summary.proCount += venue.partnerTier === "pro" ? 1 : 0;
      summary.pipelineCount += ["contacted", "interested", "trial"].includes(venue.monetisationStatus) ? 1 : 0;
      summary.payingMrr += venue.monetisationStatus === "paying" ? MONTHLY_TIER_VALUE[venue.partnerTier] : 0;
      return summary;
    },
    {
      totalVenues: 0,
      claimedCount: 0,
      unclaimedCount: 0,
      featuredEligibleCount: 0,
      notContactedCount: 0,
      contactedCount: 0,
      interestedCount: 0,
      trialCount: 0,
      payingCount: 0,
      churnedCount: 0,
      notFitCount: 0,
      starterCount: 0,
      growthCount: 0,
      proCount: 0,
      pipelineCount: 0,
      payingMrr: 0,
      claimedPercentage: 0,
      featuredEligiblePercentage: 0,
    },
  );

  summary.claimedPercentage = getPercentage(summary.claimedCount, summary.totalVenues);
  summary.featuredEligiblePercentage = getPercentage(summary.featuredEligibleCount, summary.totalVenues);

  return summary;
}

function getPercentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
