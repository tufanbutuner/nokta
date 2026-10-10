-- Sprint 52: raise the default slot capacity from 1 to 4.
--
-- Sprint 51 shipped capacity as opt-in per venue (default 1 = today's
-- one-booking-kills-the-slot behaviour). Every venue is meant to get
-- multi-party slots, so the default of 1 made the feature dormant: it had to be
-- raised venue by venue in Booking rules.
--
-- The default of 1 was baked in four places, and all four have to move together
-- or they disagree:
--
--   1. The column default        - governs settings rows created from now on.
--   2. The trigger's coalesce    - governs venues with NO settings row at all
--                                  (the majority: ~440 of ~478 in prod).
--   3. Existing rows             - the 38 venues that already have a row are
--                                  pinned at 1; the coalesce never touches them
--                                  because max() returns their stored 1.
--   4. The client mapper's ?? 1  - defensive fallback if the column is ever null.
--
-- Only (2) and (3) change behaviour for venues that exist today; (1) and (4)
-- keep new rows and null-mapping consistent with them.
--
-- Constrained to rows still sitting on the old default so a venue that has since
-- chosen its own capacity is never stomped.

alter table public.venue_booking_settings
  alter column slot_capacity set default 4;

update public.venue_booking_settings
   set slot_capacity = 4
 where slot_capacity = 1;

-- Re-declare the trigger with the raised fallback. Same body as sprint-51
-- except the coalesce default; must stay in step with it otherwise.
create or replace function public.enforce_booking_slot_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_slot record;
  old_slot record;
  venue_capacity integer;
  taken integer;
begin
  if new.status not in ('accepted', 'customer_accepted_alternative') then
    return new;
  end if;

  select * into new_slot from public.effective_booking_slot(new.status, new.requested_date, new.requested_time, new.proposed_date, new.proposed_time);

  -- An update to a row that already occupies this exact slot adds no new demand
  -- (replies, messages, timestamps must not start failing on an over-full venue).
  if tg_op = 'UPDATE' and old.status in ('accepted', 'customer_accepted_alternative') then
    select * into old_slot from public.effective_booking_slot(old.status, old.requested_date, old.requested_time, old.proposed_date, old.proposed_time);
    if old_slot.slot_date = new_slot.slot_date and old_slot.slot_time = new_slot.slot_time then
      return new;
    end if;
  end if;

  -- Serialise confirms per venue: the second concurrent accept waits here and
  -- re-counts against the committed first accept instead of racing it.
  perform 1 from public.venues where id = new.venue_id for update;

  select coalesce(max(s.slot_capacity), 4)
    into venue_capacity
    from public.venue_booking_settings s
   where s.venue_id = new.venue_id;

  select count(*)
    into taken
    from public.booking_requests b
   where b.venue_id = new.venue_id
     and b.id <> new.id
     and b.status in ('accepted', 'customer_accepted_alternative')
     and (case when b.status in ('accepted', 'customer_accepted_alternative')
                    and b.proposed_date is not null and b.proposed_time is not null
               then b.proposed_date else b.requested_date end) = new_slot.slot_date
     and left(case when b.status in ('accepted', 'customer_accepted_alternative')
                       and b.proposed_date is not null and b.proposed_time is not null
                  then b.proposed_time else b.requested_time end, 5) = new_slot.slot_time;

  if taken >= venue_capacity then
    raise exception 'SLOT_CAPACITY_REACHED: % of % slot(s) already taken at % %', taken, venue_capacity, new_slot.slot_date, new_slot.slot_time
      using hint = 'Another request was confirmed for this slot. Offer the customer a different time.';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
