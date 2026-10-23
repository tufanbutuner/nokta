-- Sprint 55: let anyone see how full a venue's booking slots are.
--
-- Free booking times are worked out from a venue's booking windows, blackout
-- dates and per-slot capacity, minus the bookings already holding each slot.
-- Anonymous visitors (and assistants searching on their behalf) cannot read
-- booking_requests, so until now they saw every slot as free.
--
-- This returns only how many accepted bookings hold each date+time slot, never
-- who made them, so it is safe to expose. Counts use the same effective slot as
-- public.effective_booking_slot (sprint 51) and src/lib/bookingSlot.ts.

create or replace function public.venue_booked_slot_counts(p_venue_ids uuid[], p_from date default current_date)
returns table (venue_id uuid, slot_date date, slot_time text, taken integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.venue_id, s.slot_date, s.slot_time, count(*)::integer as taken
    from public.booking_requests b
   cross join lateral public.effective_booking_slot(b.status, b.requested_date, b.requested_time, b.proposed_date, b.proposed_time) s
   where b.venue_id = any(p_venue_ids)
     and b.status in ('accepted', 'customer_accepted_alternative')
     and s.slot_date >= p_from
   group by b.venue_id, s.slot_date, s.slot_time;
$$;

revoke execute on function public.venue_booked_slot_counts(uuid[], date) from public;
grant execute on function public.venue_booked_slot_counts(uuid[], date) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
