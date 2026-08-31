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

create or replace function public.get_booking_notification_channels(user_id uuid, recipient_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  preferences public.notification_preferences%rowtype;
  use_in_app boolean := true;
  use_email boolean := true;
  channels jsonb := '[]'::jsonb;
begin
  select * into preferences from public.notification_preferences where notification_preferences.user_id = get_booking_notification_channels.user_id;
  if found and recipient_type in ('owner', 'customer') then
    use_in_app := preferences.booking_notifications_in_app;
    use_email := preferences.booking_notifications_email;
  end if;
  if use_in_app then channels := channels || '["in_app"]'::jsonb; end if;
  if use_email then channels := channels || '["email"]'::jsonb; end if;
  if jsonb_array_length(channels) = 0 then return '["in_app"]'::jsonb; end if;
  return channels;
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

notify pgrst, 'reload schema';
