import { trackEvent } from "@/lib/analytics";
import { supabase, supabaseConfigError } from "@/lib/supabase";

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function queueEmailDeliveryForNotification(input: { notificationId?: string; bookingRequestId?: string; enquiryId?: string }): Promise<void> {
  trackEvent("email_notification_queued", { hasActionUrl: true });
  await sendNotificationEmail(input);
}

export async function sendNotificationEmail(input: { notificationId?: string; bookingRequestId?: string; enquiryId?: string }): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.functions.invoke("send-notification-email", {
    body: input,
  });
  if (error) throw new Error(`Could not send notification email: ${error.message}`);
}
