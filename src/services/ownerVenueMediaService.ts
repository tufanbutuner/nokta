import { createVenueMediaStoragePath } from "@/lib/mediaFileNames";
import { validateMediaDimensions } from "@/lib/mediaUploadValidation";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { mapVenueMediaRowToMedia } from "@/lib/venueMediaMappers";
import { getMyClaimedVenue } from "@/services/ownerVenueService";
import type { VenueMediaRow } from "@/types/database";
import type { VenueMedia } from "@/types/venueMedia";

export interface OwnerMediaUploadInput {
  venueId: string;
  userId: string;
  file: File;
  altText?: string | null;
  caption?: string | null;
}

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function uploadOwnerVenueMedia(input: OwnerMediaUploadInput): Promise<VenueMedia> {
  const client = ensureSupabase();
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You can only upload photos for venues you manage.");

  if ((input.altText?.length ?? 0) > 140) throw new Error("Alt text must be 140 characters or fewer.");
  if ((input.caption?.length ?? 0) > 240) throw new Error("Caption must be 240 characters or fewer.");

  const validation = await validateMediaDimensions(input.file);
  if (!validation.isValid) throw new Error(validation.errors[0] ?? "Image is invalid.");

  const storagePath = createVenueMediaStoragePath({ venueId: venue.id, userId: input.userId, fileName: input.file.name });
  const upload = await client.storage.from("venue-media").upload(storagePath, input.file, {
    contentType: input.file.type,
    upsert: false,
  });

  if (upload.error) throw new Error(`Could not upload photo: ${upload.error.message}`);
  const { data: publicUrl } = client.storage.from("venue-media").getPublicUrl(storagePath);

  const { data, error } = await client
    .from("venue_media")
    .insert({
      venue_id: venue.id,
      url: publicUrl.publicUrl,
      storage_path: storagePath,
      alt_text: nullableText(input.altText),
      caption: nullableText(input.caption),
      media_type: "image",
      source_type: "owner-uploaded",
      source_url: null,
      is_primary: false,
      sort_order: 0,
      verification_status: "unverified",
      uploaded_by: input.userId,
      uploaded_by_role: "owner",
      review_status: "pending",
      file_name: input.file.name,
      file_size_bytes: input.file.size,
      mime_type: input.file.type,
      width: validation.width,
      height: validation.height,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create media review item: ${error.message}`);
  return mapVenueMediaRowToMedia(data as VenueMediaRow);
}

export async function getOwnerVenueMedia(input: { userId: string; venueId: string }): Promise<VenueMedia[]> {
  const venue = await getMyClaimedVenue({ userId: input.userId, venueId: input.venueId });
  if (!venue) throw new Error("You can only view media for venues you manage.");
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_media")
    .select("*")
    .eq("venue_id", venue.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load venue media: ${error.message}`);
  return ((data ?? []) as VenueMediaRow[]).map(mapVenueMediaRowToMedia);
}

export async function getApprovedVenueMedia(venueId: string): Promise<VenueMedia[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_media")
    .select("*")
    .eq("venue_id", venueId)
    .eq("review_status", "approved")
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load approved venue media: ${error.message}`);
  return ((data ?? []) as VenueMediaRow[]).map(mapVenueMediaRowToMedia);
}

export async function updateOwnerVenueMediaMetadata(input: { userId: string; mediaId: string; altText?: string | null; caption?: string | null }): Promise<VenueMedia> {
  if ((input.altText?.length ?? 0) > 140) throw new Error("Alt text must be 140 characters or fewer.");
  if ((input.caption?.length ?? 0) > 240) throw new Error("Caption must be 240 characters or fewer.");
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_media")
    .update({ alt_text: nullableText(input.altText), caption: nullableText(input.caption) })
    .eq("id", input.mediaId)
    .eq("uploaded_by", input.userId)
    .in("review_status", ["pending", "rejected"])
    .select("*")
    .single();

  if (error) throw new Error(`Could not update media details: ${error.message}`);
  return mapVenueMediaRowToMedia(data as VenueMediaRow);
}

export async function deleteOwnerPendingMedia(input: { userId: string; mediaId: string }): Promise<void> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("venue_media")
    .select("storage_path")
    .eq("id", input.mediaId)
    .eq("uploaded_by", input.userId)
    .eq("review_status", "pending")
    .single();

  if (error) throw new Error(`Could not find pending media: ${error.message}`);
  const storagePath = (data as Pick<VenueMediaRow, "storage_path">).storage_path;
  const { error: deleteError } = await client.from("venue_media").delete().eq("id", input.mediaId).eq("uploaded_by", input.userId).eq("review_status", "pending");
  if (deleteError) throw new Error(`Could not delete pending media: ${deleteError.message}`);
  if (storagePath) await client.storage.from("venue-media").remove([storagePath]);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
