export type OwnerOnboardingTaskKey =
  | "claim_approved"
  | "review_profile"
  | "upload_photos"
  | "configure_availability"
  | "test_booking"
  | "enable_notifications"
  | "review_pricing";

export type OwnerOnboardingTaskStatus = "pending" | "completed" | "skipped";

export interface OwnerOnboardingTask {
  id: string;
  venueId: string;
  userId: string;
  taskKey: OwnerOnboardingTaskKey;
  status: OwnerOnboardingTaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
