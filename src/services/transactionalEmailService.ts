import type { EmailSendResult, TransactionalEmailPayload } from "@/types/emailNotifications";

export async function sendTransactionalEmail(_payload: TransactionalEmailPayload): Promise<EmailSendResult> {
  return { success: false, provider: "noop", providerMessageId: null, errorMessage: "Transactional email is sent from Supabase Edge Functions." };
}
