alter table public.booking_requests
  add column if not exists customer_access_token text,
  add column if not exists customer_access_token_expires_at timestamptz,
  add column if not exists customer_alternative_response_message text,
  add column if not exists customer_responded_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmation_reference text;

create unique index if not exists booking_requests_customer_access_token_idx
  on public.booking_requests (customer_access_token)
  where customer_access_token is not null;

create unique index if not exists booking_requests_confirmation_reference_idx
  on public.booking_requests (confirmation_reference)
  where confirmation_reference is not null;

create index if not exists booking_requests_confirmed_at_idx on public.booking_requests (confirmed_at);
create index if not exists booking_requests_customer_responded_at_idx on public.booking_requests (customer_responded_at);

create or replace function public.get_booking_request_status_by_token(access_token text)
returns table (
  id uuid,
  venue_id text,
  venue_name text,
  venue_slug text,
  venue_area text,
  venue_city text,
  customer_name text,
  party_size integer,
  requested_date date,
  requested_time text,
  occasion text,
  status text,
  owner_response_message text,
  proposed_date date,
  proposed_time text,
  proposed_message text,
  customer_alternative_response_message text,
  customer_responded_at timestamptz,
  confirmed_at timestamptz,
  confirmation_reference text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    br.id,
    br.venue_id,
    v.name as venue_name,
    v.slug as venue_slug,
    v.area as venue_area,
    v.city as venue_city,
    br.customer_name,
    br.party_size,
    br.requested_date,
    br.requested_time,
    br.occasion,
    br.status,
    br.owner_response_message,
    br.proposed_date,
    br.proposed_time,
    br.proposed_message,
    br.customer_alternative_response_message,
    br.customer_responded_at,
    br.confirmed_at,
    br.confirmation_reference,
    br.created_at,
    br.updated_at
  from public.booking_requests br
  join public.venues v on v.id = br.venue_id
  where br.customer_access_token = access_token
    and br.customer_access_token_expires_at > now()
  limit 1;
$$;

create or replace function public.accept_booking_alternative_by_token(access_token text, response_message text default null)
returns table (
  id uuid,
  venue_id text,
  venue_name text,
  venue_slug text,
  venue_area text,
  venue_city text,
  customer_name text,
  party_size integer,
  requested_date date,
  requested_time text,
  occasion text,
  status text,
  owner_response_message text,
  proposed_date date,
  proposed_time text,
  proposed_message text,
  customer_alternative_response_message text,
  customer_responded_at timestamptz,
  confirmed_at timestamptz,
  confirmation_reference text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select br.id into target_id
  from public.booking_requests br
  where br.customer_access_token = accept_booking_alternative_by_token.access_token
    and br.customer_access_token_expires_at > now()
    and br.status = 'alternative_proposed'
    and br.proposed_date is not null
    and br.proposed_time is not null
  limit 1;

  if target_id is null then
    raise exception 'Booking alternative is not available.';
  end if;

  update public.booking_requests
  set
    status = 'customer_accepted_alternative',
    requested_date = booking_requests.proposed_date,
    requested_time = booking_requests.proposed_time,
    customer_alternative_response_message = nullif(trim(accept_booking_alternative_by_token.response_message), ''),
    customer_responded_at = now(),
    confirmed_at = now(),
    updated_at = now()
  where booking_requests.id = target_id;

  return query select * from public.get_booking_request_status_by_token(accept_booking_alternative_by_token.access_token);
end;
$$;

create or replace function public.decline_booking_alternative_by_token(access_token text, response_message text default null)
returns table (
  id uuid,
  venue_id text,
  venue_name text,
  venue_slug text,
  venue_area text,
  venue_city text,
  customer_name text,
  party_size integer,
  requested_date date,
  requested_time text,
  occasion text,
  status text,
  owner_response_message text,
  proposed_date date,
  proposed_time text,
  proposed_message text,
  customer_alternative_response_message text,
  customer_responded_at timestamptz,
  confirmed_at timestamptz,
  confirmation_reference text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select br.id into target_id
  from public.booking_requests br
  where br.customer_access_token = decline_booking_alternative_by_token.access_token
    and br.customer_access_token_expires_at > now()
    and br.status = 'alternative_proposed'
  limit 1;

  if target_id is null then
    raise exception 'Booking alternative is not available.';
  end if;

  update public.booking_requests
  set
    status = 'customer_declined_alternative',
    customer_alternative_response_message = nullif(trim(decline_booking_alternative_by_token.response_message), ''),
    customer_responded_at = now(),
    confirmed_at = null,
    updated_at = now()
  where booking_requests.id = target_id;

  return query select * from public.get_booking_request_status_by_token(decline_booking_alternative_by_token.access_token);
end;
$$;

grant execute on function public.get_booking_request_status_by_token(text) to anon, authenticated;
grant execute on function public.accept_booking_alternative_by_token(text, text) to anon, authenticated;
grant execute on function public.decline_booking_alternative_by_token(text, text) to anon, authenticated;
