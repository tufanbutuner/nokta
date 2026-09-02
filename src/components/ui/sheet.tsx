import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "bottom";
}

function Sheet({ open, onOpenChange, children, side = "right" }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1600] bg-black/35" onClick={() => onOpenChange(false)}>
      <div
        className={cn(
          "fixed w-full overflow-y-auto bg-card p-5 shadow-2xl",
          side === "right" && "inset-y-0 right-0 max-w-sm",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 flex items-center justify-between", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

function SheetClose({ onClick, "aria-label": ariaLabel = "Close panel" }: { onClick: () => void; "aria-label"?: string }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} aria-label={ariaLabel}>
      <X className="h-4 w-4" />
    </Button>
  );
}

export { Sheet, SheetHeader, SheetTitle, SheetClose };
