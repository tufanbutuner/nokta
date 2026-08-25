import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-10 text-center", className)}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-md text-muted-foreground">{description}</p> : null}
      {children}
      {actionLabel && actionHref ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link reloadDocument to={actionHref}>
              {actionLabel}
            </Link>
          </Button>
          {secondaryActionLabel && secondaryActionHref ? (
            <Button asChild variant="outline">
              <Link reloadDocument to={secondaryActionHref}>
                {secondaryActionLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
