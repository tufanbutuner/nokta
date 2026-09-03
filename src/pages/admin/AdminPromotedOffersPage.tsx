import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminPromotedOfferForm } from "@/components/admin/offers/AdminPromotedOfferForm";
import { AdminPromotedOfferTable } from "@/components/admin/offers/AdminPromotedOfferTable";
import {
  PromotedOfferFilters,
  PromotedOfferSummaryCards,
  type PromotedOfferStatusFilter,
  type PromotedOfferTypeFilter,
} from "@/components/admin/offers/AdminPromotedOfferControls";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { validatePromotedOfferInput } from "@/lib/promotedOfferValidation";
import { createPromotedOffer, deletePromotedOffer, getAdminPromotedOffers, updatePromotedOffer, updatePromotedOfferStatus } from "@/services/adminPromotedOfferService";
import type { PromotedOffer, PromotedOfferInput, PromotedOfferStatus } from "@/types/promotedOffers";
import type { Venue } from "@/types/venue";

export function AdminPromotedOffersPage() {
  const { user } = useAuth();
  const { venues, isLoading: isLoadingVenues, error: venuesError } = useVenues();
  const [offers, setOffers] = useState<PromotedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromotedOffer | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotedOfferStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<PromotedOfferTypeFilter>("all");
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

        <PromotedOfferSummaryCards offers={offers} />
        {actionError ? <Alert className="border-destructive/30 text-destructive">{actionError}</Alert> : null}
        {venuesError ? <Alert className="border-destructive/30 text-destructive">{venuesError}</Alert> : null}

        <AdminPromotedOfferForm key={editing?.id ?? "new"} offer={editing} venues={venues} isLoadingVenues={isLoadingVenues} onSave={handleSave} onCancel={() => setEditing(null)} />

        <PromotedOfferFilters
          query={query}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          cityFilter={cityFilter}
          cityOptions={cityOptions}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
          onCityFilterChange={setCityFilter}
        />

        {isLoading ? (
          <LoadingState message="Loading promoted offers..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <AdminPromotedOfferTable offers={filteredOffers} venuesById={venuesById} onEdit={setEditing} onStatus={handleStatus} onDelete={handleDelete} />
        )}
      </div>
    </AdminPageShell>
  );
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
