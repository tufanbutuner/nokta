export function OwnerMediaGuidelines() {
  return (
    <aside className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Photo guidelines</h2>
      <p className="mt-2 text-sm text-muted-foreground">Upload original photos of your venue only.</p>
      <div className="mt-5 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <p className="font-medium">Good photos</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Exterior or front entrance</li>
            <li>Interior seating and lounge atmosphere</li>
            <li>Food, drinks, groups, or event setup</li>
          </ul>
        </div>
        <div>
          <p className="font-medium">Avoid</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Stock, scraped, or copyrighted images</li>
            <li>Instagram or Google screenshots</li>
            <li>Blurry, dark, unrelated, or personal-data images</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
