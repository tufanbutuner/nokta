# Category Expansion

Nokta launches with shisha lounges and late-night lounge venues, but the product should remain flexible enough for restaurants, bars, cafes, dessert spots, private hire venues and other social venues.

Global copy should describe social venue discovery and booking. Shisha-specific copy belongs on launch-category, city/category and venue surfaces where the data genuinely supports it.

The category foundation is:

- `primary_category` for the main venue type.
- `secondary_categories` for supporting tags such as food, mocktails, private hire, late-night and groups.
- Active category config in `src/data/venueCategories.ts`.

Future public routes:

- `/categories/:categorySlug`
- `/cities/:citySlug/:categorySlug`

Do not create indexable restaurant, bar, cafe or other category pages until there is enough real data to avoid thin pages. Inactive/future categories should not be indexed.
