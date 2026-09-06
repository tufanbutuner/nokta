# London Venue Seeding

Use this flow to quickly discover more London shisha venues, then review the generated data before importing it.

1. Add a Google Places API key to `.env.local`.

```bash
GOOGLE_PLACES_API_KEY=...
```

2. Generate review files.

```bash
npm run discover:venues:london -- --limit=120
```

This creates:

- `data/london-venues.generated.json` for venues whose name explicitly includes shisha, sheesha, sisha, hookah or lounge.
- `data/london-venues-review-needed.generated.json` for ambiguous restaurants, cafes and bars that need manual verification before import.

3. Review `data/london-venues.generated.json`.

Check that each venue really offers shisha, remove false positives, add real prices where verified, and replace stock images with owned or venue-approved media when available.

4. Validate the file.

```bash
npm run seed:venues:london -- --validate-only
```

5. Import into Supabase.

```bash
npm run seed:venues:london
```

The discovery script intentionally does not import Google ratings or Google photos. Ratings stay `null` until Nokta owns or licenses that rating data, and generated venues use varied stock placeholders so the product can be reviewed without every card sharing one image.
