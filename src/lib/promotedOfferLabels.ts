import type { PromotedOfferStatus, PromotedOfferType } from "@/types/promotedOffers";

export const PROMOTED_OFFER_TYPE_OPTIONS: { label: string; value: PromotedOfferType }[] = [
  { label: "Food offer", value: "food" },
  { label: "Drink offer", value: "drink" },
  { label: "Birthday package", value: "birthday" },
  { label: "Group booking", value: "group" },
  { label: "Football night", value: "football" },
  { label: "Student night", value: "student" },
  { label: "Private hire", value: "private-hire" },
  { label: "Event", value: "event" },
  { label: "Other", value: "other" },
];

export const PROMOTED_OFFER_STATUS_OPTIONS: { label: string; value: PromotedOfferStatus }[] = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

export function formatPromotedOfferType(type: PromotedOfferType): string {
  return PROMOTED_OFFER_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Offer";
}

export function formatPromotedOfferStatus(status: PromotedOfferStatus): string {
  return PROMOTED_OFFER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Unknown";
}
