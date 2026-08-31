export async function getClaimedVenueOwnerEmail(_input: { venueId: string }): Promise<{ ownerUserId: string | null; ownerEmail: string | null }> {
  return { ownerUserId: null, ownerEmail: null };
}
