import { trackEvent } from "@/lib/analytics";
import { mapNotificationRowToNotification } from "@/lib/notificationMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { Notification, CreateNotificationInput } from "@/types/notifications";
import type { NotificationRow } from "@/types/database";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("notifications")
    .insert({
      recipient_user_id: input.recipientUserId ?? null,
      recipient_email: input.recipientEmail ?? null,
      recipient_type: input.recipientType,
      notification_type: input.notificationType,
      title: input.title,
      body: input.body,
      action_label: input.actionLabel ?? null,
      action_url: input.actionUrl ?? null,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      venue_id: input.venueId ?? null,
      booking_request_id: input.bookingRequestId ?? null,
      enquiry_id: input.enquiryId ?? null,
      delivery_channels: input.deliveryChannels ?? ["in_app"],
    })
    .select("*")
    .single();
  if (error) throw new Error(`Could not create notification: ${error.message}`);
  const notification = mapNotificationRowToNotification(data as NotificationRow);
  trackEvent("notification_created", getSafeAnalyticsProperties(notification));
  return notification;
}

export async function getMyNotifications(input: { userId: string; includeDismissed?: boolean; limit?: number }): Promise<Notification[]> {
  const client = ensureSupabase();
  let query = client.from("notifications").select("*").eq("recipient_user_id", input.userId).order("created_at", { ascending: false }).limit(input.limit ?? 20);
  if (!input.includeDismissed) query = query.is("dismissed_at", null);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load notifications: ${error.message}`);
  return ((data ?? []) as NotificationRow[]).map(mapNotificationRowToNotification);
}

export async function getMyUnreadNotificationCount(input: { userId: string }): Promise<number> {
  const client = ensureSupabase();
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", input.userId)
    .is("read_at", null)
    .is("dismissed_at", null);
  if (error) throw new Error(`Could not load unread notifications: ${error.message}`);
  return count ?? 0;
}

export async function markNotificationRead(input: { userId: string; notificationId: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", input.notificationId).eq("recipient_user_id", input.userId);
  if (error) throw new Error(`Could not mark notification read: ${error.message}`);
  trackEvent("notification_marked_read");
}

export async function markAllNotificationsRead(input: { userId: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_user_id", input.userId).is("read_at", null);
  if (error) throw new Error(`Could not mark notifications read: ${error.message}`);
  trackEvent("notification_marked_all_read");
}

export async function dismissNotification(input: { userId: string; notificationId: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("notifications").update({ dismissed_at: new Date().toISOString() }).eq("id", input.notificationId).eq("recipient_user_id", input.userId);
  if (error) throw new Error(`Could not dismiss notification: ${error.message}`);
  trackEvent("notification_dismissed");
}

function getSafeAnalyticsProperties(notification: Notification) {
  return {
    notificationType: notification.notificationType,
    recipientType: notification.recipientType,
    relatedEntityType: notification.relatedEntityType,
    hasActionUrl: Boolean(notification.actionUrl),
  };
}
