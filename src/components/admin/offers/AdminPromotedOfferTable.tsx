import { Link } from "react-router-dom";
import { PromotedOfferBadge } from "@/components/offers/PromotedOfferBadge";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { Button } from "@/components/ui/button";
import { formatPromotedOfferStatus, formatPromotedOfferType } from "@/lib/promotedOfferLabels";
import { cn } from "@/lib/utils";
import type { PromotedOffer, PromotedOfferStatus, PromotedOfferType } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function AdminPromotedOfferTable({
  offers,
  venuesById,
  onEdit,
  onStatus,
  onDelete,
}: {
  offers: PromotedOffer[];
  venuesById: Map<string, Venue>;
  onEdit: (offer: PromotedOffer) => void;
  onStatus: (offer: PromotedOffer, status: PromotedOfferStatus) => void;
  onDelete: (offer: PromotedOffer) => void;
}) {
  if (!offers.length) {
    return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No promoted offers match these filters.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">City/Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {offers.map((offer) => {
              const venue = venuesById.get(offer.venueId);
              return (
                <tr key={offer.id}>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2"><PromotedOfferBadge compact /></div>
                    <div className="mt-2 font-medium">{offer.title}</div>
                    {offer.description ? <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{offer.description}</div> : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{venue?.name ?? offer.venueId}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {venue ? <span>{venue.city} · {venue.area}</span> : null}
                      {venue?.isClaimed ? <ClaimedVenueBadge compact /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4"><TypeBadge type={offer.offerType} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{[offer.city, offer.area].filter(Boolean).join(" · ") || "Global"}</td>
                  <td className="px-4 py-4"><StatusBadge status={offer.status} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(offer.startsAt)}<br />to {formatDate(offer.endsAt)}</td>
                  <td className="px-4 py-4">{offer.priority}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(offer)}>Edit</Button>
                      {offer.status !== "active" ? <Button size="sm" onClick={() => onStatus(offer, "active")}>Activate</Button> : <Button size="sm" variant="outline" onClick={() => onStatus(offer, "paused")}>Pause</Button>}
                      <Button size="sm" variant="ghost" onClick={() => onStatus(offer, "cancelled")}>Cancel</Button>
                      {offer.status === "draft" ? <Button size="sm" variant="ghost" onClick={() => onDelete(offer)}>Delete</Button> : null}
                      {venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>View</Link></Button> : null}
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

function StatusBadge({ status }: { status: PromotedOfferStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-medium", status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-background")}>{formatPromotedOfferStatus(status)}</span>;
}

function TypeBadge({ type }: { type: PromotedOfferType }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium">{formatPromotedOfferType(type)}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
