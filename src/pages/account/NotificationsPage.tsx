import { useEffect, useState } from "react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationsEmptyState } from "@/components/notifications/NotificationsEmptyState";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { dismissNotification, getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notificationService";
import type { Notification } from "@/types/notifications";

type NotificationFilter = "all" | "unread";

const NOTIFICATION_FILTERS: { label: string; value: NotificationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    getMyNotifications({ userId: user.id, includeDismissed: false, limit: 100 })
      .then((next) => {
        if (!cancelled) setNotifications(next);
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
  }, [user]);

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const visibleNotifications = filter === "unread" ? notifications.filter((notification) => !notification.readAt) : notifications;

  async function handleRead(notification: Notification) {
    if (!user || notification.readAt) return;
    await markNotificationRead({ userId: user.id, notificationId: notification.id });
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
  }

  async function handleDismiss(notification: Notification) {
    if (!user) return;
    await dismissNotification({ userId: user.id, notificationId: notification.id });
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead({ userId: user.id });
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
  }

  return (
    <main>
      <PageMeta title="Notifications | nokta" description="View your nokta notifications." canonicalPath="/account/notifications" />
      <PageContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <AccountPageHeader title="Notifications" description="Booking, enquiry and owner updates in one place." />

          <div className="flex items-center justify-between gap-3">
            <div role="group" aria-label="Show" className="inline-flex rounded-full bg-nokta-track p-1">
              {NOTIFICATION_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    filter === option.value ? "bg-nokta-surface text-nokta-ink shadow-sm" : "text-nokta-ink-muted hover:text-nokta-ink",
                  )}
                >
                  {option.label}
                  {option.value === "unread" && unreadCount ? <span className="ml-1.5 tabular-nums text-nokta-accent-dark">{unreadCount}</span> : null}
                </button>
              ))}
            </div>
            <Button type="button" variant="ghost" className="rounded-full" onClick={handleMarkAllRead} disabled={!unreadCount}>
              Mark all read
            </Button>
          </div>

          {isLoading ? <LoadingState message="Loading notifications..." /> : null}
          {error ? <ErrorState title="Could not load notifications" message={error} /> : null}
          {!isLoading && !error && !visibleNotifications.length ? <NotificationsEmptyState /> : null}
          {!isLoading && !error && visibleNotifications.length ? <div className="grid gap-3">{visibleNotifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onRead={handleRead} onDismiss={handleDismiss} />)}</div> : null}
        </div>
      </PageContainer>
    </main>
  );
}
