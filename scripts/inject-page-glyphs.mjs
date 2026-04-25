#!/usr/bin/env node
/**
 * Idempotent injector for in-page glyphs on topic and tool pages.
 *
 * Topic pages (12: 6 EN + 6 ES) — add a 24px line-stroked glyph
 * inside the hero eyebrow via the .eyebrow--glyph modifier. The
 * glyph signals subject before the H1 takes over.
 *
 * Tool pages (16-20: 8-10 EN + 8-10 ES) — add a 48px glyph block
 * above the hero eyebrow + H1 via .tool-hero-glyph. Tool pages
 * currently start with text-only heros; the glyph gives a one-glance
 * "what is this" cue.
 *
 * Skips pages already injected (looks for class="eyebrow-glyph" or
 * class="tool-hero-glyph"). Run multiple times safely.
 *
 * Usage:
 *   node scripts/inject-page-glyphs.mjs
 *   node scripts/inject-page-glyphs.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const dryRun = process.argv.includes("--dry-run");

// -------------------------------------------------------------
// glyph paths (24-unit grid, mirror of GLYPHS in build-og-cards.mjs)
// -------------------------------------------------------------
const GLYPHS = {
  speed:        `<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 14 2"/>`,
  trust:        `<path d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"/><polyline points="9 12 11.5 14.5 15.5 10"/>`,
  brand:        `<rect x="4" y="4" width="16" height="16" rx="1"/><line x1="12" y1="4.5" x2="12" y2="19.5"/><line x1="4.5" y1="10" x2="19.5" y2="10"/>`,
  code:         `<polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/><line x1="14" y1="4" x2="10" y2="20"/>`,
  audit:        `<rect x="4" y="4" width="16" height="16" rx="1"/><polyline points="8 12 11 15 16 9"/>`,
  conversions:  `<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="11" x2="18" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/><polyline points="10 19 12 21 14 19"/>`,
  "local-seo":  `<path d="M12 22 C7 16 4 12 4 9 a8 8 0 0 1 16 0 c0 3 -3 7 -8 13 z"/><circle cx="12" cy="9" r="2.5"/>`,
  margin:       `<rect x="3.5" y="3.5" width="6" height="6" rx="0.5"/><rect x="14.5" y="14.5" width="6" height="6" rx="0.5"/><line x1="20" y1="4" x2="4" y2="20"/>`,
  reservations: `<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><rect x="9" y="13" width="4" height="4" fill="currentColor" stroke="none"/>`,
  delivery:     `<path d="M5 8 L19 8 L18 21 L6 21 Z"/><path d="M9 8 V5.5 a3 3 0 0 1 6 0 V8"/><line x1="6" y1="11" x2="18" y2="11"/>`,
  reviews:      `<polyline points="6 4 4 4 4 20 6 20"/><polyline points="18 4 20 4 20 20 18 20"/><polygon points="12 7 13.5 10.5 17 10.8 14.3 13.2 15.2 16.7 12 14.8 8.8 16.7 9.7 13.2 7 10.8 10.5 10.5"/>`,
  glossary:     `<path d="M3 6 L12 5 L21 6 L21 19 L12 18 L3 19 Z"/><line x1="12" y1="5" x2="12" y2="18"/><line x1="6" y1="9" x2="9" y2="9"/><line x1="15" y1="9" x2="18" y2="9"/>`,
  resources:    `<rect x="5" y="5" width="14" height="16" rx="1.5"/><rect x="9" y="3" width="6" height="3.5" rx="0.5"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="15.5" x2="16" y2="15.5"/>`,
  research:     `<circle cx="12" cy="12" r="8"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>`,
};

// -------------------------------------------------------------
// page → glyph mapping
// -------------------------------------------------------------

const TOPIC_GLYPH = {
  "speed-mobile":      "speed",
  "conversions":       "conversions",
  "local-seo":         "local-seo",
  "operations-margin": "margin",
  "trust-reviews":     "trust",
  "brand-design":      "brand",
};

const TOOL_GLYPH = {
  "mobile-check":  "speed",
  "schema-check":  "code",
  "speed-test":    "speed",
  "tech-stack":    "code",
  "gbp-grader":    "local-seo",
  "compare":       "brand",
  "search-ideas":  "local-seo",
  "seo-grader":    "local-seo",
  "margin-math":   "margin",
  "brand-suite":   "brand",
  "audits":        "audit",
};

// -------------------------------------------------------------
// helpers
// -------------------------------------------------------------

function svg24(glyphKey, opts = {}) {
  const path = GLYPHS[glyphKey];
  if (!path) return "";
  const attrs = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  return `<svg ${attrs}>${path}</svg>`;
}

// -------------------------------------------------------------
// topic page injection
// -------------------------------------------------------------

function injectTopic({ filePath, glyphKey }) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("eyebrow-glyph")) return "skipped";  // already injected

  const eyebrowSvg = svg24(glyphKey);
  const inject = `<span class="eyebrow-glyph" aria-hidden="true">${eyebrowSvg}</span>`;

  // Topic hero: find the first <span class="eyebrow">Topic</span>
  // (or any short eyebrow text) inside .hero-center. Replace with
  // the modifier class + leading glyph.
  const re = /<span class="eyebrow">([^<]+)<\/span>/;
  const m = html.match(re);
  if (!m) return "no-eyebrow";

  const replacement = `<span class="eyebrow eyebrow--glyph">${inject}${m[1]}</span>`;
  html = html.replace(re, replacement);

  if (!dryRun) fs.writeFileSync(filePath, html, "utf8");
  return "injected";
}

// -------------------------------------------------------------
// tool page injection
// -------------------------------------------------------------

function injectTool({ filePath, glyphKey }) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("tool-hero-glyph")) return "skipped";

  const heroSvg = svg24(glyphKey);
  const block = `<div class="tool-hero-glyph" aria-hidden="true">${heroSvg}</div>`;

  // Inject before the first <span class="eyebrow"> in the page.
  // Tool heros all start with the eyebrow line, so this lands the
  // glyph as a centered block above it without breaking layout.
  const re = /(<span class="eyebrow">)/;
  if (!re.test(html)) return "no-eyebrow";
  html = html.replace(re, `${block}\n      $1`);

  if (!dryRun) fs.writeFileSync(filePath, html, "utf8");
  return "injected";
}

// -------------------------------------------------------------
// run
// -------------------------------------------------------------

const stats = { topic: { injected: 0, skipped: 0, miss: 0 },
                tool:  { injected: 0, skipped: 0, miss: 0 } };

function tally(kind, result) {
  if (result === "injected") stats[kind].injected++;
  else if (result === "skipped") stats[kind].skipped++;
  else stats[kind].miss++;
}

// Topic pages: /learn/topics/<slug>/index.html and ES mirror.
for (const base of [path.join(REPO, "learn", "topics"),
                    path.join(REPO, "es", "learn", "topics")]) {
  if (!fs.existsSync(base)) continue;
  for (const slug of Object.keys(TOPIC_GLYPH)) {
    const f = path.join(base, slug, "index.html");
    if (!fs.existsSync(f)) continue;
    const result = injectTopic({ filePath: f, glyphKey: TOPIC_GLYPH[slug] });
    tally("topic", result);
    console.log(`  topic ${slug.padEnd(20)} ${result}`);
  }
}

// Tool pages: /tools/<slug>/index.html and ES mirror.
for (const base of [path.join(REPO, "tools"),
                    path.join(REPO, "es", "tools")]) {
  if (!fs.existsSync(base)) continue;
  for (const slug of Object.keys(TOOL_GLYPH)) {
    const f = path.join(base, slug, "index.html");
    if (!fs.existsSync(f)) continue;
    const result = injectTool({ filePath: f, glyphKey: TOOL_GLYPH[slug] });
    tally("tool", result);
    console.log(`  tool  ${slug.padEnd(20)} ${result}`);
  }
}

console.log(`\ntopic: ${stats.topic.injected} injected, ${stats.topic.skipped} already done, ${stats.topic.miss} eyebrow-not-found`);
console.log(`tool:  ${stats.tool.injected} injected, ${stats.tool.skipped} already done, ${stats.tool.miss} eyebrow-not-found`);
