# City Launch Checklist

Use this before making a city active in Sheesha.

## Launch status

Launched cities:

- London
- Birmingham
- Manchester
- Leicester

Coming soon:

- Bradford
- Leeds
- Liverpool
- Sheffield
- Nottingham
- Glasgow

## Minimum launch bar

- Target at least 8 venues
- Minimum 6 strong venues for smaller cities, with data gaps documented
- All venues have `country` and `city`
- All venues have address and postcode
- All venues have valid coordinates
- All venues have business status
- All venues have verification status
- All venues have at least one data source
- At least 50% of venues have opening hours
- At least 50% of venues have an official source
- City page has metadata
- City appears in Discover
- City appears in sitemap
- Data quality dashboard supports the city

## Recommended pre-launch checks

- Discover city selector includes the city
- Area filters only show areas from the selected city
- Map centres on the selected city
- Venue cards do not leak venues from other cities
- Recommendation quiz includes the city
- Recommendation results stay inside the selected city
- Suggest venue form includes the city
- Admin venue table can filter by city
- Admin suggestions can filter by city
- Public copy avoids "best" language unless rankings are justified
- Venue images are owned, venue-approved, or clearly treated as placeholders

## Post-launch checks

- Run seed validation
- Run TypeScript
- Run production build
- Regenerate sitemap
- Smoke test `/cities/:citySlug`
- Smoke test `/discover?city=:CityName`
- Smoke test at least one venue detail page for the city
