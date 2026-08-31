create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_email text,
  recipient_type text not null,
  notification_type text not null,
  title text not null,
  body text not null,
  action_label text,
  action_url text,
  related_entity_type text,
  related_entity_id text,
  venue_id text references public.venues(id) on delete cascade,
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  enquiry_id uuid references public.venue_enquiries(id) on delete set null,
  delivery_channels jsonb not null default '["in_app"]'::jsonb,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  provider text,
  provider_message_id text,
  error_message text,
  attempted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  booking_notifications_in_app boolean not null default true,
  booking_notifications_email boolean not null default true,
  enquiry_notifications_in_app boolean not null default true,
  enquiry_notifications_email boolean not null default true,
  marketing_notifications_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications drop constraint if exists notifications_recipient_type_check;
alter table public.notifications add constraint notifications_recipient_type_check check (recipient_type in ('owner', 'customer', 'admin'));

alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (
  notification_type in (
    'booking_request_submitted',
    'booking_request_accepted',
    'booking_request_declined',
    'booking_alternative_proposed',
    'booking_alternative_accepted',
    'booking_alternative_declined',
    'booking_cancelled',
    'enquiry_submitted',
    'media_upload_approved',
    'media_upload_rejected',
    'promotion_request_approved',
    'promotion_request_rejected',
    'venue_update_approved',
    'venue_update_rejected',
    'billing_subscription_updated',
    'system'
  )
);

alter table public.notifications drop constraint if exists notifications_related_entity_type_check;
alter table public.notifications add constraint notifications_related_entity_type_check check (
  related_entity_type is null
  or related_entity_type in ('booking_request', 'venue_enquiry', 'venue_media', 'promotion_request', 'venue_update_request', 'subscription', 'venue')
);

alter table public.notification_delivery_logs drop constraint if exists notification_delivery_logs_channel_check;
alter table public.notification_delivery_logs add constraint notification_delivery_logs_channel_check check (channel in ('in_app', 'email'));

alter table public.notification_delivery_logs drop constraint if exists notification_delivery_logs_status_check;
alter table public.notification_delivery_logs add constraint notification_delivery_logs_status_check check (status in ('pending', 'sent', 'delivered', 'failed', 'skipped'));

