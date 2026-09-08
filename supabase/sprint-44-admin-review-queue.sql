-- Admin-only auth email lookup for Review queue submitter labels.
-- The existing get_user_email(uuid) remains private to database triggers.
create or replace function public.get_admin_user_emails(user_ids uuid[])
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select users.id, users.email::text
  from auth.users
  where users.id = any(coalesce(user_ids, array[]::uuid[]));
end;
$$;

revoke all on function public.get_admin_user_emails(uuid[]) from public, anon, authenticated;
grant execute on function public.get_admin_user_emails(uuid[]) to authenticated;

notify pgrst, 'reload schema';
