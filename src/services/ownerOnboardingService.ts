import { trackEvent } from "@/lib/analytics";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import type { OwnerOnboardingTaskRow } from "@/types/database";
import type { OwnerOnboardingTask, OwnerOnboardingTaskKey, OwnerOnboardingTaskStatus } from "@/types/ownerOnboarding";

export const OWNER_ONBOARDING_TASK_KEYS: OwnerOnboardingTaskKey[] = [
  "claim_approved",
  "review_profile",
  "upload_photos",
  "configure_availability",
  "test_booking",
  "enable_notifications",
  "review_pricing",
];

function ensureSupabase() {
  if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  return supabase;
}

export async function getOwnerOnboardingTasks(input: { venueId: string; userId: string }): Promise<OwnerOnboardingTask[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("owner_onboarding_tasks")
    .select("*")
    .eq("venue_id", input.venueId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Could not load onboarding tasks: ${error.message}`);
  return ((data ?? []) as OwnerOnboardingTaskRow[]).map(mapOwnerOnboardingTaskRow);
}

export async function initialiseOwnerOnboardingTasks(input: { venueId: string; userId: string }): Promise<OwnerOnboardingTask[]> {
  const client = ensureSupabase();
  const now = new Date().toISOString();
  const rows = OWNER_ONBOARDING_TASK_KEYS.map((taskKey) => ({
    venue_id: input.venueId,
    user_id: input.userId,
    task_key: taskKey,
    status: taskKey === "claim_approved" ? "completed" : "pending",
    completed_at: taskKey === "claim_approved" ? now : null,
    updated_at: now,
  }));

  const { error } = await client.from("owner_onboarding_tasks").upsert(rows, { onConflict: "venue_id,user_id,task_key", ignoreDuplicates: true });
  if (error) throw new Error(`Could not initialise onboarding tasks: ${error.message}`);
  return getOwnerOnboardingTasks(input);
}

export async function markOwnerOnboardingTaskCompleted(input: { venueId: string; userId: string; taskKey: OwnerOnboardingTaskKey }): Promise<void> {
  await updateOwnerOnboardingTask({ ...input, status: "completed", completedAt: new Date().toISOString() });
  trackEvent("owner_onboarding_task_completed", { venueId: input.venueId, taskKey: input.taskKey });
}

export async function skipOwnerOnboardingTask(input: { venueId: string; userId: string; taskKey: OwnerOnboardingTaskKey }): Promise<void> {
  await updateOwnerOnboardingTask({ ...input, status: "skipped", completedAt: null });
}

async function updateOwnerOnboardingTask(input: { venueId: string; userId: string; taskKey: OwnerOnboardingTaskKey; status: OwnerOnboardingTaskStatus; completedAt: string | null }) {
  const client = ensureSupabase();
  const { error } = await client
    .from("owner_onboarding_tasks")
    .update({ status: input.status, completed_at: input.completedAt, updated_at: new Date().toISOString() })
    .eq("venue_id", input.venueId)
    .eq("user_id", input.userId)
    .eq("task_key", input.taskKey);

  if (error) throw new Error(`Could not update onboarding task: ${error.message}`);
}

function mapOwnerOnboardingTaskRow(row: OwnerOnboardingTaskRow): OwnerOnboardingTask {
  return {
    id: row.id,
    venueId: row.venue_id,
    userId: row.user_id,
    taskKey: row.task_key,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
