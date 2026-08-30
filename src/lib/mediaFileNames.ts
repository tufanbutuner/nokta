export function sanitiseFileName(fileName: string): string {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${safeBaseName || "venue-photo"}${extension ? `.${extension}` : ""}`;
}

export function createVenueMediaStoragePath(input: { venueId: string; userId: string; fileName: string }): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${input.venueId}/owner-uploads/${input.userId}/${timestamp}-${sanitiseFileName(input.fileName)}`;
}
