import { readFileSync } from "node:fs";
import process from "node:process";

/**
 * The edge runtime cannot resolve the app's "@/" alias, so middleware.ts restates
 * the static metadata table from src/lib/pageMetadata.ts. Two copies drift, and
 * the drift is only ever visible in a shared link — which nobody checks. This
 * compares them and fails the build instead.
 */

function extractPairs(source: string, startMarker: string): Map<string, { title: string; description: string }> {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find ${startMarker}`);

  // Read to the closing brace of the object literal.
  const body = source.slice(start);
  const end = body.indexOf("\n};");
  const table = body.slice(0, end);

  const pairs = new Map<string, { title: string; description: string }>();
  // Interpolations like ${brandConfig.appName} contain a closing brace, so the
  // block cannot be matched with [^}]*: that truncates the entry mid-title and
  // silently drops it, which would hide the very drift this script looks for.
  // Normalise interpolations away first, then match.
  const normalised = table.replace(/\$\{brandConfig\.appName\}|\$\{BRAND\}/g, "Nokta");
  const entry = /"(\/[^"]*)":\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entry.exec(normalised)) !== null) {
    const [, route, block] = match;
    const title = block.match(/title:\s*[`"]([^`"]*)[`"]/)?.[1];
    const description = block.match(/description:\s*"([^"]*)"/)?.[1];
    if (!title || !description) throw new Error(`Could not parse title/description for ${route} — fix the parser rather than letting the entry be skipped.`);
    pairs.set(route, { title, description });
  }

  return pairs;
}

const app = extractPairs(readFileSync("src/lib/pageMetadata.ts", "utf8"), "export const STATIC_PAGE_METADATA");

// The home route points at a shared constant rather than an inline object in both
// files, so it is not part of the table comparison; assert it exists in each.
for (const [label, file] of [["pageMetadata.ts", "src/lib/pageMetadata.ts"], ["middleware.ts", "middleware.ts"]] as const) {
  if (!readFileSync(file, "utf8").includes('"/": ')) {
    console.error(`Missing home route entry in ${label}`);
    process.exit(1);
  }
}
const edge = extractPairs(readFileSync("middleware.ts", "utf8"), "const STATIC_PAGES");

const problems: string[] = [];

for (const [route, appMeta] of app) {
  const edgeMeta = edge.get(route);
  if (!edgeMeta) {
    problems.push(`${route}: present in pageMetadata.ts but missing from middleware.ts`);
    continue;
  }
  if (appMeta.title !== edgeMeta.title) problems.push(`${route}: title differs\n  app:  ${appMeta.title}\n  edge: ${edgeMeta.title}`);
  if (appMeta.description !== edgeMeta.description) problems.push(`${route}: description differs\n  app:  ${appMeta.description}\n  edge: ${edgeMeta.description}`);
}

for (const route of edge.keys()) {
  if (!app.has(route)) problems.push(`${route}: present in middleware.ts but missing from pageMetadata.ts`);
}

if (problems.length) {
  console.error("Static page metadata has drifted between the app and the edge middleware:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nEdit both tables together.");
  process.exit(1);
}

console.log(`Metadata parity OK — ${app.size} routes match.`);
