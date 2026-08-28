import { useMemo, useState, type FormEvent } from "react";
import { OwnerVenueUpdateDiffPreview } from "@/components/owner/updates/OwnerVenueUpdateDiffPreview";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateVenueUpdateRequestInput } from "@/lib/venueUpdateRequestValidation";
import type { VenueProfileUpdateChanges, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";
import type { Venue, VenueVibe } from "@/types/venue";

const FEATURE_OPTIONS = [
  { label: "Food", value: "food" },
  { label: "Alcohol", value: "alcohol" },
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Open late", value: "openLate" },
];

const VIBE_OPTIONS: VenueVibe[] = ["casual", "luxury", "date-night", "groups", "football", "late-night", "quiet", "party", "rooftop", "outdoor"];

export function OwnerVenueUpdateForm({ venue, onSubmit, isSubmitting }: { venue: Venue; onSubmit: (input: VenueUpdateRequestInput) => Promise<void>; isSubmitting: boolean }) {
  const original = useMemo(() => toChanges(venue), [venue]);
  const [changes, setChanges] = useState<VenueProfileUpdateChanges>(original);
  const [requestNotes, setRequestNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const input = { venueId: venue.id, originalSnapshot: original, requestedChanges: changes, requestNotes };
  const validation = validateVenueUpdateRequestInput(input);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSubmit(input);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Alert>Need to update your venue name, address or location? Contact Sheesha so we can verify the change.</Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Description" error={showErrors ? validation.errors.description : undefined}><Textarea value={changes.description ?? ""} onChange={(event) => setChanges({ ...changes, description: event.target.value })} /></Field>
        <Field label="Phone" error={showErrors ? validation.errors.phone : undefined}><Input value={changes.phone ?? ""} onChange={(event) => setChanges({ ...changes, phone: event.target.value })} /></Field>
        <Field label="Website" error={showErrors ? validation.errors.website : undefined}><Input value={changes.website ?? ""} onChange={(event) => setChanges({ ...changes, website: event.target.value })} /></Field>
        <Field label="Instagram" error={showErrors ? validation.errors.instagram : undefined}><Input value={changes.instagram ?? ""} onChange={(event) => setChanges({ ...changes, instagram: event.target.value })} /></Field>
        <Field label="Price from" error={showErrors ? validation.errors.priceFrom : undefined}><Input type="number" min={0} max={100} value={changes.priceFrom ?? ""} onChange={(event) => setChanges({ ...changes, priceFrom: event.target.value ? Number(event.target.value) : null })} /></Field>
        <Field label="Menu URL" error={showErrors ? validation.errors.menuUrl : undefined}><Input value={changes.menuUrl ?? ""} onChange={(event) => setChanges({ ...changes, menuUrl: event.target.value })} /></Field>
        <Field label="Booking URL" error={showErrors ? validation.errors.bookingUrl : undefined}><Input value={changes.bookingUrl ?? ""} onChange={(event) => setChanges({ ...changes, bookingUrl: event.target.value })} /></Field>
        <Field label="Contact URL" error={showErrors ? validation.errors.contactUrl : undefined}><Input value={changes.contactUrl ?? ""} onChange={(event) => setChanges({ ...changes, contactUrl: event.target.value })} /></Field>
      </div>
      <OptionGroup title="Features" values={changes.features ?? []} options={FEATURE_OPTIONS} onChange={(features) => setChanges({ ...changes, features })} />
      <OptionGroup title="Vibes" values={changes.vibes ?? []} options={VIBE_OPTIONS.map((vibe) => ({ label: vibe, value: vibe }))} onChange={(vibes) => setChanges({ ...changes, vibes })} />
      <Field label="Request notes" error={showErrors ? validation.errors.requestNotes : undefined}><Textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} /></Field>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Before / after preview</h2>
        <OwnerVenueUpdateDiffPreview original={original} requested={changes} />
        {showErrors && validation.errors.requestedChanges ? <p className="text-sm text-destructive">{validation.errors.requestedChanges}</p> : null}
      </section>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit update request"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}

function OptionGroup({ title, values, options, onChange }: { title: string; values: string[]; options: { label: string; value: string }[]; onChange: (values: string[]) => void }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {options.map((option) => <label key={option.value} className="flex items-center gap-2 text-sm"><Checkbox checked={values.includes(option.value)} onChange={(event) => onChange(event.target.checked ? [...values, option.value] : values.filter((value) => value !== option.value))} />{option.label}</label>)}
      </div>
    </section>
  );
}

function toChanges(venue: Venue): VenueProfileUpdateChanges {
  return {
    description: venue.description,
    phone: venue.phone,
    website: venue.website,
    instagram: venue.instagram,
    priceFrom: venue.priceFrom,
    openingHours: venue.openingHours,
    features: [venue.food && "food", venue.alcohol && "alcohol", venue.indoor && "indoor", venue.outdoor && "outdoor", venue.openLate && "openLate"].filter(Boolean) as string[],
    vibes: venue.vibes,
    menuUrl: venue.dataSources.menuUrl ?? venue.dataSources.shishaMenuUrl ?? null,
    bookingUrl: venue.dataSources.bookingUrl ?? null,
    contactUrl: venue.dataSources.contactUrl ?? null,
  };
}
