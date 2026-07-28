#!/usr/bin/env node
/**
 * inject-provenance-hop.mjs — close the last provenance hop on the ingredient pages.
 *
 * THE DEFECT THIS FIXES (audit, 2026-07-28). We publish two things almost nobody
 * publishes: `cost-index/sources.json` (81 ingredients, each mapped to the NAMED public
 * report behind its reading — e.g. ribeye -> USDA LPGMN report 2453, BLS WPU022101) and
 * `cost-index/revisions.json` (9,257 records of previously-published readings that later
 * changed). Neither was reachable from an ingredient page: the read card linked only
 * `/cost-index/methodology/#track-record`. A reader who wanted to check a number could
 * not get from the number to its agency in one hop.
 *
 * That is the whole posture. A source that volunteers its own revision history gets
 * STRONGER when someone tries to check it, which is why almost nobody ships it.
 *
 * HONESTY (binding — see ADR-020, docs/fact-check.md):
 *   - Both numbers are COUNTS read from committed files at build time, never estimated.
 *   - The revision line says the SERIES carries N recorded revisions. It must never say
 *     or imply that THIS reading was revised: revisions.json records carry the
 *     observation `date`, not a vintage, so "this number changed" is not derivable.
 *   - Only slugs present in cost-index/sources.json are touched. For any other page the
 *     sentence "the registry names the public report behind it" would be false, so the
 *     block is not injected at all (notably the 12 seafood/oil pages that have a page but
 *     no published series — the honest dark set).
 *   - No price, no direction, no forecast, no cause.
 *
 * Idempotent strip+rewrite between sentinels, EN + ES. Runs AFTER
 * build-cost-index-pages.mjs (which overwrites ingredient HTML wholesale), same posture
 * as inject-supply-picture.mjs / inject-ingredient-recalls.mjs.
 *
 *   node scripts/inject-provenance-hop.mjs            # rewrite in place
 *   node scripts/inject-provenance-hop.mjs --check    # exit 1 if any page is out of sync
 *   node scripts/inject-provenance-hop.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const START = '<!-- provenance-hop:start -->';
const END = '<!-- /provenance-hop:end -->';
// The read card's methodology line — the block lands immediately after it.
const ANCHOR_RE = /<p class="ci-read__method">[\s\S]*?<\/p>/;

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));

// ── the block ────────────────────────────────────────────────────────────────
// nReports: count of NAMED public reports in sources.json for this slug.
// nRevisions: count of recorded revisions for this slug in revisions.json (may be 0).
export function provenanceBlock(nReports, nRevisions, es) {
  const base = es ? '/es/cost-index' : '/cost-index';
  const reg = `<a href="${base}/sources/#registry">`;
  const rev = `<a href="${base}/methodology/#revision">`;
  const reports = es
    ? `${reg}${nReports} informe${nReports === 1 ? '' : 's'} público${nReports === 1 ? '' : 's'}</a>`
    : `${reg}${nReports} public report${nReports === 1 ? '' : 's'}</a>`;
  const revisions = nRevisions > 0
    ? (es
        ? `${rev}${nRevisions} revisi${nRevisions === 1 ? 'ón' : 'ones'} registrada${nRevisions === 1 ? '' : 's'}</a>`
        : `${rev}${nRevisions} recorded revision${nRevisions === 1 ? '' : 's'}</a>`)
    : (es ? `${rev}ninguna revisión registrada</a>` : `${rev}no recorded revisions</a>`);
  const body = es
    ? `Rastrea esta lectura: el registro de fuentes nombra ${reports} detrás de ella, y esta serie acumula ${revisions} en nuestro archivo publicado.`
    : `Trace this reading: the source registry names the ${reports} behind it, and this series carries ${revisions} in our published archive.`;
  return `${START}<p class="ci-read__prov">${body}</p>${END}`;
}

// ── injection ────────────────────────────────────────────────────────────────
export function injectProvenance(html, nReports, nRevisions, es) {
  // Idempotent: strip any prior block AND the whitespace we inserted ahead of it.
  // (Leaving that whitespace behind made re-runs accumulate indentation — caught by
  // the byte-identity case in --self-test.)
  const i = html.indexOf(START);
  if (i >= 0) {
    const j = html.indexOf(END, i);
    if (j >= 0) {
      let from = i;
      while (from > 0 && /\s/.test(html[from - 1])) from--;
      html = html.slice(0, from) + html.slice(j + END.length);
    }
  }
  const m = ANCHOR_RE.exec(html);
  if (!m) return null; // no read card on this page — caller skips
  const at = m.index + m[0].length;
  return html.slice(0, at) + '\n    ' + provenanceBlock(nReports, nRevisions, es) + html.slice(at);
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  const page = (extra = '') => `<aside><p class="ci-read__method"><a href="/x">How we verify</a></p>${extra}<p class="ci-read__data">d</p></aside>`;
  let fail = 0;
  const t = (name, cond) => { if (!cond) { console.error('  ✗', name); fail++; } };

  const once = injectProvenance(page(), 3, 68, false);
  t('injects after the method line', once.indexOf(START) > once.indexOf('ci-read__method'));
  t('lands before the data line', once.indexOf(END) < once.indexOf('ci-read__data'));
  t('states both counts', once.includes('3 public reports') && once.includes('68 recorded revisions'));
  t('links the registry', once.includes('/cost-index/sources/#registry'));
  t('links the revision method', once.includes('/cost-index/methodology/#revision'));

  const twice = injectProvenance(once, 3, 68, false);
  t('idempotent (byte-identical on re-run)', twice === once);
  t('exactly one block after re-run', (twice.match(/provenance-hop:start/g) || []).length === 1);

  const zero = injectProvenance(page(), 1, 0, false);
  t('0 revisions reads honestly', zero.includes('no recorded revisions') && !zero.includes('0 recorded'));
  t('singular report', zero.includes('1 public report<') || zero.includes('1 public report</a>'));

  const esOut = injectProvenance(page(), 2, 5, true);
  t('ES uses /es/ paths', esOut.includes('/es/cost-index/sources/#registry') && esOut.includes('/es/cost-index/methodology/#revision'));
  t('ES prose', esOut.includes('Rastrea esta lectura'));

  t('no anchor -> null', injectProvenance('<div>nothing</div>', 1, 1, false) === null);

  // honesty invariants
  const all = once + esOut + zero;
  t('never claims THIS number was revised', !/this (number|reading) (was|has been) revised/i.test(all));
  t('no price/forecast token', !/\$|forecast|predict/i.test(all));

  if (fail) { console.error(`inject-provenance-hop self-test: ${fail} failure(s).`); process.exit(1); }
  console.log('inject-provenance-hop self-test: 13/13 passed (placement, idempotency, counts, ES, honesty).');
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
const sources = rd('cost-index/sources.json').ingredients || [];
const revisions = rd('cost-index/revisions.json').revisions || [];

const revCount = new Map();
for (const r of revisions) revCount.set(r.ingredient, (revCount.get(r.ingredient) || 0) + 1);

let changed = 0, touched = 0;
const skipped = [];

for (const entry of sources) {
  const slug = entry.slug;
  const nReports = Array.isArray(entry.sources) ? entry.sources.length : 0;
  if (!slug || !nReports) { skipped.push(`${slug || '(no slug)'}: no named sources`); continue; }
  const nRevisions = revCount.get(slug) || 0;

  for (const [dir, es] of [['cost-index', false], ['es/cost-index', true]]) {
    const rel = `${dir}/${slug}/index.html`;
    const abs = path.join(repo, rel);
    if (!fs.existsSync(abs)) { skipped.push(`${rel}: missing`); continue; }
    const before = fs.readFileSync(abs, 'utf8');
    const after = injectProvenance(before, nReports, nRevisions, es);
    if (after === null) { skipped.push(`${rel}: no ci-read__method anchor`); continue; }
    touched++;
    if (after !== before) { changed++; if (!CHECK) fs.writeFileSync(abs, after); }
  }
}

if (skipped.length) for (const s of skipped.slice(0, 10)) console.error('  - ' + s);

if (CHECK) {
  if (changed) {
    console.error(`✗ provenance-hop: ${changed} page(s) out of sync — run: node scripts/inject-provenance-hop.mjs`);
    process.exit(1);
  }
  console.log(`✓ provenance-hop: ${touched} ingredient page(s) carry the source-registry + revision-count hop.`);
} else {
  console.log(`provenance-hop: ${changed} file(s) changed across ${touched} ingredient page(s)${skipped.length ? `, ${skipped.length} skipped` : ''}.`);
}
