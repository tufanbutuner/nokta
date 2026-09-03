import { useState, type FormEvent, type ReactNode } from "react";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROMOTED_OFFER_STATUS_OPTIONS, PROMOTED_OFFER_TYPE_OPTIONS } from "@/lib/promotedOfferLabels";
import { validatePromotedOfferInput } from "@/lib/promotedOfferValidation";
import type { PromotedOffer, PromotedOfferInput, PromotedOfferStatus, PromotedOfferType } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function AdminPromotedOfferForm({
  offer,
  venues,
  isLoadingVenues,
  onSave,
  onCancel,
}: {
  offer: PromotedOffer | null;
  venues: Venue[];
  isLoadingVenues: boolean;
  onSave: (input: PromotedOfferInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<PromotedOfferInput>(() => ({
    venueId: offer?.venueId ?? "",
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    terms: offer?.terms ?? "",
    offerType: offer?.offerType ?? "group",
    city: offer?.city ?? "",
    area: offer?.area ?? "",
    startsAt: toDateTimeLocal(offer?.startsAt) ?? toDateTimeLocal(new Date().toISOString()) ?? "",
    endsAt: toDateTimeLocal(offer?.endsAt) ?? toDateTimeLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()) ?? "",
    status: offer?.status ?? "draft",
    priority: offer?.priority ?? 0,
    ctaLabel: offer?.ctaLabel ?? "",
    ctaUrl: offer?.ctaUrl ?? "",
  }));
  const [showErrors, setShowErrors] = useState(false);
  const selectedVenue = venues.find((venue) => venue.id === values.venueId);
  const validation = validatePromotedOfferInput(values, selectedVenue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSave(toIsoInput(values));
  }

  function update<K extends keyof PromotedOfferInput>(key: K, value: PromotedOfferInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleVenueChange(venueId: string) {
    const venue = venues.find((candidate) => candidate.id === venueId);
    setValues((current) => ({
      ...current,
      venueId,
      city: venue?.city ?? current.city,
      area: venue?.area ?? current.area,
    }));
  }

  return (
    <form className="rounded-xl border bg-card p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{offer ? "Edit offer" : "New offer"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Active offers are blocked for unsafe wording, unverified venues or non-open venues.</p>
        </div>
        {offer ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel edit</Button> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Venue" error={showErrors ? validation.errors.venueId : undefined}>
          <Select value={values.venueId} onChange={(event) => handleVenueChange(event.target.value)} disabled={isLoadingVenues} options={[{ label: "Choose venue", value: "" }, ...venues.map((venue) => ({ label: `${venue.name} · ${venue.city}`, value: venue.id }))]} />
        </Field>
        <Field label="Offer type" error={showErrors ? validation.errors.offerType : undefined}>
          <Select value={values.offerType} onChange={(event) => update("offerType", event.target.value as PromotedOfferType)} options={PROMOTED_OFFER_TYPE_OPTIONS} />
        </Field>
        <Field label="Title" error={showErrors ? validation.errors.title : undefined}>
          <Input value={values.title} maxLength={120} onChange={(event) => update("title", event.target.value)} placeholder="Birthday table package" />
        </Field>
        <Field label="Priority" error={showErrors ? validation.errors.priority : undefined}>
          <Input type="number" min={0} value={values.priority ?? 0} onChange={(event) => update("priority", Number(event.target.value))} />
        </Field>
        <Field label="City" error={showErrors ? validation.errors.city : undefined}>
          <Input value={values.city ?? ""} onChange={(event) => update("city", event.target.value)} />
        </Field>
        <Field label="Area" error={showErrors ? validation.errors.area : undefined}>
          <Input value={values.area ?? ""} onChange={(event) => update("area", event.target.value)} />
        </Field>
        <Field label="Starts at" error={showErrors ? validation.errors.startsAt : undefined}>
          <Input type="datetime-local" value={values.startsAt} onChange={(event) => update("startsAt", event.target.value)} />
        </Field>
        <Field label="Ends at" error={showErrors ? validation.errors.endsAt : undefined}>
          <Input type="datetime-local" value={values.endsAt} onChange={(event) => update("endsAt", event.target.value)} />
        </Field>
        <Field label="Status" error={showErrors ? validation.errors.status : undefined}>
          <Select value={values.status} onChange={(event) => update("status", event.target.value as PromotedOfferStatus)} options={PROMOTED_OFFER_STATUS_OPTIONS} />
        </Field>
        <Field label="CTA label" error={showErrors ? validation.errors.ctaLabel : undefined}>
          <Input value={values.ctaLabel ?? ""} maxLength={40} onChange={(event) => update("ctaLabel", event.target.value)} placeholder="Enquire now" />
        </Field>
        <Field label="CTA URL" error={showErrors ? validation.errors.ctaUrl : undefined}>
          <Input value={values.ctaUrl ?? ""} onChange={(event) => update("ctaUrl", event.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Description" error={showErrors ? validation.errors.description : undefined}>
          <Textarea value={values.description ?? ""} maxLength={300} onChange={(event) => update("description", event.target.value)} />
        </Field>
        <Field label="Terms" error={showErrors ? validation.errors.terms : undefined}>
          <Textarea value={values.terms ?? ""} maxLength={500} onChange={(event) => update("terms", event.target.value)} />
        </Field>
      </div>

      {selectedVenue ? (
        <div className="mt-4 rounded-lg border bg-background/60 p-3 text-sm">
          <p className="font-medium">{selectedVenue.name}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedVenue.city} · {selectedVenue.area} · {selectedVenue.businessStatus} · {selectedVenue.verificationStatus}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">{selectedVenue.isClaimed ? <ClaimedVenueBadge compact /> : <span className="text-xs text-muted-foreground">Not claimed</span>}</div>
        </div>
      ) : null}

      {validation.warnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium">Warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button type="submit">{offer ? "Save offer" : "Create offer"}</Button>
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

function toIsoInput(input: PromotedOfferInput): PromotedOfferInput {
  return {
    ...input,
    startsAt: new Date(input.startsAt).toISOString(),
    endsAt: new Date(input.endsAt).toISOString(),
    priority: input.priority ?? 0,
  };
}
