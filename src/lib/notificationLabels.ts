import type { NotificationType } from "@/types/notifications";

export function formatNotificationType(type: NotificationType): string {
  return type.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

export function getNotificationIconName(type: NotificationType): string {
  if (type.startsWith("booking_")) return "calendar";
  if (type === "enquiry_submitted") return "inbox";
  if (type.includes("approved")) return "check";
  if (type.includes("rejected") || type.includes("declined") || type.includes("cancelled")) return "alert";
  return "bell";
}

export function getNotificationTone(type: NotificationType): "default" | "success" | "warning" | "destructive" | "muted" {
  if (type.includes("accepted") || type.includes("approved")) return "success";
  if (type.includes("alternative") || type === "booking_request_submitted" || type === "enquiry_submitted") return "warning";
  if (type.includes("declined") || type.includes("rejected") || type.includes("cancelled")) return "destructive";
  if (type === "system") return "muted";
  return "default";
}
