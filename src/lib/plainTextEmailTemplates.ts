export function buildPlainTextEmail(input: { title: string; lines: string[]; actionUrl?: string | null; actionLabel?: string | null }): string {
  const parts = [input.title, "", ...input.lines.filter(Boolean)];
  if (input.actionUrl) {
    parts.push("", input.actionLabel ? `${input.actionLabel}:` : "Open link:", input.actionUrl);
  }
  parts.push("", "You received this email because you used nokta for a booking or venue enquiry.");
  return parts.join("\n");
}
