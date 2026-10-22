import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { buildArdManifest, buildLlmsTxt } from "../src/lib/agentDiscovery";
import { SUPPORTED_CITIES } from "../src/data/supportedCities";

const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || process.env.VITE_APP_URL || "https://www.nokta.uk").replace(/\/$/, "");

async function main() {
  const publicDir = join(process.cwd(), "public");
  const wellKnownDir = join(publicDir, ".well-known");

  await mkdir(wellKnownDir, { recursive: true });
  await writeFile(join(publicDir, "llms.txt"), buildLlmsTxt(SITE_URL, SUPPORTED_CITIES), "utf8");
  await writeFile(join(wellKnownDir, "ard.json"), `${JSON.stringify(buildArdManifest(SITE_URL), null, 2)}\n`, "utf8");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
