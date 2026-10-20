import { describe, expect, it } from "vitest";
import { countBookingsAtSlot, type BookingSlot } from "@/lib/bookingSlot";

describe("countBookingsAtSlot", () => {
  const bookedSlots: BookingSlot[] = [
    { date: "2026-10-20", time: "18:00:00" },
    { date: "2026-10-20", time: "18:00" },
    { date: "2026-10-20", time: "18:30:00" },
    { date: "2026-10-21", time: "18:00:00" },
  ];

  it.each(["18:00", "18:00:00"])(
    "counts only bookings on the requested date and minute for %s",
    (time) => {
      expect(countBookingsAtSlot(bookedSlots, "2026-10-20", time)).toBe(2);
    },
  );

  it("returns zero when the time has no bookings", () => {
    expect(countBookingsAtSlot(bookedSlots, "2026-10-20", "19:00")).toBe(0);
  });

  it("returns zero when the date has no bookings", () => {
    expect(countBookingsAtSlot(bookedSlots, "2026-10-22", "18:00")).toBe(0);
  });

  it("returns zero when there are no booked slots", () => {
    expect(countBookingsAtSlot([], "2026-10-20", "18:00")).toBe(0);
  });
});
