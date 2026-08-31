export function formatDayOfWeek(dayOfWeek: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek] ?? "Unknown";
}

export function formatNoticePeriod(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? "day" : "days"}`;
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`;
  return `${minutes} minutes`;
}

export function formatAdvanceBookingWindow(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"} in advance`;
}

export function formatBookingWindowLabel(input: { startTime: string; endTime: string }): string {
  return `${formatTime(input.startTime)} - ${formatTime(input.endTime)}`;
}

function formatTime(time: string) {
  const [hourValue, minute] = time.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}
