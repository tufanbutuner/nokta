import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { VenueForm } from "@/components/admin/venues/VenueForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { createEmptyVenueFormValues, mapVenueToFormValues } from "@/lib/venueFormMappers";
import { createVenue, getVenueById, updateVenue } from "@/services/adminVenueService";
import type { VenueFormValues } from "@/types/venueForm";

export function VenueFormPage({ mode }: { mode: "new" | "edit" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<VenueFormValues | null>(mode === "new" ? createEmptyVenueFormValues() : null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const title = useMemo(() => (mode === "new" ? "New venue" : "Edit venue"), [mode]);

  useEffect(() => {
    if (mode === "new") {
      setInitialValues(createEmptyVenueFormValues());
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    if (!id) {
      setInitialValues(null);
      setLoadError("Venue ID is missing.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
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
  }, [id, mode]);

  async function handleSubmit(values: VenueFormValues) {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      if (mode === "new") {
        const createdVenue = await createVenue(values);
        navigate(`/admin/venues/${createdVenue.id}/edit`, { replace: true });
        return;
      }

      if (!id) {
        throw new Error("Venue ID is missing.");
      }

      const updatedVenue = await updateVenue(id, values);
      setInitialValues(mapVenueToFormValues(updatedVenue));
      setSaveMessage("Venue saved.");
    } catch (caughtError) {
      setSaveError(caughtError instanceof Error ? caughtError.message : "Could not save venue.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <PageContainer className="py-20">
          <LoadingState message="Loading venue form..." />
        </PageContainer>
      </main>
    );
  }

  if (loadError || !initialValues) {
    return (
      <main>
        <PageContainer className="py-20">
          <ErrorState message={loadError ?? "Could not load venue form."} />
          <Button asChild className="mt-6">
            <Link to="/admin/venues">Back to venues</Link>
          </Button>
        </PageContainer>
      </main>
    );
  }

  return (
    <main>
      <PageContainer className="py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Internal</p>
          <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Maintain venue details, source provenance, verification status and data quality inputs.
          </p>
        </div>
        <VenueForm
          key={`${mode}-${initialValues.id || "new"}`}
          initialValues={initialValues}
          mode={mode}
          isSaving={isSaving}
          saveMessage={saveMessage}
          saveError={saveError}
          onSubmit={handleSubmit}
        />
      </PageContainer>
    </main>
  );
}
