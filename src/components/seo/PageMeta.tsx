import { Helmet } from "react-helmet-async";
import { brandConfig } from "@/config/brand";
import { DEFAULT_OG_IMAGE } from "@/lib/pageMetadata";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
  imageUrl?: string;
}

/**
 * The apex 308-redirects to www, so www is the canonical host — the one the edge
 * middleware puts in every crawler canonical, and the one the sitemap lists. When
 * this fell back to the apex, a page rendered by the client claimed an apex
 * canonical while the same page served to a crawler claimed www, which is a split
 * signal for the same URL.
 */
const FALLBACK_SITE_URL = "https://www.nokta.uk";

export function PageMeta({ title, description, canonicalPath, imageUrl }: PageMetaProps) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = canonicalPath ? new URL(canonicalPath, siteUrl).toString() : undefined;
  // Always emit an image: a card with none renders as a small text-only preview.
  const image = new URL(imageUrl ?? DEFAULT_OG_IMAGE, siteUrl).toString();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={brandConfig.appName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="application-name" content={brandConfig.appName} />
    </Helmet>
  );
}

function getSiteUrl() {
  const envSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_APP_URL) as string | undefined;
  return (envSiteUrl || FALLBACK_SITE_URL).replace(/\/$/, "");
}
