alter table public.venues
add column if not exists is_test boolean not null default false;

create index if not exists venues_is_test_idx on public.venues (is_test);

drop policy if exists "Allow public read access to venues" on public.venues;
drop policy if exists "Public can read non-test venues" on public.venues;
drop policy if exists "Admins can read all venues" on public.venues;

create policy "Public can read non-test venues"
on public.venues
for select
using (is_test = false);

create policy "Admins can read all venues"
on public.venues
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

do $$
begin
  if not exists (select 1 from auth.users where lower(email) = 'tufanbutuner@gmail.com') then
    raise exception 'Admin user tufanbutuner@gmail.com does not exist in auth.users yet.';
  end if;
end $$;

insert into public.admin_users (user_id, email)
select id, email
from auth.users
where lower(email) = 'tufanbutuner@gmail.com'
on conflict (user_id) do update
set email = excluded.email;

insert into public.venues (
  id,
  slug,
  name,
  description,
  country,
  city,
  area,
  address,
  postcode,
  latitude,
  longitude,
  rating,
  price_from,
  price_level,
  indoor,
  outdoor,
  food,
  alcohol,
  open_late,
  vibes,
  images,
  opening_hours,
  website,
  instagram,
  phone,
  business_status,
  verification_status,
  last_verified_at,
  data_sources,
  source_notes,
  is_claimed,
  claimed_by,
  claimed_at,
  partner_tier,
  monetisation_status,
  monetisation_notes,
  featured_eligible,
  featured_blocked_reason,
  is_test
)
select
  'sheesha-test-lounge',
  'sheesha-test-lounge',
  'Sheesha Test Lounge',
  'Hidden admin-only test venue for validating owner, admin, enquiry, subscription, offer, featured and profile update workflows without touching a real venue.',
  'United Kingdom',
  'London',
  'Soho',
  '1 Test Street, London',
  'W1T 1ST',
  51.5172,
  -0.1345,
  4.8,
  15,
  2,
  true,
  true,
  true,
  false,
  true,
  array['casual', 'groups', 'football', 'late-night', 'outdoor'],
  array[
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1600&q=80'
  ],
  '[
    {"day":"Monday","open":"14:00","close":"01:00"},
    {"day":"Tuesday","open":"14:00","close":"01:00"},
    {"day":"Wednesday","open":"14:00","close":"01:00"},
    {"day":"Thursday","open":"14:00","close":"01:00"},
    {"day":"Friday","open":"14:00","close":"02:00"},
    {"day":"Saturday","open":"12:00","close":"02:00"},
    {"day":"Sunday","open":"12:00","close":"00:00"}
  ]'::jsonb,
  'https://example.com/sheesha-test-lounge',
  'https://instagram.com/sheesha_test_lounge',
  '+44 20 0000 0000',
  'open',
  'verified',
  now(),
  '{"officialWebsite":"https://example.com/sheesha-test-lounge","bookingUrl":"https://example.com/sheesha-test-lounge/book","menuUrl":"https://example.com/sheesha-test-lounge/menu","contactUrl":"https://example.com/sheesha-test-lounge/contact"}'::jsonb,
  'Admin-only seeded test venue. Safe to edit during QA.',
  true,
  (select id from auth.users where lower(email) = 'tufanbutuner@gmail.com' limit 1),
  now(),
  'pro',
  'paying',
  'Internal QA test account.',
  true,
  null,
  true
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  is_claimed = true,
  claimed_by = excluded.claimed_by,
  claimed_at = coalesce(public.venues.claimed_at, now()),
  partner_tier = 'pro',
  monetisation_status = 'paying',
  featured_eligible = true,
  is_test = true,
  updated_at = now();

insert into public.venue_subscriptions (
  venue_id,
  plan,
  status,
  billing_provider,
  current_period_start,
  current_period_end,
  admin_notes,
  created_by,
  updated_by
)
select
  'sheesha-test-lounge',
  'pro',
  'active',
  'manual',
  now(),
  now() + interval '30 days',
  'Seeded Pro subscription for admin-only testing.',
  id,
  id
from auth.users
where lower(email) = 'tufanbutuner@gmail.com'
on conflict (venue_id) do update
set
  plan = 'pro',
  status = 'active',
  billing_provider = 'manual',
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  admin_notes = excluded.admin_notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.venue_enquiries (
  venue_id,
  submitted_by,
  enquiry_type,
  party_size,
  preferred_date,
  preferred_time,
  customer_name,
  customer_email,
  customer_phone,
  message,
  status
)
values
  ('sheesha-test-lounge', null, 'birthday', 8, current_date + 7, '20:30', 'Test Customer One', 'test.customer.one@example.com', '+44 7700 900001', 'Testing a birthday enquiry flow.', 'new'),
  ('sheesha-test-lounge', null, 'football', 5, current_date + 3, '19:00', 'Test Customer Two', 'test.customer.two@example.com', '+44 7700 900002', 'Testing a football booking enquiry.', 'contacted'),
  ('sheesha-test-lounge', null, 'private-hire', 20, current_date + 14, '21:00', 'Test Customer Three', 'test.customer.three@example.com', null, 'Testing a larger private hire enquiry.', 'responded')
on conflict do nothing;

notify pgrst, 'reload schema';
