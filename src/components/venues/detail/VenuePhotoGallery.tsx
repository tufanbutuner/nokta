import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVenueImage } from "@/lib/venueImages";
import type { Venue } from "@/types/venue";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Hero strip inside the content column: one large photo and three small ones, with the
 * gallery button in the bottom-right cell. Photos returns here as a button rather than a tab.
 */
export function PhotoGallery({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  const primaryImage = images[0] ?? getVenueImage(venue);
  const galleryImages = images.length ? images : [primaryImage];
  const stripImages = [0, 1, 2, 3].map((index) => galleryImages[index] ?? galleryImages[index % galleryImages.length]);

  return (
    <section className="grid h-[240px] grid-cols-[2fr_1fr_1fr] gap-[3px] overflow-hidden rounded-[14px]">
      <HeroPhotoCell image={stripImages[0]} venue={venue} index={0} onOpenImage={onOpenImage} />
      <HeroPhotoCell image={stripImages[1]} venue={venue} index={1} onOpenImage={onOpenImage} />
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-[3px]">
        <HeroPhotoCell image={stripImages[2]} venue={venue} index={2} onOpenImage={onOpenImage} />
        <div className="relative min-h-0">
          <HeroPhotoCell image={stripImages[3]} venue={venue} index={3} onOpenImage={onOpenImage} />
          <button type="button" aria-label={`View all ${galleryImages.length} photos`} className="absolute bottom-2.5 right-2.5 inline-flex min-h-[34px] max-w-[calc(100%-1.25rem)] items-center gap-[7px] whitespace-nowrap rounded-lg bg-white px-3 text-[12.5px] font-semibold text-nokta-ink shadow-sm transition-colors hover:bg-nokta-hover" onClick={() => onOpenImage(0)}>
            <Camera className="h-3.5 w-3.5 shrink-0" />
            {/* The cell is narrow on phones, so drop to the bare count rather than clip the label. */}
            <span className="hidden sm:inline">All {galleryImages.length} photos</span>
            <span className="sm:hidden">{galleryImages.length}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function HeroPhotoCell({ image, venue, index, onOpenImage }: { image: string; venue: Venue; index: number; onOpenImage: (index: number) => void }) {
  return (
    <button type="button" className="block h-full min-h-0 w-full overflow-hidden bg-nokta-track text-left" onClick={() => onOpenImage(index)}>
      <img src={image} alt={`${venue.name} photo ${index + 1}`} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
    </button>
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

function getPreviousImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex - 1 + imageCount) % imageCount;
}

function getNextImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex + 1) % imageCount;
}
