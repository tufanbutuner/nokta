create or replace function public.get_owner_inbox_enquiries()
returns table (
  id uuid,
  venue_id text,
  enquiry_type text,
  party_size integer,
  preferred_date date,
  preferred_time text,
  customer_name text,
  customer_email text,
  customer_phone text,
  message text,
  status text,
  venue_response text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  has_full_access boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with owned_enquiries as (
    select
      enquiry.*,
      coalesce(
        subscription.plan in ('growth', 'pro')
        and subscription.status in ('trial', 'active', 'past_due'),
        false
      ) as can_view_details
    from public.venue_enquiries enquiry
    join public.venues venue on venue.id = enquiry.venue_id
    left join public.venue_subscriptions subscription on subscription.venue_id = venue.id
    where venue.is_claimed = true
      and venue.claimed_by = auth.uid()
  )
  select
    enquiry.id,
    enquiry.venue_id,
    enquiry.enquiry_type,
    enquiry.party_size,
    enquiry.preferred_date,
    enquiry.preferred_time,
    case when enquiry.can_view_details then enquiry.customer_name else 'Customer ' || left(enquiry.id::text, 4) end,
    case when enquiry.can_view_details then enquiry.customer_email else null end,
    case when enquiry.can_view_details then enquiry.customer_phone else null end,
    case when enquiry.can_view_details then enquiry.message else null end,
    enquiry.status,
    case when enquiry.can_view_details then enquiry.venue_response else null end,
    enquiry.created_at,
    enquiry.updated_at,
    enquiry.can_view_details
  from owned_enquiries enquiry
  order by enquiry.created_at desc;
$$;

revoke all on function public.get_owner_inbox_enquiries() from public;
grant execute on function public.get_owner_inbox_enquiries() to authenticated;

notify pgrst, 'reload schema';
