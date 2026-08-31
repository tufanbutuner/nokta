import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";

export function TermsPage() {
  return (
    <main>
      <PageMeta
        title="Terms | nokta"
        description="Basic terms for using nokta venue discovery, user reviews and suggested venue data."
        canonicalPath="/terms"
      />
      <PageContainer className="max-w-3xl py-12">
        <p className="text-sm font-medium text-muted-foreground">Terms</p>
        <h1 className="mt-2 text-4xl font-semibold">Terms of use</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>This is placeholder terms copy for launch preparation and is not final legal text.</p>
          <p>Venue details, opening hours, pricing, menus and availability may change. Always check directly with the venue before travelling or booking.</p>
          <p>Reviews are user-submitted and reflect individual experiences.</p>
          <p>Users must not submit abusive, misleading, unlawful or intentionally inaccurate content in reviews, venue suggestions or venue claim requests.</p>
          <p>Venue claim requests may be approved, rejected or cancelled at our discretion. Submitting a claim does not guarantee access to manage a venue profile.</p>
          <p>Venue enquiries are not confirmed bookings. Venue availability is not guaranteed, and nokta may not be responsible for venue response times.</p>
          <p>Users should provide accurate contact details when sending enquiries.</p>
          <p>Claimants must provide accurate information and must not claim a venue they do not own, manage or have permission to represent.</p>
          <p>nokta is not responsible for venue availability, pricing changes, booking outcomes or changes made by venues.</p>
        </div>
      </PageContainer>
    </main>
  );
}
