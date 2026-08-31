create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "Anyone can insert venue analytics events" on public.venue_analytics_events;
create policy "Anyone can insert venue analytics events"
on public.venue_analytics_events
for insert
with check (
  venue_id is not null
  and event_name is not null
  and event_name in (
    'venue_profile_viewed',
    'venue_directions_clicked',
    'venue_website_clicked',
    'venue_instagram_clicked',
    'venue_saved',
    'venue_unsaved',
    'venue_enquiry_cta_clicked',
    'venue_enquiry_submitted',
    'venue_booking_request_cta_clicked',
    'venue_booking_request_submitted',
    'venue_booking_status_viewed',
    'venue_booking_alternative_accepted',
    'venue_booking_alternative_declined',
    'venue_booking_confirmed',
    'venue_booking_request_declined',
    'venue_booking_alternative_proposed',
    'featured_placement_viewed',
    'featured_placement_clicked',
    'promoted_offer_viewed',
    'promoted_offer_clicked'
  )
);

drop policy if exists "Anyone can read venue media files" on storage.objects;

revoke execute on function public.create_notification_delivery_logs() from anon, authenticated;
revoke execute on function public.notify_booking_request_inserted() from anon, authenticated;
revoke execute on function public.notify_booking_request_updated() from anon, authenticated;
revoke execute on function public.notify_venue_enquiry_inserted() from anon, authenticated;
revoke execute on function public.get_booking_notification_channels(uuid, text) from anon, authenticated;
revoke execute on function public.get_user_email(uuid) from anon, authenticated;
revoke execute on function public.get_owner_venue_enquiry_summary(text) from anon;

grant execute on function public.get_owner_venue_enquiry_summary(text) to authenticated;
grant execute on function public.get_booking_request_status_by_token(text) to anon, authenticated;
grant execute on function public.accept_booking_alternative_by_token(text, text) to anon, authenticated;
grant execute on function public.decline_booking_alternative_by_token(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
