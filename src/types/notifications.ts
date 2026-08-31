export type NotificationRecipientType = "owner" | "customer" | "admin";

export type NotificationType =
  | "booking_request_submitted"
  | "booking_request_accepted"
  | "booking_request_declined"
  | "booking_alternative_proposed"
  | "booking_alternative_accepted"
  | "booking_alternative_declined"
  | "booking_cancelled"
  | "enquiry_submitted"
  | "media_upload_approved"
  | "media_upload_rejected"
  | "promotion_request_approved"
  | "promotion_request_rejected"
  | "venue_update_approved"
  | "venue_update_rejected"
  | "billing_subscription_updated"
  | "system";

export type NotificationRelatedEntityType = "booking_request" | "venue_enquiry" | "venue_media" | "promotion_request" | "venue_update_request" | "subscription" | "venue";
export type NotificationDeliveryChannel = "in_app" | "email";

export interface Notification {
  id: string;
  recipientUserId: string | null;
  recipientEmail: string | null;
  recipientType: NotificationRecipientType;
  notificationType: NotificationType;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  relatedEntityType: NotificationRelatedEntityType | null;
  relatedEntityId: string | null;
  venueId: string | null;
  bookingRequestId: string | null;
  enquiryId: string | null;
  deliveryChannels: NotificationDeliveryChannel[];
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  recipientUserId?: string | null;
  recipientEmail?: string | null;
  recipientType: NotificationRecipientType;
  notificationType: NotificationType;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  relatedEntityType?: NotificationRelatedEntityType | null;
  relatedEntityId?: string | null;
  venueId?: string | null;
  bookingRequestId?: string | null;
  enquiryId?: string | null;
  deliveryChannels?: NotificationDeliveryChannel[];
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  bookingNotificationsInApp: boolean;
  bookingNotificationsEmail: boolean;
  enquiryNotificationsInApp: boolean;
  enquiryNotificationsEmail: boolean;
  marketingNotificationsEmail: boolean;
  createdAt: string;
  updatedAt: string;
}
