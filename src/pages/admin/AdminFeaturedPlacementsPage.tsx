import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { FeaturedBadge } from "@/components/featured/FeaturedBadge";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
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
import { getFeaturedEligibility } from "@/lib/featuredEligibility";
import { validateFeaturedPlacementInput } from "@/lib/featuredPlacementValidation";
import { cn } from "@/lib/utils";
import {
  createFeaturedPlacement,
  deleteFeaturedPlacement,
  getAdminFeaturedPlacements,
  updateFeaturedPlacement,
  updateFeaturedPlacementStatus,
} from "@/services/adminFeaturedPlacementService";
import type { FeaturedPlacement, FeaturedPlacementInput, FeaturedPlacementStatus, FeaturedPlacementType } from "@/types/featuredPlacements";
import type { Venue } from "@/types/venue";

const TYPE_OPTIONS: { label: string; value: FeaturedPlacementType }[] = [
  { label: "Homepage", value: "homepage" },
  { label: "City", value: "city" },
  { label: "Area", value: "area" },
  { label: "Discover", value: "discover" },
  { label: "Recommendation", value: "recommendation" },
];

const STATUS_OPTIONS: { label: string; value: FeaturedPlacementStatus }[] = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

export function AdminFeaturedPlacementsPage() {
  const { user } = useAuth();
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeaturedPlacement | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FeaturedPlacementStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | FeaturedPlacementType>("all");

  useEffect(() => {
    let cancelled = false;
    getAdminFeaturedPlacements()
      .then((nextPlacements) => {
        if (!cancelled) setPlacements(nextPlacements);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load featured placements.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const filteredPlacements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return placements.filter((placement) => {
      const venue = venuesById.get(placement.venueId);
      if (statusFilter !== "all" && placement.status !== statusFilter) return false;
      if (typeFilter !== "all" && placement.placementType !== typeFilter) return false;
      if (!normalizedQuery) return true;
      return [venue?.name, venue?.city, venue?.area, placement.title, placement.description, placement.city, placement.area, placement.placementType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [placements, query, statusFilter, typeFilter, venuesById]);

  async function handleSave(input: FeaturedPlacementInput) {
    if (!user) return;
    setActionError(null);
    try {
      const saved = editing
        ? await updateFeaturedPlacement({ placementId: editing.id, placement: input, adminUserId: user.id })
        : await createFeaturedPlacement({ placement: input, adminUserId: user.id });
      setPlacements((current) => (editing ? current.map((placement) => (placement.id === saved.id ? saved : placement)) : [saved, ...current]));
      setEditing(null);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not save featured placement.");
    }
  }

  async function handleStatus(placement: FeaturedPlacement, status: FeaturedPlacementStatus) {
    if (!user) return;
    setActionError(null);
    try {
      const updated = await updateFeaturedPlacementStatus({ placementId: placement.id, status, adminUserId: user.id });
      setPlacements((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not update featured placement.");
    }
  }

  async function handleDelete(placement: FeaturedPlacement) {
    setActionError(null);
    try {
      await deleteFeaturedPlacement(placement.id);
      setPlacements((current) => current.filter((item) => item.id !== placement.id));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not delete featured placement.");
    }
  }

  return (
    <AdminPageShell activePath="/admin/featured">
      <PageMeta title="Featured Placements | nokta Admin" description="Manage featured placement campaigns." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a7e72]">Admin</p>
            <h1 className="mt-1 font-brand text-3xl font-bold tracking-[-0.5px] text-nokta-ink">Featured placements</h1>
            <p className="mt-2 text-sm text-[#8a7e72]">Create clearly labelled promotional placements.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/monetisation">Open monetisation</Link>
          </Button>
        </div>

        <SummaryCards placements={placements} />
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}

        <PlacementForm
          key={editing?.id ?? "new"}
          placement={editing}
          venues={venues}
          isLoadingVenues={isLoadingVenues}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venue, city, area or placement" />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} options={[{ label: "All statuses", value: "all" }, ...STATUS_OPTIONS]} />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} options={[{ label: "All types", value: "all" }, ...TYPE_OPTIONS]} />
        </div>

        {isLoading ? (
          <LoadingState message="Loading featured placements..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <PlacementTable
            placements={filteredPlacements}
            venuesById={venuesById}
            onEdit={setEditing}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function PlacementForm({
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
          <Select value={values.placementType} onChange={(event) => update("placementType", event.target.value as FeaturedPlacementType)} options={TYPE_OPTIONS} />
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
          <Select value={values.status} onChange={(event) => update("status", event.target.value as FeaturedPlacementStatus)} options={STATUS_OPTIONS} />
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

function PlacementTable({
  placements,
  venuesById,
  onEdit,
  onStatus,
  onDelete,
}: {
  placements: FeaturedPlacement[];
  venuesById: Map<string, Venue>;
  onEdit: (placement: FeaturedPlacement) => void;
  onStatus: (placement: FeaturedPlacement, status: FeaturedPlacementStatus) => void;
  onDelete: (placement: FeaturedPlacement) => void;
}) {
  if (!placements.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No featured placements match these filters.</div>;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Placement</th>
              <th className="px-4 py-3">City/Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {placements.map((placement) => {
              const venue = venuesById.get(placement.venueId);
              const eligibility = venue ? getFeaturedEligibility(venue) : null;
              return (
                <tr key={placement.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium">{venue?.name ?? placement.venueId}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {venue ? <span>{venue.city} · {venue.area}</span> : null}
                      {venue?.isClaimed ? <ClaimedVenueBadge compact /> : null}
                      {eligibility && !eligibility.eligible ? <span className="text-red-700">Not eligible</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2"><TypeBadge type={placement.placementType} /><FeaturedBadge compact /></div>
                    {placement.title ? <div className="mt-2 font-medium">{placement.title}</div> : null}
                    {placement.description ? <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{placement.description}</div> : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{[placement.city, placement.area].filter(Boolean).join(" · ") || "Global"}</td>
                  <td className="px-4 py-4"><StatusBadge status={placement.status} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{formatDate(placement.startsAt)}<br />to {formatDate(placement.endsAt)}</td>
                  <td className="px-4 py-4">{placement.priority}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(placement)}>Edit</Button>
                      {placement.status !== "active" ? <Button size="sm" onClick={() => onStatus(placement, "active")}>Activate</Button> : <Button size="sm" variant="outline" onClick={() => onStatus(placement, "paused")}>Pause</Button>}
                      <Button size="sm" variant="ghost" onClick={() => onStatus(placement, "cancelled")}>Cancel</Button>
                      {placement.status === "draft" ? <Button size="sm" variant="ghost" onClick={() => onDelete(placement)}>Delete</Button> : null}
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

function SummaryCards({ placements }: { placements: FeaturedPlacement[] }) {
  const active = placements.filter((placement) => placement.status === "active").length;
  const draft = placements.filter((placement) => placement.status === "draft").length;
  const paused = placements.filter((placement) => placement.status === "paused").length;
  const homepage = placements.filter((placement) => placement.placementType === "homepage").length;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total placements" value={placements.length} />
      <MetricCard label="Active" value={active} />
      <MetricCard label="Draft" value={draft} />
      <MetricCard label="Homepage" value={homepage + paused} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{error ? <span className="block text-sm text-destructive">{error}</span> : null}</label>;
}

function StatusBadge({ status }: { status: FeaturedPlacementStatus }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium capitalize">{status}</span>;
}

function TypeBadge({ type }: { type: FeaturedPlacementType }) {
  return <span className="inline-flex rounded-full border bg-background px-2 py-1 text-xs font-medium capitalize">{type}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
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
