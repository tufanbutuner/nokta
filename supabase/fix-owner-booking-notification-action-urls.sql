update public.notifications
set action_url = '/owner/bookings?booking=' || booking_request_id::text
where recipient_type = 'owner'
  and related_entity_type = 'booking_request'
  and booking_request_id is not null
  and action_url = '/owner/bookings';
