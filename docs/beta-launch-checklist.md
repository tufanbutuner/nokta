# Nokta beta launch checklist

## Required before beta

- [ ] Production domain points to the latest Vercel deployment.
- [ ] `APP_URL` and `VITE_APP_URL` use the production Nokta URL.
- [ ] Supabase auth redirect URLs include the production Nokta URL.
- [ ] Resend sender domain is verified and `EMAIL_FROM_ADDRESS` uses that domain.
- [ ] Stripe test and live secrets are set in the correct Supabase environments.
- [ ] `robots.txt` and `sitemap.xml` expose only public routes.
- [ ] A signed-out user can request a booking and receive the status link.
- [ ] A signed-in customer can see My Bookings from latest to oldest.
- [ ] A venue owner can accept, decline, propose and cancel bookings.
- [ ] A newly approved owner sees the launch checklist in their venue dashboard.
- [ ] A claimed owner can open venue analytics and see aggregate value reporting.
- [ ] `/for-venues` explains the owner value proposition and links into claim/list flows.
- [ ] Admin can manage venues, claims, reviews, media, bookings and promotions.

## Public surfaces

- [ ] Homepage renders cleanly on mobile and desktop.
- [ ] Discover renders list-first on mobile and map/list on desktop.
- [ ] City pages render only active cities.
- [ ] Venue pages render gallery, booking card, tabs and map without overflow.
- [ ] Error boundaries show a useful fallback.
- [ ] Owner claim page clearly explains what happens after approval.

## Brand

- [ ] Product copy says Nokta.
- [ ] Shisha wording is only used for the venue category or launch wedge.
- [ ] Wordmark uses Onest.
- [ ] Body and headings use Outfit.
- [ ] Favicon and meaningful dot moments render correctly.
