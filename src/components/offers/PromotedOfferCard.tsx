import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { PromotedOfferBadge } from "@/components/offers/PromotedOfferBadge";
import { Button } from "@/components/ui/button";
import { formatPromotedOfferType } from "@/lib/promotedOfferLabels";
import { cn } from "@/lib/utils";
import type { PromotedOffer } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

interface PromotedOfferCardProps {
  offer: PromotedOffer;
  venue?: Venue;
  variant?: "homepage" | "city" | "venue" | "compact";
  onClick?: () => void;
}

export function PromotedOfferCard({ offer, venue, variant = "homepage", onClick }: PromotedOfferCardProps) {
  const href = offer.ctaUrl ?? (venue ? `/venues/${venue.slug}` : "/discover");
  const isExternal = Boolean(offer.ctaUrl);
  const location = [offer.area ?? venue?.area, offer.city ?? venue?.city].filter(Boolean).join(", ");
  const expiry = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(offer.endsAt));

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm shadow-stone-950/5",
        variant === "compact" ? "gap-3" : "gap-4",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PromotedOfferBadge compact={variant === "compact"} />
        <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">{formatPromotedOfferType(offer.offerType)}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold leading-tight">{offer.title}</h3>
        {venue ? <p className="mt-1 text-sm font-medium text-muted-foreground">{venue.name}</p> : null}
      </div>

      {offer.description ? <p className="text-sm leading-6 text-muted-foreground">{offer.description}</p> : null}

      <div className="mt-auto space-y-2 text-xs text-muted-foreground">
        {location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Ends {expiry}
        </div>
        {offer.terms ? <p className="border-t pt-2 leading-5">Terms: {offer.terms}</p> : null}
      </div>

      <Button asChild variant={variant === "venue" ? "default" : "outline"} className="mt-1 w-fit" onClick={onClick}>
        {isExternal ? (
          <a href={href} target="_blank" rel="noreferrer">
            {offer.ctaLabel ?? "View offer"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        ) : (
          <Link to={href}>
            {offer.ctaLabel ?? "View venue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </Button>
    </article>
  );
}
