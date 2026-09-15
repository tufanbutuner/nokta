import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import process from "node:process";

/**
 * The crawler body is hand-built HTML assembled from database values, and nothing
 * else exercises it: it is only ever served to a crawler, so a broken tag or an
 * unescaped venue name would not show up in the app, in a build, or in a page a
 * person looks at. It would show up as mangled search results weeks later.
 *
 * This renders the body for a set of awkward venues and asserts the properties
 * that matter: tags balance, values are escaped, and the facts the page claims are
 * the ones it was given. It deliberately does not compare against the React tree —
 * the body carries the same facts in simpler markup by design, so there is no
 * equality to assert.
 */

const TMP = "middleware.__check__.ts";

function loadMiddleware() {
  const source = readFileSync("middleware.ts", "utf8")
    .replace(/import \{ next \}[^\n]*\n/, "const next = () => new Response(null, { status: 299 });\n")
    .concat("\nexport { buildVenueBody, buildCityBody, escapeHtml };\n");
  writeFileSync(TMP, source);
  return import(`./${TMP}`.replace("./", "../"));
}

const problems: string[] = [];

function check(label: string, condition: boolean, detail?: string) {
  if (!condition) problems.push(detail ? `${label}: ${detail}` : label);
}

/** Counts opening and closing tags so an unbalanced block cannot slip through. */
function assertBalanced(label: string, html: string) {
  for (const tag of ["ul", "li", "table", "tr", "td", "th", "nav", "address", "h1", "h2", "p", "a"]) {
    const open = html.match(new RegExp(`<${tag}(?=[\\s>])`, "g"))?.length ?? 0;
    const close = html.match(new RegExp(`</${tag}>`, "g"))?.length ?? 0;
    check(label, open === close, `<${tag}> opened ${open} times, closed ${close}`);
  }
}

const baseVenue = {
  name: "Test Venue",
  slug: "test-venue",
  city: "London",
  area: "Soho",
  address: "1 Test St",
  postcode: "W1 1AA",
  country: "United Kingdom",
  description: "A venue.",
  images: ["/a.jpg"],
  latitude: 51.5,
  longitude: -0.1,
  price_level: 2,
  phone: "020 1234 5678",
  website: "https://example.com",
  instagram: "https://instagram.com/x",
  business_status: "open",
  opening_hours: [{ day: "Monday", open: "17:00", close: "23:00" }],
  halal: true,
  outdoor: false,
  indoor: true,
  food: true,
  alcohol: false,
  open_late: true,
};

async function main() {
  const { buildVenueBody, buildCityBody } = await loadMiddleware();

  // A fully populated venue: every block should be present and balanced.
  const full = buildVenueBody(baseVenue);
  assertBalanced("full venue", full);
  check("full venue", full.includes("<h1>Test Venue</h1>"), "heading missing");
  check("full venue", full.includes("Monday"), "opening hours missing");
  check("full venue", full.includes("/cities/london"), "city link missing");
  check("full venue", full.includes("<address>"), "address missing");

  // A venue with nothing optional set must still produce valid markup rather than
  // empty headings with no content under them.
  const sparse = buildVenueBody({ ...baseVenue, description: null, images: null, address: null, postcode: null, phone: null, website: null, opening_hours: null, halal: null, indoor: null, food: null, open_late: null });
  assertBalanced("sparse venue", sparse);
  check("sparse venue", !sparse.includes("<h2>Opening hours</h2>"), "emitted an opening hours heading with no hours");
  check("sparse venue", !sparse.includes("<h2>Features</h2>"), "emitted a features heading with no features");
  check("sparse venue", !sparse.includes("<address>"), "emitted an address block with no address");

  // Hostile values must not escape their attribute or element. This is the check
  // that matters most: venue names are user-editable through the owner dashboard.
  const hostile = buildVenueBody({
    ...baseVenue,
    name: '<script>alert(1)</script>',
    description: '"><img src=x onerror=alert(1)>',
    area: "</p><script>bad()</script>",
  });
  assertBalanced("hostile venue", hostile);
  check("hostile venue", !hostile.includes("<script>"), "an unescaped <script> tag reached the output");
  // Escaped text may legitimately contain the characters of an attack (a review of
  // a venue called "<script>" is just text), so what matters is that no live tag
  // was produced — not that the substring is absent. Strip every real tag and
  // assert nothing tag-shaped survives in the text that remains.
  const textOnly = hostile.replace(/<\/?[a-z][^>]*>/gi, "");
  check("hostile venue", !/<[a-z]/i.test(textOnly), "a tag survived in text content, so a value was not escaped");
  check("hostile venue", hostile.includes("&lt;script&gt;"), "the hostile name was dropped rather than escaped");

  // Malformed opening hours are dropped rather than rendered as empty rows.
  const badHours = buildVenueBody({ ...baseVenue, opening_hours: [{ day: "Notaday", open: "1", close: "2" }, { day: "Friday", open: "", close: "23:00" }] });
  assertBalanced("bad hours", badHours);
  check("bad hours", !badHours.includes("<h2>Opening hours</h2>"), "rendered an hours table from entries that are all invalid");

  const cityMeta = { title: "Venues in London | nokta", description: "Explore social venues in London." };
  const city = buildCityBody("London", cityMeta, [
    { name: "Alpha & Co", slug: "alpha", area: "Soho" },
    { name: "Beta", slug: "beta", area: "" },
  ]);
  assertBalanced("city with venues", city);
  check("city with venues", city.includes("<h2>2 venues in London</h2>"), "venue count missing or wrong");
  check("city with venues", city.includes("Alpha &amp; Co"), "ampersand in a venue name was not escaped");
  check("city with venues", (city.match(/<li>/g) ?? []).length === 2, "listing did not render one item per venue");

  // A failed venue lookup must still render a usable page, not a broken listing.
  const cityNoVenues = buildCityBody("Leeds", cityMeta, null);
  assertBalanced("city without venues", cityNoVenues);
  check("city without venues", !cityNoVenues.includes("<ul>"), "rendered an empty list when the lookup failed");
  check("city without venues", cityNoVenues.includes("<h1>Venues in Leeds</h1>"), "heading missing");

  const singular = buildCityBody("London", cityMeta, [{ name: "Solo", slug: "solo", area: "Soho" }]);
  check("single venue city", singular.includes("<h2>1 venue in London</h2>"), "did not use the singular form");

  if (problems.length) {
    console.error("Crawler body rendering has problems:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log("Crawler body OK — venue and city bodies render valid, escaped markup.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    try {
      unlinkSync(TMP);
    } catch {
      // Already gone; nothing to clean up.
    }
  });
