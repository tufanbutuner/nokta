import { Link } from "react-router-dom";
import { ClaimedVenueBadge } from "@/components/admin/monetisation/ClaimedVenueBadge";
import { MonetisationStatusBadge } from "@/components/admin/monetisation/MonetisationStatusBadge";
import { PartnerTierBadge } from "@/components/admin/monetisation/PartnerTierBadge";
import { getFeaturedEligibilityRecommendation } from "@/lib/commercialEligibility";
import type { MonetisationStatus } from "@/types/monetisation";
import type { Venue } from "@/types/venue";

type QuickAction = {
  label: string;
  status: MonetisationStatus;
};

const QUICK_ACTIONS: Partial<Record<MonetisationStatus, QuickAction[]>> = {
  "not-contacted": [{ label: "Mark Contacted", status: "contacted" }],
  interested: [{ label: "Start Trial", status: "trial" }],
  trial: [{ label: "Mark Paying", status: "paying" }],
};

export function MonetisationVenueTable({
  venues,
  updatingAction,
  onStatusChange,
}: {
  venues: Venue[];
  updatingAction: string | null;
  onStatusChange: (venue: Venue, status: MonetisationStatus) => Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.04] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse font-['Outfit']">
          <thead>
            <tr className="border-b border-black/[0.04]">
              <HeaderCell>Venue</HeaderCell>
              <HeaderCell>Area</HeaderCell>
              <HeaderCell>Claimed</HeaderCell>
              <HeaderCell>Tier</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Featured</HeaderCell>
              <HeaderCell className="text-right">Actions</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => {
              const recommendation = getFeaturedEligibilityRecommendation(venue);
              const featuredLabel = getFeaturedLabel(venue, recommendation.eligible);
              const actions = QUICK_ACTIONS[venue.monetisationStatus] ?? [];

              return (
                <tr key={venue.id} className="border-b border-black/[0.04] align-middle transition-colors hover:bg-clay-50">
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-clay-600">{venue.name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8a7e72]">{venue.area}</td>
                  <td className="px-4 py-3">
                    <ClaimedVenueBadge claimed={venue.isClaimed} variant="dot" />
                  </td>
                  <td className="px-4 py-3">
                    <PartnerTierBadge tier={venue.partnerTier} />
                  </td>
                  <td className="px-4 py-3">
                    <MonetisationStatusBadge status={venue.monetisationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={featuredLabel.className}>{featuredLabel.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 text-[11px] font-medium">
                      {actions.map((action) => {
                        const actionKey = `${venue.id}:${action.status}`;
                        const isUpdating = updatingAction === actionKey;

                        return (
                          <button
                            key={action.status}
                            type="button"
                            className="text-steel-400 transition-colors hover:text-clay-600 disabled:cursor-wait disabled:opacity-60"
                            disabled={Boolean(updatingAction)}
                            onClick={() => onStatusChange(venue, action.status)}
                          >
                            {isUpdating ? "Saving..." : action.label}
                          </button>
                        );
                      })}
                      <Link className="text-clay-400 transition-colors hover:text-clay-500" to={`/admin/venues/${venue.id}/edit`}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <th className={`px-4 py-3 text-left text-[11px] font-medium text-[#8a7e72] ${className ?? ""}`}>{children}</th>;
}

function getFeaturedLabel(venue: Venue, recommendedEligible: boolean) {
  if (venue.featuredEligible || recommendedEligible) {
    return { label: "Eligible", className: "text-[10px] font-medium text-forest-400" };
  }

  if (venue.featuredBlockedReason) {
    return { label: "Blocked", className: "text-[10px] font-medium text-[#8a7e72]" };
  }

  return { label: "Needs work", className: "text-[10px] font-medium text-[#8a7e72]" };
}
