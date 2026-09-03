import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { Venue } from "@/types/venue";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FavouriteButton } from "@/components/venues/FavouriteButton";

export function PhotoGallery({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  const primaryImage = images[0] ?? getVenueImage(venue);
  const galleryImages = images.length ? images : [primaryImage];
  const galleryCount = galleryImages.length;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const activeImage = galleryImages[activeGalleryIndex] ?? primaryImage;
  const hasMultipleImages = galleryImages.length > 1;

  return (
    <section className="relative bg-nokta-surface">
      <Button asChild variant="secondary" size="icon" className="absolute left-3 top-3 z-20 h-10 w-10 rounded-full bg-stone-950/55 text-white backdrop-blur hover:bg-stone-950/70 sm:hidden" aria-label="Back to discover">
        <Link to="/discover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 z-20 h-10 w-10 bg-stone-950/55 text-white backdrop-blur hover:bg-stone-950/70 sm:hidden [&_svg.fill-foreground]:fill-white" />
      <button type="button" className="block h-[220px] w-full overflow-hidden text-left sm:h-[340px]" onClick={() => onOpenImage(activeGalleryIndex)}>
        <img src={activeImage} alt={`${venue.name} gallery ${activeGalleryIndex + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-[1.015]" />
      </button>
      {hasMultipleImages ? (
        <>
          <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-nokta-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Previous photo" onClick={() => setActiveGalleryIndex((index) => getPreviousImageIndex(index, galleryImages.length))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-nokta-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Next photo" onClick={() => setActiveGalleryIndex((index) => getNextImageIndex(index, galleryImages.length))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      ) : null}
      <PhotoCountBadge current={activeGalleryIndex + 1} total={galleryCount} />
    </section>
  );
}

export function PhotosTab({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2">
        <Camera className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Photos</h2>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <button key={`${image}-${index}`} type="button" className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border bg-card text-left" onClick={() => onOpenImage(index)}>
            <img src={image} alt={`${venue.name} photo ${index + 1}`} className="w-full object-cover transition duration-500 hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function PhotoLightbox({ venue, images, activeIndex, onChange, onClose }: { venue: Venue; images: string[]; activeIndex: number; onChange: (index: number) => void; onClose: () => void }) {
  const activeImage = images[activeIndex] ?? images[0] ?? getVenueImage(venue);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onChange(getPreviousImageIndex(activeIndex, images.length));
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        onChange(getNextImageIndex(activeIndex, images.length));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, hasMultipleImages, images.length, onChange, onClose]);

  return (
    <div className="fixed inset-0 z-[1500] bg-stone-950/90 p-3 text-background sm:p-6" role="dialog" aria-modal="true" aria-label={`${venue.name} photo viewer`}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close photo viewer" onClick={onClose} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{venue.name}</p>
            <p className="text-xs text-background/65">
              Photo {activeIndex + 1} of {images.length}
            </p>
          </div>
          <Button type="button" variant="secondary" size="icon" className="bg-background/10 text-background hover:bg-background/20" aria-label="Close photo viewer" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {hasMultipleImages ? (
            <Button type="button" variant="secondary" size="icon" className="absolute left-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:left-3" aria-label="Previous photo" onClick={() => onChange(getPreviousImageIndex(activeIndex, images.length))}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}

          <img src={activeImage} alt={`${venue.name} expanded photo ${activeIndex + 1}`} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-stone-950/40" />

          {hasMultipleImages ? (
            <Button type="button" variant="secondary" size="icon" className="absolute right-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:right-3" aria-label="Next photo" onClick={() => onChange(getNextImageIndex(activeIndex, images.length))}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button key={`${image}-thumb-${index}`} type="button" className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition", index === activeIndex ? "border-background" : "border-background/20 opacity-65 hover:opacity-100")} aria-label={`Open photo ${index + 1}`} onClick={() => onChange(index)}>
                <img src={image} alt={`${venue.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PhotoCountBadge({ current, total }: { current: number; total: number }) {
  return (
    <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-stone-950/75 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur">
      {current} / {total}
    </span>
  );
}

function getPreviousImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex - 1 + imageCount) % imageCount;
}

function getNextImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex + 1) % imageCount;
}
