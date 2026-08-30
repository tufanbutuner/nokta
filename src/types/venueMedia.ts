export type VenueMediaReviewStatus = "pending" | "approved" | "rejected";
export type VenueMediaUploadedByRole = "admin" | "owner";
export type VenueMediaSourceType = "manual" | "venue-owned" | "stock" | "admin-uploaded" | "owner-uploaded";

export interface VenueMedia {
  id: string;
  venueId: string;
  url: string;
  storagePath: string | null;
  altText: string | null;
  caption: string | null;
  mediaType: "image";
  sourceType: VenueMediaSourceType;
  sourceUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  verificationStatus: "unverified" | "partially-verified" | "verified";
  uploadedBy: string | null;
  uploadedByRole: VenueMediaUploadedByRole | null;
  reviewStatus: VenueMediaReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}
