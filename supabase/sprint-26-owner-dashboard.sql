drop policy if exists "Owners can read analytics for their claimed venues" on public.venue_analytics_events;
create policy "Owners can read analytics for their claimed venues"
on public.venue_analytics_events
for select
using (
  exists (
    select 1
    from public.venues
    where venues.id = venue_analytics_events.venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  )
);

create or replace function public.get_owner_venue_enquiry_summary(target_venue_id text)
returns table (
  total_enquiries bigint,
  new_enquiries bigint,
  contacted_enquiries bigint,
  responded_enquiries bigint,
  converted_enquiries bigint,
  closed_enquiries bigint,
  spam_enquiries bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) as total_enquiries,
    count(*) filter (where status = 'new') as new_enquiries,
    count(*) filter (where status = 'contacted') as contacted_enquiries,
    count(*) filter (where status = 'responded') as responded_enquiries,
    count(*) filter (where status = 'converted') as converted_enquiries,
    count(*) filter (where status = 'closed') as closed_enquiries,
    count(*) filter (where status = 'spam') as spam_enquiries
  from public.venue_enquiries
  where venue_id = target_venue_id
  and exists (
    select 1
    from public.venues
    where venues.id = target_venue_id
    and venues.is_claimed = true
    and venues.claimed_by = auth.uid()
  );
$$;

grant execute on function public.get_owner_venue_enquiry_summary(text) to authenticated;
