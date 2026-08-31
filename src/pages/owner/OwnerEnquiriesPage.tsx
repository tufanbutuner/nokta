import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerEnquiryDetailsDialog } from "@/components/owner/enquiries/OwnerEnquiryDetailsDialog";
import { OwnerEnquiryFilters, type OwnerEnquiryFilterState } from "@/components/owner/enquiries/OwnerEnquiryFilters";
import { OwnerEnquiryNotesDialog } from "@/components/owner/enquiries/OwnerEnquiryNotesDialog";
import { OwnerEnquirySummaryCards } from "@/components/owner/enquiries/OwnerEnquirySummaryCards";
import { OwnerEnquiryTable } from "@/components/owner/enquiries/OwnerEnquiryTable";
import { PageMeta } from "@/components/seo/PageMeta";
import { UpgradePrompt } from "@/components/subscriptions/UpgradePrompt";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { canAccessOwnerEnquiryInbox } from "@/lib/ownerEnquiryAccess";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { getOwnerVenueEnquiries, updateOwnerVenueEnquiryNotes, updateOwnerVenueEnquiryStatus } from "@/services/ownerVenueEnquiryService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerEnquiriesPage() {
  const { venueId } = useParams();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [subscriptions, setSubscriptions] = useState<VenueSubscription[]>([]);
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [selected, setSelected] = useState<VenueEnquiry | null>(null);
  const [notesTarget, setNotesTarget] = useState<VenueEnquiry | null>(null);
  const [filters, setFilters] = useState<OwnerEnquiryFilterState>({ venueId: venueId ?? "all", status: "all", type: "all", date: "30d" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getMyClaimedVenues(user.id), getOwnerVenueSubscriptions(user.id)])
      .then(async ([nextVenues, nextSubscriptions]) => {
        if (cancelled) return;
        setVenues(nextVenues);
        setSubscriptions(nextSubscriptions);
        const accessibleIds = new Set(nextSubscriptions.filter(canAccessOwnerEnquiryInbox).map((subscription) => subscription.venueId));
        const selectedVenue = venueId ? nextVenues.find((venue) => venue.id === venueId || venue.slug === venueId) : null;
        if (!accessibleIds.size || (selectedVenue && !accessibleIds.has(selectedVenue.id))) return;
        const nextEnquiries = await getOwnerVenueEnquiries({ userId: user.id, venueId: selectedVenue?.id ?? null });
        if (cancelled) return;
        setEnquiries(nextEnquiries);
        trackEvent("owner_enquiry_inbox_viewed", { venueId: selectedVenue?.id ?? null, plan: nextSubscriptions.find((subscription) => subscription.venueId === selectedVenue?.id)?.plan ?? null });
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load owner enquiries.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, venueId]);

  const accessibleVenues = useMemo(() => {
    const accessibleIds = new Set(subscriptions.filter(canAccessOwnerEnquiryInbox).map((subscription) => subscription.venueId));
    return venues.filter((venue) => accessibleIds.has(venue.id));
  }, [subscriptions, venues]);
  const venuesById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const filtered = useMemo(() => filterEnquiries(enquiries, filters), [enquiries, filters]);

  async function handleStatus(enquiry: VenueEnquiry, status: VenueEnquiryStatus) {
    if (!user) return;
    if (["converted", "closed", "spam"].includes(status) && !window.confirm(`Mark this enquiry as ${status}?`)) return;
    setIsSaving(true);
    try {
      const updated = await updateOwnerVenueEnquiryStatus({ userId: user.id, enquiryId: enquiry.id, status });
      setEnquiries((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update enquiry.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNotes(input: { ownerNotes: string | null; venueResponse: string | null }) {
    if (!user || !notesTarget) return;
    setIsSaving(true);
    try {
      const updated = await updateOwnerVenueEnquiryNotes({ userId: user.id, enquiryId: notesTarget.id, ...input });
      setEnquiries((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotesTarget(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save enquiry notes.");
    } finally {
      setIsSaving(false);
    }
  }

  const currentPlan = subscriptions[0]?.plan ?? "free";
  const locked = !accessibleVenues.length;

  return (
    <OwnerLayout>
      <PageMeta title="Enquiry inbox | nokta" description="Manage customer enquiries for your claimed venues." canonicalPath="/owner/enquiries" />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Growth feature</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Enquiry inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">View customer enquiries and track lead outcomes. Enquiries are not confirmed bookings.</p>
        </div>
        {error ? <Alert className="border-destructive/30 text-destructive">{error}</Alert> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading enquiries...</p> : locked ? (
          <UpgradePrompt feature="owner_enquiry_inbox" requiredPlan="growth" currentPlan={currentPlan} />
        ) : (
          <>
            <OwnerEnquirySummaryCards enquiries={enquiries} />
            <OwnerEnquiryFilters venues={accessibleVenues} value={filters} onChange={setFilters} lockVenue={Boolean(venueId)} />
            <OwnerEnquiryTable enquiries={filtered} venuesById={venuesById} onView={(enquiry) => { setSelected(enquiry); trackEvent("owner_enquiry_viewed", { venueId: enquiry.venueId, enquiryId: enquiry.id, enquiryType: enquiry.enquiryType, status: enquiry.status }); }} onStatus={handleStatus} onNotes={setNotesTarget} />
            <p className="text-sm text-muted-foreground">Email notifications are coming soon. For now, check your owner dashboard for new enquiries.</p>
          </>
        )}
      </div>
      {selected ? <OwnerEnquiryDetailsDialog enquiry={selected} venue={venuesById[selected.venueId]} onClose={() => setSelected(null)} /> : null}
      {notesTarget ? <OwnerEnquiryNotesDialog enquiry={notesTarget} onClose={() => setNotesTarget(null)} onSave={handleNotes} isSaving={isSaving} /> : null}
    </OwnerLayout>
  );
}

function filterEnquiries(enquiries: VenueEnquiry[], filters: OwnerEnquiryFilterState) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const cutoff = filters.date === "7d" ? now.getTime() - 7 * 86400000 : filters.date === "30d" ? now.getTime() - 30 * 86400000 : filters.date === "month" ? monthStart : 0;

  return enquiries.filter((enquiry) => {
    if (filters.venueId !== "all" && enquiry.venueId !== filters.venueId) return false;
    if (filters.status !== "all" && enquiry.status !== filters.status) return false;
    if (filters.type !== "all" && enquiry.enquiryType !== filters.type) return false;
    if (cutoff && new Date(enquiry.createdAt).getTime() < cutoff) return false;
    return true;
  });
}
