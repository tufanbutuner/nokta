import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminReviewFilters, type AdminReviewStatusFilter } from "@/components/admin/reviews/AdminReviewFilters";
import { AdminReviewSummaryCards } from "@/components/admin/reviews/AdminReviewSummaryCards";
import { AdminReviewTable } from "@/components/admin/reviews/AdminReviewTable";
import { ModerationNotesDialog } from "@/components/admin/reviews/ModerationNotesDialog";
import type { ModerationAction } from "@/components/admin/reviews/AdminReviewActions";
import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import {
  getAdminReviews,
  softDeleteReview,
  updateReviewModerationNotes,
  updateReviewModerationStatus,
} from "@/services/adminReviewService";
import type { ReviewStatus, VenueReview } from "@/types/reviews";

const ACTION_STATUS: Partial<Record<ModerationAction, ReviewStatus>> = {
  publish: "published",
  hide: "hidden",
  flag: "flagged",
};

export function AdminReviewsPage() {
  const { user } = useAuth();
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminReviewStatusFilter>("all");
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);
  const [pendingReview, setPendingReview] = useState<VenueReview | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const venuesById = useMemo(() => Object.fromEntries(venues.map((venue) => [venue.id, venue])), [venues]);
  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const venue = venuesById[review.venueId];
      const matchesStatus = status === "all" || review.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [review.title ?? "", review.body, review.userId, review.venueId, venue?.name ?? "", venue?.area ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, reviews, status, venuesById]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setIsLoading(true);
      setError(null);

      try {
        const nextReviews = await getAdminReviews();
        if (!cancelled) {
          setReviews(nextReviews);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setReviews([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load reviews.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  function openActionDialog(action: ModerationAction, review: VenueReview) {
    setPendingAction(action);
    setPendingReview(review);
    setMutationError(null);
  }

  async function handleModerationSubmit(moderationNotes: string) {
    if (!pendingReview || !pendingAction || !user) {
      return;
    }

    setPendingReviewId(pendingReview.id);
    setMutationError(null);

    try {
      const nextReview =
        pendingAction === "notes"
          ? await updateReviewModerationNotes({ reviewId: pendingReview.id, moderationNotes })
          : pendingAction === "delete"
            ? await softDeleteReview({ reviewId: pendingReview.id, moderationNotes, adminUserId: user.id })
            : await updateReviewModerationStatus({
                reviewId: pendingReview.id,
                status: ACTION_STATUS[pendingAction] ?? "flagged",
                moderationNotes,
                adminUserId: user.id,
              });

      setReviews((currentReviews) => currentReviews.map((review) => (review.id === nextReview.id ? nextReview : review)));
      setPendingAction(null);
      setPendingReview(null);
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not update review.");
    } finally {
      setPendingReviewId(null);
    }
  }

  if (isLoading || venuesLoading) {
    return (
      <main>
        <PageContainer className="py-20">
          <LoadingState message="Loading review moderation..." />
        </PageContainer>
      </main>
    );
  }

  if (error || venuesError) {
    return (
      <main>
        <PageContainer className="py-20">
          <ErrorState message={error ?? venuesError ?? undefined} />
        </PageContainer>
      </main>
    );
  }

  return (
    <main>
      <PageContainer className="py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Internal</p>
            <h1 className="mt-2 text-4xl font-semibold">Review moderation</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Hide, republish, flag and soft-delete user reviews without losing the record.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/admin/venues">Manage venues</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/data-quality">Data quality</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/suggestions">Suggestions</Link>
            </Button>
          </div>
        </div>

        <AdminReviewSummaryCards reviews={reviews} />

        <Card className="mb-5 mt-8">
          <CardContent>
            <AdminReviewFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />
          </CardContent>
        </Card>

        {mutationError ? <Alert className="mb-5 border-destructive/30 text-destructive">{mutationError}</Alert> : null}

        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>

        {filteredReviews.length ? (
          <AdminReviewTable
            reviews={filteredReviews}
            venuesById={venuesById}
            pendingReviewId={pendingReviewId}
            onAction={openActionDialog}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold">No reviews match these filters</h2>
              <p className="mt-2 text-muted-foreground">Adjust the search or status filter to continue moderation.</p>
            </CardContent>
          </Card>
        )}
      </PageContainer>

      <ModerationNotesDialog
        open={Boolean(pendingAction && pendingReview)}
        action={pendingAction}
        review={pendingReview}
        isSubmitting={Boolean(pendingReviewId)}
        onCancel={() => {
          setPendingAction(null);
          setPendingReview(null);
          setMutationError(null);
        }}
        onSubmit={handleModerationSubmit}
      />
    </main>
  );
}
