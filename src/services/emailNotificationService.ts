export interface EmailNotificationPayload {
  to: string;
  subject: string;
  bodyText: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export async function sendEmailNotification(_payload: EmailNotificationPayload): Promise<{ success: boolean; provider?: string; providerMessageId?: string | null; errorMessage?: string | null }> {
  return { success: false, provider: "none", providerMessageId: null, errorMessage: "Email provider is not configured." };
}
