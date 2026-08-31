import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationsEmptyState } from "@/components/notifications/NotificationsEmptyState";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { dismissNotification, getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notificationService";
import type { Notification } from "@/types/notifications";

type NotificationFilter = "all" | "unread";

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
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-clay-accent">Account</p>
              <h1 className="mt-2 font-brand text-4xl font-bold tracking-[-0.5px]">Notifications</h1>
              <p className="mt-2 text-sm text-muted-foreground">Booking, enquiry and owner updates in one place.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/account">Account</Link>
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Select value={filter} onValueChange={(next) => setFilter(next as NotificationFilter)} options={[{ label: "All notifications", value: "all" }, { label: "Unread", value: "unread" }]} />
            <Button type="button" variant="outline" onClick={handleMarkAllRead}>Mark all read</Button>
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
