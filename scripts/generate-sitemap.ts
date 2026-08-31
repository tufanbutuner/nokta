import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { SUPPORTED_CITIES } from "../src/data/supportedCities";

config({ path: ".env.local" });
config();

const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || process.env.VITE_APP_URL || "https://nokta.uk").replace(/\/$/, "");
const STATIC_ROUTES = ["/", "/discover", "/privacy", "/terms"];

async function main() {
  const venueSlugs = await getVenueSlugs();
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
    return [];
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await client.from("venues").select("slug").order("name", { ascending: true });

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
