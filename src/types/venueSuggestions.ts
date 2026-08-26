export type VenueSuggestionStatus = "pending" | "approved" | "rejected" | "converted";

export interface VenueSuggestion {
  id: string;
  submittedBy: string | null;
  venueName: string;
  country: string;
  city: string;
  area: string | null;
  address: string | null;
  postcode: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  notes: string | null;
  status: VenueSuggestionStatus;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSuggestionInput {
  venueName: string;
  country: string;
  city: string;
  area?: string | null;
  address?: string | null;
  postcode?: string | null;
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
  notes?: string | null;
}
