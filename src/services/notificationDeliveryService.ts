import { trackEvent } from "@/lib/analytics";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { NotificationDeliveryChannel } from "@/types/notifications";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function createNotificationDeliveryLogs(input: { notificationId: string; channels: NotificationDeliveryChannel[] }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("notification_delivery_logs").insert(input.channels.map((channel) => ({
    notification_id: input.notificationId,
    channel,
    status: channel === "in_app" ? "delivered" : "skipped",
    provider: channel === "email" ? "none" : null,
    attempted_at: new Date().toISOString(),
    delivered_at: channel === "in_app" ? new Date().toISOString() : null,
  })));
  if (error) throw new Error(`Could not create delivery logs: ${error.message}`);
}

export async function processEmailNotification(input: { notificationId: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from("notification_delivery_logs")
    .update({ status: "skipped", provider: "none", attempted_at: new Date().toISOString(), error_message: "Email provider is not configured." })
    .eq("notification_id", input.notificationId)
    .eq("channel", "email");
  if (error) throw new Error(`Could not process email notification: ${error.message}`);
  trackEvent("notification_email_skipped", { channel: "email" });
}
