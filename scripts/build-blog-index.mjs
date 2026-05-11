#!/usr/bin/env node
/**
 * Rebuild the post-card list in /blog/index.html and /es/blog/index.html
 * from data/library-tags.json + data/i18n-slug-map.json.
 *
 * Sort order
 * ----------
 * Most-recent-first by the actual `<meta property="article:published_time">`
 * stamped on each blog post's HTML. Reading from the HTML (not the date
 * field in library-tags.json) lets within-day ordering reflect the real
 * publish moment — so a batch where the overview piece is dated
 * 9:30am sorts above sub-articles at 9:00am even though they share a
 * YYYY-MM-DD date.
 *
 * Card structure (mirrors what the index already used):
 *   <a href="/blog/<slug>/" class="post-card">
 *     <div class="meta">
 *       <span class="date">MMM D, YYYY</span>
 *       <span>X min read</span>
 *     </div>
 *     <div>
 *       <h3>Title.</h3>
 *       <p>Dek.</p>
 *     </div>
 *   </a>
 *
 * ES cards pull title + dek from the article's own ES HTML (since
 * library-tags.json only carries EN copy). Dates render in Spanish
 * abbreviation (ene, feb, mar, abr…).
 *
 * Idempotent: re-running with no library-tags changes is a no-op.
 *
 * Usage:
 *   node scripts/build-blog-index.mjs
 *   node scripts/build-blog-index.mjs --check    # exit 1 if cards would change
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const tags = JSON.parse(fs.readFileSync(path.join(REPO, 'data/library-tags.json'), 'utf8'));
const slugMap = JSON.parse(fs.readFileSync(path.join(REPO, 'data/i18n-slug-map.json'), 'utf8'));
const enToEs = slugMap.blog || {};

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function readPublishedTime(slug) {
  const p = path.join(REPO, 'blog', slug, 'index.html');
  if (!fs.existsSync(p)) return '1970-01-01T00:00:00-04:00';
  const m = fs.readFileSync(p, 'utf8').match(/<meta property="article:published_time" content="([^"]+)"/);
  return m ? m[1] : '1970-01-01T00:00:00-04:00';
}

function fmtDateEN(iso) {
  const [y, m, d] = iso.split('-');
  return `${MONTHS_EN[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function fmtDateES(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d, 10)} ${MONTHS_ES[parseInt(m, 10) - 1]} ${y}`;
}

function normalizeTitle(t) {
  t = t.trim();
  if (!/[.!?]$/.test(t)) t += '.';
  // Lowercase post-colon clause to match brand voice on cards
  const colonIdx = t.indexOf(': ');
  if (colonIdx >= 0) {
    const head = t.slice(0, colonIdx + 2);
    const tail = t.slice(colonIdx + 2);
    if (tail) t = head + tail[0].toLowerCase() + tail.slice(1);
  }
  return t;
}

function buildENCard(slug, entry) {
  const date = entry.date;
  if (!date) return '';
  const title = normalizeTitle(entry.title);
  const dek = String(entry.dek || '').replace(/ — /g, ' &mdash; ').replace(/—/g, '&mdash;');
  return `      <a href="/blog/${slug}/" class="post-card">
        <div class="meta">
          <span class="date">${fmtDateEN(date)}</span>
          <span>${entry.read_min} min read</span>
        </div>
        <div>
          <h3>${title}</h3>
          <p>${dek}</p>
        </div>
      </a>`;
}

function buildESCard(enSlug, entry) {
  const date = entry.date;
  if (!date) return '';
  const esSlug = enToEs[enSlug] || enSlug;  // ES-original keeps slug
  const esFile = path.join(REPO, 'es/blog', esSlug, 'index.html');
  if (!fs.existsSync(esFile)) {
    console.warn(`  ! missing ES file for slug ${enSlug} → ${esSlug}`);
    return '';
  }
  const src = fs.readFileSync(esFile, 'utf8');
  const titleMatch = src.match(/<title>([^<]+)<\/title>/);
  let title = titleMatch ? titleMatch[1].split(' | ')[0].trim() : entry.title;
  const dekMatch = src.match(/<meta name="description" content="([^"]+)"/);
  let dek = dekMatch ? dekMatch[1] : entry.dek;
  if (dek.length > 280) {
    const cut = dek.slice(0, 280);
    dek = cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  title = normalizeTitle(title);
  return `      <a href="/es/blog/${esSlug}/" class="post-card">
        <div class="meta">
          <span class="date">${fmtDateES(date)}</span>
          <span>${entry.read_min} min de lectura</span>
        </div>
        <div>
          <h3>${title}</h3>
          <p>${dek}</p>
        </div>
      </a>`;
}

const sorted = Object.entries(tags.blog_posts || {}).sort((a, b) => {
  const ta = readPublishedTime(a[0]);
  const tb = readPublishedTime(b[0]);
  return tb.localeCompare(ta);  // descending
});

const POST_LIST_RE = /(<div class="post-list">)([\s\S]*?)(    <\/div>\s*\n  <\/div>\s*\n<\/section>)/;

function patch(filePath, newCards) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!POST_LIST_RE.test(src)) {
    console.warn(`  ! no <div class="post-list"> found in ${path.relative(REPO, filePath)}`);
    return false;
  }
  const newInner = `\n${newCards}\n    `;
  const next = src.replace(POST_LIST_RE, (_, open, _inner, close) => open + newInner + close);
  if (next === src) return false;
  if (checkOnly) return true;
  fs.writeFileSync(filePath, next);
  return true;
}

const enCards = sorted.map(([slug, entry]) => buildENCard(slug, entry)).filter(Boolean).join('\n');
const esCards = sorted.map(([slug, entry]) => buildESCard(slug, entry)).filter(Boolean).join('\n');

let drift = 0;
if (patch(path.join(REPO, 'blog/index.html'), enCards)) {
  drift++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: blog/index.html (${sorted.length} cards, date-descending)`);
}
if (patch(path.join(REPO, 'es/blog/index.html'), esCards)) {
  drift++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: es/blog/index.html (${sorted.length} cards, date-descending)`);
}

if (checkOnly && drift > 0) process.exit(1);
console.log(`build-blog-index: ${drift} file(s) ${checkOnly ? 'would update' : 'updated'}.`);
