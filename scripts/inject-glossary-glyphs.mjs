#!/usr/bin/env node
/**
 * Idempotent injector for category glyphs on glossary term pages.
 *
 * Each term page already carries a category eyebrow:
 *   <span class="eyebrow"><a href="/glossary/#category">Category</a></span>
 *
 * This script reads the category slug from that link, looks up the
 * matching glyph, and injects a 24px line-stroked SVG inside the
 * eyebrow via the .eyebrow--glyph modifier (same vocabulary as the
 * topic + tool injectors).
 *
 * Skips pages already injected. Walks both /glossary/ and
 * /es/glossary/ (~192 pages total).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const dryRun = process.argv.includes("--dry-run");

// Glyph paths — kept in sync with build-og-cards.mjs and
// inject-page-glyphs.mjs. When the registry changes, update all
// three (drift between them would be a smell).
const GLYPHS = {
  speed:        `<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 14 2"/>`,
  trust:        `<path d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"/><polyline points="9 12 11.5 14.5 15.5 10"/>`,
  brand:        `<rect x="4" y="4" width="16" height="16" rx="1"/><line x1="12" y1="4.5" x2="12" y2="19.5"/><line x1="4.5" y1="10" x2="19.5" y2="10"/>`,
  code:         `<polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/><line x1="14" y1="4" x2="10" y2="20"/>`,
  conversions:  `<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="11" x2="18" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/><polyline points="10 19 12 21 14 19"/>`,
  "local-seo":  `<path d="M12 22 C7 16 4 12 4 9 a8 8 0 0 1 16 0 c0 3 -3 7 -8 13 z"/><circle cx="12" cy="9" r="2.5"/>`,
  margin:       `<rect x="3.5" y="3.5" width="6" height="6" rx="0.5"/><rect x="14.5" y="14.5" width="6" height="6" rx="0.5"/><line x1="20" y1="4" x2="4" y2="20"/>`,
  reservations: `<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><rect x="9" y="13" width="4" height="4" fill="currentColor" stroke="none"/>`,
  glossary:     `<path d="M3 6 L12 5 L21 6 L21 19 L12 18 L3 19 Z"/><line x1="12" y1="5" x2="12" y2="18"/><line x1="6" y1="9" x2="9" y2="9"/><line x1="15" y1="9" x2="18" y2="9"/>`,
};

const CATEGORY_GLYPH = {
  "basics":             "glossary",
  "brand-design":       "brand",
  "conversions":        "conversions",
  "data-literacy":      "code",
  "findability":        "local-seo",
  "mobile":             "speed",
  "restaurant-numbers": "margin",
  "subtypes":           "reservations",
  "trust":              "trust",
};

function svg24(glyphKey) {
  const path = GLYPHS[glyphKey];
  if (!path) return "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("eyebrow-glyph")) return "skipped";

  const re = /<span class="eyebrow"><a href="(?:\/es)?\/glossary\/#([^"]+)">([^<]+)<\/a><\/span>/;
  const m = html.match(re);
  if (!m) return "no-eyebrow";
  const categorySlug = m[1];
  const categoryDisplay = m[2];
  const glyphKey = CATEGORY_GLYPH[categorySlug];
  if (!glyphKey) return "no-glyph";

  // Preserve the existing href so the eyebrow remains a category link.
  const href = m[0].match(/href="([^"]+)"/)[1];
  const inject = `<span class="eyebrow-glyph" aria-hidden="true">${svg24(glyphKey)}</span>`;
  const replacement = `<span class="eyebrow eyebrow--glyph"><a href="${href}">${inject}${categoryDisplay}</a></span>`;
  html = html.replace(re, replacement);

  if (!dryRun) fs.writeFileSync(filePath, html, "utf8");
  return "injected";
}

const stats = { injected: 0, skipped: 0, "no-eyebrow": 0, "no-glyph": 0 };

for (const base of [path.join(REPO, "glossary"),
                    path.join(REPO, "es", "glossary")]) {
  if (!fs.existsSync(base)) continue;
  for (const term of fs.readdirSync(base)) {
    const f = path.join(base, term, "index.html");
    if (!fs.existsSync(f)) continue;
    const result = processFile(f);
    stats[result] = (stats[result] || 0) + 1;
  }
}

console.log(`injected:  ${stats.injected}`);
console.log(`skipped:   ${stats.skipped}`);
if (stats["no-eyebrow"]) console.log(`no-eyebrow: ${stats["no-eyebrow"]}`);
if (stats["no-glyph"])   console.log(`no-glyph:   ${stats["no-glyph"]}`);
