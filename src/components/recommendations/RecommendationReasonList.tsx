export function RecommendationReasonList({ reasons }: { reasons: string[] }) {
  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {reasons.slice(0, 4).map((reason) => (
        <li key={reason}>✓ {reason}</li>
      ))}
    </ul>
  );
}
