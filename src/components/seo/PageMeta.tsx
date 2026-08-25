import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
  imageUrl?: string;
}

const FALLBACK_SITE_URL = "https://sheesha-lovat.vercel.app";

export function PageMeta({ title, description, canonicalPath, imageUrl }: PageMetaProps) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = canonicalPath ? new URL(canonicalPath, siteUrl).toString() : undefined;
  const image = imageUrl ? new URL(imageUrl, siteUrl).toString() : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}
    </Helmet>
  );
}

function getSiteUrl() {
  const envSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  return (envSiteUrl || FALLBACK_SITE_URL).replace(/\/$/, "");
}
