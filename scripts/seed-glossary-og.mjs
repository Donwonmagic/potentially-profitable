#!/usr/bin/env node
/**
 * Sprint 17 (Cohesion) — seed per-glossary-term OG card manifest entries.
 *
 * Walks /glossary/<slug>/index.html and /es/glossary/<slug>/ and
 * extracts the data already on each page (term name, AKA, topic,
 * first sentence of the definition). Emits manifest entries into
 * brand/og/cards.json under the "glossary" kind so
 * scripts/build-og-cards.mjs can render SVG+PNG for each.
 *
 * Idempotent: re-running on an already-seeded manifest replaces
 * existing glossary-* entries rather than duplicating them.
 *
 * Usage:
 *   node scripts/seed-glossary-og.mjs           # write
 *   node scripts/seed-glossary-og.mjs --check   # exit 1 if manifest would change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

// Category pages live under /glossary/<category>/ but aren't terms.
const CATEGORY_SLUGS = new Set([
  'basics', 'brand-design', 'conversions', 'data-literacy',
  'findability', 'mobile', 'restaurant-numbers', 'subtypes', 'trust',
]);

// Topic URL → accent color and glyph cue. Mirrors the per-accent
// rule already in brand/og/cards.json's _comment.
const TOPIC_ACCENT = {
  'speed-mobile':      'teal',
  'local-seo':         'teal',
  'conversions':       'rust',
  'operations-margin': 'gold',
  'brand-design':      'teal',
  'trust-reviews':     'rust',
};

// Eyebrow text per topic per locale. Shorter than the topic
// label on the page so the eyebrow stays compact at small sizes.
const TOPIC_EYEBROW = {
  en: {
    'speed-mobile':      'GLOSSARY · SPEED & MOBILE',
    'local-seo':         'GLOSSARY · LOCAL SEO',
    'conversions':       'GLOSSARY · CONVERSIONS',
    'operations-margin': 'GLOSSARY · OPERATIONS & MARGIN',
    'brand-design':      'GLOSSARY · BRAND & DESIGN',
    'trust-reviews':     'GLOSSARY · TRUST & REVIEWS',
  },
  es: {
    'speed-mobile':      'GLOSARIO · VELOCIDAD Y MÓVIL',
    'local-seo':         'GLOSARIO · SEO LOCAL',
    'conversions':       'GLOSARIO · CONVERSIONES',
    'operations-margin': 'GLOSARIO · OPERACIONES Y MARGEN',
    'brand-design':      'GLOSARIO · MARCA Y DISEÑO',
    'trust-reviews':     'GLOSARIO · CONFIANZA Y RESEÑAS',
  },
};

const FALLBACK_EYEBROW = { en: 'GLOSSARY', es: 'GLOSARIO' };

function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&middot;/g, '·')
    .replace(/&iacute;/g, 'í')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á');
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/<[^>]*>/g, '')).trim();
}

function firstSentence(s, maxLen) {
  const text = String(s).trim();
  // Find the first sentence-ending punctuation followed by a space
  // or end-of-string. Be conservative — don't treat "Mr." as a
  // sentence boundary (rare in this corpus).
  const m = text.match(/^[^.!?]*[.!?](?=\s|$)/);
  let pick = m ? m[0] : text;
  if (maxLen && pick.length > maxLen) {
    // Clip at the last word boundary inside the limit.
    const clip = pick.slice(0, maxLen);
    const lastSpace = clip.lastIndexOf(' ');
    pick = (lastSpace > maxLen * 0.6 ? clip.slice(0, lastSpace) : clip) + '…';
  }
  return pick;
}

function extractFromPage(file) {
  const src = fs.readFileSync(file, 'utf8');
  const h1m  = src.match(/<h1\s+class="term-h1"[^>]*>([\s\S]*?)<\/h1>/);
  const akam = src.match(/<p\s+class="term-aka"[^>]*>([\s\S]*?)<\/p>/);
  const defm = src.match(/<p\s+class="term-def"[^>]*>([\s\S]*?)<\/p>/);
  const topicm = src.match(/<a\s+class="term-topic-chip"[^>]*href="\/(?:es\/)?learn\/topics\/([a-z-]+)\//);
  return {
    term:  h1m ? stripHtml(h1m[1]) : '',
    aka:   akam ? stripHtml(akam[1]) : '',
    def:   defm ? stripHtml(defm[1]) : '',
    topic: topicm ? topicm[1] : null,
  };
}

function collectTerms(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (CATEGORY_SLUGS.has(entry.name)) continue;
    if (entry.name === 'sitemap') continue; // /glossary/sitemap/ is a meta page
    const file = path.join(dir, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    out.push({ slug: entry.name, file });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

function buildEntry({ slug, file, locale }) {
  const data = extractFromPage(file);
  if (!data.term) return null;
  const accent  = (data.topic && TOPIC_ACCENT[data.topic]) || 'teal';
  const eyebrow = (data.topic && TOPIC_EYEBROW[locale][data.topic]) || FALLBACK_EYEBROW[locale];
  const dek     = firstSentence(data.def, 180);
  return {
    slug:   `glossary-${slug}${locale === 'es' ? '-es' : ''}`,
    kind:   'glossary',
    locale,
    accent,
    glyph:  'glossary',
    eyebrow,
    title_1:      data.term,
    title_italic: data.aka,
    title_2:      '',
    dek,
  };
}

const enTerms = collectTerms(path.join(repoRoot, 'glossary'));
const esTerms = collectTerms(path.join(repoRoot, 'es', 'glossary'));

const newEntries = [];
for (const { slug, file } of enTerms) {
  const e = buildEntry({ slug, file, locale: 'en' });
  if (e) newEntries.push(e);
}
for (const { slug, file } of esTerms) {
  const e = buildEntry({ slug, file, locale: 'es' });
  if (e) newEntries.push(e);
}

const cardsPath = path.join(repoRoot, 'brand', 'og', 'cards.json');
const manifest  = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const existing  = manifest.cards || [];
// Drop any prior glossary-* entries (idempotent re-seed).
const kept      = existing.filter((c) => !(c.kind === 'glossary'));
const merged    = [...kept, ...newEntries];

const nextJson  = JSON.stringify({ ...manifest, cards: merged }, null, 2) + '\n';
const prevJson  = fs.readFileSync(cardsPath, 'utf8');

if (nextJson === prevJson) {
  console.log(`Glossary OG seed: ${newEntries.length} entries already up to date.`);
  process.exit(0);
}

if (!checkOnly) fs.writeFileSync(cardsPath, nextJson);
console.log(`${checkOnly ? 'would update' : 'updated'}: brand/og/cards.json (${newEntries.length} glossary-* entries)`);

if (checkOnly) process.exit(1);
