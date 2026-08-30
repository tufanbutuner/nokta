import type { OwnerPromotionRequestStatus, OwnerPromotionRequestType } from "@/types/ownerPromotionRequests";

export function formatOwnerPromotionRequestType(type: OwnerPromotionRequestType): string {
  if (type === "promoted_offer") return "Promoted offer";
  return "Featured placement";
}

export function formatOwnerPromotionRequestStatus(status: OwnerPromotionRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "converted":
      return "Live";
  }
}
