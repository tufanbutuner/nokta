import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildArdManifest, buildLlmsTxt } from "@/lib/agentDiscovery";
import type { SupportedCity } from "@/types/city";

const SITE_URL = "https://www.nokta.uk";

const cities: SupportedCity[] = [
  { name: "London", slug: "london", country: "United Kingdom", latitude: 51.5, longitude: -0.12, defaultZoom: 11, isActive: true },
  { name: "Hidden", slug: "hidden", country: "United Kingdom", latitude: 52, longitude: -1, defaultZoom: 12, isActive: false },
];

describe("buildLlmsTxt", () => {
  const llms = buildLlmsTxt(SITE_URL, cities);

  it("starts with an H1, as the Lighthouse llms.txt audit requires", () => {
    expect(llms.split("\n")[0]).toBe("# Nokta");
  });

  it("links to active cities only", () => {
    expect(llms).toContain(`[London](${SITE_URL}/cities/london)`);
    expect(llms).not.toContain("/cities/hidden");
  });

  it("states the read-and-cite, no-training policy", () => {
    expect(llms).toContain("read and cite");
    expect(llms).toContain("may not be used to train AI models");
  });
});

// Mirrors the required-field checks in Lighthouse's ARD conformance port
// (third-party/ard/ard.js), so a broken manifest fails here before it fails the audit.
const URN_REGEX = /^urn:air:([a-zA-Z0-9.-]+)(?::([a-zA-Z0-9._:-]+))?:([a-zA-Z0-9._-]+)$/;

describe("buildArdManifest", () => {
  const manifest = buildArdManifest(SITE_URL);

  it("declares specVersion 1.0, which older ARD validators require", () => {
    expect(manifest.specVersion).toBe("1.0");
  });

  it("has at least one entry", () => {
    expect(manifest.entries.length).toBeGreaterThan(0);
  });

  it.each(buildArdManifest(SITE_URL).entries)("entry $identifier meets the ARD required fields", (entry) => {
    expect(entry.identifier).toMatch(URN_REGEX);
    expect(entry.displayName).not.toBe("");
    expect(entry.type).toMatch(/^[\w.+-]+\/[\w.+-]+/);
    expect(entry.url.startsWith(`${SITE_URL}/`)).toBe(true);
    expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
    expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
  });
});

/** The robots.txt groups that apply to a user agent, per RFC 9309: the most specific named group, else `*`. */
function rulesFor(robots: string, userAgent: string): string[] {
  const groups: { agents: string[]; rules: string[] }[] = [];
  let current: { agents: string[]; rules: string[] } | null = null;

  for (const raw of robots.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const [key, ...rest] = line.split(":");
    const field = key.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (field === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (field === "allow" || field === "disallow")) {
      current.rules.push(`${field}: ${value}`);
    }
  }

  const agent = userAgent.toLowerCase();
  const named = groups.find((group) => group.agents.includes(agent));
  return (named ?? groups.find((group) => group.agents.includes("*")))?.rules ?? [];
}

describe("public/robots.txt", () => {
  const robots = readFileSync(join(process.cwd(), "public", "robots.txt"), "utf8");

  it.each(["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent"])(
    "blocks the training crawler %s from the whole site",
    (agent) => {
      expect(rulesFor(robots, agent)).toEqual(["disallow: /"]);
    },
  );

  it.each(["OAI-SearchBot", "ChatGPT-User", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Googlebot"])(
    "lets the assistant or search fetcher %s read public pages but not private ones",
    (agent) => {
      const rules = rulesFor(robots, agent);
      expect(rules).toContain("allow: /");
      expect(rules).toContain("disallow: /owner/");
      expect(rules).toContain("disallow: /account");
    },
  );
});
