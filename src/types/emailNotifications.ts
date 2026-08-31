export type EmailNotificationTemplate =
  | "booking_request_confirmation"
  | "owner_new_booking_request"
  | "booking_request_accepted"
  | "booking_request_declined"
  | "booking_alternative_proposed"
  | "owner_booking_alternative_accepted"
  | "owner_booking_alternative_declined"
  | "owner_new_enquiry"
  | "owner_media_approved"
  | "owner_media_rejected"
  | "owner_promotion_request_approved"
  | "owner_promotion_request_rejected"
  | "owner_venue_update_approved"
  | "owner_venue_update_rejected";

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface TransactionalEmailPayload {
  to: EmailRecipient;
  template: EmailNotificationTemplate;
  subject: string;
  previewText?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  data: Record<string, string | number | boolean | null | undefined>;
}

export interface EmailSendResult {
  success: boolean;
  provider: "resend" | "noop";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}
