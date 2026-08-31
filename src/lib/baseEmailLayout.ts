import { escapeEmailHtml } from "@/lib/emailSanitisation";

export function buildBaseEmailHtml(input: { title: string; previewText?: string | null; bodyHtml: string; actionUrl?: string | null; actionLabel?: string | null; footer?: string | null }): string {
  const title = escapeEmailHtml(input.title);
  const preview = input.previewText ? `<div style="display:none;max-height:0;overflow:hidden">${escapeEmailHtml(input.previewText)}</div>` : "";
  const action = input.actionUrl
    ? `<p style="margin:28px 0 8px"><a href="${escapeEmailHtml(input.actionUrl)}" style="display:inline-block;background:#23201d;color:#fff;text-decoration:none;border-radius:10px;padding:12px 16px;font-weight:700">${escapeEmailHtml(input.actionLabel ?? "Open nokta")}</a></p><p style="font-size:12px;color:#766b60;word-break:break-all">${escapeEmailHtml(input.actionUrl)}</p>`
    : "";
  const footer = escapeEmailHtml(input.footer ?? "You received this email because you used nokta for a booking or venue enquiry.");

  return `<!doctype html><html><body style="margin:0;background:#f7f3ed;font-family:Arial,sans-serif;color:#23201d">${preview}<main style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="font-size:22px;font-weight:800;letter-spacing:0.02em;margin-bottom:22px">nokta</div><section style="background:#fff;border:1px solid #ebe2d7;border-radius:16px;padding:28px"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.2">${title}</h1>${input.bodyHtml}${action}</section><p style="margin:18px 4px 0;font-size:12px;line-height:1.6;color:#766b60">${footer}</p></main></body></html>`;
}
