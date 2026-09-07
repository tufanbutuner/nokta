import { escapeEmailHtml } from "@/lib/emailSanitisation";

export function buildBaseEmailHtml(input: { title: string; previewText?: string | null; bodyHtml: string; actionUrl?: string | null; actionLabel?: string | null; footer?: string | null }): string {
  const title = escapeEmailHtml(input.title);
  const preview = input.previewText ? `<div style="display:none;max-height:0;overflow:hidden">${escapeEmailHtml(input.previewText)}</div>` : "";
  const action = input.actionUrl
    ? `<p style="margin:28px 0 10px"><a href="${escapeEmailHtml(input.actionUrl)}" style="display:inline-block;background:#B3543C;color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 18px;font-weight:700">${escapeEmailHtml(input.actionLabel ?? "Open nokta")}</a></p><p style="margin:0;font-size:12px;line-height:1.5;color:#8C7C76;word-break:break-all">${escapeEmailHtml(input.actionUrl)}</p>`
    : "";
  const footer = escapeEmailHtml(input.footer ?? "You received this email because you used nokta for a booking or venue enquiry.");

  return `<!doctype html><html><body style="margin:0;background:#FFF3E6;font-family:Outfit,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1E130F">${preview}<main style="max-width:620px;margin:0 auto;padding:36px 18px"><div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:22px;color:#1E130F">nokta<span style="color:#DB5D2C">.</span></div><section style="background:#FEFDFD;border:1px solid #E2D0C4;border-radius:18px;padding:28px;box-shadow:0 18px 44px rgba(30,19,15,0.06)"><h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#1E130F">${title}</h1><div style="height:1px;background:#E2D0C4;margin:0 0 18px"></div>${input.bodyHtml}${action}</section><p style="margin:18px 4px 0;font-size:12px;line-height:1.6;color:#8C7C76">${footer}</p></main></body></html>`;
}
