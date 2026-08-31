import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notifications";
import { NotificationStatusDot } from "./NotificationStatusDot";

export function NotificationItem({ notification, onRead, onDismiss }: { notification: Notification; onRead: (notification: Notification) => void; onDismiss?: (notification: Notification) => void }) {
  const isUnread = !notification.readAt;
  const content = (
    <div className={cn("flex gap-3 rounded-xl border p-3 text-left transition-colors", isUnread ? "bg-clay-50" : "bg-card")}>
      <NotificationStatusDot isUnread={isUnread} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sheesh-ink">{notification.title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.body}</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">{formatCreatedAt(notification.createdAt)}</p>
        </div>
        {notification.actionLabel ? <p className="mt-2 text-sm font-medium text-clay-accent">{notification.actionLabel}</p> : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {notification.actionUrl ? (
        <Link to={notification.actionUrl} onClick={() => onRead(notification)}>
          {content}
        </Link>
      ) : (
        <button type="button" className="w-full cursor-pointer" onClick={() => onRead(notification)}>
          {content}
        </button>
      )}
      {onDismiss ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => onDismiss(notification)}>
          Dismiss
        </Button>
      ) : null}
    </div>
  );
}

function formatCreatedAt(value: string) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  if (diffMs < 60_000) return "Now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h`;
  return createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
