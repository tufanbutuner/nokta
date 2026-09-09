import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { validateVenueUpdateRequestInput } from "@/lib/venueUpdateRequestValidation";
import { ProfileDiffTable } from "@/components/owner/updates/ProfileDiffTable";
import { FEATURE_CHIPS, VIBE_CHIPS, getProfileDiff } from "@/lib/venueProfileDiff";
import type { VenueProfileUpdateChanges, VenueUpdateRequest, VenueUpdateRequestInput } from "@/types/venueUpdateRequests";
import type { Venue } from "@/types/venue";

const DESCRIPTION_LIMIT = 600;

const INPUT_CLASS = "h-11 w-full rounded-[9px] border border-nokta-border-input bg-white px-3 text-[13.5px] text-nokta-ink outline-none placeholder:text-nokta-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-clay-accent";
const TEXTAREA_CLASS = "w-full resize-y rounded-[9px] border border-nokta-border-input bg-white px-3 py-[10px] text-[13.5px] leading-[1.55] text-nokta-ink outline-none placeholder:text-nokta-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-clay-accent";

export function toProfileChanges(venue: Venue): VenueProfileUpdateChanges {
  return {
    description: venue.description ?? "",
    phone: venue.phone ?? "",
    website: venue.website ?? "",
    instagram: venue.instagram ?? "",
    features: [venue.food && "food", venue.alcohol && "alcohol", venue.halal && "halal", venue.indoor && "indoor", venue.outdoor && "outdoor", venue.openLate && "openLate"].filter(Boolean) as string[],
    vibes: venue.vibes,
    bookingUrl: venue.dataSources.bookingUrl ?? "",
    contactUrl: venue.dataSources.contactUrl ?? "",
  };
}

