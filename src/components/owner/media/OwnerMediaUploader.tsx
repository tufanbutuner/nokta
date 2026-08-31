import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OwnerMediaDropzone } from "@/components/owner/media/OwnerMediaDropzone";
import { validateMediaFile } from "@/lib/mediaUploadValidation";
import { trackEvent } from "@/lib/analytics";
import { uploadOwnerVenueMedia } from "@/services/ownerVenueMediaService";
import type { VenueMedia } from "@/types/venueMedia";
import type { Venue } from "@/types/venue";

export function OwnerMediaUploader({ venue, userId, onUploaded }: { venue: Venue; userId: string; onUploaded: (media: VenueMedia) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleFiles(nextFiles: File[]) {
    const limitedFiles = nextFiles.slice(0, 10);
    setFiles(limitedFiles);
    setMessage(limitedFiles.length < nextFiles.length ? "Only the first 10 files were added." : null);
  }

  async function handleUpload() {
    setIsUploading(true);
    setMessage(null);
    trackEvent("owner_media_upload_started", { venueId: venue.id });
    try {
      for (const file of files) {
        const validation = validateMediaFile(file);
        if (!validation.isValid) throw new Error(`${file.name}: ${validation.errors[0]}`);
        const media = await uploadOwnerVenueMedia({ venueId: venue.id, userId, file, altText, caption });
        onUploaded(media);
        trackEvent("owner_media_upload_completed", { venueId: venue.id, mediaId: media.id, fileType: file.type, fileSizeBucket: getFileSizeBucket(file.size), reviewStatus: media.reviewStatus });
      }
      setFiles([]);
      setAltText("");
      setCaption("");
      setMessage("Photos uploaded for review.");
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Could not upload photos.";
      setMessage(errorMessage);
      trackEvent("owner_media_upload_failed", { venueId: venue.id });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Upload photos</h2>
      <p className="mt-1 text-sm text-muted-foreground">Photos are reviewed by nokta before appearing publicly.</p>
      <div className="mt-5"><OwnerMediaDropzone onFiles={handleFiles} /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label><span className="text-sm font-medium">Alt text</span><Input className="mt-2" value={altText} maxLength={140} onChange={(event) => setAltText(event.target.value)} placeholder={`${venue.name} interior`} /></label>
        <label><span className="text-sm font-medium">Caption</span><Textarea className="mt-2 min-h-10" value={caption} maxLength={240} onChange={(event) => setCaption(event.target.value)} placeholder="Optional short caption" /></label>
      </div>
      {files.length ? <p className="mt-4 text-sm text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"} ready to upload.</p> : null}
      {message ? <Alert className="mt-4">{message}</Alert> : null}
      <Button type="button" className="mt-5" disabled={!files.length || isUploading} onClick={handleUpload}>{isUploading ? "Uploading..." : "Upload for review"}</Button>
    </section>
  );
}

function getFileSizeBucket(size: number) {
  if (size < 1024 * 1024) return "under_1mb";
  if (size < 5 * 1024 * 1024) return "1_5mb";
  return "5_8mb";
}
