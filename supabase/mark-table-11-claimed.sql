update public.venues
set
  is_claimed = false,
  claimed_by = null,
  claimed_at = null
where slug = 'table-11-hounslow';

notify pgrst, 'reload schema';
