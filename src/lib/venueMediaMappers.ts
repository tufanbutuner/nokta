import type { VenueMediaRow } from "@/types/database";
import type { VenueMedia } from "@/types/venueMedia";

export function mapVenueMediaRowToMedia(row: VenueMediaRow): VenueMedia {
  return {
    id: row.id,
    venueId: row.venue_id,
    url: row.url,
    storagePath: row.storage_path,
    altText: row.alt_text,
    caption: row.caption,
    mediaType: row.media_type,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
    verificationStatus: row.verification_status,
    uploadedBy: row.uploaded_by,
    uploadedByRole: row.uploaded_by_role,
    reviewStatus: row.review_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
