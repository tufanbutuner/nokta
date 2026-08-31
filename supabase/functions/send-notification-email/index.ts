import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationType =
  | "booking_request_submitted"
  | "booking_request_accepted"
  | "booking_request_declined"
  | "booking_alternative_proposed"
  | "booking_alternative_accepted"
  | "booking_alternative_declined"
  | "booking_cancelled"
  | "enquiry_submitted";

interface NotificationRow {
  id: string;
  recipient_email: string | null;
  recipient_type: "owner" | "customer" | "admin";
  notification_type: NotificationType;
  action_url: string | null;
  action_label: string | null;
  booking_request_id: string | null;
  enquiry_id: string | null;
  venue_id: string | null;
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...init.headers },
  });
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, { status: 405 });

  const supabase = createAdminClient();

  try {
    const { notificationId, deliveryLogId, bookingRequestId, enquiryId } = await request.json();
    console.log("send-notification-email request", { notificationId, deliveryLogId, bookingRequestId, enquiryId });
    const notifications = await getTargetNotifications(supabase, { notificationId, deliveryLogId, bookingRequestId, enquiryId });
    console.log("send-notification-email targets", { count: notifications.length });
    const results = [];

    for (const notification of notifications) {
      results.push(await sendNotification(supabase, notification));
    }

    return jsonResponse({ processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send notification email.";
    return jsonResponse({ error: message }, { status: 500 });
  }
});

async function getTargetNotifications(supabase: ReturnType<typeof createAdminClient>, input: { notificationId?: string; deliveryLogId?: string; bookingRequestId?: string; enquiryId?: string }) {
  if (typeof input.deliveryLogId === "string") {
    const { data, error } = await supabase
      .from("notification_delivery_logs")
      .select("notifications(*)")
      .eq("id", input.deliveryLogId)
      .eq("channel", "email")
      .eq("status", "pending")
      .maybeSingle();
    if (error) throw error;
    const notification = data?.notifications;
    return notification ? [notification as NotificationRow] : [];
  }

  let query = supabase
    .from("notification_delivery_logs")
    .select("notifications(*)")
    .eq("channel", "email")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (typeof input.notificationId === "string") query = query.eq("notification_id", input.notificationId);
  else if (typeof input.bookingRequestId === "string") query = query.eq("notifications.booking_request_id", input.bookingRequestId);
  else if (typeof input.enquiryId === "string") query = query.eq("notifications.enquiry_id", input.enquiryId);
  else throw new Error("notificationId, bookingRequestId or enquiryId is required.");

  const { data, error } = await query.limit(10);
  if (error) throw error;
  return ((data ?? []) as { notifications: NotificationRow | null }[]).map((row) => row.notifications).filter(Boolean) as NotificationRow[];
}

