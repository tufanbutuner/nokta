import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPenceAsPrice, pencePriceToPoundsFloor } from "@/lib/venueMenuValidation";
import type { PriceLevel } from "@/types/venue";
import type { VenueMenuLinkField } from "@/services/venueMenuService";

const PRICE_LEVELS: PriceLevel[] = [1, 2, 3, 4];

export function MenuPriceSummary({ derivedPricePence, priceLevel }: { derivedPricePence: number | null; priceLevel: PriceLevel }) {
  return (
    <section className="rounded-xl border bg-card px-[17px] py-[15px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-nokta-ink">
            {derivedPricePence === null ? "No price yet" : `From £${pencePriceToPoundsFloor(derivedPricePence)} · ${"£".repeat(priceLevel)}`}
          </h2>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
            {derivedPricePence === null
              ? "Add a live shisha item and your page will show a price you never have to type."
              : `Taken from your cheapest live shisha item (${formatPenceAsPrice(derivedPricePence)}). Search filters and sorting use this — you never type it.`}
          </p>
        </div>
        <div className="flex flex-none gap-1.5" role="group" aria-label="Price level">
          {PRICE_LEVELS.map((level) => (
            <span
              key={level}
              aria-current={level === priceLevel}
              className={cn(
                "flex h-8 w-[38px] items-center justify-center rounded-[7px] border text-[12.5px]",
                level === priceLevel ? "border-clay-accent bg-clay-accent/10 font-semibold text-[#a44a30]" : "text-muted-foreground",
              )}
            >
              {"£".repeat(level)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const LINK_FIELDS: { field: VenueMenuLinkField; label: string }[] = [
  { field: "shishaMenuUrl", label: "Shisha menu" },
  { field: "menuUrl", label: "Food & drink" },
  { field: "shishaPageUrl", label: "Shisha page" },
];

export function ExternalMenuLinksCard({
  links,
  isSaving,
  onSave,
}: {
  links: Record<VenueMenuLinkField, string | null>;
  isSaving: boolean;
  onSave: (links: Record<VenueMenuLinkField, string | null>) => void;
}) {
  const [values, setValues] = useState(links);
  const isDirty = LINK_FIELDS.some(({ field }) => (values[field] ?? "") !== (links[field] ?? ""));

  return (
    <section className="rounded-xl border bg-[oklch(0.97_0.015_60)] px-[17px] py-[14px]">
      <h2 className="text-[13px] font-semibold text-nokta-ink">External menu links</h2>
      <p className="mt-1 text-xs leading-[1.5] text-muted-foreground">
        Kept for venues that would rather not maintain a list. If a link and items both exist, items win on the public page.
      </p>
      <div className="mt-3 flex flex-col gap-[9px]">
        {LINK_FIELDS.map(({ field, label }) => (
          <label key={field} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="w-28 flex-none text-[12.5px] text-muted-foreground">{label}</span>
            <Input
              value={values[field] ?? ""}
              placeholder="Add a link"
              onChange={(event) => setValues({ ...values, [field]: event.target.value || null })}
              className="h-9 text-[13px]"
            />
          </label>
        ))}
      </div>
      {isDirty ? (
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={() => onSave(values)} disabled={isSaving} className="h-[31px] text-[12.5px]">
            {isSaving ? "Saving..." : "Save links"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setValues(links)} disabled={isSaving} className="h-[31px] text-[12.5px]">Cancel</Button>
        </div>
      ) : null}
    </section>
  );
}
