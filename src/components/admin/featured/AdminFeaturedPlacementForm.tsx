import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFeaturedEligibility } from "@/lib/featuredEligibility";
import { validateFeaturedPlacementInput } from "@/lib/featuredPlacementValidation";
import { cn } from "@/lib/utils";
import type { FeaturedPlacement, FeaturedPlacementInput, FeaturedPlacementStatus, FeaturedPlacementType } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";
import { FEATURED_PLACEMENT_STATUS_OPTIONS, FEATURED_PLACEMENT_TYPE_OPTIONS } from "./AdminFeaturedPlacementControls";

export function AdminFeaturedPlacementForm({
  placement,
  venues,
  isLoadingVenues,
  onSave,
  onCancel,
}: {
  placement: FeaturedPlacement | null;
  venues: Venue[];
  isLoadingVenues: boolean;
  onSave: (input: FeaturedPlacementInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<FeaturedPlacementInput>(() => ({
    venueId: placement?.venueId ?? "",
    placementType: placement?.placementType ?? "homepage",
    city: placement?.city ?? "",
    area: placement?.area ?? "",
    title: placement?.title ?? "",
    description: placement?.description ?? "",
    startsAt: toDateTimeLocal(placement?.startsAt) ?? toDateTimeLocal(new Date().toISOString()) ?? "",
    endsAt: toDateTimeLocal(placement?.endsAt) ?? toDateTimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) ?? "",
    status: placement?.status ?? "draft",
    priority: placement?.priority ?? 0,
  }));
  const [showErrors, setShowErrors] = useState(false);
  const selectedVenue = venues.find((venue) => venue.id === values.venueId);
  const validation = validateFeaturedPlacementInput(values, selectedVenue);
  const eligibility = selectedVenue ? getFeaturedEligibility(selectedVenue) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSave(toIsoInput(values));
  }

  function update<K extends keyof FeaturedPlacementInput>(key: K, value: FeaturedPlacementInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="rounded-xl border bg-card p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{placement ? "Edit placement" : "New placement"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Active placements are blocked unless the selected venue is eligible.</p>
        </div>
        {placement ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel edit</Button> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Venue" error={showErrors ? validation.errors.venueId : undefined}>
          <Select value={values.venueId} onChange={(event) => update("venueId", event.target.value)} disabled={isLoadingVenues} options={[{ label: "Choose venue", value: "" }, ...venues.map((venue) => ({ label: `${venue.name} · ${venue.city}`, value: venue.id }))]} />
        </Field>
        <Field label="Placement type" error={showErrors ? validation.errors.placementType : undefined}>
          <Select value={values.placementType} onChange={(event) => update("placementType", event.target.value as FeaturedPlacementType)} options={FEATURED_PLACEMENT_TYPE_OPTIONS} />
        </Field>
        <Field label="City" error={showErrors ? validation.errors.city : undefined}>
          <Input value={values.city ?? ""} onChange={(event) => update("city", event.target.value)} />
        </Field>
        <Field label="Area" error={showErrors ? validation.errors.area : undefined}>
          <Input value={values.area ?? ""} onChange={(event) => update("area", event.target.value)} />
        </Field>
        <Field label="Title" error={showErrors ? validation.errors.title : undefined}>
          <Input value={values.title ?? ""} onChange={(event) => update("title", event.target.value)} />
        </Field>
        <Field label="Priority" error={showErrors ? validation.errors.priority : undefined}>
          <Input type="number" min={0} value={values.priority ?? 0} onChange={(event) => update("priority", Number(event.target.value))} />
        </Field>
        <Field label="Starts at" error={showErrors ? validation.errors.startsAt : undefined}>
          <Input type="datetime-local" value={values.startsAt} onChange={(event) => update("startsAt", event.target.value)} />
        </Field>
        <Field label="Ends at" error={showErrors ? validation.errors.endsAt : undefined}>
          <Input type="datetime-local" value={values.endsAt} onChange={(event) => update("endsAt", event.target.value)} />
        </Field>
        <Field label="Status" error={showErrors ? validation.errors.status : undefined}>
          <Select value={values.status} onChange={(event) => update("status", event.target.value as FeaturedPlacementStatus)} options={FEATURED_PLACEMENT_STATUS_OPTIONS} />
        </Field>
        <Field label="Description" error={showErrors ? validation.errors.description : undefined}>
          <Textarea value={values.description ?? ""} onChange={(event) => update("description", event.target.value)} />
        </Field>
      </div>
      {selectedVenue && eligibility ? (
        <div className="mt-4 rounded-lg border bg-background/60 p-3 text-sm">
          <p className={cn("font-medium", eligibility.eligible ? "text-emerald-700" : "text-red-700")}>{eligibility.eligible ? "Eligible for featured" : "Not eligible for active featured"}</p>
          {[...eligibility.blockingReasons, ...eligibility.warnings].length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {[...eligibility.blockingReasons, ...eligibility.warnings].map((message) => <li key={message}>{message}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="mt-5 flex justify-end">
        <Button type="submit">{placement ? "Save placement" : "Create placement"}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 16);
}

function toIsoInput(input: FeaturedPlacementInput): FeaturedPlacementInput {
  return {
    ...input,
    startsAt: new Date(input.startsAt).toISOString(),
    endsAt: new Date(input.endsAt).toISOString(),
    priority: input.priority ?? 0,
  };
}
