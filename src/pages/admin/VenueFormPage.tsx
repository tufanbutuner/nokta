import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { VenueForm } from "@/components/admin/venues/VenueForm";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { createEmptyVenueFormValues, createVenueFormValuesFromSuggestion, mapVenueToFormValues } from "@/lib/venueFormMappers";
import { createVenue, getVenueById, updateVenue } from "@/services/adminVenueService";
import { getAdminVenueSuggestionById } from "@/services/adminVenueSuggestionService";
import type { VenueFormValues } from "@/types/venueForm";
import type { VenueSuggestion } from "@/types/venueSuggestions";

export function VenueFormPage({ mode }: { mode: "new" | "edit" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const suggestionId = mode === "new" ? searchParams.get("suggestion") : null;
  const [initialValues, setInitialValues] = useState<VenueFormValues | null>(
    mode === "new" && !suggestionId ? createEmptyVenueFormValues() : null,
  );
  const [sourceSuggestion, setSourceSuggestion] = useState<VenueSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit" || Boolean(suggestionId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const title = useMemo(() => (mode === "new" ? "New venue" : "Edit venue"), [mode]);
  const focusTarget = searchParams.get("focus");

  useEffect(() => {
    let cancelled = false;

    if (mode === "new") {
      setLoadError(null);
      setSourceSuggestion(null);

      if (!suggestionId) {
        setInitialValues(createEmptyVenueFormValues());
        setIsLoading(false);
        return;
      }

      setInitialValues(null);
      setIsLoading(true);

      void getAdminVenueSuggestionById(suggestionId)
        .then((suggestion) => {
          if (cancelled) {
            return;
          }

          if (!suggestion) {
            setLoadError("Suggestion not found.");
            return;
          }

          setSourceSuggestion(suggestion);
          setInitialValues(createVenueFormValuesFromSuggestion(suggestion));
        })
        .catch((caughtError) => {
          if (!cancelled) {
            setInitialValues(null);
            setLoadError(caughtError instanceof Error ? caughtError.message : "Could not load venue suggestion.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    setSourceSuggestion(null);

    if (!id) {
      setInitialValues(null);
      setLoadError("Venue ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    void getVenueById(id)
      .then((venue) => {
        if (cancelled) {
          return;
        }

        if (!venue) {
          setInitialValues(null);
          setLoadError("Venue not found.");
          return;
        }

        setInitialValues(mapVenueToFormValues(venue));
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setInitialValues(null);
          setLoadError(caughtError instanceof Error ? caughtError.message : "Could not load venue.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, mode, suggestionId]);

  useEffect(() => {
    if (isLoading || focusTarget !== "monetisationNotes") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const field = document.getElementById("monetisationNotes");
      field?.scrollIntoView({ block: "center" });
      field?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [focusTarget, isLoading]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function handleSubmit(values: VenueFormValues) {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      if (mode === "new") {
        const createdVenue = await createVenue(values);
        setToast({ type: "success", message: "Venue created." });
        navigate(`/admin/venues/${createdVenue.id}/edit`, { replace: true });
        return;
      }

      if (!id) {
        throw new Error("Venue ID is missing.");
      }

      const updatedVenue = await updateVenue(id, values);
      setInitialValues(mapVenueToFormValues(updatedVenue));
      setSaveMessage("Venue saved.");
      setToast({ type: "success", message: "Venue saved." });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not save venue.";
      setSaveError(message);
      setToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell activePath="/admin/venues">
        <div className="py-20">
          <LoadingState message="Loading venue form..." />
        </div>
      </AdminPageShell>
    );
  }

  if (loadError || !initialValues) {
    return (
      <AdminPageShell activePath="/admin/venues">
        <div className="py-20">
          <ErrorState message={loadError ?? "Could not load venue form."} />
          <Button asChild className="mt-6">
            <Link to="/admin/venues">Back to venues</Link>
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell activePath="/admin/venues">
      <div className="py-5">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Internal</p>
          <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Maintain venue details, source provenance, verification status and data quality inputs.
          </p>
        </div>
        {sourceSuggestion ? (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-900">
            Prefilled from suggestion: {sourceSuggestion.venueName}. Review the details, add coordinates and any missing verification before saving.
          </Alert>
        ) : null}
        <VenueForm
          key={`${mode}-${suggestionId ?? (initialValues.id || "new")}`}
          initialValues={initialValues}
          mode={mode}
          isSaving={isSaving}
          saveMessage={saveMessage}
          saveError={saveError}
          onSubmit={handleSubmit}
          onInvalidSubmit={(errors) => setToast({ type: "error", message: `Please fix ${formatValidationFields(errors)} before saving.` })}
        />
        {toast ? <Toast type={toast.type} title={toast.type === "success" ? "Saved" : "Save failed"} message={toast.message} onClose={() => setToast(null)} /> : null}
      </div>
    </AdminPageShell>
  );
}

function formatValidationFields(errors: Record<string, string>) {
  const labels = Object.keys(errors).slice(0, 3).map(formatValidationField);
  const remainingCount = Math.max(0, Object.keys(errors).length - labels.length);
  const fieldList = labels.join(", ");

  return remainingCount ? `${fieldList} and ${remainingCount} more field${remainingCount === 1 ? "" : "s"}` : fieldList || "the highlighted fields";
}

function formatValidationField(field: string) {
  return field
    .replace(/^dataSources\./, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .toLowerCase();
}
