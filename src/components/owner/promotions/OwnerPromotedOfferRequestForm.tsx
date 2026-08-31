import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateOwnerPromotionRequestInput } from "@/lib/ownerPromotionRequestValidation";
import type { OwnerPromotionOfferType, OwnerPromotionRequestInput } from "@/types/ownerPromotionRequests";
import type { Venue } from "@/types/venue";

const OFFER_TYPES = [
  { value: "group", label: "Group" },
  { value: "birthday", label: "Birthday" },
  { value: "football", label: "Football" },
  { value: "student", label: "Student" },
  { value: "food", label: "Food" },
  { value: "drink", label: "Drink" },
  { value: "private-hire", label: "Private hire" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

export function OwnerPromotedOfferRequestForm({ venue, onSubmit, isSubmitting }: { venue: Venue; onSubmit: (request: OwnerPromotionRequestInput) => Promise<void>; isSubmitting: boolean }) {
  const initialDates = useMemo(getInitialDates, []);
  const [values, setValues] = useState({
    offerType: "group" as OwnerPromotionOfferType,
    title: "",
    description: "",
    terms: "",
    requestedStartsAt: initialDates.startsAt,
    requestedEndsAt: initialDates.endsAt,
    ctaLabel: "Book now",
    ctaUrl: venue.website ?? "",
    ownerNotes: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const input: OwnerPromotionRequestInput = { venueId: venue.id, requestType: "promoted_offer", ...values };
  const validation = validateOwnerPromotionRequestInput(input);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;
    await onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">Promoted offers are reviewed by nokta before they go live.</p>
      <Alert className="mt-4 border-clay-400/20 bg-clay-50 text-sm text-nokta-ink">Please avoid directly promoting tobacco products, flavours, or smoking discounts.</Alert>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Venue"><Input value={venue.name} disabled /></Field>
        <Field label="Offer type" error={showErrors ? validation.errors.offerType : undefined}><Select value={values.offerType} onValueChange={(value) => setValues({ ...values, offerType: value as OwnerPromotionOfferType })} options={OFFER_TYPES} /></Field>
        <Field label="Title" error={showErrors ? validation.errors.title : undefined}><Input value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="Group booking package" /></Field>
        <Field label="CTA label" error={showErrors ? validation.errors.ctaLabel : undefined}><Input value={values.ctaLabel} onChange={(event) => setValues({ ...values, ctaLabel: event.target.value })} /></Field>
        <Field label="Start date" error={showErrors ? validation.errors.requestedStartsAt : undefined}><Input type="datetime-local" value={values.requestedStartsAt} onChange={(event) => setValues({ ...values, requestedStartsAt: event.target.value })} /></Field>
        <Field label="End date" error={showErrors ? validation.errors.requestedEndsAt : undefined}><Input type="datetime-local" value={values.requestedEndsAt} onChange={(event) => setValues({ ...values, requestedEndsAt: event.target.value })} /></Field>
        <Field label="CTA URL" error={showErrors ? validation.errors.ctaUrl : undefined}><Input value={values.ctaUrl} onChange={(event) => setValues({ ...values, ctaUrl: event.target.value })} placeholder="https://..." /></Field>
      </div>
      <Field label="Description" error={showErrors ? validation.errors.description : undefined} className="mt-4"><Textarea value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} /></Field>
      <Field label="Terms" error={showErrors ? validation.errors.terms : undefined} className="mt-4"><Textarea value={values.terms} onChange={(event) => setValues({ ...values, terms: event.target.value })} /></Field>
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
