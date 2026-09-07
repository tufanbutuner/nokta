import { useState } from "react";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPenceAsPrice, parsePriceInputToPence, validateMenuItemPricePence } from "@/lib/venueMenuValidation";
import type { VenueMenuItem, VenueMenuItemDraftChange, VenueMenuSection } from "@/types/venueMenu";

interface MenuSectionCardProps {
  section: VenueMenuSection;
  items: VenueMenuItem[];
  errors: Record<string, string>;
  onUpdateItem: (itemId: string, change: VenueMenuItemDraftChange) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (sectionId: string) => void;
  onRaisePrices: (sectionId: string) => void;
}

export function MenuSectionCard({ section, items, errors, onUpdateItem, onRemoveItem, onAddItem, onRaisePrices }: MenuSectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-[17px] py-[13px]">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[14.5px] font-semibold text-nokta-ink">{section.name}</h2>
          <span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-3">
          {items.length ? (
            <button type="button" onClick={() => onRaisePrices(section.id)} className="text-[12.5px] font-medium text-clay-accent hover:underline">Raise all by %</button>
          ) : null}
          <button type="button" onClick={() => onAddItem(section.id)} className="text-[12.5px] font-medium text-clay-accent hover:underline">+ Add item</button>
        </div>
      </div>

      {items.length ? (
        <>
          <div className="hidden grid-cols-[22px_1.4fr_1fr_92px_74px_30px] gap-[10px] border-b bg-[oklch(0.97_0.012_60)] px-[17px] py-2 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted-foreground lg:grid">
            <span />
            <span>Item</span>
            <span>Note</span>
            <span className="text-right">Price</span>
            <span className="text-center">Live</span>
            <span />
          </div>
          {items.map((item, index) => (
            <MenuItemRow
              key={item.id}
              item={item}
              isLast={index === items.length - 1}
              nameError={errors[`${item.id}.name`]}
              priceError={errors[`${item.id}.price`]}
              onUpdate={(change) => onUpdateItem(item.id, change)}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}
        </>
      ) : (
        <div className="px-[17px] py-[15px]">
          <div className="rounded-[10px] border border-dashed p-[13px] text-center">
            <p className="text-[13px] text-muted-foreground">No items in {section.name} yet. Add a few, or link your existing menu.</p>
            <button
              type="button"
              onClick={() => onAddItem(section.id)}
              className="mt-3 inline-flex h-[31px] items-center rounded-lg bg-clay-accent px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-clay-accent/90"
            >
              Add item
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MenuItemRow({
  item,
  isLast,
  nameError,
  priceError,
  onUpdate,
  onRemove,
}: {
  item: VenueMenuItem;
  isLast: boolean;
  nameError?: string;
  priceError?: string;
  onUpdate: (change: VenueMenuItemDraftChange) => void;
  onRemove: () => void;
}) {
  const [editingField, setEditingField] = useState<"name" | "note" | "price" | null>(null);
  const hasError = Boolean(nameError || priceError);

  return (
    <div
      className={cn(
        "grid grid-cols-[22px_1fr_auto] items-center gap-[10px] px-[17px] py-[11px] lg:grid-cols-[22px_1.4fr_1fr_92px_74px_30px]",
        isLast ? "" : "border-b",
        editingField ? "bg-[oklch(0.985_0.02_75)]" : "",
        hasError ? "bg-destructive/5" : "",
      )}
    >
      <GripVertical className="h-4 w-4 cursor-grab text-[oklch(0.72_0.02_42)]" aria-hidden="true" />

      <div className="min-w-0">
        <InlineText
          value={item.name}
          placeholder="Item name"
          isEditing={editingField === "name"}
          onEdit={() => setEditingField("name")}
          onCommit={(value) => {
            onUpdate({ name: value });
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
          className={cn("text-[13.5px] font-medium", item.isLive ? "text-nokta-ink" : "text-[oklch(0.55_0.02_42)]")}
        />
        {nameError ? <p className="mt-1 text-xs text-destructive">{nameError}</p> : null}
        <div className="mt-1 lg:hidden">
          <InlineText
            value={item.note ?? ""}
            placeholder="Add a note"
            isEditing={editingField === "note"}
            onEdit={() => setEditingField("note")}
            onCommit={(value) => {
              onUpdate({ note: value || null });
              setEditingField(null);
            }}
            onCancel={() => setEditingField(null)}
            className="text-[12.5px] text-muted-foreground"
          />
        </div>
      </div>

      <div className="hidden min-w-0 lg:block">
        <InlineText
          value={item.note ?? ""}
          placeholder="Add a note"
          isEditing={editingField === "note"}
          onEdit={() => setEditingField("note")}
          onCommit={(value) => {
            onUpdate({ note: value || null });
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
          className={cn("text-[12.5px]", item.isLive ? "text-muted-foreground" : "text-[oklch(0.62_0.02_42)]")}
        />
      </div>

      <div className="hidden justify-end lg:flex">
        <InlinePrice
          pricePence={item.pricePence}
          isEditing={editingField === "price"}
          hasError={Boolean(priceError)}
          isLive={item.isLive}
          onEdit={() => setEditingField("price")}
          onCommit={(pence) => {
            if (pence !== null) onUpdate({ pricePence: pence });
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      </div>

      <div className="hidden justify-center lg:flex">
        <LiveToggle isLive={item.isLive} name={item.name} onChange={(isLive) => onUpdate({ isLive })} />
      </div>

      <div className="hidden justify-end lg:flex">
        <RemoveButton name={item.name} onRemove={onRemove} />
      </div>

      <div className="flex items-center gap-3 lg:hidden">
        <InlinePrice
          pricePence={item.pricePence}
          isEditing={editingField === "price"}
          hasError={Boolean(priceError)}
          isLive={item.isLive}
          onEdit={() => setEditingField("price")}
          onCommit={(pence) => {
            if (pence !== null) onUpdate({ pricePence: pence });
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
        <LiveToggle isLive={item.isLive} name={item.name} onChange={(isLive) => onUpdate({ isLive })} />
        <RemoveButton name={item.name} onRemove={onRemove} />
      </div>

      {priceError ? <p className="col-span-full text-xs text-destructive lg:col-start-4 lg:col-end-7 lg:text-right">{priceError}</p> : null}
    </div>
  );
}

function InlineText({
  value,
  placeholder,
  isEditing,
  onEdit,
  onCommit,
  onCancel,
  className,
}: {
  value: string;
  placeholder: string;
  isEditing: boolean;
  onEdit: () => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [pending, setPending] = useState(value);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setPending(value);
          onEdit();
        }}
        className={cn("block w-full truncate rounded px-1 py-0.5 text-left hover:bg-black/[0.03]", value ? className : "text-[oklch(0.62_0.02_42)]", className)}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={pending}
      onChange={(event) => setPending(event.target.value)}
      onBlur={() => onCommit(pending)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit(pending);
        if (event.key === "Escape") onCancel();
      }}
      className="h-[30px] w-full rounded-[7px] border border-clay-accent bg-background px-[9px] text-[13.5px]"
      aria-label={placeholder}
    />
  );
}

function InlinePrice({
  pricePence,
  isEditing,
  hasError,
  isLive,
  onEdit,
  onCommit,
  onCancel,
}: {
  pricePence: number;
  isEditing: boolean;
  hasError: boolean;
  isLive: boolean;
  onEdit: () => void;
  onCommit: (pence: number | null) => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(() => (pricePence / 100).toString());
  const [parseError, setParseError] = useState<string | null>(null);

  // An unparseable price keeps the field open with a message rather than
  // silently snapping back to the old value.
  function commit(raw: string) {
    const parsed = parsePriceInputToPence(raw);
    const error = validateMenuItemPricePence(parsed);
    if (error) {
      setParseError(error);
      return;
    }
    setParseError(null);
    onCommit(parsed);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setPending((pricePence / 100).toString());
          setParseError(null);
          onEdit();
        }}
        className={cn(
          "rounded px-1 py-0.5 text-right text-[13.5px] font-semibold hover:bg-black/[0.03]",
          isLive ? "text-nokta-ink" : "text-[oklch(0.55_0.02_42)]",
          hasError ? "text-destructive" : "",
        )}
      >
        {formatPenceAsPrice(pricePence)}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        autoFocus
        inputMode="decimal"
        value={pending}
        onChange={(event) => {
          setPending(event.target.value);
          if (parseError) setParseError(null);
        }}
        onBlur={() => commit(pending)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit(pending);
          if (event.key === "Escape") {
            setParseError(null);
            onCancel();
          }
        }}
        className={cn(
          "h-[30px] w-[92px] rounded-[7px] border bg-background px-[9px] text-right text-[13.5px] font-semibold",
          parseError ? "border-destructive" : "border-clay-accent",
        )}
        aria-label="Price"
        aria-invalid={Boolean(parseError)}
      />
      {parseError ? <span className="text-xs text-destructive">{parseError}</span> : null}
    </div>
  );
}

function LiveToggle({ isLive, name, onChange }: { isLive: boolean; name: string; onChange: (isLive: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLive}
      aria-label={`Show ${name || "item"} on your public page`}
      onClick={() => onChange(!isLive)}
      className={cn(
        "flex h-11 w-11 items-center justify-center lg:h-[18px] lg:w-8 lg:justify-start",
      )}
    >
      <span className={cn("flex h-[18px] w-8 items-center rounded-full p-[2px] transition-colors", isLive ? "bg-clay-accent" : "bg-[oklch(0.86_0.015_55)]")}>
        <span className={cn("h-[14px] w-[14px] rounded-full bg-white transition-transform", isLive ? "translate-x-[14px]" : "translate-x-0")} />
      </span>
    </button>
  );
}

function RemoveButton({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${name || "item"}`}
      className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-destructive lg:h-[30px] lg:w-[30px]"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
