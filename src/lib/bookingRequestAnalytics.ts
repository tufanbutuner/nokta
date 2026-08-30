export function getPartySizeBucket(partySize: number): "1-2" | "3-5" | "6-10" | "11+" {
  if (partySize <= 2) return "1-2";
  if (partySize <= 5) return "3-5";
  if (partySize <= 10) return "6-10";
  return "11+";
}

export function getRequestedDateBucket(date: string): "today" | "tomorrow" | "this_week" | "future" {
  const today = startOfDay(new Date());
  const requested = startOfDay(new Date(`${date}T00:00:00`));
  const diffDays = Math.round((requested.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays <= 7) return "this_week";
  return "future";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
