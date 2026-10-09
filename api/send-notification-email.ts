/**
 * Server-side proxy for the send-notification-email Supabase Edge Function.
 *
 * That function runs with the service role key and therefore must not be callable
 * by anyone who finds its URL. It cannot require a Supabase JWT either, because
 * signed-out visitors submit booking requests and enquiries and still need the
 * confirmation email to go out.
 *
 * So the edge function authenticates its caller with a shared secret instead, and
 * this proxy is the only place that secret lives. The browser calls this route; the
 * secret stays in Vercel's environment and is never shipped to the client.
 */

const ALLOWED_KEYS = ["notificationId", "bookingRequestId", "enquiryId"] as const;

type RequestBody = Partial<Record<(typeof ALLOWED_KEYS)[number], unknown>>;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const functionUrl = process.env.SUPABASE_URL;
  const secret = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!functionUrl || !secret) {
    console.error("send-notification-email proxy is not configured.");
    return Response.json({ error: "Email delivery is not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Forward only known identifiers, and only when they are well formed. The edge
  // function re-derives every recipient from these ids, so nothing else is needed
  // and anything else would just widen what a caller can influence.
  const forwarded: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const value = body[key];
    if (value === undefined || value === null) continue;
    if (!isUuid(value)) return Response.json({ error: `${key} must be a UUID.` }, { status: 400 });
    forwarded[key] = value;
  }

  if (Object.keys(forwarded).length === 0) {
    return Response.json({ error: "notificationId, bookingRequestId or enquiryId is required." }, { status: 400 });
  }

  const response = await fetch(`${functionUrl.replace(/\/$/, "")}/functions/v1/send-notification-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-notification-secret": secret },
    body: JSON.stringify(forwarded),
  });

  const result = await response.json().catch(() => ({}));
  return Response.json(result, { status: response.status });
}
