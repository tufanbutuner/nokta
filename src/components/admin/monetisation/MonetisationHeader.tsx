import { Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MonetisationHeader({
  venueCount,
  noteVenueId,
  onExport,
}: {
  venueCount: number;
  noteVenueId?: string;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-['Outfit'] text-[22px] font-semibold leading-tight tracking-[-0.5px] text-clay-600">Monetisation</h1>
        <p className="mt-1 text-[13px] text-[#8a7e72]">Pipeline overview &middot; {venueCount} venues tracked</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg border-black/[0.06] bg-white px-3 font-['Outfit'] text-xs font-medium text-clay-600 hover:bg-clay-50"
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button
          asChild={Boolean(noteVenueId)}
          type="button"
          size="sm"
          className="h-9 rounded-lg bg-clay-400 px-3 font-['Outfit'] text-xs font-medium text-white hover:bg-clay-500 disabled:opacity-50"
          disabled={!noteVenueId}
        >
          {noteVenueId ? (
            <Link to={`/admin/venues/${noteVenueId}/edit?focus=monetisationNotes`}>
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Link>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
