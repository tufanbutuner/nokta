import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";

const FINAL_STATUSES: VenueEnquiryStatus[] = ["converted", "closed", "spam"];

export function OwnerEnquiryActions({ enquiry, onStatus, onNotes, compact = false }: { enquiry: VenueEnquiry; onStatus: (status: VenueEnquiryStatus) => void; onNotes: () => void; compact?: boolean }) {
  const isFinal = FINAL_STATUSES.includes(enquiry.status);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actions = [
    enquiry.status === "new" ? { label: "Mark contacted", onClick: () => onStatus("contacted"), variant: "outline" as const } : null,
    enquiry.status === "contacted" ? { label: "Mark responded", onClick: () => onStatus("responded"), variant: "outline" as const } : null,
    !isFinal ? { label: "Converted", onClick: () => onStatus("converted"), variant: "outline" as const } : null,
    !isFinal ? { label: "Close", onClick: () => onStatus("closed"), variant: "ghost" as const } : null,
    !isFinal ? { label: "Spam", onClick: () => onStatus("spam"), variant: "ghost" as const } : null,
    { label: "Notes", onClick: onNotes, variant: "outline" as const },
  ].filter(Boolean) as { label: string; onClick: () => void; variant: "outline" | "ghost" }[];

  useLayoutEffect(() => {
    if (!isMenuOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.right - 176,
    });
  }, [isMenuOpen]);

  if (compact) {
    return (
      <div className="inline-block">
        <Button ref={triggerRef} size="icon" variant="ghost" aria-label="Open enquiry actions" aria-expanded={isMenuOpen} className="h-8 w-8" onClick={() => setIsMenuOpen((open) => !open)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {isMenuOpen && menuPosition
          ? createPortal(
          <div className="fixed z-50 w-44 rounded-xl border bg-card p-1 text-left shadow-lg" style={{ top: menuPosition.top, left: menuPosition.left }}>
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="flex w-full cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
                onClick={() => {
                  setIsMenuOpen(false);
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.map((action) => (
        <Button key={action.label} size="sm" variant={action.variant} onClick={action.onClick}>
          {action.label}
        </Button>
      ))}
    </div>
  );
}
