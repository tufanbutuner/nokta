import type { NotificationRow, NotificationPreferencesRow } from "@/types/database";
import type { Notification, NotificationPreferences } from "@/types/notifications";

export function mapNotificationRowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    recipientEmail: row.recipient_email,
    recipientType: row.recipient_type,
    notificationType: row.notification_type,
    title: row.title,
    body: row.body,
    actionLabel: row.action_label,
    actionUrl: row.action_url,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    venueId: row.venue_id,
    bookingRequestId: row.booking_request_id,
    enquiryId: row.enquiry_id,
    deliveryChannels: row.delivery_channels as Notification["deliveryChannels"],
    readAt: row.read_at,
    dismissedAt: row.dismissed_at,
    createdAt: row.created_at,
  };
}

export function mapNotificationPreferencesRow(row: NotificationPreferencesRow): NotificationPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    bookingNotificationsInApp: row.booking_notifications_in_app,
    bookingNotificationsEmail: row.booking_notifications_email,
    enquiryNotificationsInApp: row.enquiry_notifications_in_app,
    enquiryNotificationsEmail: row.enquiry_notifications_email,
    marketingNotificationsEmail: row.marketing_notifications_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
