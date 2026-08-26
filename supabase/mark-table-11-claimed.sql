update public.venues
set
  is_claimed = true,
  claimed_at = coalesce(claimed_at, now())
where slug = 'table-11-hounslow';

notify pgrst, 'reload schema';
