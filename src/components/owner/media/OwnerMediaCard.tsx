import { Button } from "@/components/ui/button";
import { OwnerMediaStatusBadge } from "@/components/owner/media/OwnerMediaStatusBadge";
import type { VenueMedia } from "@/types/venueMedia";

export function OwnerMediaCard({ media, onEdit, onDelete }: { media: VenueMedia; onEdit?: (media: VenueMedia) => void; onDelete?: (media: VenueMedia) => void }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <img src={media.url} alt={media.altText ?? "Venue upload"} className="aspect-[4/3] w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OwnerMediaStatusBadge status={media.reviewStatus} />
          <span className="text-xs text-muted-foreground">{formatFileSize(media.fileSizeBytes)}</span>
        </div>
        {media.caption ? <p className="text-sm font-medium">{media.caption}</p> : null}
        {media.altText ? <p className="text-xs text-muted-foreground">Alt: {media.altText}</p> : null}
        {media.width && media.height ? <p className="text-xs text-muted-foreground">{media.width} x {media.height}</p> : null}
        {media.reviewStatus === "rejected" && media.reviewNotes ? <p className="text-sm text-red-700">Admin notes: {media.reviewNotes}</p> : null}
        <div className="flex flex-wrap gap-2">
          {media.reviewStatus !== "approved" && onEdit ? <Button type="button" size="sm" variant="outline" onClick={() => onEdit(media)}>Edit details</Button> : null}
          {media.reviewStatus === "pending" && onDelete ? <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(media)}>Delete</Button> : null}
        </div>
      </div>
    </article>
  );
}

function formatFileSize(size: number | null) {
  if (!size) return "Size unknown";
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
