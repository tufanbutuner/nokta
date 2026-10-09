alter table public.venues
add column if not exists primary_category text not null default 'shisha_lounge',
add column if not exists secondary_categories text[] not null default '{}';

alter table public.venues
drop constraint if exists venues_primary_category_check;

alter table public.venues
add constraint venues_primary_category_check
check (
  primary_category in (
    'shisha_lounge',
    'restaurant',
    'bar',
    'cafe',
    'dessert',
    'lounge',
    'late_night',
    'private_hire',
    'other'
  )
);

create index if not exists venues_primary_category_idx
on public.venues (primary_category);

create index if not exists venues_secondary_categories_idx
on public.venues using gin (secondary_categories);

create index if not exists venues_city_primary_category_idx
on public.venues (city, primary_category);

update public.venues
set
  primary_category = coalesce(primary_category, 'shisha_lounge'),
  secondary_categories = case
    when secondary_categories is null or array_length(secondary_categories, 1) is null
      then array['shisha', 'lounge', 'late_night']
    else secondary_categories
  end;

alter table public.venue_suggestions
add column if not exists primary_category text not null default 'shisha_lounge',
add column if not exists secondary_categories text[] not null default '{}';

alter table public.venue_suggestions
drop constraint if exists venue_suggestions_primary_category_check;

alter table public.venue_suggestions
add constraint venue_suggestions_primary_category_check
check (
  primary_category in (
    'shisha_lounge',
    'restaurant',
    'bar',
    'cafe',
    'dessert',
    'lounge',
    'late_night',
    'private_hire',
    'other'
  )
);

create index if not exists venue_suggestions_primary_category_idx
on public.venue_suggestions (primary_category);

notify pgrst, 'reload schema';
