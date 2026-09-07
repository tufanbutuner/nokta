import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerVenueTabShell } from "@/components/owner/OwnerVenueTabShell";
import { OwnerMediaGrid } from "@/components/owner/media/OwnerMediaGrid";
import { OwnerMediaGuidelines } from "@/components/owner/media/OwnerMediaGuidelines";
import { OwnerMediaMetadataDialog } from "@/components/owner/media/OwnerMediaMetadataDialog";
import { OwnerMediaUploader } from "@/components/owner/media/OwnerMediaUploader";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { deleteOwnerPendingMedia, getOwnerVenueMedia, updateOwnerVenueMediaMetadata } from "@/services/ownerVenueMediaService";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueMedia } from "@/types/venueMedia";
import type { Venue } from "@/types/venue";

export function OwnerVenueMediaPage() {
  const { user } = useAuth();
  const { venueId = "" } = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [media, setMedia] = useState<VenueMedia[]>([]);
  const [editing, setEditing] = useState<VenueMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !venueId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([getMyClaimedVenue({ userId: user.id, venueId }), getOwnerVenueMedia({ userId: user.id, venueId })])
      .then(([nextVenue, nextMedia]) => {
        if (!nextVenue) throw new Error("Venue media page not found.");
        if (cancelled) return;
        setVenue(nextVenue);
        setMedia(nextMedia);
        trackEvent("owner_media_page_viewed", { venueId: nextVenue.id, city: nextVenue.city, area: nextVenue.area });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load venue media.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  async function handleSaveMetadata(input: { altText: string; caption: string }) {
    if (!user || !editing) return;
    const updated = await updateOwnerVenueMediaMetadata({ userId: user.id, mediaId: editing.id, altText: input.altText, caption: input.caption });
    setMedia((current) => current.map((item) => item.id === updated.id ? updated : item));
    trackEvent("owner_media_metadata_updated", { venueId: updated.venueId, mediaId: updated.id, reviewStatus: updated.reviewStatus });
  }

  async function handleDelete(item: VenueMedia) {
    if (!user) return;
    await deleteOwnerPendingMedia({ userId: user.id, mediaId: item.id });
    setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id));
    trackEvent("owner_media_pending_deleted", { venueId: item.venueId, mediaId: item.id, reviewStatus: item.reviewStatus });
  }

  return (
    <OwnerLayout>
      <PageMeta title={venue ? `${venue.name} photos | nokta` : "Venue photos | nokta"} description="Upload and manage venue photos for review." canonicalPath={venue ? `/owner/venues/${venue.slug}/photos` : undefined} />
      {isLoading ? <LoadingState message="Loading venue photos..." /> : error || !venue || !user ? <ErrorState title="Venue media not found" message={error ?? "You do not have access to this venue media page."} /> : (
        <OwnerVenueTabShell
          venue={venue}
          title="Photos"
          actions={<Button asChild variant="outline" className="h-[34px] text-[13px]"><Link to={`/venues/${venue.slug}`}>Preview public page</Link></Button>}
        >
        <div className="space-y-5">
          <p className="text-[13px] text-muted-foreground">Upload original venue photos for admin review. Approved photos appear on the public venue page.</p>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <OwnerMediaUploader venue={venue} userId={user.id} onUploaded={(item) => setMedia((current) => [item, ...current])} />
              <OwnerMediaGrid media={media} legacyImages={venue.images} onEdit={setEditing} onDelete={handleDelete} />
            </div>
            <OwnerMediaGuidelines />
          </div>
          {editing ? <OwnerMediaMetadataDialog media={editing} onClose={() => setEditing(null)} onSave={handleSaveMetadata} /> : null}
        </div>
        </OwnerVenueTabShell>
      )}
    </OwnerLayout>
  );
}
