export type VenueEnquiryType = "general" | "birthday" | "group" | "football" | "late-night" | "private-hire";

export type VenueEnquiryStatus = "new" | "contacted" | "responded" | "converted" | "closed" | "spam";

export interface VenueEnquiry {
  id: string;
  venueId: string;
  submittedBy: string | null;
  enquiryType: VenueEnquiryType;
  partySize: number | null;
  preferredDate: string | null;
  preferredTime: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  message: string | null;
  status: VenueEnquiryStatus;
  adminNotes: string | null;
  assignedTo: string | null;
  contactedVenueAt: string | null;
  venueResponse: string | null;
  resolvedAt: string | null;
  ownerLastUpdatedBy: string | null;
  ownerLastUpdatedAt: string | null;
  ownerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueEnquiryInput {
  venueId: string;
  enquiryType: VenueEnquiryType;
  partySize?: number | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  message?: string | null;
}
