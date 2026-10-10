# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mobile is the main audience. The homepage serves three situations, all confirmed:

- **Group night out**: someone picking a spot for friends tonight or this weekend, often sharing options in a group chat.
- **Nearby, right now**: already out and wants somewhere close that is open and has room.
- **Special occasion**: a birthday or group booking that needs space, private hire or a set menu.

Venue owners are a second audience with their own owner area (`/owner`). They are not the homepage's audience.

## Product Purpose

Nokta helps people find and book social venues across the UK. Shisha lounges come first; restaurants, bars, cafés and dessert spots follow. Visitors browse venues, read honest detail, save and share shortlists, get recommendations (`/recommend`), and send booking requests or enquiries directly to the venue. A visit succeeds when someone leaves with a place they trust and a request sent.

## Positioning

These three things, together, are what OpenTable-style platforms do not offer:

- **Honest venue detail**: real prices, shisha menus, vibe, opening hours and photos, the things generic listings leave out.
- **Independents**: many listed lounges are not on the big booking platforms. Requests go direct to the venue.
- **Local scene knowledge**: it should feel like a friend who knows the area, organised by neighbourhood, by night and by crowd rather than as an endless results list.

## Operating Context

- Booking is a request, not instant confirmation. The venue accepts, declines or suggests another time, and the customer follows progress on a booking status page.
- Venues have per-slot capacity, opening hours, closures and party-size rules.
- Discovery is split: the homepage is a light browse surface, and the full filtered list lives at `/discover` (see `docs/homepage-build-plan.md`).

## Capabilities and Constraints

- Categories are config-driven (`src/data/venueCategories.ts`). Only `shisha_lounge` is active today.
- **Category stance (confirmed):** the homepage stays neutral in structure so restaurants and cafés can be switched on later, but shisha leads honestly because it is the only live category. Do not fake breadth.
- Featured placements must be labelled "Featured" (`docs/featured-placements-policy.md`).
- London-first: confident about London, honest about other cities. Venue data exists for many UK cities (`data/venues/*.generated.json`); some is marked review-needed.
- Filter state lives in the URL on `/discover`.

## Brand Commitments

- Name: **nokta**, Turkish for "dot". The dot and place idea should be a quiet signature, not the page structure, and never "dot soup" (`docs/homepage-build-plan.md`).
- Assets: `public/nokta-dot*.svg` and the favicon set.
- Copy is London-first, honest and not overclaiming.
- The homepage must be distinct from OpenTable-style generic booking UI, without being over the top.

## Evidence on Hand

- Real venue data: names, areas, prices, opening hours, photos, and menus where seeded.
- Earlier homepage explorations: `prototypes/` (airbnb, balanced, booking, dot, homepage, nokta) and `nokta-search.html`.
- No testimonials, press, user counts or review volumes are confirmed. Do not invent them.

## Product Principles

1. Honest beats polished: show real prices, menus and hours before persuasive copy.
2. Help people narrow down, not wade through lists. Every surface should shorten the path to "this one".
3. Local and specific: neighbourhoods, nights and crowds are first-class ways in.
4. Built to grow categories without pretending they already exist.
5. Mobile first: designed for one thumb, often in a group chat or on the street.
