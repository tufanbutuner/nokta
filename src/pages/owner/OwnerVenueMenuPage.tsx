import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalMenuLinksCard, MenuPriceSummary } from "@/components/owner/menu/MenuPriceSummary";
import { MenuSectionCard } from "@/components/owner/menu/MenuSectionCard";
import { NoReviewNotice, PublicPagePreview, UnpublishedChangesTray } from "@/components/owner/menu/MenuSidePanels";
import { useVenueMenuDraft } from "@/components/owner/menu/useVenueMenuDraft";
import { OwnerVenueTabHeader, useOwnerVenue } from "@/components/owner/OwnerVenueRouteLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { summariseVenueMenuDraft } from "@/lib/venueMenuValidation";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import { getOwnerVenueMenu, publishVenueMenu, updateVenueMenuLinks, type VenueMenuLinkField } from "@/services/venueMenuService";
import type { VenueMenu } from "@/types/venueMenu";

export function OwnerVenueMenuPage() {
  const { user } = useAuth();
  const { venue, setVenue } = useOwnerVenue();
  const [menu, setMenu] = useState<VenueMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const { draft, draftItems, draftSections, changeCount, validation, derivedPricePence, updateItem, addItem, removeItem, moveItem, raiseSectionPrices, addSection, updateSection, moveSection, removeSection, discard } = useVenueMenuDraft({ venueId: venue.id, menu });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getOwnerVenueMenu({ userId: user.id, venueId: venue.id })
      .then((nextMenu) => {
        if (cancelled) return;
        setMenu(nextMenu);
        trackEvent("owner_menu_page_viewed", { venueId: venue.id, itemCount: nextMenu.items.length });
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
  }, [user, venue.id]);

  // Warn before losing an unpublished draft on a full page unload.
  useEffect(() => {
    if (!changeCount) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [changeCount]);

  const changeSummaries = useMemo(
    () => (menu ? summariseVenueMenuDraft({ draft, items: menu.items, sections: menu.sections }) : []),
    [draft, menu],
  );

  const links = useMemo(
    () => ({
      menuUrl: venue.dataSources.menuUrl ?? null,
      shishaMenuUrl: venue.dataSources.shishaMenuUrl ?? null,
      shishaPageUrl: venue.dataSources.shishaPageUrl ?? null,
    }),
    [venue],
  );

  async function handlePublish() {
    if (!user) return;
    if (!validation.isValid) { setShowErrors(true); return; }
    try {
      setIsPublishing(true);
      setError(null);
      const nextMenu = await publishVenueMenu({ userId: user.id, venueId: venue.id, draft });
      setMenu(nextMenu);
      discard();
      setShowErrors(false);
      setNotice("Menu updated — live now.");
      const refreshed = await getMyClaimedVenue({ userId: user.id, venueId: venue.id });
      if (refreshed) setVenue(refreshed);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not publish your menu.");
      // A partial apply is possible, so resync with the server rather than
      // leaving the editor showing a draft that may already be live.
      if (user) {
        const nextMenu = await getOwnerVenueMenu({ userId: user.id, venueId: venue.id }).catch(() => null);
        if (nextMenu) setMenu(nextMenu);
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveLinks(nextLinks: Record<VenueMenuLinkField, string | null>) {
    if (!user) return;
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

  function handleAddSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = addSection({ name: sectionName.trim(), isShisha: false });
    setSectionName("");
    setAddingSection(false);
    setFocusId(id);
  }

  function handleAddItem(sectionId: string) {
    setFocusId(addItem(sectionId));
  }

  function confirmTabChange() {
    if (!changeCount) return true;
    const shouldDiscard = window.confirm(`Publish or discard your ${changeCount} change${changeCount === 1 ? "" : "s"}? Select OK to discard and leave this tab.`);
    if (shouldDiscard) discard();
    return shouldDiscard;
  }

  return (
    <>
      <PageMeta title="Menu & pricing | nokta" description="Edit your menu items and prices." canonicalPath={`/owner/venues/${venue.slug}/menu`} />
      <OwnerVenueTabHeader
        title="Menu & pricing"
        canNavigate={confirmTabChange}
        actions={
          <>
            <Button asChild variant="outline" className="h-9 text-sm">
              <Link to={`/venues/${venue.slug}`}>Preview public page</Link>
            </Button>
            <Button type="button" onClick={handlePublish} disabled={!changeCount || isPublishing} className="h-9 text-sm">
              {isPublishing ? "Publishing..." : changeCount ? `Publish ${changeCount} change${changeCount === 1 ? "" : "s"}` : "Publish"}
            </Button>
          </>
        }
      />
      {isLoading ? <LoadingState message="Loading your menu..." /> : !menu ? <ErrorState message={error ?? "Could not load your menu."} /> : (
        <div className="flex flex-col gap-4">

          {error ? <ErrorState message={error} /> : null}
          {notice ? <p className="rounded-lg border border-nokta-ok-line bg-nokta-ok-tint px-3 py-2 text-sm text-nokta-ok-ink">{notice}</p> : null}

          <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="flex flex-col gap-[14px]">
              <MenuPriceSummary derivedPricePence={derivedPricePence} priceLevel={venue.priceLevel} />

              {draftSections.map((section, index) => (
                <MenuSectionCard
                  key={section.id}
                  section={section}
                  items={draftItems.filter((item) => item.sectionId === section.id)}
                  isFirst={index === 0}
                  isLast={index === draftSections.length - 1}
                  isNew={section.id.startsWith("new-")}
                  changedItemIds={new Set([...Object.keys(draft.updated), ...draft.created.map((item) => item.tempId)])}
                  errors={validation.errors}
                  showErrors={showErrors}
                  focusId={focusId}
                  onFocused={() => setFocusId(null)}
                  onUpdateSection={(change) => updateSection(section.id, change)}
                  onMoveSection={(direction) => moveSection(section.id, direction)}
                  onRemoveSection={() => removeSection(section.id)}
                  onRaisePrices={(percent) => raiseSectionPrices({ sectionId: section.id, percent })}
                  onUpdateItem={updateItem}
                  onMoveItem={moveItem}
                  onRemoveItem={removeItem}
                  onAddItem={() => handleAddItem(section.id)}
                />
              ))}

              {addingSection ? (
                <form onSubmit={handleAddSection} className="flex flex-wrap items-center gap-2 rounded-2xl border border-nokta-border bg-nokta-surface p-3">
                  <input autoFocus value={sectionName} maxLength={60} onChange={(event) => setSectionName(event.target.value)} placeholder="New section name" aria-label="New section name" className="h-10 min-w-48 flex-1 rounded-xl border border-nokta-border-input bg-nokta-surface px-3 text-sm outline-none focus:border-nokta-accent" />
                  <Button type="submit" disabled={!sectionName.trim()}>Add section</Button>
                  <Button type="button" variant="outline" onClick={() => { setAddingSection(false); setSectionName(""); }}>Cancel</Button>
                </form>
              ) : <button type="button" onClick={() => setAddingSection(true)} className="self-start rounded-xl border border-dashed border-nokta-border px-4 py-2.5 text-sm font-semibold text-nokta-accent-dark hover:bg-nokta-hover">+ Add a section</button>}

              <ExternalMenuLinksCard links={links} isSaving={isSavingLinks} onSave={handleSaveLinks} />
            </div>

            <div className="flex flex-col gap-[13px]">
              <UnpublishedChangesTray
                changes={changeSummaries}
                isPublishing={isPublishing}
                canPublish
                onPublish={handlePublish}
                onDiscard={() => {
                  if (window.confirm(`Discard ${changeCount} unpublished change${changeCount === 1 ? "" : "s"}?`)) discard();
                }}
              />
              <PublicPagePreview sections={draftSections} items={draftItems} unpricedItemIds={new Set([
                ...draft.created.filter((item) => item.pricePence === null).map((item) => item.tempId),
                ...Object.entries(draft.updated).filter(([, change]) => change.pricePence === null).map(([id]) => id),
              ])} />
              <NoReviewNotice />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
