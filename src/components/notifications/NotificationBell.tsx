import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyUnreadNotificationCount } from "@/services/notificationService";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function NotificationBell({ align = "right", className }: { align?: "left" | "right"; className?: string }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    getMyUnreadNotificationCount({ userId: user.id }).then(setUnreadCount).catch(() => setUnreadCount(0));
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div ref={ref} className={className ?? "relative"}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((next) => !next);
          trackEvent("notification_bell_opened");
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-clay-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{Math.min(unreadCount, 99)}</span> : null}
      </Button>
      {isOpen ? <NotificationsDropdown align={align} onUnreadCountChange={setUnreadCount} /> : null}
    </div>
  );
}
