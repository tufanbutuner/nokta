import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalMenuLinksCard, MenuPriceSummary } from "@/components/owner/menu/MenuPriceSummary";
import { MenuSectionCard } from "@/components/owner/menu/MenuSectionCard";
import { NoReviewNotice, PublicPagePreview, UnpublishedChangesTray } from "@/components/owner/menu/MenuSidePanels";
import { useVenueMenuDraft } from "@/components/owner/menu/useVenueMenuDraft";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { summariseVenueMenuDraft } from "@/lib/venueMenuValidation";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { createVenueMenuSection, getOwnerVenueMenu, publishVenueMenu, updateVenueMenuLinks, type VenueMenuLinkField } from "@/services/venueMenuService";
import type { Venue } from "@/types/venue";
import type { VenueMenu } from "@/types/venueMenu";

export function OwnerVenueMenuPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [menu, setMenu] = useState<VenueMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { draft, draftItems, changeCount, validation, derivedPricePence, updateItem, addItem, removeItem, raiseSectionPrices, discard } = useVenueMenuDraft({ venueId: venue?.id ?? "", menu });

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyClaimedVenue({ userId: user.id, venueId })
      .then(async (nextVenue) => {
        if (!nextVenue) throw new Error("We could not find that venue.");
        const nextMenu = await getOwnerVenueMenu({ userId: user.id, venueId: nextVenue.id });
        if (cancelled) return;
        setVenue(nextVenue);
        setMenu(nextMenu);
        trackEvent("owner_menu_page_viewed", { venueId: nextVenue.id, itemCount: nextMenu.items.length });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load your menu.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  // Warn before losing an unpublished draft on a full page unload.
  useEffect(() => {
    if (!changeCount) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [changeCount]);

  const changeSummaries = useMemo(
    () => (menu ? summariseVenueMenuDraft({ draft, items: menu.items }) : []),
    [draft, menu],
  );

  const links = useMemo(
    () => ({
      menuUrl: venue?.dataSources.menuUrl ?? null,
      shishaMenuUrl: venue?.dataSources.shishaMenuUrl ?? null,
      shishaPageUrl: venue?.dataSources.shishaPageUrl ?? null,
    }),
    [venue],
  );

  async function handlePublish() {
    if (!user || !venue || !validation.isValid) return;
    try {
      setIsPublishing(true);
      setError(null);
      const nextMenu = await publishVenueMenu({ userId: user.id, venueId: venue.id, draft });
      setMenu(nextMenu);
      discard();
      setNotice("Menu updated — live now.");
      const refreshed = await getMyClaimedVenue({ userId: user.id, venueId: venue.id });
      if (refreshed) setVenue(refreshed);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not publish your menu.");
      // A partial apply is possible, so resync with the server rather than
      // leaving the editor showing a draft that may already be live.
      if (user && venue) {
        const nextMenu = await getOwnerVenueMenu({ userId: user.id, venueId: venue.id }).catch(() => null);
        if (nextMenu) setMenu(nextMenu);
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveLinks(nextLinks: Record<VenueMenuLinkField, string | null>) {
    if (!user || !venue) return;
    try {
      setIsSavingLinks(true);
      setError(null);
      await updateVenueMenuLinks({ userId: user.id, venueId: venue.id, links: nextLinks });
      const refreshed = await getMyClaimedVenue({ userId: user.id, venueId: venue.id });
      if (refreshed) setVenue(refreshed);
      setNotice("Menu links saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save menu links.");
    } finally {
      setIsSavingLinks(false);
    }
  }

  async function handleAddSection() {
    if (!user || !venue) return;
    const name = window.prompt("Name your new menu section");
    if (!name?.trim()) return;
    try {
      setError(null);
      await createVenueMenuSection({ userId: user.id, venueId: venue.id, name });
      const nextMenu = await getOwnerVenueMenu({ userId: user.id, venueId: venue.id });
      setMenu(nextMenu);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add that section.");
    }
  }

  function handleRaisePrices(sectionId: string) {
    if (!menu) return;
    const answer = window.prompt("Raise every live price in this section by what percent?", "5");
    const percent = Number(answer);
    if (!answer || !Number.isFinite(percent) || percent === 0) return;
    raiseSectionPrices({ sectionId, percent, items: draftItems });
  }

  return (
    <OwnerLayout>
      <PageMeta title="Menu & pricing | nokta" description="Edit your menu items and prices." canonicalPath={`/owner/venues/${venueId}/menu`} />
      {isLoading ? <LoadingState message="Loading your menu..." /> : !venue || !menu ? <ErrorState message={error ?? "Could not load your menu."} /> : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12.5px] text-muted-foreground">
                <Link to="/owner/venues" className="font-medium text-clay-accent hover:underline">My venues</Link> / {venue.name}
              </p>
              <h1 className="mt-1 font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink">Menu &amp; pricing</h1>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{venue.area}, {venue.city}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="h-[34px] text-[13px]">
                <Link to={`/venues/${venue.slug}`}>Preview public page</Link>
              </Button>
              <Button type="button" onClick={handlePublish} disabled={!changeCount || isPublishing || !validation.isValid} className="h-[34px] text-[13px]">
                {isPublishing ? "Publishing..." : changeCount ? `Publish ${changeCount} change${changeCount === 1 ? "" : "s"}` : "Publish"}
              </Button>
            </div>
          </div>

          {error ? <ErrorState message={error} /> : null}
          {notice ? <p className="rounded-lg border border-[oklch(0.86_0.06_150)] bg-[oklch(0.96_0.03_150)] px-3 py-2 text-[13px] text-[oklch(0.32_0.06_150)]">{notice}</p> : null}

          <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="flex flex-col gap-[14px]">
              <MenuPriceSummary derivedPricePence={derivedPricePence} priceLevel={venue.priceLevel} />

              {menu.sections.map((section) => (
                <MenuSectionCard
                  key={section.id}
                  section={section}
                  items={draftItems.filter((item) => item.sectionId === section.id)}
                  errors={validation.errors}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                  onAddItem={(sectionId) => addItem(sectionId, draftItems.filter((item) => item.sectionId === sectionId).length)}
                  onRaisePrices={handleRaisePrices}
                />
              ))}

              <button type="button" onClick={handleAddSection} className="self-start text-[12.5px] font-medium text-clay-accent hover:underline">+ Add a section</button>

              <ExternalMenuLinksCard links={links} isSaving={isSavingLinks} onSave={handleSaveLinks} />
            </div>

            <div className="flex flex-col gap-[13px]">
              <UnpublishedChangesTray
                changes={changeSummaries}
                isPublishing={isPublishing}
                canPublish={validation.isValid}
                onPublish={handlePublish}
                onDiscard={() => {
                  if (window.confirm(`Discard ${changeCount} unpublished change${changeCount === 1 ? "" : "s"}?`)) discard();
                }}
              />
              <PublicPagePreview sections={menu.sections} items={draftItems} />
              <NoReviewNotice />
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
