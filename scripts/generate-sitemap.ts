import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { SUPPORTED_CITIES } from "../src/data/supportedCities";

config({ path: ".env.local" });
config();

/**
 * The apex 308-redirects to www, so www is the canonical host and the one the
 * middleware puts in every canonical tag. A sitemap of apex URLs would list a
 * redirect for every page, which wastes crawl budget and contradicts those tags.
 */
const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || process.env.VITE_APP_URL || "https://www.nokta.uk").replace(/\/$/, "");
const STATIC_ROUTES = ["/", "/discover", "/for-venues", "/recommend", "/suggest", "/privacy", "/terms"];

async function main() {
  const venueSlugs = await getVenueSlugs();

  // The sitemap is generated during the build, so a Supabase outage would
  // otherwise ship a sitemap with no venues in it — telling search engines the
  // catalogue is empty, which is worse than shipping yesterday's file. Fail the
  // build instead and leave the existing sitemap in place.
  if (!venueSlugs.length) {
    throw new Error("No venue slugs returned — refusing to write a sitemap with no venues. Check Supabase credentials and connectivity.");
  }

  const cityRoutes = SUPPORTED_CITIES.filter((city) => city.isActive).map((city) => `/cities/${city.slug}`);
  const routes = [...STATIC_ROUTES, ...cityRoutes, ...venueSlugs.map((slug) => `/venues/${slug}`)];
  const xml = createSitemapXml(routes);
  const outputPath = join(process.cwd(), "public", "sitemap.xml");

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, "utf8");
}

async function getVenueSlugs(): Promise<string[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("VITE_SUPABASE_URL and a Supabase key must be set to generate the sitemap.");
  }

  const client = createClient(supabaseUrl, supabaseKey);
  // Match what the site actually serves: test venues are hidden from everyone but
  // admins, and a permanently closed venue should not be offered up for crawling.
  const { data, error } = await client.from("venues").select("slug").eq("is_test", false).neq("business_status", "permanently-closed").order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load venue slugs for sitemap: ${error.message}`);
  }

  return (data ?? []).map((row) => row.slug).filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
}

function createSitemapXml(routes: string[]) {
  const urls = routes
    .map((route) => {
      const loc = `${SITE_URL}${route === "/" ? "" : route}`;
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

void main();
