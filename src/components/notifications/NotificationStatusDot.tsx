export function NotificationStatusDot({ isUnread }: { isUnread: boolean }) {
  return <span className={isUnread ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-clay-accent" : "mt-1 h-2 w-2 shrink-0 rounded-full bg-transparent"} />;
}