export function OwnerVenueProfileForm({
  venue,
  pendingRequest,
  onSubmit,
  isSubmitting,
  onDirtyChange,
}: {
  venue: Venue;
  /** Latest request still awaiting review, if any. */
  pendingRequest?: VenueUpdateRequest | null;
  onSubmit: (input: VenueUpdateRequestInput) => Promise<boolean>;
  isSubmitting: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  /**
   * What is live on the public page. Always the diff baseline, even while a
   * request is pending — a new request's "before" must describe published
   * values, never another request's unapproved ones.
   */
  const venueSnapshot = useMemo(() => toProfileChanges(venue), [venue]);
  /**
   * What the fields start at: the pending request's values when one is in
   * review, so submitted edits survive a reload instead of appearing lost.
   */
  const initialValues = useMemo(
    () => pendingRequest ? { ...venueSnapshot, ...pendingRequest.requestedChanges } : venueSnapshot,
    [venueSnapshot, pendingRequest],
  );
  /**
   * Re-based to what was just submitted on success so the action bar clears —
   * the venue itself does not change until an admin approves.
   */
  const [snapshot, setSnapshot] = useState<VenueProfileUpdateChanges>(initialValues);
  const [changes, setChanges] = useState<VenueProfileUpdateChanges>(initialValues);
  const [requestNotes, setRequestNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setSnapshot(initialValues);
    setChanges(initialValues);
    setRequestNotes("");
    setShowErrors(false);
    setReviewOpen(false);
  }, [initialValues]);

  /** Rows shown in the pending banner: published values vs what is in review. */
  const pendingDiff = useMemo(
    () => pendingRequest ? getProfileDiff(venueSnapshot, { ...venueSnapshot, ...pendingRequest.requestedChanges }) : [],
    [venueSnapshot, pendingRequest],
  );

  const diff = useMemo(() => getProfileDiff(snapshot, changes), [snapshot, changes]);
  const isDirty = diff.length > 0;
  const input: VenueUpdateRequestInput = { venueId: venue.id, originalSnapshot: venueSnapshot, requestedChanges: changes, requestNotes };
  const validation = validateVenueUpdateRequestInput(input);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function update(field: keyof VenueProfileUpdateChanges, value: string) {
    setChanges((current) => ({ ...current, [field]: value }));
  }

  function toggle(field: "features" | "vibes", value: string) {
    setChanges((current) => {
      const values = current[field] ?? [];
      return { ...current, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
  }

  function discard() {
    if (diff.length > 1 && !window.confirm("Discard all unsaved changes?")) return;
    setChanges(snapshot);
    setRequestNotes("");
    setReviewOpen(false);
    setShowErrors(false);
  }

  async function handleSubmit() {
    setShowErrors(true);
    if (!validation.isValid) {
      const firstError = Object.keys(validation.errors).find((key) => fieldRefs.current[key]);
      if (firstError) fieldRefs.current[firstError]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const submitted = await onSubmit(input);
    if (!submitted) return;
    setSnapshot(changes);
    setRequestNotes("");
    setShowErrors(false);
    setReviewOpen(false);
  }

  const descriptionCount = (changes.description ?? "").length;

  return (
    <>
      <div className="flex flex-col gap-4">
        {pendingRequest && pendingDiff.length ? (
          <div className="rounded-[10px] border border-nokta-border border-l-[3px] border-l-clay-300 bg-white px-[15px] py-[13px]">
            <p className="text-[13px] leading-[1.55] text-nokta-ink-subtle">
              <strong className="font-semibold text-nokta-ink">These edits are with nokta for review.</strong>{" "}
              The fields below show what you submitted on {new Date(pendingRequest.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}, not what is live on your public page yet.
            </p>
            <button type="button" aria-expanded={pendingOpen} onClick={() => setPendingOpen((open) => !open)} className="mt-2 cursor-pointer text-[13px] font-medium text-clay-accent hover:underline">
              {pendingOpen ? "Hide what changes" : `Show what changes (${pendingDiff.length})`}
            </button>
            {pendingOpen ? <div className="mt-2.5"><ProfileDiffTable rows={pendingDiff} /></div> : null}
          </div>
        ) : null}

        <SectionCard title="About this venue" subtitle="Shown at the top of your public page.">
          <label className="block">
            <span className="mb-1.5 flex justify-between text-[13px] font-medium text-nokta-ink">
              <span>Description</span>
              <span className={cn("font-normal text-nokta-ink-muted", descriptionCount > DESCRIPTION_LIMIT && "text-destructive")}>{descriptionCount}/{DESCRIPTION_LIMIT}</span>
            </span>
            <textarea
              ref={(node) => { fieldRefs.current.description = node; }}
              rows={4}
              className={TEXTAREA_CLASS}
              value={changes.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <FieldError message={showErrors ? validation.errors.description : undefined} />
        </SectionCard>

        <SectionCard title="Contact & links" subtitle="How customers reach you outside nokta.">
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <TextField label="Phone" value={changes.phone ?? ""} onChange={(value) => update("phone", value)} error={showErrors ? validation.errors.phone : undefined} inputRef={(node) => { fieldRefs.current.phone = node; }} />
            <TextField label="Website" placeholder="https://" value={changes.website ?? ""} onChange={(value) => update("website", value)} error={showErrors ? validation.errors.website : undefined} inputRef={(node) => { fieldRefs.current.website = node; }} />
            <TextField label="Instagram" placeholder="@handle" value={changes.instagram ?? ""} onChange={(value) => update("instagram", value)} error={showErrors ? validation.errors.instagram : undefined} inputRef={(node) => { fieldRefs.current.instagram = node; }} />
            <TextField label="Booking link" placeholder="Optional" value={changes.bookingUrl ?? ""} onChange={(value) => update("bookingUrl", value)} error={showErrors ? validation.errors.bookingUrl : undefined} inputRef={(node) => { fieldRefs.current.bookingUrl = node; }} />
            <TextField label="Contact link" placeholder="Optional" value={changes.contactUrl ?? ""} onChange={(value) => update("contactUrl", value)} error={showErrors ? validation.errors.contactUrl : undefined} inputRef={(node) => { fieldRefs.current.contactUrl = node; }} />
          </div>
        </SectionCard>

        <section className="rounded-[14px] border border-nokta-border bg-white">
          <div className="px-5 pt-4">
            <h2 className="text-[15px] font-semibold text-nokta-ink">Features</h2>
            <p className="mt-[3px] text-[12.5px] text-nokta-ink-muted">Used by search filters. Only tick what you offer every day.</p>
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-5 pt-3.5">
            {FEATURE_CHIPS.map((chip) => (
              <Chip key={chip.value} label={chip.label} checked={(changes.features ?? []).includes(chip.value)} onClick={() => toggle("features", chip.value)} showBox />
            ))}
          </div>
          <div className="border-t border-nokta-divider px-5 pb-5 pt-4">
            <h3 className="text-[13px] font-semibold text-nokta-ink">Vibes</h3>
            <p className="mb-3 mt-[3px] text-[12.5px] text-nokta-ink-muted">Pick the ones that describe a typical night.</p>
            <div className="flex flex-wrap gap-2">
              {VIBE_CHIPS.map((chip) => (
                <Chip key={chip.value} label={chip.label} checked={(changes.vibes ?? []).includes(chip.value)} onClick={() => toggle("vibes", chip.value)} />
              ))}
            </div>
          </div>
        </section>

        <SectionCard title="Note for the reviewer" subtitle="Optional. Context speeds up approval.">
          <textarea
            ref={(node) => { fieldRefs.current.requestNotes = node; }}
            rows={2}
            className={TEXTAREA_CLASS}
            placeholder="e.g. We stopped serving alcohol from 1 September."
            value={requestNotes}
            onChange={(event) => setRequestNotes(event.target.value)}
          />
          <FieldError message={showErrors ? validation.errors.requestNotes : undefined} />
        </SectionCard>
      </div>

      {isDirty ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-nokta-border bg-white shadow-[0_-6px_24px_rgba(26,21,16,.07)]">
          {reviewOpen ? (
            <div className="mx-auto max-h-[38vh] max-w-[1180px] overflow-y-auto px-[clamp(14px,4vw,26px)] pt-3.5">
              <ProfileDiffTable rows={diff} />
            </div>
          ) : null}
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-[clamp(14px,4vw,26px)] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <p className="flex-[1_1_240px] text-[13px] leading-[1.45] text-nokta-ink-subtle">
              <strong className="font-semibold text-nokta-ink">{diff.length === 1 ? "1 change ready to submit" : `${diff.length} changes ready to submit`}</strong>
              {" "}— reviewed by nokta, usually within one working day.
            </p>
            <div className="flex flex-[1_1_300px] flex-wrap justify-end gap-2">
              <button type="button" onClick={discard} className="order-2 min-h-11 flex-[0_1_auto] rounded-[9px] border border-transparent px-3.5 text-[13.5px] font-medium text-nokta-ink-muted transition-colors hover:text-nokta-ink">Discard</button>
              <button type="button" onClick={() => setReviewOpen((open) => !open)} className="order-1 min-h-11 flex-[1_1_130px] rounded-[9px] border border-nokta-border-input bg-white px-[15px] text-[13.5px] font-medium text-nokta-ink transition-colors hover:bg-nokta-hover">{reviewOpen ? "Hide changes" : "Review changes"}</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="order-3 min-h-11 flex-[1_1_150px] rounded-[9px] bg-clay-accent px-[18px] text-[13.5px] font-semibold text-white transition-colors hover:bg-clay-accent-hover disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit for review"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SectionCard({ title, subtitle, children }: { title: ReactNode; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-nokta-border bg-white">
      <div className="px-5 pt-4">
        <h2 className="text-[15px] font-semibold text-nokta-ink">{title}</h2>
        <p className="mt-[3px] text-[12.5px] text-nokta-ink-muted">{subtitle}</p>
      </div>
      <div className="px-5 pb-5 pt-3.5">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, placeholder, error, inputRef }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; inputRef?: (node: HTMLInputElement | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-nokta-ink">{label}</span>
      <input ref={inputRef} className={INPUT_CLASS} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1.5 block text-[13px] text-destructive">{message}</span>;
}

function Chip({ label, checked, onClick, showBox }: { label: string; checked: boolean; onClick: () => void; showBox?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-full border text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-clay-accent",
        showBox ? "min-h-10 py-2 pl-[11px] pr-3.5 text-[13.5px]" : "min-h-[38px] px-3.5 py-2",
        checked ? "border-clay-accent bg-nokta-chip-tint text-nokta-accent-dark" : "border-nokta-border bg-white text-nokta-ink-subtle hover:bg-nokta-hover",
      )}
    >
      {showBox ? (
        <span aria-hidden="true" className={cn("inline-flex size-[15px] items-center justify-center rounded border text-[10px] leading-none text-white", checked ? "border-clay-accent bg-clay-accent" : "border-nokta-border-input bg-white")}>
          {checked ? "✓" : ""}
        </span>
      ) : null}
      {label}
    </button>
  );
}
