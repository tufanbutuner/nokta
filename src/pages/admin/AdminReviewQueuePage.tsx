import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminNoteCard, DetailSideRail, InfoCard, OwnerNoteCard, ReviewQueueActionBar } from "@/components/admin/review/ReviewQueueActions";
import { MediaSubmittedBand } from "@/components/admin/review/MediaSubmittedBand";
import { ReviewQueueList, StatusPill, TypeChip } from "@/components/admin/review/ReviewQueueList";
import { UpdatesSubmittedBand } from "@/components/admin/review/UpdatesSubmittedBand";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  formatReviewQueueAgeLong,
  formatReviewQueueType,
  getReviewQueueAgeDays,
  isReviewQueueType,
  MEDIA_REJECT_REASONS,
  REJECT_NOTE_CHIPS,
  REVIEW_QUEUE_TYPES,
} from "@/lib/adminReviewQueueLabels";
import { cn } from "@/lib/utils";
import { getMediaQueue, getReviewQueueCounts, getUpdatesQueue, type VenueSummary } from "@/services/adminReviewQueueService";
import { approveVenueMedia, rejectVenueMedia } from "@/services/adminVenueMediaReviewService";
import { applyVenueUpdateRequest, approveVenueUpdateRequest, rejectVenueUpdateRequest } from "@/services/adminVenueUpdateRequestService";
import type { PhotoDecision, ReviewQueueCounts, ReviewQueueItem, ReviewQueueSort } from "@/types/adminReviewQueue";
import type { VenueMedia } from "@/types/venueMedia";
import type { VenueUpdateRequest } from "@/types/venueUpdateRequests";

const SORT_OPTIONS = [
  { label: "Oldest first", value: "oldest" },
  { label: "Newest first", value: "newest" },
];

const IMPLEMENTED_TYPES = new Set(["updates", "media"]);

/** approve → reject → undecided, so a mis-click is reversible without a reset. */
function cyclePhotoDecision(current: Record<string, PhotoDecision>, mediaId: string): Record<string, PhotoDecision> {
  const next = { ...current };
  if (next[mediaId] === "approve") next[mediaId] = "reject";
  else if (next[mediaId] === "reject") delete next[mediaId];
  else next[mediaId] = "approve";
  return next;
}

