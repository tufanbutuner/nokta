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
      case when channel_value = 'in_app' then 'delivered' else 'pending' end,
      null,
      case when channel_value = 'in_app' then now() else null end,
      case when channel_value = 'in_app' then now() else null end
    );
  end loop;

  return new;
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
  status_url text;
begin
  select * into venue_record from public.venues where id = new.venue_id;
  status_url := case when new.customer_access_token is null then null else '/booking-status/' || new.customer_access_token end;

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
    new.submitted_by,
    new.customer_email,
    'customer',
    'booking_request_submitted',
    'Your booking request has been sent',
    'Your booking request for ' || coalesce(venue_record.name, 'this venue') || ' has been sent.',
    'View booking status',
    status_url,
    'booking_request',
    new.id::text,
    new.venue_id,
    new.id,
    case when new.submitted_by is null then '["email"]'::jsonb else public.get_booking_notification_channels(new.submitted_by, 'customer') end
  );

  if venue_record.claimed_by is not null then
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
      '/owner/bookings?booking=' || new.id::text,
      'booking_request',
      new.id::text,
      new.venue_id,
      new.id,
      public.get_booking_notification_channels(venue_record.claimed_by, 'owner')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_notification_delivery_logs on public.notifications;
create trigger create_notification_delivery_logs
after insert on public.notifications
for each row
execute function public.create_notification_delivery_logs();

drop trigger if exists notify_booking_request_inserted on public.booking_requests;
create trigger notify_booking_request_inserted
after insert on public.booking_requests
for each row
execute function public.notify_booking_request_inserted();

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
select
  br.submitted_by,
  br.customer_email,
  'customer',
  'booking_request_submitted',
  'Your booking request has been sent',
  'Your booking request for ' || coalesce(v.name, 'this venue') || ' has been sent.',
  'View booking status',
  case when br.customer_access_token is null then null else '/booking-status/' || br.customer_access_token end,
  'booking_request',
  br.id::text,
  br.venue_id,
  br.id,
  case when br.submitted_by is null then '["email"]'::jsonb else public.get_booking_notification_channels(br.submitted_by, 'customer') end
from public.booking_requests br
left join public.venues v on v.id = br.venue_id
where br.status = 'pending'
  and br.created_at > now() - interval '2 days'
  and not exists (
    select 1
    from public.notifications n
    where n.booking_request_id = br.id
      and n.recipient_type = 'customer'
      and n.notification_type = 'booking_request_submitted'
  );

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
select
  v.claimed_by,
  public.get_user_email(v.claimed_by),
  'owner',
  'booking_request_submitted',
  'New booking request',
  'You have a new booking request for ' || v.name || '.',
  'View booking',
  '/owner/bookings?booking=' || br.id::text,
  'booking_request',
  br.id::text,
  br.venue_id,
  br.id,
  public.get_booking_notification_channels(v.claimed_by, 'owner')
from public.booking_requests br
join public.venues v on v.id = br.venue_id
where br.status = 'pending'
  and br.created_at > now() - interval '2 days'
  and v.claimed_by is not null
  and not exists (
    select 1
    from public.notifications n
    where n.booking_request_id = br.id
      and n.recipient_type = 'owner'
      and n.notification_type = 'booking_request_submitted'
  );

revoke execute on function public.create_notification_delivery_logs() from anon, authenticated;
revoke execute on function public.notify_booking_request_inserted() from anon, authenticated;

notify pgrst, 'reload schema';
