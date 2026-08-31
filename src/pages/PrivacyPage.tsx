import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";

export function PrivacyPage() {
  return (
    <main>
      <PageMeta
        title="Privacy | nokta"
        description="How nokta handles account data, saved venues, reviews, suggestions, location context and analytics events."
        canonicalPath="/privacy"
      />
      <PageContainer className="max-w-3xl py-12">
        <p className="text-sm font-medium text-muted-foreground">Privacy</p>
        <h1 className="mt-2 text-4xl font-semibold">Privacy notice</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>This is placeholder privacy copy for launch preparation and is not final legal text.</p>
          <p>nokta uses account data so users can sign in and keep saved venues synced across devices.</p>
          <p>Saved venues, recently viewed venues, reviews, venue suggestions, venue enquiries and venue claim requests may be associated with your account when you are signed in.</p>
          <p>Venue enquiries may include contact details, preferred dates or times, party size and enquiry messages so nokta or a venue can follow up.</p>
          <p>Venue claim requests may include claimant contact details, business contact details, role information and proof links or notes so we can review ownership or management access.</p>
          <p>We track basic analytics events to understand how people use the product, such as searches, filters, venue views, reviews, suggestions and claim request actions.</p>
          <p>For browser location, exact latitude and longitude are used in the app for distance and sorting, but exact browser coordinates are not stored in analytics events.</p>
        </div>
      </PageContainer>
    </main>
  );
}
