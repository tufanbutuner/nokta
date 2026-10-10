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

/**
 * Vercel invokes `api/` functions with the classic (request, response) pair and
 * waits for `response` to be answered. Returning a web `Response` instead leaves
 * the request hanging forever, so this handler speaks the Node signature.
 */
type HandlerRequest = {
  method?: string;
  body?: unknown;
  json?: () => Promise<unknown>;
};

type HandlerResponse = {
  status: (code: number) => HandlerResponse;
  json: (body: unknown) => void;
};

async function readBody(request: HandlerRequest): Promise<unknown> {
  // The Node runtime parses JSON bodies itself, so `body` is usually already there.
  if (request.body !== undefined && request.body !== null) return request.body;
  if (typeof request.json === "function") return request.json();
  throw new Error("Request body is unavailable.");
}

export default async function handler(request: HandlerRequest, response: HandlerResponse): Promise<void> {
  const fail = (status: number, error: string) => {
    response.status(status).json({ error });
  };

  if (request.method !== "POST") {
    fail(405, "Method not allowed.");
    return;
  }

  const functionUrl = process.env.SUPABASE_URL;
  const secret = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!functionUrl || !secret) {
    console.error("send-notification-email proxy is not configured.");
    fail(500, "Email delivery is not configured.");
    return;
  }

  let body: RequestBody;
  try {
    body = (await readBody(request)) as RequestBody;
  } catch {
    fail(400, "Invalid request body.");
    return;
  }

  // Forward only known identifiers, and only when they are well formed. The edge
  // function re-derives every recipient from these ids, so nothing else is needed
  // and anything else would just widen what a caller can influence.
  const forwarded: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const value = body[key];
    if (value === undefined || value === null) continue;
    if (!isUuid(value)) {
      fail(400, `${key} must be a UUID.`);
      return;
    }
    forwarded[key] = value;
  }

  if (Object.keys(forwarded).length === 0) {
    fail(400, "notificationId, bookingRequestId or enquiryId is required.");
    return;
  }

  const upstream = await fetch(`${functionUrl.replace(/\/$/, "")}/functions/v1/send-notification-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-notification-secret": secret },
    body: JSON.stringify(forwarded),
  });

  const result = await upstream.json().catch(() => ({}));
  response.status(upstream.status).json(result);
}
