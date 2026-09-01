import type { OwnerVenueAnalyticsDailySummary } from "@/services/ownerVenueAnalyticsService";

export function OwnerAnalyticsTrendChart({ daily }: { daily: OwnerVenueAnalyticsDailySummary[] }) {
  if (!daily.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-5">
        <h2 className="font-semibold">Daily trend</h2>
        <p className="mt-1 text-sm text-muted-foreground">Profile views, booking requests, enquiries and customer actions by day.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Profile views</th>
              <th className="px-5 py-3">Bookings</th>
              <th className="px-5 py-3">Enquiries</th>
              <th className="px-5 py-3">Customer actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {daily.map((day) => (
              <tr key={day.date}>
                <td className="px-5 py-3 font-medium">{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                <td className="px-5 py-3">{day.profileViews}</td>
                <td className="px-5 py-3">{day.bookingRequests}</td>
                <td className="px-5 py-3">{day.enquiries}</td>
                <td className="px-5 py-3">{day.customerActions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
