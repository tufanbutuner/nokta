# Sheesha UK expansion plan

Sheesha is expanding from a London-first product into a UK-wide shisha venue discovery platform, city by city.

## Positioning

- Use transition copy: "Discover shisha lounges in London and across the UK."
- Avoid claiming full UK coverage until venue depth exists outside London.
- Keep London, Birmingham, Manchester and Leicester active, with other cities marked as coming soon until verified venue coverage is ready.

## Initial target cities

London, Birmingham, Manchester, Leicester, Bradford, Leeds, Liverpool, Sheffield, Nottingham and Glasgow.

## City launch requirements

- Verified venue identity, address, city, area and coordinates.
- Opening hours, price, images and at least one official or shisha-specific source.
- Admin review for data quality before public launch.
- City activated in `src/data/supportedCities.ts` only after there is enough coverage.

## Admin workflow

1. Add or import venues with `country`, `city` and `area`.
2. Review them in Admin -> Venues using the city filter.
3. Audit city readiness in Admin -> Data Quality.
4. Activate the city in `SUPPORTED_CITIES`.
5. Regenerate the sitemap after city activation.
