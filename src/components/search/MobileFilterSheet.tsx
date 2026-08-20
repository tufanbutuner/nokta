import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VenueFilters } from "@/components/search/VenueFilters";
import type { VenueFilterState } from "@/types/filters";

export function MobileFilterSheet({
  filters,
  onChange,
  onClear,
  resultCount,
}: {
  filters: VenueFilterState;
  onChange: (filters: VenueFilterState) => void;
  onClear: () => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="w-full sm:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filters
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetClose onClick={() => setOpen(false)} />
        </SheetHeader>
        <VenueFilters filters={filters} onChange={onChange} onClear={onClear} className="grid gap-4" />
        <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
          {resultCount === 1 ? "Show 1 venue" : `Show ${resultCount} venues`}
        </Button>
      </Sheet>
    </>
  );
}