create index if not exists notifications_recipient_user_id_idx on public.notifications (recipient_user_id);
create index if not exists notifications_recipient_email_idx on public.notifications (recipient_email);
create index if not exists notifications_recipient_type_idx on public.notifications (recipient_type);
create index if not exists notifications_notification_type_idx on public.notifications (notification_type);
create index if not exists notifications_venue_id_idx on public.notifications (venue_id);
create index if not exists notifications_booking_request_id_idx on public.notifications (booking_request_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
create index if not exists notifications_unread_idx on public.notifications (recipient_user_id, read_at) where read_at is null;
create index if not exists notification_delivery_logs_notification_id_idx on public.notification_delivery_logs (notification_id);
create index if not exists notification_delivery_logs_channel_status_idx on public.notification_delivery_logs (channel, status);

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.notification_delivery_logs enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
on public.notifications
for select
using (recipient_user_id = auth.uid());

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications
for update
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

drop policy if exists "Admins can read all notifications" on public.notifications;
create policy "Admins can read all notifications"
on public.notifications
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can manage all notifications" on public.notifications;
create policy "Admins can manage all notifications"
on public.notifications
for all
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can read notification delivery logs" on public.notification_delivery_logs;
create policy "Admins can read notification delivery logs"
on public.notification_delivery_logs
for select
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Admins can manage notification delivery logs" on public.notification_delivery_logs;
create policy "Admins can manage notification delivery logs"
on public.notification_delivery_logs
for all
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "Users can read their own notification preferences" on public.notification_preferences;
create policy "Users can read their own notification preferences"
on public.notification_preferences
for select
using (user_id = auth.uid());

drop policy if exists "Users can update their own notification preferences" on public.notification_preferences;
create policy "Users can update their own notification preferences"
on public.notification_preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can insert their own notification preferences" on public.notification_preferences;
create policy "Users can insert their own notification preferences"
on public.notification_preferences
for insert
with check (user_id = auth.uid());

create or replace function public.create_notification_delivery_logs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  channel_value text;
begin
  for channel_value in select jsonb_array_elements_text(new.delivery_channels)
  loop
    insert into public.notification_delivery_logs (
      notification_id,
      channel,
      status,
      provider,
      attempted_at,
      delivered_at
    )
    values (
      new.id,
      channel_value,
      case when channel_value = 'in_app' then 'delivered' else 'skipped' end,
      case when channel_value = 'email' then 'none' else null end,
      now(),
      case when channel_value = 'in_app' then now() else null end
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists create_notification_delivery_logs on public.notifications;
create trigger create_notification_delivery_logs
after insert on public.notifications
for each row
execute function public.create_notification_delivery_logs();

create or replace function public.get_user_email(user_id uuid)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select email from auth.users where id = user_id limit 1;
$$;

create or replace function public.get_booking_notification_channels(user_id uuid, recipient_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  preferences public.notification_preferences%rowtype;
  use_email boolean := true;
begin
  select * into preferences from public.notification_preferences where notification_preferences.user_id = get_booking_notification_channels.user_id;
  if found and recipient_type in ('owner', 'customer') then
    use_email := preferences.booking_notifications_email;
  end if;
  if use_email then
    return '["in_app", "email"]'::jsonb;
  end if;
  return '["in_app"]'::jsonb;
end;
$$;

create or replace function public.notify_booking_request_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  venue_record public.venues%rowtype;
begin
  select * into venue_record from public.venues where id = new.venue_id;
  if venue_record.claimed_by is null then
    return new;
  end if;

  insert into public.notifications (
    recipient_user_id,
    recipient_email,
    recipient_type,
    notification_type,
    title,
    body,
    action_label,
    action_url,
    related_entity_type,
    related_entity_id,
    venue_id,
    booking_request_id,
    delivery_channels
  )
  values (
    venue_record.claimed_by,
    public.get_user_email(venue_record.claimed_by),
    'owner',
    'booking_request_submitted',
    'New booking request',
    'You have a new booking request for ' || venue_record.name || '.',
    'View booking',
    '/owner/bookings',
    'booking_request',
    new.id::text,
    new.venue_id,
    new.id,
    public.get_booking_notification_channels(venue_record.claimed_by, 'owner')
  );

  return new;
end;
$$;

create or replace function public.notify_booking_request_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  venue_record public.venues%rowtype;
  customer_action_url text;
  owner_id uuid;
begin
  if old.status = new.status then
    return new;
  end if;

  select * into venue_record from public.venues where id = new.venue_id;
  customer_action_url := case when new.customer_access_token is null then null else '/booking-status/' || new.customer_access_token end;
  owner_id := venue_record.claimed_by;

  if new.status = 'accepted' and new.submitted_by is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (new.submitted_by, new.customer_email, 'customer', 'booking_request_accepted', 'Booking confirmed', venue_record.name || ' has accepted your booking request.', 'View booking status', customer_action_url, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(new.submitted_by, 'customer'));
  elsif new.status = 'declined' and new.submitted_by is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (new.submitted_by, new.customer_email, 'customer', 'booking_request_declined', 'Booking declined', venue_record.name || ' was unable to accept your booking request.', 'View booking status', customer_action_url, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(new.submitted_by, 'customer'));
  elsif new.status = 'alternative_proposed' and new.submitted_by is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (new.submitted_by, new.customer_email, 'customer', 'booking_alternative_proposed', 'Venue proposed another time', venue_record.name || ' has suggested another date or time for your booking.', 'Review alternative', customer_action_url, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(new.submitted_by, 'customer'));
  elsif new.status = 'cancelled' and new.submitted_by is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (new.submitted_by, new.customer_email, 'customer', 'booking_cancelled', 'Booking cancelled', venue_record.name || ' cancelled this booking.', 'View booking status', customer_action_url, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(new.submitted_by, 'customer'));
  elsif new.status = 'customer_accepted_alternative' and owner_id is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (owner_id, public.get_user_email(owner_id), 'owner', 'booking_alternative_accepted', 'Alternative accepted', 'The customer accepted your proposed booking time.', 'View booking', '/owner/bookings', 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(owner_id, 'owner'));
  elsif new.status = 'customer_declined_alternative' and owner_id is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (owner_id, public.get_user_email(owner_id), 'owner', 'booking_alternative_declined', 'Alternative declined', 'The customer declined your proposed booking time.', 'View booking', '/owner/bookings', 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(owner_id, 'owner'));
  end if;

  return new;
end;
$$;

create or replace function public.notify_venue_enquiry_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  venue_record public.venues%rowtype;
begin
  select * into venue_record from public.venues where id = new.venue_id;
  if venue_record.claimed_by is null then
    return new;
  end if;

  insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, enquiry_id, delivery_channels)
  values (venue_record.claimed_by, public.get_user_email(venue_record.claimed_by), 'owner', 'enquiry_submitted', 'New enquiry', 'You have a new enquiry for ' || venue_record.name || '.', 'View enquiries', '/owner/enquiries', 'venue_enquiry', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(venue_record.claimed_by, 'owner'));

  return new;
end;
$$;

drop trigger if exists notify_booking_request_inserted on public.booking_requests;
create trigger notify_booking_request_inserted
after insert on public.booking_requests
for each row
execute function public.notify_booking_request_inserted();

drop trigger if exists notify_booking_request_updated on public.booking_requests;
create trigger notify_booking_request_updated
after update on public.booking_requests
for each row
execute function public.notify_booking_request_updated();

drop trigger if exists notify_venue_enquiry_inserted on public.venue_enquiries;
create trigger notify_venue_enquiry_inserted
after insert on public.venue_enquiries
for each row
execute function public.notify_venue_enquiry_inserted();

notify pgrst, 'reload schema';
