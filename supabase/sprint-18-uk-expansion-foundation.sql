alter table public.venues
add column if not exists country text not null default 'United Kingdom',
add column if not exists city text not null default 'London';

create index if not exists venues_country_idx
on public.venues (country);

create index if not exists venues_city_idx
on public.venues (city);

create index if not exists venues_country_city_idx
on public.venues (country, city);

alter table public.venue_suggestions
add column if not exists country text not null default 'United Kingdom',
add column if not exists city text not null default 'London';

create index if not exists venue_suggestions_country_idx
on public.venue_suggestions (country);

create index if not exists venue_suggestions_city_idx
on public.venue_suggestions (city);

notify pgrst, 'reload schema';
