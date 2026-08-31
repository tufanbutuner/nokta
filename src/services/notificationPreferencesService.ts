import { mapNotificationPreferencesRow } from "@/lib/notificationMappers";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { NotificationPreferencesRow } from "@/types/database";
import type { NotificationPreferences } from "@/types/notifications";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getMyNotificationPreferences(input: { userId: string }): Promise<NotificationPreferences> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("notification_preferences")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load notification preferences: ${error.message}`);
  if (data) return mapNotificationPreferencesRow(data as NotificationPreferencesRow);
  return createDefaultPreferences(input.userId);
}

export async function updateMyNotificationPreferences(input: { userId: string; preferences: Partial<NotificationPreferences> }): Promise<NotificationPreferences> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("notification_preferences")
    .upsert({
      user_id: input.userId,
      booking_notifications_in_app: input.preferences.bookingNotificationsInApp,
      booking_notifications_email: input.preferences.bookingNotificationsEmail,
      enquiry_notifications_in_app: input.preferences.enquiryNotificationsInApp,
      enquiry_notifications_email: input.preferences.enquiryNotificationsEmail,
      marketing_notifications_email: input.preferences.marketingNotificationsEmail,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Could not update notification preferences: ${error.message}`);
  return mapNotificationPreferencesRow(data as NotificationPreferencesRow);
}

async function createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
  const client = ensureSupabase();
  const { data, error } = await client.from("notification_preferences").insert({ user_id: userId }).select("*").single();
  if (error) throw new Error(`Could not create notification preferences: ${error.message}`);
  return mapNotificationPreferencesRow(data as NotificationPreferencesRow);
}
