alter table public.venues
add column if not exists is_claimed boolean not null default false,
add column if not exists claimed_by uuid references auth.users(id),
add column if not exists claimed_at timestamp with time zone,
add column if not exists partner_tier text not null default 'none',
add column if not exists monetisation_status text not null default 'not-contacted',
add column if not exists monetisation_notes text,
add column if not exists featured_eligible boolean not null default false,
add column if not exists featured_blocked_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_partner_tier_check'
      and conrelid = 'public.venues'::regclass
  ) then
    alter table public.venues
    add constraint venues_partner_tier_check
    check (partner_tier in ('none', 'starter', 'growth', 'pro'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_monetisation_status_check'
      and conrelid = 'public.venues'::regclass
  ) then
    alter table public.venues
    add constraint venues_monetisation_status_check
    check (
      monetisation_status in (
        'not-contacted',
        'contacted',
        'interested',
        'trial',
        'paying',
        'churned',
        'not-fit'
      )
    );
  end if;
end $$;

notify pgrst, 'reload schema';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'venues'
  and column_name in (
    'is_claimed',
    'claimed_by',
    'claimed_at',
    'partner_tier',
    'monetisation_status',
    'monetisation_notes',
    'featured_eligible',
    'featured_blocked_reason'
  )
order by column_name;
