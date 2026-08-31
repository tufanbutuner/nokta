export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitiseEmailText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function truncateEmailText(input: { value: string | null | undefined; maxLength: number }): string {
  const value = sanitiseEmailText(input.value);
  if (value.length <= input.maxLength) return value;
  return `${value.slice(0, Math.max(0, input.maxLength - 1)).trim()}...`;
}
