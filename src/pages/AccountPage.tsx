import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthError } from "@/components/auth/AuthError";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds, recentlyViewedVenueIds, isLoading } = useVenuePreferences();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);

    try {
      await signOut();
      navigate("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main>
      <PageMeta title="Account | Sheesha" description="Manage your Sheesha account, saved venues and recently viewed venues." canonicalPath="/account" />
      <PageContainer className="py-12">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <h1 className="mt-2 text-4xl font-semibold">Your Sheesha account</h1>
            </div>

            <div className="rounded-lg border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 font-medium">{user?.email}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Saved venues</p>
                <p className="mt-1 text-3xl font-semibold">{isLoading ? "..." : favouriteVenueIds.length}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Recently viewed</p>
                <p className="mt-1 text-3xl font-semibold">{isLoading ? "..." : recentlyViewedVenueIds.length}</p>
              </div>
            </div>

            {isAdmin ? (
              <div className="rounded-lg border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Admin</p>
                <h2 className="mt-1 text-xl font-semibold">Venue management</h2>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline">
                    <Link to="/admin/venues">Manage venues</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/data-quality">Data quality</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/reviews">Reviews</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/suggestions">Suggestions</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/monetisation">Monetisation</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            <AuthError message={error} />

            <Button onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
