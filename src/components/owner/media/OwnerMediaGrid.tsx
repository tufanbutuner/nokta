import { OwnerMediaCard } from "@/components/owner/media/OwnerMediaCard";
import type { VenueMedia } from "@/types/venueMedia";

export function OwnerMediaGrid({ media, legacyImages = [], onEdit, onDelete }: { media: VenueMedia[]; legacyImages?: string[]; onEdit: (media: VenueMedia) => void; onDelete: (media: VenueMedia) => void }) {
  const groups = [
    { title: "Pending review", items: media.filter((item) => item.reviewStatus === "pending") },
    { title: "Approved", items: media.filter((item) => item.reviewStatus === "approved") },
    { title: "Rejected", items: media.filter((item) => item.reviewStatus === "rejected") },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Existing public photos</h2>
        {legacyImages.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {legacyImages.map((image, index) => (
              <article key={`${image}-${index}`} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <img src={image} alt={`Existing venue photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <p className="text-sm font-medium">Live on public profile</p>
                  <p className="mt-1 text-xs text-muted-foreground">Legacy venue image</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground">No existing public photos.</div>
        )}
      </section>
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="text-xl font-semibold">{group.title}</h2>
          {group.items.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => <OwnerMediaCard key={item.id} media={item} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground">No {group.title.toLowerCase()} photos.</div>
          )}
        </section>
      ))}
    </div>
  );
}
