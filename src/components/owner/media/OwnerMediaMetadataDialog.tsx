import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VenueMedia } from "@/types/venueMedia";

export function OwnerMediaMetadataDialog({ media, onClose, onSave }: { media: VenueMedia; onClose: () => void; onSave: (input: { altText: string; caption: string }) => Promise<void> }) {
  const [altText, setAltText] = useState(media.altText ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave({ altText, caption });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1500] bg-stone-950/60 p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative mx-auto mt-12 max-w-lg rounded-xl border bg-card p-5 shadow-xl">
        <h2 className="text-xl font-semibold">Edit photo details</h2>
        <img src={media.url} alt={media.altText ?? "Venue upload"} className="mt-4 aspect-[16/9] w-full rounded-lg object-cover" />
        <label className="mt-4 block"><span className="text-sm font-medium">Alt text</span><Input className="mt-2" value={altText} maxLength={140} onChange={(event) => setAltText(event.target.value)} /></label>
        <label className="mt-4 block"><span className="text-sm font-medium">Caption</span><Textarea className="mt-2" value={caption} maxLength={240} onChange={(event) => setCaption(event.target.value)} /></label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}
