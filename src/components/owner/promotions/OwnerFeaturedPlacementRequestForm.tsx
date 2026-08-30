import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateOwnerPromotionRequestInput } from "@/lib/ownerPromotionRequestValidation";
import type { OwnerPromotionPlacementType, OwnerPromotionRequestInput } from "@/types/ownerPromotionRequests";
import type { Venue } from "@/types/venue";

const PLACEMENT_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "city", label: "City" },
  { value: "area", label: "Area" },
  { value: "discover", label: "Discover" },
  { value: "recommendation", label: "Recommendation" },
];

export function OwnerFeaturedPlacementRequestForm({ venue, onSubmit, isSubmitting }: { venue: Venue; onSubmit: (request: OwnerPromotionRequestInput) => Promise<void>; isSubmitting: boolean }) {
  const initialDates = useMemo(getInitialDates, []);
  const [values, setValues] = useState({
    placementType: "city" as OwnerPromotionPlacementType,
    requestedCity: venue.city,
    requestedArea: venue.area,
    title: `${venue.name} featured placement`,
    description: "",
    requestedStartsAt: initialDates.startsAt,
    requestedEndsAt: initialDates.endsAt,
    ownerNotes: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const input: OwnerPromotionRequestInput = { venueId: venue.id, requestType: "featured_placement", ...values };
  const validation = validateOwnerPromotionRequestInput(input);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">Featured placements are reviewed by Sheesha before they go live.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Venue"><Input value={venue.name} disabled /></Field>
        <Field label="Placement type" error={showErrors ? validation.errors.placementType : undefined}><Select value={values.placementType} onValueChange={(value) => setValues({ ...values, placementType: value as OwnerPromotionPlacementType })} options={PLACEMENT_TYPES} /></Field>
        <Field label="City" error={showErrors ? validation.errors.requestedCity : undefined}><Input value={values.requestedCity} onChange={(event) => setValues({ ...values, requestedCity: event.target.value })} /></Field>
        <Field label="Area" error={showErrors ? validation.errors.requestedArea : undefined}><Input value={values.requestedArea} onChange={(event) => setValues({ ...values, requestedArea: event.target.value })} /></Field>
        <Field label="Title" error={showErrors ? validation.errors.title : undefined}><Input value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /></Field>
        <Field label="Start date"><Input type="datetime-local" value={values.requestedStartsAt} onChange={(event) => setValues({ ...values, requestedStartsAt: event.target.value })} /></Field>
        <Field label="End date" error={showErrors ? validation.errors.requestedEndsAt : undefined}><Input type="datetime-local" value={values.requestedEndsAt} onChange={(event) => setValues({ ...values, requestedEndsAt: event.target.value })} /></Field>
      </div>
      <Field label="Description" error={showErrors ? validation.errors.description : undefined} className="mt-4"><Textarea value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} /></Field>
      <Field label="Owner notes" error={showErrors ? validation.errors.ownerNotes : undefined} className="mt-4"><Textarea value={values.ownerNotes} onChange={(event) => setValues({ ...values, ownerNotes: event.target.value })} /></Field>
      {validation.warnings.length ? <p className="mt-4 text-sm text-muted-foreground">{validation.warnings[0]}</p> : null}
      <Button type="submit" className="mt-5" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit request"}</Button>
    </form>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="text-sm font-medium">{label}</span><span className="mt-2 block">{children}</span>{error ? <span className="mt-1 block text-sm text-destructive">{error}</span> : null}</label>;
}

function getInitialDates() {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  return { startsAt: toDateTimeLocal(start), endsAt: toDateTimeLocal(end) };
}

function toDateTimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
