import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { PromotedOfferBadge } from "@/components/offers/PromotedOfferBadge";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { PROMOTED_OFFER_STATUS_OPTIONS, PROMOTED_OFFER_TYPE_OPTIONS, formatPromotedOfferStatus, formatPromotedOfferType } from "@/lib/promotedOfferLabels";
import { validatePromotedOfferInput } from "@/lib/promotedOfferValidation";
import { cn } from "@/lib/utils";
import { createPromotedOffer, deletePromotedOffer, getAdminPromotedOffers, updatePromotedOffer, updatePromotedOfferStatus } from "@/services/adminPromotedOfferService";
import type { PromotedOffer, PromotedOfferInput, PromotedOfferStatus, PromotedOfferType } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

type StatusFilter = "all" | PromotedOfferStatus;
type TypeFilter = "all" | PromotedOfferType;

export function AdminPromotedOffersPage() {
  const { user } = useAuth();
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [offers, setOffers] = useState<PromotedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromotedOffer | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getAdminPromotedOffers()
      .then((nextOffers) => {
        if (!cancelled) setOffers(nextOffers);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load promoted offers.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const cityOptions = useMemo(() => Array.from(new Set(venues.map((venue) => venue.city))).sort(), [venues]);
  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const venue = venuesById.get(offer.venueId);
      if (statusFilter !== "all" && offer.status !== statusFilter) return false;
      if (typeFilter !== "all" && offer.offerType !== typeFilter) return false;
      if (cityFilter !== "all" && (offer.city ?? venue?.city) !== cityFilter) return false;
      if (!normalizedQuery) return true;
      return [offer.title, offer.description, offer.terms, venue?.name, venue?.city, venue?.area, offer.city, offer.area]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [cityFilter, offers, query, statusFilter, typeFilter, venuesById]);

  async function handleSave(input: PromotedOfferInput) {
    if (!user) return;
    setActionError(null);
    try {
      const saved = editing
        ? await updatePromotedOffer({ offerId: editing.id, offer: input, adminUserId: user.id })
        : await createPromotedOffer({ offer: input, adminUserId: user.id });
      setOffers((current) => (editing ? current.map((offer) => (offer.id === saved.id ? saved : offer)) : [saved, ...current]));
      setEditing(null);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not save promoted offer.");
    }
  }

  async function handleStatus(offer: PromotedOffer, status: PromotedOfferStatus) {
    if (!user) return;
    setActionError(null);
    const venue = venuesById.get(offer.venueId);
    const validation = validatePromotedOfferInput(toOfferInput({ ...offer, status }), venue);
    if (status === "active" && !validation.isValid) {
      setActionError(Object.values(validation.errors)[0] ?? "Could not activate promoted offer.");
      return;
    }

    try {
      const updated = await updatePromotedOfferStatus({ offerId: offer.id, status, adminUserId: user.id });
      setOffers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update promoted offer.");
    }
  }

  async function handleDelete(offer: PromotedOffer) {
    setActionError(null);
    try {
      await deletePromotedOffer(offer.id);
      setOffers((current) => current.filter((item) => item.id !== offer.id));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not delete promoted offer.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/offers">
      <PageMeta title="Promoted Offers | nokta Admin" description="Manage promoted venue offers." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Promoted offers</h1>
            <p className="mt-2 text-sm text-[#8a7e72]">Create clearly labelled venue packages and offers.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/monetisation">Open monetisation</Link>
          </Button>
        </div>

        <SummaryCards offers={offers} />
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}

        <OfferForm key={editing?.id ?? "new"} offer={editing} venues={venues} isLoadingVenues={isLoadingVenues} onSave={handleSave} onCancel={() => setEditing(null)} />

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search offer, venue, city or area" />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} options={[{ label: "All statuses", value: "all" }, ...PROMOTED_OFFER_STATUS_OPTIONS]} />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} options={[{ label: "All types", value: "all" }, ...PROMOTED_OFFER_TYPE_OPTIONS]} />
          <Select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} options={[{ label: "All cities", value: "all" }, ...cityOptions.map((city) => ({ label: city, value: city }))]} />
        </div>

        {isLoading ? (
          <LoadingState message="Loading promoted offers..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <OfferTable offers={filteredOffers} venuesById={venuesById} onEdit={setEditing} onStatus={handleStatus} onDelete={handleDelete} />
        )}
      </div>
    </AdminPageShell>
  );
}

function OfferForm({
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

function OfferTable({
  offers,
  venuesById,
  onEdit,
  onStatus,
  onDelete,
}: {
  offers: PromotedOffer[];
  venuesById: Map<string, Venue>;
  onEdit: (offer: PromotedOffer) => void;
  onStatus: (offer: PromotedOffer, status: PromotedOfferStatus) => void;
  onDelete: (offer: PromotedOffer) => void;
}) {
  if (!offers.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No promoted offers match these filters.</div>;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">City/Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {offers.map((offer) => {
              const venue = venuesById.get(offer.venueId);
              return (
                <tr key={offer.id}>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2"><PromotedOfferBadge compact /></div>
                    <div className="mt-2 font-medium">{offer.title}</div>
                    {offer.description ? <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{offer.description}</div> : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{venue?.name ?? offer.venueId}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {venue ? <span>{venue.city} · {venue.area}</span> : null}
                      {venue?.isClaimed ? <ClaimedVenueBadge compact /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4"><TypeBadge type={offer.offerType} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{[offer.city, offer.area].filter(Boolean).join(" · ") || "Global"}</td>
                  <td className="px-4 py-4"><StatusBadge status={offer.status} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(offer.startsAt)}<br />to {formatDate(offer.endsAt)}</td>
                  <td className="px-4 py-4">{offer.priority}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(offer)}>Edit</Button>
                      {offer.status !== "active" ? <Button size="sm" onClick={() => onStatus(offer, "active")}>Activate</Button> : <Button size="sm" variant="outline" onClick={() => onStatus(offer, "paused")}>Pause</Button>}
                      <Button size="sm" variant="ghost" onClick={() => onStatus(offer, "cancelled")}>Cancel</Button>
                      {offer.status === "draft" ? <Button size="sm" variant="ghost" onClick={() => onDelete(offer)}>Delete</Button> : null}
                      {venue ? <Button asChild size="sm" variant="ghost"><Link to={`/venues/${venue.slug}`}>View</Link></Button> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCards({ offers }: { offers: PromotedOffer[] }) {
  const active = offers.filter((offer) => offer.status === "active").length;
  const draft = offers.filter((offer) => offer.status === "draft").length;
  const paused = offers.filter((offer) => offer.status === "paused").length;
  const birthday = offers.filter((offer) => offer.offerType === "birthday").length;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total offers" value={offers.length} />
      <MetricCard label="Active" value={active} />
      <MetricCard label="Draft" value={draft} />
      <MetricCard label="Paused/Birthday" value={paused + birthday} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}

function StatusBadge({ status }: { status: PromotedOfferStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-medium", status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-background")}>{formatPromotedOfferStatus(status)}</span>;
}

function TypeBadge({ type }: { type: PromotedOfferType }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium">{formatPromotedOfferType(type)}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
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

function toOfferInput(offer: PromotedOffer): PromotedOfferInput {
  return {
    venueId: offer.venueId,
    title: offer.title,
    description: offer.description,
    terms: offer.terms,
    offerType: offer.offerType,
    city: offer.city,
    area: offer.area,
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
    status: offer.status,
    priority: offer.priority,
    ctaLabel: offer.ctaLabel,
    ctaUrl: offer.ctaUrl,
  };
}
