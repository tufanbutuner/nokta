import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Percent, Plus, Trash2, X } from "lucide-react";
import { workspacePrimaryActionClass, workspaceSecondaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { cn } from "@/lib/utils";
import { MAX_MENU_ITEM_NAME_LENGTH, MAX_MENU_ITEM_NOTE_LENGTH, MAX_MENU_SECTION_NAME_LENGTH, parsePriceInputToPence, validateMenuItemPricePence } from "@/lib/venueMenuValidation";
import type { VenueMenuItem, VenueMenuItemEdit, VenueMenuSection, VenueMenuSectionDraftChange } from "@/types/venueMenu";

/** Reads as text until hovered or focused, so the menu looks like a menu, not a form. */
const quietInputClass =
  "w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2.5 text-nokta-ink outline-none transition-colors placeholder:text-nokta-ink-muted/70 hover:border-nokta-border focus:border-nokta-accent focus:bg-nokta-surface-alt aria-[invalid=true]:border-nokta-bad-line aria-[invalid=true]:bg-nokta-bad-tint";

const iconButtonClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-nokta-ink-muted transition-colors hover:bg-nokta-hover hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35";

interface MenuSectionCardProps {
  section: VenueMenuSection;
  items: VenueMenuItem[];
  isFirst: boolean;
  isLast: boolean;
  isNew: boolean;
  changedItemIds: Set<string>;
  errors: Record<string, string>;
  showErrors: boolean;
  focusId: string | null;
  onFocused: () => void;
  onUpdateSection: (change: VenueMenuSectionDraftChange) => void;
  onMoveSection: (direction: -1 | 1) => void;
  onRemoveSection: () => void;
  onRaisePrices: (percent: number) => void;
  onUpdateItem: (itemId: string, change: VenueMenuItemEdit) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: () => void;
}

export function MenuSectionCard(props: MenuSectionCardProps) {
  const { section, items, isFirst, isLast, isNew, errors, showErrors, focusId, onFocused } = props;
  const [panel, setPanel] = useState<"raise" | "remove" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameError = errors[`${section.id}.section`];
  const liveCount = items.filter((item) => item.isLive).length;

  useEffect(() => {
    if (focusId !== section.id) return;
    nameRef.current?.focus();
    nameRef.current?.select();
    onFocused();
  }, [focusId, section.id, onFocused]);

  return (
    <section aria-label={section.name || "New section"} className="overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface">
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-nokta-divider-row px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-[1_1_16rem]">
          <input
            ref={nameRef}
            value={section.name}
            maxLength={MAX_MENU_SECTION_NAME_LENGTH}
            placeholder="Section name, e.g. Shisha"
            aria-label="Section name"
            aria-invalid={Boolean(nameError)}
            onChange={(event) => props.onUpdateSection({ name: event.target.value })}
            className={cn(quietInputClass, "h-11 font-brand text-xl font-bold tracking-[-0.01em]")}
          />
          {nameError ? <p className="mt-1 px-2.5 text-[13px] text-nokta-bad-ink">{nameError}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 text-[13px] text-nokta-ink-muted">
            <span>
              {items.length} item{items.length === 1 ? "" : "s"}
              {items.length && liveCount !== items.length ? ` · ${liveCount} live` : ""}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <Switch checked={section.isShisha} onChange={(isShisha) => props.onUpdateSection({ isShisha })} label="Sets your ‘from’ price" />
              <span>Sets your ‘from’ price</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {items.length ? (
            <button type="button" className={cn(iconButtonClass, panel === "raise" && "bg-nokta-hover text-nokta-ink")} aria-label={`Raise prices in ${section.name || "this section"}`} aria-expanded={panel === "raise"} title="Raise prices by %" onClick={() => setPanel(panel === "raise" ? null : "raise")}>
              <Percent className="size-4" />
            </button>
          ) : null}
          <button type="button" className={iconButtonClass} aria-label={`Move ${section.name || "section"} up`} title="Move up" disabled={isFirst} onClick={() => props.onMoveSection(-1)}>
            <ArrowUp className="size-4" />
          </button>
          <button type="button" className={iconButtonClass} aria-label={`Move ${section.name || "section"} down`} title="Move down" disabled={isLast} onClick={() => props.onMoveSection(1)}>
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            className={cn(iconButtonClass, "hover:bg-nokta-bad-tint hover:text-nokta-bad-ink", panel === "remove" && "bg-nokta-bad-tint text-nokta-bad-ink")}
            aria-label={`Remove ${section.name || "section"}`}
            aria-expanded={panel === "remove"}
            title="Remove section"
            onClick={() => (isNew && !items.length ? props.onRemoveSection() : setPanel(panel === "remove" ? null : "remove"))}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {panel === "raise" ? <RaisePricesPanel onApply={(percent) => { props.onRaisePrices(percent); setPanel(null); }} onClose={() => setPanel(null)} /> : null}
        {panel === "remove" ? (
          <div role="alert" className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl bg-nokta-bad-tint px-4 py-3 text-sm text-nokta-bad-ink">
            <span>
              Remove <strong className="font-semibold">{section.name || "this section"}</strong>
              {items.length ? ` and its ${items.length} item${items.length === 1 ? "" : "s"}` : ""}? Nothing changes until you publish.
            </span>
            <span className="flex gap-2">
              <button type="button" className={workspaceSecondaryActionClass} onClick={() => setPanel(null)}>Keep</button>
              <button type="button" className={cn(workspacePrimaryActionClass, "bg-nokta-bad-solid text-white")} onClick={props.onRemoveSection}>Remove</button>
            </span>
          </div>
        ) : null}
      </header>

      {items.length ? (
        <>
          <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7.5rem_3.5rem_7rem] gap-2 border-b border-nokta-divider-row bg-nokta-surface-alt px-4 py-2 text-xs font-medium text-nokta-ink-muted lg:grid">
            <span className="pl-2.5">Item</span>
            <span className="pl-2.5">Note</span>
            <span className="pr-2.5 text-right">Price</span>
            <span className="text-center">Live</span>
            <span />
          </div>
          <ul className="divide-y divide-nokta-divider-row">
            {items.map((item, index) => (
              <MenuItemRow
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                isChanged={props.changedItemIds.has(item.id)}
                isNew={item.id.startsWith("new-")}
                errors={errors}
                showErrors={showErrors}
                autoFocus={focusId === item.id}
                onFocused={onFocused}
                onUpdate={(change) => props.onUpdateItem(item.id, change)}
                onMove={(direction) => props.onMoveItem(item.id, direction)}
                onRemove={() => props.onRemoveItem(item.id)}
                onSubmitRow={index === items.length - 1 ? props.onAddItem : undefined}
              />
            ))}
          </ul>
        </>
      ) : null}

      <div className="p-3 sm:px-4">
        <button
          type="button"
          onClick={props.onAddItem}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-nokta-border text-sm font-semibold text-nokta-ink-muted transition-colors hover:border-nokta-accent hover:bg-nokta-hover hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus aria-hidden="true" className="size-4" />
          {items.length ? "Add item" : `Add the first item${section.name.trim() ? ` to ${section.name.trim()}` : ""}`}
        </button>
      </div>
    </section>
  );
}

function MenuItemRow({
  item,
  isFirst,
  isLast,
  isChanged,
  isNew,
  errors,
  showErrors,
  autoFocus,
  onFocused,
  onUpdate,
  onMove,
  onRemove,
  onSubmitRow,
}: {
  item: VenueMenuItem;
  isFirst: boolean;
  isLast: boolean;
  isChanged: boolean;
  isNew: boolean;
  errors: Record<string, string>;
  showErrors: boolean;
  autoFocus: boolean;
  onFocused: () => void;
  onUpdate: (change: VenueMenuItemEdit) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onSubmitRow?: () => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState<{ name?: boolean; price?: boolean }>({});
  // A new item's price stays blank rather than reading £0 until it is typed.
  const [priceText, setPriceText] = useState(() => (isNew && item.pricePence === 0 ? "" : formatPriceInput(item.pricePence)));
  const [priceFocused, setPriceFocused] = useState(false);
  const [localPriceError, setLocalPriceError] = useState<string | null>(null);

  // Keep the field in step with changes made elsewhere (e.g. "raise by %").
  useEffect(() => {
    if (priceFocused || localPriceError) return;
    if (isNew && item.pricePence === 0 && !priceText) return;
    setPriceText(formatPriceInput(item.pricePence));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.pricePence]);

  useEffect(() => {
    if (!autoFocus) return;
    nameRef.current?.focus();
    onFocused();
  }, [autoFocus, onFocused]);

  const nameError = showErrors || touched.name ? errors[`${item.id}.name`] : undefined;
  const priceError = localPriceError ?? (showErrors || touched.price ? errors[`${item.id}.price`] : undefined);
  const label = item.name.trim() || "this item";

  function handlePriceChange(raw: string) {
    setPriceText(raw);
    const pence = parsePriceInputToPence(raw);
    const error = raw.trim() ? validateMenuItemPricePence(pence) : null;
    setLocalPriceError(null);
    onUpdate({ pricePence: error || pence === null ? null : pence });
  }

  function handlePriceBlur() {
    setPriceFocused(false);
    setTouched((current) => ({ ...current, price: true }));
    if (!priceText.trim()) {
      setLocalPriceError(validateMenuItemPricePence(null));
      return;
    }
    const pence = parsePriceInputToPence(priceText);
    const error = validateMenuItemPricePence(pence);
    setLocalPriceError(error);
    if (!error && pence !== null) setPriceText(formatPriceInput(pence));
  }

  function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !onSubmitRow) return;
    event.preventDefault();
    onSubmitRow();
  }

  return (
    <li className={cn("relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 px-3 py-2.5 sm:px-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7.5rem_3.5rem_7rem] lg:items-center", !item.isLive && "bg-nokta-surface-alt")}>
      {isChanged ? (
        <span className="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-nokta-accent-solid" title="Unpublished change">
          <span className="sr-only">Unpublished change</span>
        </span>
      ) : null}

      <div className="col-span-2 min-w-0 lg:col-span-1">
        <input
          ref={nameRef}
          value={item.name}
          maxLength={MAX_MENU_ITEM_NAME_LENGTH}
          placeholder="Item name"
          aria-label="Item name"
          aria-invalid={Boolean(nameError)}
          onChange={(event) => onUpdate({ name: event.target.value })}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          onKeyDown={submitOnEnter}
          className={cn(quietInputClass, "h-10 text-[15px] font-semibold", !item.isLive && "text-nokta-ink-muted")}
        />
        {nameError ? <p className="px-2.5 pt-0.5 text-[13px] text-nokta-bad-ink">{nameError}</p> : null}
      </div>

      <div className="col-span-2 min-w-0 lg:col-span-1">
        <input
          value={item.note ?? ""}
          maxLength={MAX_MENU_ITEM_NOTE_LENGTH}
          placeholder="Add a note"
          aria-label={`Note for ${label}`}
          onChange={(event) => onUpdate({ note: event.target.value || null })}
          onKeyDown={submitOnEnter}
          className={cn(quietInputClass, "h-9 text-sm text-nokta-ink-muted lg:h-10")}
        />
      </div>

      <div className="min-w-0">
        <div className="relative w-[7.5rem] max-w-full">
          <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-nokta-ink-muted">£</span>
          <input
            value={priceText}
            inputMode="decimal"
            placeholder="0.00"
            aria-label={`Price for ${label}`}
            aria-invalid={Boolean(priceError)}
            onChange={(event) => handlePriceChange(event.target.value)}
            onFocus={() => setPriceFocused(true)}
            onBlur={handlePriceBlur}
            onKeyDown={submitOnEnter}
            className={cn(quietInputClass, "h-10 pl-6 text-right text-[15px] font-semibold tabular-nums")}
          />
        </div>
        {priceError ? <p className="pt-0.5 text-[13px] text-nokta-bad-ink lg:text-right">{priceError}</p> : null}
      </div>

      <div className="flex items-center justify-end gap-0.5 lg:contents">
        <div className="flex justify-center">
          <Switch checked={item.isLive} onChange={(isLive) => onUpdate({ isLive })} label={`Show ${label} on your public page`} />
        </div>
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" className={iconButtonClass} aria-label={`Move ${label} up`} title="Move up" disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp className="size-4" />
          </button>
          <button type="button" className={iconButtonClass} aria-label={`Move ${label} down`} title="Move down" disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown className="size-4" />
          </button>
          <button type="button" className={cn(iconButtonClass, "hover:bg-nokta-bad-tint hover:text-nokta-bad-ink")} aria-label={`Remove ${label}`} title="Remove" onClick={onRemove}>
            <X className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function RaisePricesPanel({ onApply, onClose }: { onApply: (percent: number) => void; onClose: () => void }) {
  const [value, setValue] = useState("5");
  const percent = Number(value);
  const isValid = value.trim() !== "" && Number.isFinite(percent) && percent !== 0 && percent > -100 && percent <= 100;

  return (
    <form
      className="flex w-full flex-wrap items-center gap-3 rounded-xl bg-nokta-hover px-4 py-3 text-sm text-nokta-ink"
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) onApply(percent);
      }}
    >
      <label htmlFor="raise-percent" className="font-medium">Change every live price by</label>
      <span className="relative">
        <input
          id="raise-percent"
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && onClose()}
          className="h-10 w-20 rounded-lg border border-nokta-border-input bg-nokta-surface pr-7 text-right font-semibold tabular-nums outline-none focus:border-nokta-accent"
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-nokta-ink-muted">%</span>
      </span>
      <span className="text-nokta-ink-muted">Rounded to the nearest 50p. Use a minus to lower.</span>
      <span className="ml-auto flex gap-2">
        <button type="button" className={workspaceSecondaryActionClass} onClick={onClose}>Cancel</button>
        <button type="submit" className={workspacePrimaryActionClass} disabled={!isValid}>Apply</button>
      </span>
    </form>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-9 min-w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", checked ? "bg-nokta-accent-solid" : "bg-nokta-border")}>
        <span className={cn("size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
      </span>
    </button>
  );
}

function formatPriceInput(pence: number) {
  return (pence / 100).toFixed(2).replace(/\.00$/, "");
}
