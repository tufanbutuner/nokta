import { OUTLINE_BUTTON, PRIMARY_BUTTON, RecommendCanvas, RecommendError, RecommendEyebrow, RecommendHeader, RecommendLoading } from "@/components/recommendations/flow/RecommendChrome";
import { ROLE_COLORS, roleLabel, formatPickMeta } from "@/components/recommendations/flow/recommendPickMeta";
import { PageMeta } from "@/components/seo/PageMeta";
import { useVenues } from "@/hooks/useVenues";
import { summariseAnswers } from "@/lib/recommendFlow";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import { getSharedRecommendShortlist } from "@/services/recommendShortlistService";
import type { RecommendShortlist } from "@/types/recommendFlow";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

/**
 * The public end of a share link. The recipient is not signed in, so this reads
 * through the share-code policy and never touches the sender's account.
 */
export function SharedShortlistPage() {
  const { code = "" } = useParams();
  const { venues, isLoading: venuesLoading } = useVenues();
  const [shortlist, setShortlist] = useState<RecommendShortlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getSharedRecommendShortlist(code)
      .then((result) => {
        if (cancelled) return;
        setShortlist(result);
        setError(result ? null : "This link has expired or was never shared.");
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setError(caughtError instanceof Error ? caughtError.message : "Could not open this link.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const picks = shortlist ? shortlist.picks.map((pick) => ({ pick, venue: venues.find((venue) => venue.id === pick.venueId) })).filter((entry) => entry.venue) : [];

  return (
    <RecommendCanvas>
      <PageMeta title={shortlist ? `${shortlist.name} | nokta` : "Shared shortlist | nokta"} description="Three picks shared with you on nokta." canonicalPath={`/s/${code}`} />
      <RecommendHeader progress="100%" stepLabel="Shared" />

      <section className="relative z-10 flex flex-1 flex-col gap-[clamp(14px,2cqi,22px)] px-[clamp(18px,3.4cqi,40px)] pb-[clamp(18px,2.6cqi,30px)] pt-[clamp(8px,2cqi,20px)] motion-safe:animate-[rdFade_.3s_both]">
        {isLoading || venuesLoading ? (
          <RecommendLoading message="Opening this shortlist..." />
        ) : error || !shortlist ? (
          <RecommendError message={error ?? "This link has expired."}>
            <Link to="/recommend" className={cn(PRIMARY_BUTTON, "h-11 px-5 text-[14px]")}>
              Find your own three
            </Link>
          </RecommendError>
        ) : (
          <>
            <div className="grid gap-2.5">
              <RecommendEyebrow>Shared with you</RecommendEyebrow>
              <h1 className="text-[clamp(24px,4.6cqi,38px)] font-semibold leading-[1.08] tracking-[-1.1px]">{shortlist.name}</h1>
              <p className="text-[13.5px] text-white/[.58]">{summariseAnswers(shortlist.answers)}</p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-[clamp(10px,1.4cqi,14px)]">
              {picks.map(({ pick, venue }) => {
                if (!venue) return null;
                const emphasised = pick.role === "safe";

                return (
                  <article key={pick.venueId} className={cn("flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-[clamp(13px,1.6cqi,18px)]", emphasised ? "border-clay-accent bg-[rgba(196,93,62,.14)]" : "border-white/[.13] bg-white/[.04]")}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.13em]" style={{ color: ROLE_COLORS[pick.role] }}>
                        {roleLabel(pick.role, null)}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[12px] font-semibold text-white/55">{pick.matchLabel}</span>
                    </div>
                    <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-[clamp(74px,9cqi,104px)] w-full rounded-[10px] object-cover" />
                    <div className="grid gap-1">
                      <h2 className="text-[clamp(17px,2.1cqi,21px)] font-semibold leading-tight tracking-[-0.4px]">{venue.name}</h2>
                      {/* Distance is deliberately absent: the sender's location is never shared. */}
                      <p className="text-[13px] text-white/60">{formatPickMeta(venue, null)}</p>
                    </div>
                    <p className="text-[13.5px] leading-[1.45] text-white/[.82] [text-wrap:pretty]">{pick.reason}</p>
                    <Link to={`/venues/${venue.slug}`} className={cn(PRIMARY_BUTTON, "mt-auto h-10 rounded-[9px] text-[13.5px]")}>
                      View venue
                    </Link>
                  </article>
                );
              })}
            </div>

            <Link to="/recommend" className={cn(OUTLINE_BUTTON, "h-[42px] w-fit px-5 text-[13.5px]")}>
              Find your own three
            </Link>
          </>
        )}
      </section>
    </RecommendCanvas>
  );
}
