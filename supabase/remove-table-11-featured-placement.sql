delete from public.featured_placements
where venue_id in (
  select id
  from public.venues
  where slug = 'table-11-hounslow'
);
