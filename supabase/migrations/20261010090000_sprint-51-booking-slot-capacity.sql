-- Sprint 51: per-slot booking capacity + an atomic guard against double-bookings.
--
-- 1) venue_booking_settings.slot_capacity: how many separate parties may hold the
--    same date+time slot. Default 1 keeps today's behaviour; venues raise it from
--    the booking rules page (a restaurant would run 4-8, a shisha lounge 3-5).
-- 2) A trigger enforces the cap at write time. The app checks availability before
--    it writes, but two confirms can interleave between check and write; the
--    trigger closes that race for every code path (owner UI, admin, customer
--    accepting an alternative, direct API writes).
--
-- Only statuses that actually occupy a slot count: 'accepted' and
-- 'customer_accepted_alternative'. Pending requests never hold capacity.

alter table public.venue_booking_settings
  add column if not exists slot_capacity integer not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_settings_slot_capacity_check') then
    alter table public.venue_booking_settings
      add constraint venue_booking_settings_slot_capacity_check
      check (slot_capacity >= 1 and slot_capacity <= 50);
  end if;
end $$;

-- The slot a booking occupies: an agreed alternative lives at its proposed
-- date/time, everything else at the requested one. Must stay in step with
-- src/lib/bookingSlot.ts on the client.
create or replace function public.effective_booking_slot(p_status text, p_requested_date date, p_requested_time text, p_proposed_date date, p_proposed_time text)
returns table (slot_date date, slot_time text)
language sql
immutable
as $$
  select
    case when p_status in ('accepted', 'customer_accepted_alternative')
              and p_proposed_date is not null and p_proposed_time is not null
         then p_proposed_date
         else p_requested_date end as slot_date,
    left(case when p_status in ('accepted', 'customer_accepted_alternative')
                   and p_proposed_date is not null and p_proposed_time is not null
              then p_proposed_time
              else p_requested_time end, 5) as slot_time;
$$;

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

  select coalesce(max(s.slot_capacity), 1)
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

drop trigger if exists enforce_booking_slot_capacity on public.booking_requests;
create trigger enforce_booking_slot_capacity
  before insert or update of status, proposed_date, proposed_time, requested_date, requested_time
  on public.booking_requests
  for each row
  execute function public.enforce_booking_slot_capacity();

revoke execute on function public.enforce_booking_slot_capacity() from public;
revoke execute on function public.effective_booking_slot(text, date, text, date, text) from public;
grant execute on function public.enforce_booking_slot_capacity() to postgres, service_role, authenticated, anon;
grant execute on function public.effective_booking_slot(text, date, text, date, text) to postgres, service_role, authenticated, anon;

notify pgrst, 'reload schema';
