create table if not exists public.venue_booking_settings (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade unique,
  booking_requests_enabled boolean not null default true,
  min_party_size integer not null default 1,
  max_party_size integer not null default 20,
  min_notice_minutes integer not null default 120,
  max_advance_days integer not null default 30,
  default_booking_duration_minutes integer not null default 120,
  booking_instructions text,
  internal_notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.venue_booking_windows (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  day_of_week integer not null,
  start_time text not null,
  end_time text not null,
  is_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.venue_booking_blackout_dates (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues(id) on delete cascade,
  blackout_date date not null,
  reason text,
  is_full_day boolean not null default true,
  start_time text,
  end_time text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (venue_id, blackout_date, start_time, end_time)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_settings_party_size_check') then
    alter table public.venue_booking_settings add constraint venue_booking_settings_party_size_check check (min_party_size > 0 and max_party_size >= min_party_size and max_party_size <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_settings_notice_check') then
    alter table public.venue_booking_settings add constraint venue_booking_settings_notice_check check (min_notice_minutes >= 0 and min_notice_minutes <= 43200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_settings_max_advance_check') then
    alter table public.venue_booking_settings add constraint venue_booking_settings_max_advance_check check (max_advance_days >= 1 and max_advance_days <= 365);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_settings_duration_check') then
    alter table public.venue_booking_settings add constraint venue_booking_settings_duration_check check (default_booking_duration_minutes >= 30 and default_booking_duration_minutes <= 480);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_windows_day_of_week_check') then
    alter table public.venue_booking_windows add constraint venue_booking_windows_day_of_week_check check (day_of_week >= 0 and day_of_week <= 6);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_windows_time_format_check') then
    alter table public.venue_booking_windows add constraint venue_booking_windows_time_format_check check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_windows_time_order_check') then
    alter table public.venue_booking_windows add constraint venue_booking_windows_time_order_check check (end_time > start_time);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venue_booking_blackout_dates_time_format_check') then
    alter table public.venue_booking_blackout_dates add constraint venue_booking_blackout_dates_time_format_check check ((start_time is null and end_time is null) or (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time > start_time));
  end if;
end $$;

create index if not exists venue_booking_settings_venue_id_idx on public.venue_booking_settings (venue_id);
create index if not exists venue_booking_windows_venue_id_idx on public.venue_booking_windows (venue_id);
create index if not exists venue_booking_windows_venue_day_idx on public.venue_booking_windows (venue_id, day_of_week);
create index if not exists venue_booking_blackout_dates_venue_id_idx on public.venue_booking_blackout_dates (venue_id);
create index if not exists venue_booking_blackout_dates_venue_date_idx on public.venue_booking_blackout_dates (venue_id, blackout_date);

drop trigger if exists set_venue_booking_settings_updated_at on public.venue_booking_settings;
create trigger set_venue_booking_settings_updated_at before update on public.venue_booking_settings for each row execute function public.set_updated_at();
drop trigger if exists set_venue_booking_windows_updated_at on public.venue_booking_windows;
create trigger set_venue_booking_windows_updated_at before update on public.venue_booking_windows for each row execute function public.set_updated_at();
drop trigger if exists set_venue_booking_blackout_dates_updated_at on public.venue_booking_blackout_dates;
create trigger set_venue_booking_blackout_dates_updated_at before update on public.venue_booking_blackout_dates for each row execute function public.set_updated_at();

insert into public.venue_booking_settings (venue_id, booking_requests_enabled, min_party_size, max_party_size, min_notice_minutes, max_advance_days, default_booking_duration_minutes)
select id, true, 1, 20, 120, 30, 120 from public.venues
on conflict (venue_id) do nothing;

insert into public.venue_booking_windows (venue_id, day_of_week, start_time, end_time, is_enabled)
select venues.id, day_value.day_of_week, '18:00', '23:30', true
from public.venues
cross join (values (0), (1), (2), (3), (4), (5), (6)) as day_value(day_of_week)
where not exists (select 1 from public.venue_booking_windows where venue_booking_windows.venue_id = venues.id);

alter table public.venue_booking_settings enable row level security;
alter table public.venue_booking_windows enable row level security;
alter table public.venue_booking_blackout_dates enable row level security;

drop policy if exists "Anyone can read venue booking settings" on public.venue_booking_settings;
create policy "Anyone can read venue booking settings" on public.venue_booking_settings for select using (true);
drop policy if exists "Anyone can read venue booking windows" on public.venue_booking_windows;
create policy "Anyone can read venue booking windows" on public.venue_booking_windows for select using (true);
drop policy if exists "Anyone can read venue booking blackout dates" on public.venue_booking_blackout_dates;
create policy "Anyone can read venue booking blackout dates" on public.venue_booking_blackout_dates for select using (true);

drop policy if exists "Owners can update booking settings for claimed venues" on public.venue_booking_settings;
create policy "Owners can update booking settings for claimed venues" on public.venue_booking_settings for update using (exists (select 1 from public.venues where venues.id = venue_booking_settings.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid())) with check (exists (select 1 from public.venues where venues.id = venue_booking_settings.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));
drop policy if exists "Owners can insert booking settings for claimed venues" on public.venue_booking_settings;
create policy "Owners can insert booking settings for claimed venues" on public.venue_booking_settings for insert with check (exists (select 1 from public.venues where venues.id = venue_booking_settings.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));

drop policy if exists "Owners can insert booking windows for claimed venues" on public.venue_booking_windows;
create policy "Owners can insert booking windows for claimed venues" on public.venue_booking_windows for insert with check (exists (select 1 from public.venues where venues.id = venue_booking_windows.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));
drop policy if exists "Owners can update booking windows for claimed venues" on public.venue_booking_windows;
create policy "Owners can update booking windows for claimed venues" on public.venue_booking_windows for update using (exists (select 1 from public.venues where venues.id = venue_booking_windows.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid())) with check (exists (select 1 from public.venues where venues.id = venue_booking_windows.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));
drop policy if exists "Owners can delete booking windows for claimed venues" on public.venue_booking_windows;
create policy "Owners can delete booking windows for claimed venues" on public.venue_booking_windows for delete using (exists (select 1 from public.venues where venues.id = venue_booking_windows.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));

drop policy if exists "Owners can insert blackout dates for claimed venues" on public.venue_booking_blackout_dates;
create policy "Owners can insert blackout dates for claimed venues" on public.venue_booking_blackout_dates for insert with check (created_by = auth.uid() and exists (select 1 from public.venues where venues.id = venue_booking_blackout_dates.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));
drop policy if exists "Owners can update blackout dates for claimed venues" on public.venue_booking_blackout_dates;
create policy "Owners can update blackout dates for claimed venues" on public.venue_booking_blackout_dates for update using (exists (select 1 from public.venues where venues.id = venue_booking_blackout_dates.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid())) with check (exists (select 1 from public.venues where venues.id = venue_booking_blackout_dates.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));
drop policy if exists "Owners can delete blackout dates for claimed venues" on public.venue_booking_blackout_dates;
create policy "Owners can delete blackout dates for claimed venues" on public.venue_booking_blackout_dates for delete using (exists (select 1 from public.venues where venues.id = venue_booking_blackout_dates.venue_id and venues.is_claimed = true and venues.claimed_by = auth.uid()));

drop policy if exists "Admins can manage venue booking settings" on public.venue_booking_settings;
create policy "Admins can manage venue booking settings" on public.venue_booking_settings for all using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())) with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
drop policy if exists "Admins can manage venue booking windows" on public.venue_booking_windows;
create policy "Admins can manage venue booking windows" on public.venue_booking_windows for all using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())) with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));
drop policy if exists "Admins can manage venue booking blackout dates" on public.venue_booking_blackout_dates;
create policy "Admins can manage venue booking blackout dates" on public.venue_booking_blackout_dates for all using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())) with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

notify pgrst, 'reload schema';
