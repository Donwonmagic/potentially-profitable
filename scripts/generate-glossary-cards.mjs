#!/usr/bin/env node
/**
 * Generates manifest entries for every glossary term page (97 EN +
 * 97 ES) and writes them into brand/og/cards.json. Reuses the
 * `research` template (cream bg) so no new template is needed.
 *
 * For each term, harvests:
 *   - Category slug + display name from the eyebrow link
 *   - Term name from <h1 class="term-h1">
 *   - Definition's first sentence from <p class="term-def">
 *
 * Mapping: category → { glyph, accent }. Same family rule as the
 * rest of the manifest (conversions=rust, mobile=teal+speed,
 * brand=teal+brand, restaurant-numbers=gold+margin, etc.).
 *
 * Idempotent: re-runs only add entries for slugs not already in the
 * manifest. Existing entries are not touched, so hand-editing
 * specific term cards is safe.
 *
 * Usage:
 *   node scripts/generate-glossary-cards.mjs
 *   node scripts/generate-glossary-cards.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");
const CARDS = path.join(REPO, "brand", "og", "cards.json");

const dryRun = process.argv.includes("--dry-run");

// -------------------------------------------------------------
// category → glyph + accent map
// -------------------------------------------------------------
//
// Accent ranges are chosen so the term's category is legible at a
// glance. Cream cards rule out a pure cream accent (invisible on
// cream bg), so brand-design uses teal not cream here.
const CATEGORY = {
  "basics":             { glyph: "glossary",     accent: "teal" },
  "brand-design":       { glyph: "brand",        accent: "teal" },
  "conversions":        { glyph: "conversions",  accent: "rust" },
  "data-literacy":      { glyph: "code",         accent: "teal" },
  "findability":        { glyph: "local-seo",    accent: "teal" },
  "mobile":             { glyph: "speed",        accent: "teal" },
  "restaurant-numbers": { glyph: "margin",       accent: "gold" },
  "subtypes":           { glyph: "reservations", accent: "rust" },
  "trust":              { glyph: "trust",        accent: "teal" },
};

// -------------------------------------------------------------
// helpers
// -------------------------------------------------------------

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** First sentence: text up to (and including) the first . ! or ?. */
function firstSentence(s) {
  const m = s.match(/^([^.!?]+[.!?])/);
  return (m ? m[1] : s).trim();
}

/** Truncate a definition to fit the dek (~110 chars), break on word. */
function fitDek(s, max = 110) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

/**
 * Pick the visually best title break for a term name. The research
 * template renders three lines: title_1, title_italic, title_2.
 * Strategy:
 *   - 1 word  → italic word, no t1/t2.
 *   - 2 words → t1 = first, italic = second.
 *   - 3 words → t1 = first, italic = second, t2 = third.
 *   - 4+ words → t1 = first 2 words, italic = third, t2 = rest.
 * The italic line carries the term's most distinctive word.
 */
function splitTitle(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return { title_1: "", title_italic: words[0], title_2: "" };
  if (words.length === 2) return { title_1: words[0], title_italic: words[1], title_2: "" };
  if (words.length === 3) return { title_1: words[0], title_italic: words[1], title_2: words[2] };
  // 4+ words: first 2 / 3rd italic / rest
  return {
    title_1: words.slice(0, 2).join(" "),
    title_italic: words[2],
    title_2: words.slice(3).join(" "),
  };
}

/** Extract metadata from a single glossary term HTML file. */
function readTerm(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const eyebrowMatch = html.match(
    /<span class="eyebrow"><a href="(?:\/es)?\/glossary\/#([^"]+)">([^<]+)<\/a><\/span>/
  );
  const h1Match = html.match(/<h1 class="term-h1">([^<]+)<\/h1>/);
  const defMatch = html.match(/<p class="term-def">([\s\S]*?)<\/p>/);
  if (!eyebrowMatch || !h1Match || !defMatch) return null;
  return {
    categorySlug: eyebrowMatch[1],
    categoryName: decodeHtmlEntities(eyebrowMatch[2]),
    name:         decodeHtmlEntities(h1Match[1]).trim(),
    definition:   decodeHtmlEntities(defMatch[1]
                    .replace(/<[^>]+>/g, "")
                    .replace(/\s+/g, " "))
                    .trim(),
  };
}

/** Build a manifest entry from a term + locale. */
function buildEntry({ term, slug, locale }) {
  const cat = CATEGORY[term.categorySlug];
  if (!cat) {
    console.warn(`  ! unknown category for ${slug}: ${term.categorySlug}`);
    return null;
  }
  const { title_1, title_italic, title_2 } = splitTitle(term.name);
  const dek = fitDek(firstSentence(term.definition));
  return {
    slug,
    kind: "research",
    locale,
    accent: cat.accent,
    glyph: cat.glyph,
    eyebrow: term.categoryName.toUpperCase(),
    title_1,
    title_italic,
    title_2,
    dek,
    // No focus module: the term card's whole point is the definition.
    // The dek + cream + glyph is the editorial unit. Adding stat/list
    // would just compete for attention.
  };
}

// -------------------------------------------------------------
// main
// -------------------------------------------------------------

const manifest = JSON.parse(fs.readFileSync(CARDS, "utf8"));
const existingSlugs = new Set(manifest.cards.map((c) => c.slug));

const sources = [
  { dir: path.join(REPO, "glossary"),    locale: "en", slugSuffix: "" },
  { dir: path.join(REPO, "es", "glossary"), locale: "es", slugSuffix: "-es" },
];

let generated = 0;
let skipped = 0;
let unparseable = 0;

for (const src of sources) {
  if (!fs.existsSync(src.dir)) continue;
  const dirs = fs.readdirSync(src.dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const termDir of dirs) {
    const htmlPath = path.join(src.dir, termDir, "index.html");
    if (!fs.existsSync(htmlPath)) continue;

    const term = readTerm(htmlPath);
    if (!term) {
      unparseable++;
      continue;
    }

    // Slug: term-<dirname> + -es for Spanish.
    const slug = `term-${termDir}${src.slugSuffix}`;
    if (existingSlugs.has(slug)) {
      skipped++;
      continue;
    }

    const entry = buildEntry({ term, slug, locale: src.locale });
    if (!entry) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  · ${slug}  [${entry.accent} ${entry.glyph}]  ${entry.title_1} ${entry.title_italic} ${entry.title_2}`);
    } else {
      manifest.cards.push(entry);
    }
    existingSlugs.add(slug);
    generated++;
  }
}

if (!dryRun) {
  fs.writeFileSync(CARDS, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

console.log(`\ngenerated:   ${generated}`);
console.log(`skipped:     ${skipped}`);
console.log(`unparseable: ${unparseable}`);
console.log(`total cards: ${manifest.cards.length + (dryRun ? generated : 0)}`);
