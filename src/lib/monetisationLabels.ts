import type { MonetisationStatus, PartnerTier } from "@/types/monetisation";

export function formatPartnerTier(tier: PartnerTier): string {
  switch (tier) {
    case "none":
      return "None";
    case "starter":
      return "Starter";
    case "growth":
      return "Growth";
    case "pro":
      return "Pro";
  }
}

export function formatMonetisationStatus(status: MonetisationStatus): string {
  switch (status) {
    case "not-contacted":
      return "Not contacted";
    case "contacted":
      return "Contacted";
    case "interested":
      return "Interested";
    case "trial":
      return "Trial";
    case "paying":
      return "Paying";
    case "churned":
      return "Churned";
    case "not-fit":
      return "Not a fit";
  }
}
