import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OwnerMediaStatusBadge } from "@/components/owner/media/OwnerMediaStatusBadge";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { approveVenueMedia, getAdminVenueMedia, rejectVenueMedia } from "@/services/adminVenueMediaReviewService";
import type { VenueMedia, VenueMediaReviewStatus } from "@/types/venueMedia";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const CITY_OPTIONS = [
  { value: "all", label: "All cities" },
  { value: "London", label: "London" },
  { value: "Birmingham", label: "Birmingham" },
  { value: "Manchester", label: "Manchester" },
  { value: "Leicester", label: "Leicester" },
];

export function AdminMediaReviewPage() {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [media, setMedia] = useState<VenueMedia[]>([]);
  const [selected, setSelected] = useState<VenueMedia | null>(null);
  const [statusFilter, setStatusFilter] = useState<VenueMediaReviewStatus | "all">("pending");
  const [cityFilter, setCityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getAdminVenueMedia(statusFilter)
      .then((nextMedia) => {
        if (!cancelled) setMedia(nextMedia);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load media review.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    trackEvent("admin_media_review_viewed", { reviewStatus: statusFilter });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const filtered = media.filter((item) => {
    const venue = venuesById.get(item.venueId);
    if (cityFilter !== "all" && venue?.city !== cityFilter) return false;
    const haystack = [venue?.name, venue?.city, venue?.area, item.caption, item.altText].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  async function handleReview(item: VenueMedia, action: "approve" | "reject") {
    if (!user) return;
    setActionError(null);
    try {
      const updated = action === "approve"
        ? await approveVenueMedia({ mediaId: item.id, adminUserId: user.id, reviewNotes })
        : await rejectVenueMedia({ mediaId: item.id, adminUserId: user.id, reviewNotes });
      setMedia((current) => {
        if (statusFilter === "pending") {
          return current.filter((mediaItem) => mediaItem.id !== updated.id);
        }
        return current.map((mediaItem) => mediaItem.id === updated.id ? updated : mediaItem);
      });
      setSelected(null);
      setReviewNotes("");
      showToast(action === "approve" ? "Photo approved. It can now appear publicly." : "Photo rejected. The owner can see the review notes.");
      if (action === "approve") trackEvent("admin_media_approved", { venueId: item.venueId, mediaId: item.id, reviewStatus: updated.reviewStatus });
      if (action === "reject") trackEvent("admin_media_rejected", { venueId: item.venueId, mediaId: item.id, reviewStatus: updated.reviewStatus });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not update media review.";
      setActionError(message);
      showToast(message);
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3200);
  }

  return (
    <AdminPageShell activePath="/admin/media-review">
      <PageMeta title="Media Review | Sheesha Admin" description="Review owner-uploaded venue media." />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Admin</p>
          <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-sheesh-ink">Media review</h1>
          <p className="mt-2 text-sm text-[#8a7e72]">Approve or reject owner-uploaded venue photos before they appear publicly.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pending review" value={media.filter((item) => item.reviewStatus === "pending").length} />
          <Metric label="Approved" value={media.filter((item) => item.reviewStatus === "approved").length} />
          <Metric label="Rejected" value={media.filter((item) => item.reviewStatus === "rejected").length} />
          <Metric label="Owner uploaded" value={media.length} />
        </div>
        <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm lg:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venue, area or caption" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VenueMediaReviewStatus | "all")} options={STATUS_OPTIONS} />
          <Select value={cityFilter} onValueChange={setCityFilter} options={CITY_OPTIONS} />
        </div>
        {actionError ? <ErrorState message={actionError} /> : null}
        {isLoading ? <LoadingState message="Loading media review..." /> : error ? <ErrorState message={error} /> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const venue = venuesById.get(item.venueId);
              return (
                <article key={item.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                  <button type="button" className="block w-full text-left" onClick={() => { setSelected(item); setReviewNotes(item.reviewNotes ?? ""); }}>
                    <img src={item.url} alt={item.altText ?? "Venue upload"} className="aspect-[4/3] w-full object-cover" />
                  </button>
                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <OwnerMediaStatusBadge status={item.reviewStatus} />
                      <span className="text-xs text-muted-foreground">{formatFileSize(item.fileSizeBytes)}</span>
                    </div>
                    <div>
                      <h2 className="font-medium">{venue?.name ?? item.venueId}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{[venue?.city, venue?.area].filter(Boolean).join(" · ")}</p>
                    </div>
                    {item.caption ? <p className="text-sm">{item.caption}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(item); setReviewNotes(item.reviewNotes ?? ""); }}>Review</Button>
                      {venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>Public page</Link></Button> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!isLoading && !error && !filtered.length ? <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No media matches these filters.</div> : null}
        {selected ? (
          <div className="fixed inset-0 z-[1500] bg-stone-950/60 p-4" role="dialog" aria-modal="true">
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setSelected(null)} />
            <div className="relative mx-auto max-h-[calc(100vh-2rem)] max-w-4xl overflow-y-auto rounded-xl border bg-card p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <OwnerMediaStatusBadge status={selected.reviewStatus} />
                  <h2 className="mt-3 text-xl font-semibold">{venuesById.get(selected.venueId)?.name ?? selected.venueId}</h2>
                </div>
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              </div>
              <img src={selected.url} alt={selected.altText ?? "Venue upload"} className="mt-5 max-h-[56vh] w-full rounded-xl object-contain bg-stone-950" />
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <Detail label="Caption" value={selected.caption} />
                <Detail label="Alt text" value={selected.altText} />
                <Detail label="Dimensions" value={selected.width && selected.height ? `${selected.width} x ${selected.height}` : null} />
                <Detail label="File size" value={formatFileSize(selected.fileSizeBytes)} />
              </dl>
              <label className="mt-5 block"><span className="text-sm font-medium">Review notes</span><Textarea className="mt-2" value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} /></label>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => handleReview(selected, "approve")}>Approve</Button>
                <Button variant="outline" onClick={() => handleReview(selected, "reject")}>Reject</Button>
              </div>
            </div>
          </div>
        ) : null}
        {toastMessage ? (
          <div className="fixed bottom-5 right-5 z-[1600] max-w-sm rounded-xl border bg-sheesh-ink px-4 py-3 text-sm font-medium text-clay-50 shadow-xl">
            {toastMessage}
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value || "Not provided"}</dd></div>;
}

function formatFileSize(size: number | null) {
  if (!size) return "Size unknown";
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
