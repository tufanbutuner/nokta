-- Notify the customer when a venue replies to a booking request.
--
-- The owner inbox has a Reply box that writes owner_response_message and
-- changes nothing else. notify_booking_request_updated returns early when the
-- status is unchanged, so a reply created no notification and no email: the
-- text sat on the row until the customer happened to reopen their booking
-- status link. The inbox meanwhile told the owner the reply was "sent as your
-- venue, copied to your email".
--
-- Add a booking_reply notification type, and a trigger branch for the case the
-- old one skipped: the message changed but the status did not.

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
    'booking_reply',
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
  select * into venue_record from public.venues where id = new.venue_id;
  customer_action_url := case when new.customer_access_token is null then null else '/booking-status/' || new.customer_access_token end;
  owner_id := venue_record.claimed_by;

  /**
   * A reply with no status change. Checked before the status branches so that
   * an owner who accepts and writes a message still gets one notification for
   * the acceptance, which already carries the message, rather than two.
   */
  if old.status = new.status then
    if new.owner_response_message is not null
      and new.owner_response_message is distinct from old.owner_response_message
      and new.submitted_by is not null
    then
      insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
      values (new.submitted_by, new.customer_email, 'customer', 'booking_reply', 'Venue replied', venue_record.name || ' replied to your booking request.', 'View booking status', customer_action_url, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(new.submitted_by, 'customer'));
    end if;

    return new;
  end if;

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
    values (owner_id, public.get_user_email(owner_id), 'owner', 'booking_alternative_accepted', 'Alternative accepted', 'The customer accepted your proposed booking time.', 'View booking', '/owner/bookings?booking=' || new.id::text, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(owner_id, 'owner'));
  elsif new.status = 'customer_declined_alternative' and owner_id is not null then
    insert into public.notifications (recipient_user_id, recipient_email, recipient_type, notification_type, title, body, action_label, action_url, related_entity_type, related_entity_id, venue_id, booking_request_id, delivery_channels)
    values (owner_id, public.get_user_email(owner_id), 'owner', 'booking_alternative_declined', 'Alternative declined', 'The customer declined your proposed booking time.', 'View booking', '/owner/bookings?booking=' || new.id::text, 'booking_request', new.id::text, new.venue_id, new.id, public.get_booking_notification_channels(owner_id, 'owner'));
  end if;

  return new;
end;
$$;
