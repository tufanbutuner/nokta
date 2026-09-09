-- Halal label on venues.
-- Self-declared by the venue and shown as a public feature/filter.
-- Defaults to false so existing venues are never implicitly labelled halal.

alter table public.venues
add column if not exists halal boolean not null default false;

comment on column public.venues.halal is
  'Venue serves halal food. Self-declared and admin-reviewed; not a certification guarantee.';
