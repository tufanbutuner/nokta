import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminSuggestionFilters, type AdminSuggestionStatusFilter } from "@/components/admin/suggestions/AdminSuggestionFilters";
import { AdminSuggestionSummaryCards } from "@/components/admin/suggestions/AdminSuggestionSummaryCards";
import { AdminSuggestionTable } from "@/components/admin/suggestions/AdminSuggestionTable";
import { AdminSuggestionNotesDialog } from "@/components/admin/suggestions/AdminSuggestionNotesDialog";
import type { SuggestionAction } from "@/components/admin/suggestions/AdminSuggestionActions";
import { ErrorState } from "@/components/state/ErrorState";
import { EmptyState } from "@/components/state/EmptyState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getAdminVenueSuggestions, updateVenueSuggestionStatus } from "@/services/adminVenueSuggestionService";
import type { VenueSuggestion, VenueSuggestionStatus } from "@/types/venueSuggestions";

const ACTION_STATUS: Partial<Record<SuggestionAction, VenueSuggestionStatus>> = {
  approve: "approved",
  reject: "rejected",
  converted: "converted",
};

export function AdminVenueSuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminSuggestionStatusFilter>("all");
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<SuggestionAction | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<VenueSuggestion | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return suggestions.filter((suggestion) => {
      const matchesStatus = status === "all" || suggestion.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [
          suggestion.venueName,
          suggestion.area ?? "",
          suggestion.city,
          suggestion.country,
          suggestion.address ?? "",
          suggestion.postcode ?? "",
          suggestion.website ?? "",
          suggestion.instagram ?? "",
          suggestion.phone ?? "",
          suggestion.notes ?? "",
          suggestion.adminNotes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, status, suggestions]);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSuggestions = await getAdminVenueSuggestions();
        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSuggestions([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load suggestions.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  function openActionDialog(action: SuggestionAction, suggestion: VenueSuggestion) {
    setPendingAction(action);
    setPendingSuggestion(suggestion);
    setMutationError(null);
  }

  async function handleSuggestionSubmit(adminNotes: string) {
    if (!pendingSuggestion || !pendingAction || !user) {
      return;
    }

    setPendingSuggestionId(pendingSuggestion.id);
    setMutationError(null);

    try {
      const nextSuggestion = await updateVenueSuggestionStatus({
        suggestionId: pendingSuggestion.id,
        status: ACTION_STATUS[pendingAction] ?? pendingSuggestion.status,
        adminUserId: user.id,
        adminNotes,
      });

      setSuggestions((currentSuggestions) =>
        currentSuggestions.map((suggestion) => (suggestion.id === nextSuggestion.id ? nextSuggestion : suggestion)),
      );
      setPendingAction(null);
      setPendingSuggestion(null);
    } catch (caughtError) {
      setMutationError(caughtError instanceof Error ? caughtError.message : "Could not update suggestion.");
    } finally {
      setPendingSuggestionId(null);
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell activePath="/admin/suggestions">
        <div className="py-20">
          <LoadingState message="Loading venue suggestions..." />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell activePath="/admin/suggestions">
        <div className="py-20">
          <ErrorState message={error} />
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell activePath="/admin/suggestions">
      <div className="py-5">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Internal</p>
            <h1 className="mt-2 text-4xl font-semibold">Venue suggestions</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Review missing venues submitted by signed-in users before adding them to Sheesha.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/admin/venues/new">New venue</Link>
            </Button>
          </div>
        </div>

        <AdminSuggestionSummaryCards suggestions={suggestions} />

        <Card className="mb-5 mt-8">
          <CardContent>
            <AdminSuggestionFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />
          </CardContent>
        </Card>

        {mutationError ? <Alert className="mb-5 border-destructive/30 text-destructive">{mutationError}</Alert> : null}

        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredSuggestions.length} of {suggestions.length} suggestions
        </div>

        {filteredSuggestions.length ? (
          <AdminSuggestionTable
            suggestions={filteredSuggestions}
            pendingSuggestionId={pendingSuggestionId}
            onAction={openActionDialog}
          />
        ) : (
          <EmptyState title="No suggestions match these filters" description="Adjust the search or status filter to continue review." />
        )}
      </div>

      <AdminSuggestionNotesDialog
        open={Boolean(pendingAction && pendingSuggestion)}
        action={pendingAction}
        suggestion={pendingSuggestion}
        isSubmitting={Boolean(pendingSuggestionId)}
        onCancel={() => {
          setPendingAction(null);
          setPendingSuggestion(null);
          setMutationError(null);
        }}
        onSubmit={handleSuggestionSubmit}
      />
    </AdminPageShell>
  );
}
