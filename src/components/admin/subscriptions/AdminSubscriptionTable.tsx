import { AdminSubscriptionActions } from "@/components/admin/subscriptions/AdminSubscriptionActions";
import { SubscriptionPlanBadge } from "@/components/admin/subscriptions/SubscriptionPlanBadge";
import { SubscriptionStatusBadge } from "@/components/admin/subscriptions/SubscriptionStatusBadge";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function AdminSubscriptionTable({
  rows,
  updatingVenueId,
  onEdit,
  onTrial,
  onCancel,
}: {
  rows: { venue: Venue; subscription: VenueSubscription }[];
  updatingVenueId?: string | null;
  onEdit: (row: { venue: Venue; subscription: VenueSubscription }) => void;
  onTrial: (row: { venue: Venue; subscription: VenueSubscription }) => void;
  onCancel: (row: { venue: Venue; subscription: VenueSubscription }) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.04] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-clay-50 text-xs uppercase tracking-[0.08em] text-[#8a7e72]">
            <tr>
              <th className="px-4 py-3 font-semibold">Venue</th>
              <th className="px-4 py-3 font-semibold">City/Area</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Period/trial</th>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.venue.id} className="align-top">
                <td className="px-4 py-4 font-medium text-sheesh-ink">{row.venue.name}</td>
                <td className="px-4 py-4 text-muted-foreground">{row.venue.city} · {row.venue.area}</td>
                <td className="px-4 py-4 text-muted-foreground">{row.venue.claimedBy ? "Claimed" : "Unassigned"}</td>
                <td className="px-4 py-4"><SubscriptionPlanBadge plan={row.subscription.plan} status={row.subscription.status} /></td>
                <td className="px-4 py-4"><SubscriptionStatusBadge status={row.subscription.status} /></td>
                <td className="px-4 py-4 text-muted-foreground">{formatPeriod(row.subscription)}</td>
                <td className="px-4 py-4 capitalize text-muted-foreground">{row.subscription.billingProvider ?? "manual"}</td>
                <td className="px-4 py-4">
                  <AdminSubscriptionActions
                    venue={row.venue}
                    onEdit={() => onEdit(row)}
                    onTrial={() => onTrial(row)}
                    onCancel={() => onCancel(row)}
                    isSaving={updatingVenueId === row.venue.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPeriod(subscription: VenueSubscription) {
  if (subscription.status === "trial" && subscription.trialEndsAt) return `Trial ends ${formatDate(subscription.trialEndsAt)}`;
  if (subscription.currentPeriodEnd) return `Renews ${formatDate(subscription.currentPeriodEnd)}`;
  if (subscription.cancelledAt) return `Cancelled ${formatDate(subscription.cancelledAt)}`;
  return "No period set";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