async function sendNotification(supabase: ReturnType<typeof createAdminClient>, notification: NotificationRow) {
  console.log("send-notification-email processing", { notificationId: notification.id, type: notification.notification_type, recipientType: notification.recipient_type });
  const { data: log, error: logError } = await supabase
    .from("notification_delivery_logs")
    .select("id,status")
    .eq("notification_id", notification.id)
    .eq("channel", "email")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (logError) throw logError;
  if (!log) {
    console.log("send-notification-email no pending log", { notificationId: notification.id });
    return { notificationId: notification.id, status: "skipped", reason: "No email delivery log." };
  }

  if (!notification.recipient_email) {
    await updateLog(supabase, log.id, { status: "skipped", provider: "noop", error_message: "Recipient email is missing." });
    return { notificationId: notification.id, status: "skipped", reason: "Recipient email is missing." };
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("send-notification-email skipped", { notificationId: notification.id, reason: "missing_resend_api_key" });
    await updateLog(supabase, log.id, { status: "skipped", provider: "noop", error_message: "RESEND_API_KEY is not configured." });
    return { notificationId: notification.id, status: "skipped", reason: "RESEND_API_KEY is not configured." };
  }

  const email = await buildEmail(supabase, notification);
  const fromName = Deno.env.get("EMAIL_FROM_NAME") ?? "Sheesha";
  const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS");
  if (!fromAddress) {
    console.log("send-notification-email skipped", { notificationId: notification.id, reason: "missing_from_address" });
    await updateLog(supabase, log.id, { status: "skipped", provider: "noop", error_message: "EMAIL_FROM_ADDRESS is not configured." });
    return { notificationId: notification.id, status: "skipped", reason: "EMAIL_FROM_ADDRESS is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [notification.recipient_email],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof result?.message === "string" ? result.message : "Resend email send failed.";
    console.log("send-notification-email failed", { notificationId: notification.id, reason: safeError(message) });
    await updateLog(supabase, log.id, { status: "failed", provider: "resend", error_message: safeError(message) });
    return { notificationId: notification.id, status: "failed", reason: safeError(message) };
  }

  await updateLog(supabase, log.id, { status: "sent", provider: "resend", provider_message_id: typeof result?.id === "string" ? result.id : null, error_message: null, delivered_at: new Date().toISOString() });
  console.log("send-notification-email sent", { notificationId: notification.id, providerMessageId: typeof result?.id === "string" ? result.id : null });
  return { notificationId: notification.id, status: "sent" };
}

async function buildEmail(supabase: ReturnType<typeof createAdminClient>, notification: NotificationRow) {
  if (notification.booking_request_id) {
    const { data, error } = await supabase.from("booking_requests").select("*,venues(name)").eq("id", notification.booking_request_id).single();
    if (error) throw error;
    return buildBookingEmail(notification, data);
  }
  if (notification.enquiry_id) {
    const { data, error } = await supabase.from("venue_enquiries").select("*,venues(name)").eq("id", notification.enquiry_id).single();
    if (error) throw error;
    return buildEnquiryEmail(notification, data);
  }
  return buildGenericEmail(notification);
}

function buildBookingEmail(notification: NotificationRow, booking: Record<string, any>) {
  const venueName = clean(booking.venues?.name ?? "your venue");
  const statusUrl = notification.action_url ? absoluteUrl(notification.action_url) : null;
  const requested = `${clean(booking.requested_date)} ${clean(booking.requested_time)}`.trim();
  const proposed = `${clean(booking.proposed_date)} ${clean(booking.proposed_time)}`.trim();
  const reference = clean(booking.confirmation_reference ?? "Pending");
  const party = booking.party_size ? `${booking.party_size} people` : "";
  const common = [`Venue: ${venueName}`, `Requested: ${requested}`, `Party size: ${party}`, `Reference: ${reference}`].filter(Boolean);

  switch (notification.notification_type) {
    case "booking_request_submitted":
      if (notification.recipient_type === "owner") return renderEmail({ subject: `New booking request for ${venueName}`, lines: [`You have a new booking request for ${venueName}.`, ...common, `Customer: ${clean(booking.customer_name)}`, `Email: ${clean(booking.customer_email)}`, optional("Phone", booking.customer_phone), optional("Occasion", booking.occasion)], actionUrl: statusUrl ?? absoluteUrl("/owner/bookings"), actionLabel: "Manage booking", owner: true });
      return renderEmail({ subject: "Your booking request has been sent", lines: [`Your booking request for ${venueName} has been sent.`, "This is not confirmed yet. The venue will review your request.", ...common], actionUrl: statusUrl, actionLabel: "View booking status" });
    case "booking_request_accepted":
      return renderEmail({ subject: "Your booking is confirmed", lines: [`${venueName} has accepted your booking request. Your booking is confirmed.`, ...common], actionUrl: statusUrl, actionLabel: "View booking status" });
    case "booking_request_declined":
      return renderEmail({ subject: "Your booking request was declined", lines: [`${venueName} was unable to accept your booking request.`, ...common, optional("Venue message", booking.owner_response_message)], actionUrl: statusUrl, actionLabel: "View booking status" });
    case "booking_alternative_proposed":
      return renderEmail({ subject: `${venueName} proposed another booking time`, lines: [`${venueName} has suggested another date or time for your booking.`, `Original request: ${requested}`, `Proposed: ${proposed}`, `Party size: ${party}`, optional("Venue message", booking.proposed_message)], actionUrl: statusUrl, actionLabel: "Review alternative" });
    case "booking_alternative_accepted":
      return renderEmail({ subject: "Customer accepted your proposed booking time", lines: [`The customer accepted your proposed booking time for ${venueName}.`, ...common, `Customer: ${clean(booking.customer_name)}`], actionUrl: absoluteUrl("/owner/bookings"), actionLabel: "View booking", owner: true });
    case "booking_alternative_declined":
      return renderEmail({ subject: "Customer declined your proposed booking time", lines: [`The customer declined your proposed booking time for ${venueName}.`, `Original request: ${requested}`, `Proposed: ${proposed}`, `Party size: ${party}`, `Customer: ${clean(booking.customer_name)}`, optional("Customer response", booking.customer_alternative_response_message)], actionUrl: absoluteUrl("/owner/bookings"), actionLabel: "View booking", owner: true });
    case "booking_cancelled":
      return renderEmail({ subject: "Your booking was cancelled", lines: [`${venueName} cancelled this booking.`, ...common], actionUrl: statusUrl, actionLabel: "View booking status" });
    default:
      return buildGenericEmail(notification);
  }
}

function buildEnquiryEmail(notification: NotificationRow, enquiry: Record<string, any>) {
  const venueName = clean(enquiry.venues?.name ?? "your venue");
  return renderEmail({
    subject: `New enquiry for ${venueName}`,
    lines: [`You have a new enquiry for ${venueName}.`, optional("Type", enquiry.enquiry_type), `Customer: ${clean(enquiry.customer_name)}`, `Email: ${clean(enquiry.customer_email)}`, optional("Phone", enquiry.customer_phone), optional("Message", enquiry.message)],
    actionUrl: absoluteUrl(notification.action_url ?? "/owner/enquiries"),
    actionLabel: notification.action_label ?? "View enquiries",
    owner: true,
  });
}

function buildGenericEmail(notification: NotificationRow) {
  return renderEmail({ subject: clean(notification.notification_type), lines: ["There is a new Sheesha notification."], actionUrl: notification.action_url ? absoluteUrl(notification.action_url) : null, actionLabel: notification.action_label });
}

function renderEmail(input: { subject: string; lines: string[]; actionUrl?: string | null; actionLabel?: string | null; owner?: boolean }) {
  const lines = input.lines.filter(Boolean).map((line) => truncate(clean(line), 700));
  const actionHtml = input.actionUrl ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#23201d;color:#fff;text-decoration:none;border-radius:10px;padding:12px 16px;font-weight:700">${escapeHtml(input.actionLabel ?? "Open Sheesha")}</a></p><p style="font-size:12px;color:#766b60;word-break:break-all">${escapeHtml(input.actionUrl)}</p>` : "";
  const htmlLines = lines.map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`).join("");
  const footer = input.owner ? "You received this email because you manage a venue on Sheesha." : "You received this email because you used Sheesha for a booking or venue enquiry.";
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ed;font-family:Arial,sans-serif;color:#23201d"><main style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:22px">sheesh.</div><section style="background:#fff;border:1px solid #ebe2d7;border-radius:16px;padding:28px"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.2">${escapeHtml(input.subject)}</h1><div style="font-size:15px;line-height:1.7;color:#423b35">${htmlLines}</div>${actionHtml}</section><p style="margin:18px 4px 0;font-size:12px;line-height:1.6;color:#766b60">${escapeHtml(footer)}</p></main></body></html>`;
  const text = [input.subject, "", ...lines, ...(input.actionUrl ? ["", input.actionLabel ?? "Open Sheesha", input.actionUrl] : []), "", footer].join("\n");
  return { subject: input.subject, html, text };
}

async function updateLog(supabase: ReturnType<typeof createAdminClient>, deliveryLogId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("notification_delivery_logs")
    .update({ ...updates, attempted_at: new Date().toISOString() })
    .eq("id", deliveryLogId);
  if (error) throw error;
}

function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const appUrl = Deno.env.get("APP_URL") ?? Deno.env.get("LIVE_APP_URL") ?? "http://localhost:5173";
  return `${appUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function optional(label: string, value: unknown) {
  const next = clean(value);
  return next ? `${label}: ${next}` : "";
}

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#039;");
}

function safeError(value: string) {
  return truncate(clean(value), 300);
}