export function AdminReviewQueuePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [requestsById, setRequestsById] = useState<Record<string, VenueUpdateRequest>>({});
  const [mediaByVenue, setMediaByVenue] = useState<Record<string, VenueMedia[]>>({});
  const [venues, setVenues] = useState<Record<string, VenueSummary>>({});
  const [counts, setCounts] = useState<ReviewQueueCounts | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [photoDecisions, setPhotoDecisions] = useState<Record<string, PhotoDecision>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeParam = searchParams.get("type");
  const activeType = isReviewQueueType(typeParam) ? typeParam : "updates";
  const selectedId = searchParams.get("item");
  const sort = (searchParams.get("sort") as ReviewQueueSort | null) ?? "oldest";
  const search = searchParams.get("q") ?? "";
  const showDecided = searchParams.get("decided") === "1";

  const loadQueue = useCallback(async () => {
    setError(null);
    if (activeType === "updates") {
      const result = await getUpdatesQueue();
      setItems(result.items);
      setRequestsById(result.requestsById);
      setVenues(result.venues);
      setMediaByVenue({});
      return;
    }
    if (activeType === "media") {
      const result = await getMediaQueue();
      setItems(result.items);
      setMediaByVenue(result.mediaByVenue);
      setVenues(result.venues);
      setRequestsById({});
      return;
    }
    setItems([]);
  }, [activeType]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([loadQueue(), getReviewQueueCounts().catch(() => null)])
      .then(([, nextCounts]) => {
        if (!cancelled && nextCounts) setCounts(nextCounts);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load the review queue.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadQueue]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((item) => (showDecided ? item.decision !== "pending" : item.decision === "pending"))
      .filter((item) => !term || item.venueName.toLowerCase().includes(term) || (item.submittedBy ?? "").toLowerCase().includes(term))
      .sort((a, b) => (sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }, [items, search, showDecided, sort]);

  const selected = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? null;
  const selectedMedia = selected && activeType === "media" ? mediaByVenue[selected.id] ?? [] : [];
  const approveCount = selectedMedia.filter((item) => photoDecisions[item.id] === "approve").length;
  const rejectCount = selectedMedia.filter((item) => photoDecisions[item.id] === "reject").length;

  // A fresh selection starts with an empty note and no photo decisions.
  useEffect(() => {
    setAdminNote("");
    setPhotoDecisions({});
  }, [selected?.id]);

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }

  /** After a decision the row leaves the pending list, so advance to the next. */
  function advanceSelection() {
    const index = visibleItems.findIndex((item) => item.id === selected?.id);
    const next = visibleItems[index + 1] ?? visibleItems[index - 1] ?? null;
    updateParams({ item: next?.id ?? null });
  }

  async function runDecision(action: () => Promise<unknown>) {
    if (!user || !selected) return;
    try {
      setIsBusy(true);
      setError(null);
      await action();
      advanceSelection();
      await loadQueue();
      const nextCounts = await getReviewQueueCounts().catch(() => null);
      if (nextCounts) setCounts(nextCounts);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "That decision could not be saved.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleApproveAndApply() {
    if (!user || !selected) return;
    if (activeType === "media") {
      void runDecision(async () => {
        for (const item of selectedMedia) {
          const decision = photoDecisions[item.id];
          if (decision === "approve") await approveVenueMedia({ mediaId: item.id, adminUserId: user.id, reviewNotes: adminNote || null });
          if (decision === "reject") await rejectVenueMedia({ mediaId: item.id, adminUserId: user.id, reviewNotes: adminNote || null });
        }
      });
      return;
    }
    // Approve and apply stay separate service calls; this button is the default pairing.
    void runDecision(async () => {
      await approveVenueUpdateRequest({ requestId: selected.id, adminUserId: user.id, adminNotes: adminNote || null });
      await applyVenueUpdateRequest({ requestId: selected.id, adminUserId: user.id });
    });
  }

  function handleApproveOnly() {
    if (!user || !selected || activeType !== "updates") return;
    void runDecision(() => approveVenueUpdateRequest({ requestId: selected.id, adminUserId: user.id, adminNotes: adminNote || null }));
  }

  function handleReject() {
    if (!user || !selected) return;
    if (activeType === "media") {
      void runDecision(async () => {
        for (const item of selectedMedia) {
          if (photoDecisions[item.id] === "reject") await rejectVenueMedia({ mediaId: item.id, adminUserId: user.id, reviewNotes: adminNote });
        }
      });
      return;
    }
    void runDecision(() => rejectVenueUpdateRequest({ requestId: selected.id, adminUserId: user.id, adminNotes: adminNote }));
  }

  // Reject always needs a note; media additionally needs at least one rejected photo.
  const canReject = activeType === "media" ? Boolean(adminNote.trim()) && rejectCount > 0 : Boolean(adminNote.trim());
  const pendingTotal = counts ? Object.values(counts).reduce((total, value) => total + value, 0) : 0;
  const oldestPending = visibleItems.length ? visibleItems.reduce((oldest, item) => (item.createdAt < oldest ? item.createdAt : oldest), visibleItems[0].createdAt) : null;

  return (
    <AdminPageShell activePath="/admin/review">
      <PageMeta title="Review queue | nokta admin" description="Everything owners submitted that needs a decision." canonicalPath="/admin/review" />
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b bg-background px-[26px] pb-[14px] pt-[18px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink">Review queue</h1>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {pendingTotal} waiting{oldestPending ? ` · oldest ${formatReviewQueueAgeLong(oldestPending)}` : ""} · everything owners submitted that needs a decision
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(event) => updateParams({ q: event.target.value || null })}
                placeholder="Search venue or owner"
                className="h-[34px] w-[220px] text-[13px]"
                aria-label="Search venue or owner"
              />
              <Select value={sort} onValueChange={(value) => updateParams({ sort: value })} options={SORT_OPTIONS} className="h-[34px] w-[150px]" />
            </div>
          </div>

          <div className="mt-[14px] flex flex-wrap items-center gap-[7px]">
            {REVIEW_QUEUE_TYPES.map((type) => {
              const count = counts?.[type] ?? 0;
              const isActive = type === activeType;
              const isImplemented = IMPLEMENTED_TYPES.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!isImplemented}
                  title={isImplemented ? undefined : `${formatReviewQueueType(type)} still has its own page`}
                  onClick={() => updateParams({ type, item: null, decided: null })}
                  className={cn(
                    "flex h-[31px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors",
                    isActive ? "border-clay-accent/30 bg-clay-accent/12 font-semibold text-[#a44a30]" : "border-transparent bg-black/5 text-nokta-ink",
                    !isImplemented && "cursor-not-allowed opacity-45",
                  )}
                >
                  {formatReviewQueueType(type)}
                  <span className={cn("rounded-full px-1.5 text-[11px]", isActive ? "bg-clay-accent/15" : "bg-black/5")}>{count}</span>
                </button>
              );
            })}
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => updateParams({ decided: showDecided ? null : "1", item: null })}
              className={cn(
                "flex h-[31px] items-center rounded-full border px-3 text-[12.5px] transition-colors",
                showDecided ? "border-clay-accent bg-clay-accent/12 font-semibold text-[#a44a30]" : "bg-card text-muted-foreground hover:text-nokta-ink",
              )}
            >
              Decided
            </button>
          </div>
        </header>

        {isLoading ? (
          <LoadingState message="Loading the review queue..." />
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[400px_1fr]">
            <div className="min-h-0 overflow-y-auto border-r bg-[oklch(0.975_0.008_60)]">
              <ReviewQueueList items={visibleItems} selectedId={selected?.id ?? null} activeType={activeType} onSelect={(item) => updateParams({ item: item.id })} />
            </div>

            <div className="min-h-0 overflow-y-auto">
              {error ? <div className="p-6"><ErrorState message={error} /></div> : null}
              {!selected ? (
                <div className="p-6 text-[13px] text-muted-foreground">Select an item to review it.</div>
              ) : (
                <div className="flex flex-col gap-[14px] px-6 pb-6 pt-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeChip type={selected.type} />
                      <StatusPill item={selected} showAge={formatReviewQueueAgeLong(selected.createdAt)} />
                    </div>
                    <h2 className="mt-2 font-brand text-[21px] font-bold tracking-[-0.3px] text-nokta-ink">{selected.venueName}</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {[
                        selected.venueId && venues[selected.venueId] ? [venues[selected.venueId].area, venues[selected.venueId].city].filter(Boolean).join(", ") : null,
                        selected.venueId && venues[selected.venueId]?.isClaimed ? "claimed" : null,
                        // submitted_by is an auth user id; emails are not
                        // readable from the client, so show a short reference.
                        selected.submittedBy ? `submitted by owner ${selected.submittedBy.slice(0, 8)}` : null,
                        `${getReviewQueueAgeDays(selected.createdAt)} days ago`,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <ReviewQueueActionBar
                    primaryLabel={activeType === "media" ? `Approve ${approveCount} selected` : "Approve & apply"}
                    secondaryLabel={activeType === "updates" ? "Approve only" : undefined}
                    rejectLabel={activeType === "media" ? `Reject ${rejectCount}` : "Reject"}
                    isBusy={isBusy || (activeType === "media" && approveCount === 0 && rejectCount === 0)}
                    canReject={canReject}
                    venueFormHref={selected.venueId ? `/admin/venues/${selected.venueId}/edit` : null}
                    onPrimary={handleApproveAndApply}
                    onSecondary={activeType === "updates" ? handleApproveOnly : undefined}
                    onReject={handleReject}
                  />

                  <div className="grid gap-[14px] 2xl:grid-cols-[minmax(0,1fr)_280px] 2xl:items-start">
                    <div className="flex min-w-0 flex-col gap-[14px]">
                      {activeType === "updates" && requestsById[selected.id] ? <UpdatesSubmittedBand request={requestsById[selected.id]} /> : null}
                      {activeType === "media" ? (
                        <>
                          <MediaSubmittedBand
                            media={selectedMedia}
                            decisions={photoDecisions}
                            onToggle={(mediaId) => setPhotoDecisions((current) => cyclePhotoDecision(current, mediaId))}
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoDecisions(Object.fromEntries(selectedMedia.map((item) => [item.id, "approve" as PhotoDecision])))}
                            className="self-start text-[12.5px] font-medium text-clay-accent hover:underline"
                          >
                            Select all
                          </button>
                        </>
                      ) : null}

                      <OwnerNoteCard note={selected.ownerNote} />
                      <AdminNoteCard
                        value={adminNote}
                        chips={activeType === "media" ? MEDIA_REJECT_REASONS : REJECT_NOTE_CHIPS}
                        isRequired
                        requiredHint={activeType === "media" ? "Pick a reason before rejecting a photo." : "A note is required to reject."}
                        onChange={setAdminNote}
                      />
                    </div>

                    <DetailSideRail>
                      {activeType === "updates" ? (
                        <InfoCard title="Approve, then apply">
                          <p><strong className="font-semibold text-nokta-ink">Approve only</strong> records the decision. <strong className="font-semibold text-nokta-ink">Apply</strong> writes to the venue. The combined button does both.</p>
                        </InfoCard>
                      ) : (
                        <InfoCard title="Decisions are per photo">
                          <p>Click a tile to cycle approve → reject → undecided. Only the photos you marked are written.</p>
                        </InfoCard>
                      )}
                      <InfoCard title="This venue">
                        <p>Prices and menu items no longer appear here — owners publish those themselves.</p>
                      </InfoCard>
                    </DetailSideRail>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
