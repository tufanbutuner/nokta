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
  const { data, error } = await client.functions.invoke<{ processed?: number; error?: string }>("send-notification-email", { body: input });
  if (error) throw new Error(`Could not send notification email: ${error.message}`);
  if (data?.error) throw new Error(`Could not send notification email: ${data.error}`);
  if ((data?.processed ?? 0) > 0) return;

  await new Promise((resolve) => window.setTimeout(resolve, 750));
  const retry = await client.functions.invoke<{ processed?: number; error?: string }>("send-notification-email", { body: input });
  if (retry.error) throw new Error(`Could not send notification email: ${retry.error.message}`);
  if (retry.data?.error) throw new Error(`Could not send notification email: ${retry.data.error}`);
  if ((retry.data?.processed ?? 0) === 0) throw new Error("Could not send notification email: no pending email notification was found.");
}
