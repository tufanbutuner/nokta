import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, BarChart3, BookOpenCheck, Building2, CreditCard, Heart, History, Inbox, LayoutDashboard, LogOut, PenLine, ShieldCheck, UserCircle } from "lucide-react";
import { AuthError } from "@/components/auth/AuthError";
import { MyClaimRequests } from "@/components/claims/MyClaimRequests";
import { MyVenueEnquiries } from "@/components/enquiries/MyVenueEnquiries";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useVenues } from "@/hooks/useVenues";
import { getMyVenueClaimRequests } from "@/services/venueClaimService";
import { getMyVenueEnquiries } from "@/services/venueEnquiryService";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import type { Venue } from "@/types/venue";
import type { VenueClaimRequest } from "@/types/venueClaims";
import type { VenueEnquiry } from "@/types/venueEnquiries";

export function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds, recentlyViewedVenueIds, isLoading } = useVenuePreferences();
  const { venues } = useVenues();
  const [claims, setClaims] = useState<VenueClaimRequest[]>([]);
  const [enquiries, setEnquiries] = useState<VenueEnquiry[]>([]);
  const [claimedVenues, setClaimedVenues] = useState<Venue[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!user) {
      setClaims([]);
      return;
    }

    let cancelled = false;
    setIsLoadingClaims(true);
    setClaimError(null);

    getMyVenueClaimRequests(user.id)
      .then((nextClaims) => {
        if (!cancelled) {
          setClaims(nextClaims);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setClaimError(caughtError instanceof Error ? caughtError.message : "Could not load venue claim requests.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingClaims(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setClaimedVenues([]);
      return;
    }
    let cancelled = false;
    getMyClaimedVenues(user.id)
      .then((nextVenues) => {
        if (!cancelled) setClaimedVenues(nextVenues);
      })
      .catch(() => {
        if (!cancelled) setClaimedVenues([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEnquiries([]);
      return;
    }
    let cancelled = false;
    setIsLoadingEnquiries(true);
    setEnquiryError(null);
    getMyVenueEnquiries(user.id)
      .then((nextEnquiries) => {
        if (!cancelled) setEnquiries(nextEnquiries);
      })
      .catch((caughtError) => {
        if (!cancelled) setEnquiryError(caughtError instanceof Error ? caughtError.message : "Could not load enquiries.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEnquiries(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const venuesById = useMemo<Record<string, Venue | undefined>>(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
    [venues],
  );

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
      <PageMeta title="Account | nokta" description="Manage your nokta account, saved venues and recently viewed venues." canonicalPath="/account" />
      <PageContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-clay-accent">Account</p>
                <h1 className="mt-2 font-brand text-4xl font-bold tracking-[-0.5px]">Your nokta account</h1>
                <p className="mt-2 text-sm text-muted-foreground">Manage saved venues, enquiries, owner tools and admin access from one place.</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nokta-ink text-sm font-semibold text-clay-50">
                  {getInitials(user?.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="truncate text-sm font-medium">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AccountMetric icon={Heart} label="Saved venues" value={isLoading ? "..." : favouriteVenueIds.length} />
            <AccountMetric icon={History} label="Recently viewed" value={isLoading ? "..." : recentlyViewedVenueIds.length} />
            <AccountMetric icon={BadgeCheck} label="Claim requests" value={isLoadingClaims ? "..." : claims.length} />
            <AccountMetric icon={Inbox} label="My enquiries" value={isLoadingEnquiries ? "..." : enquiries.length} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-xl border bg-card p-5 shadow-sm">
              <SectionHeader eyebrow="Venue claims" title="Claim requests" />
              <div className="mt-4">
                {claimError ? (
                  <Alert className="border-destructive/30 text-destructive">{claimError}</Alert>
                ) : isLoadingClaims ? (
                  <p className="text-sm text-muted-foreground">Loading claim requests...</p>
                ) : (
                  <MyClaimRequests claims={claims} venuesById={venuesById} />
                )}
              </div>
              </section>

              <section className="rounded-xl border bg-card p-5 shadow-sm">
              <SectionHeader eyebrow="My enquiries" title="Recent enquiries" />
              <div className="mt-4">
                {enquiryError ? (
                  <Alert className="border-destructive/30 text-destructive">{enquiryError}</Alert>
                ) : isLoadingEnquiries ? (
                  <p className="text-sm text-muted-foreground">Loading enquiries...</p>
                ) : (
                  <MyVenueEnquiries enquiries={enquiries} venuesById={venuesById} />
                )}
              </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <SectionHeader eyebrow="Owner tools" title={claimedVenues.length ? `${claimedVenues.length} managed venue${claimedVenues.length === 1 ? "" : "s"}` : "Own or manage a venue?"} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {claimedVenues.length ? "Open your owner workspace for venue performance, enquiries and billing." : "Claim your venue profile to access owner tools."}
                </p>
                <div className="mt-4 grid gap-2">
                  <ShortcutLink to="/account/bookings" icon={BookOpenCheck} label="My bookings" />
                  {claimedVenues.length ? (
                    <>
                      <ShortcutLink to="/owner" icon={LayoutDashboard} label="Owner dashboard" />
                      <ShortcutLink to="/owner/enquiries" icon={Inbox} label="Enquiry inbox" />
                      <ShortcutLink to="/owner/billing" icon={CreditCard} label="Billing" />
                    </>
                  ) : (
                    <Button asChild><Link to="/discover">Find your venue</Link></Button>
                  )}
                </div>
              </section>

              {isAdmin ? (
                <section className="rounded-xl border bg-nokta-ink p-5 text-clay-50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-clay-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-400">Admin</p>
                  </div>
                  <h2 className="mt-2 font-brand text-xl font-bold tracking-[-0.5px]">Management</h2>
                  <div className="mt-4 grid gap-2">
                    <AdminShortcutLink to="/admin/venues" icon={Building2} label="Manage venues" />
                    <AdminShortcutLink to="/admin/data-quality" icon={BarChart3} label="Data quality" />
                    <AdminShortcutLink to="/admin/reviews" icon={PenLine} label="Reviews" />
                    <AdminShortcutLink to="/admin/subscriptions" icon={CreditCard} label="Subscriptions" />
                  </div>
                </section>
              ) : null}

              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <SectionHeader eyebrow="Session" title="Account access" />
                <AuthError message={error} />
                <Button onClick={handleSignOut} disabled={isSigningOut} variant="outline" className="mt-4 w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </Button>
              </section>
            </aside>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}

function AccountMetric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <Icon className="h-4 w-4 text-clay-accent" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 font-brand text-xl font-bold tracking-[-0.5px]">{title}</h2>
    </div>
  );
}

function ShortcutLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Button asChild variant="outline" className="justify-start gap-2">
      <Link to={to}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

function AdminShortcutLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-clay-50/80 transition-colors hover:bg-clay-400/10 hover:text-clay-200">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function getInitials(email?: string) {
  const name = email?.split("@")[0] ?? "user";
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
