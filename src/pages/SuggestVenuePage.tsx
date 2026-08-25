import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MySuggestionsList } from "@/components/suggestions/MySuggestionsList";
import { SuggestVenueForm } from "@/components/suggestions/SuggestVenueForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { createVenueSuggestion, getMyVenueSuggestions } from "@/services/venueSuggestionService";
import type { VenueSuggestion, VenueSuggestionInput } from "@/types/venueSuggestions";

export function SuggestVenuePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { venues } = useVenues();
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    async function loadSuggestions() {
      setIsLoadingSuggestions(true);
      setError(null);

      try {
        const nextSuggestions = await getMyVenueSuggestions(user!.id);
        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSuggestions([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load your suggestions.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
        }
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(suggestion: VenueSuggestionInput) {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextSuggestion = await createVenueSuggestion({ userId: user.id, suggestion });
      setSuggestions((currentSuggestions) => [nextSuggestion, ...currentSuggestions]);
      setSuccessMessage("Thanks — your suggestion has been submitted for review.");
      trackEvent("suggestion_submitted", {
        hasWebsite: Boolean(suggestion.website?.trim()),
        hasInstagram: Boolean(suggestion.instagram?.trim()),
        hasAddress: Boolean(suggestion.address?.trim()),
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not submit suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main>
        <PageContainer className="py-20">
          <LoadingState message="Loading suggestion form..." />
        </PageContainer>
      </main>
    );
  }

  return (
    <main>
      <PageMeta
        title="Suggest a Sheesha Venue | Sheesha"
        description="Know a London shisha spot we are missing? Suggest it for review."
        canonicalPath="/suggest"
      />
      <PageContainer className="py-10">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">Suggest</p>
          <h1 className="mt-2 text-4xl font-semibold">Suggest a venue</h1>
          <p className="mt-3 text-muted-foreground">
            Know a sheesha spot we are missing? Send it over and we will review it before adding it to Sheesha.
          </p>
        </div>

        {!user ? (
          <Card className="max-w-xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Sign in to suggest a venue.</h2>
              <p className="mt-3 text-muted-foreground">Suggestions are tied to an account so admins can keep data quality tight.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/sign-in">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/sign-up">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-4">
              {successMessage ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">{successMessage}</Alert> : null}
              {error ? <ErrorState title="Suggestion error" message={error} /> : null}
              <SuggestVenueForm existingVenueNames={venues.map((venue) => venue.name)} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
            </section>

            <aside>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Your suggestions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Track what you have sent for review.</p>
              </div>
              {isLoadingSuggestions ? <LoadingState message="Loading suggestions..." /> : <MySuggestionsList suggestions={suggestions} />}
            </aside>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
