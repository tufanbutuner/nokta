import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notificationService";
import type { Notification } from "@/types/notifications";
import { useEffect, useState } from "react";
import { NotificationItem } from "./NotificationItem";
import { NotificationsEmptyState } from "./NotificationsEmptyState";

export function NotificationsDropdown({ align = "right", onUnreadCountChange }: { align?: "left" | "right"; onUnreadCountChange?: (count: number) => void }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    getMyNotifications({ userId: user.id, limit: 8 })
      .then((next) => {
        if (cancelled) return;
        setNotifications(next);
        onUnreadCountChange?.(next.filter((item) => !item.readAt).length);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load notifications.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onUnreadCountChange, user]);

  async function handleRead(notification: Notification) {
    if (!user || notification.readAt) return;
    await markNotificationRead({ userId: user.id, notificationId: notification.id });
    trackEvent("notification_clicked", {
      notificationType: notification.notificationType,
      recipientType: notification.recipientType,
      relatedEntityType: notification.relatedEntityType,
      hasActionUrl: Boolean(notification.actionUrl),
    });
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    onUnreadCountChange?.(Math.max(0, notifications.filter((item) => !item.readAt).length - 1));
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead({ userId: user.id });
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    onUnreadCountChange?.(0);
  }

  return (
    <div className={`absolute top-12 z-[1500] w-[min(360px,calc(100vw-2rem))] rounded-xl border bg-card p-3 text-card-foreground shadow-xl ${align === "left" ? "left-0" : "right-0"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-brand text-lg font-bold tracking-[-0.5px]">Notifications</p>
          <p className="text-xs text-muted-foreground">Latest updates</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
      </div>
      {isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading notifications...</p> : null}
      {error ? <p className="p-4 text-sm text-destructive">{error}</p> : null}
      {!isLoading && !error && !notifications.length ? <NotificationsEmptyState /> : null}
      {!isLoading && !error && notifications.length ? <div className="grid max-h-[420px] gap-2 overflow-y-auto">{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onRead={handleRead} />)}</div> : null}
      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
        <Link to="/account/notifications">View all notifications</Link>
      </Button>
    </div>
  );
}
