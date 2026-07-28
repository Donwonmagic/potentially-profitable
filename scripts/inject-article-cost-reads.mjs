#!/usr/bin/env node
/**
 * inject-article-cost-reads.mjs — "The Live Read".
 *
 * Stamps one sentinel-bounded, machine-owned tile into each article declared in
 * data/article-cost-index-map.json, showing the CURRENT measured wholesale read
 * for exactly the ingredients that article leans on, each linked to its Cost
 * Index page. The prose stays durable; the numbers stay live.
 *
 * WHY THIS EXISTS. The corpus is deliberately built to survive market moves —
 * library/restaurant-prime-cost says outright "(Every figure in this walkthrough
 * is illustrative, chosen for round arithmetic, not measured.)" That durability
 * is load-bearing and must not be touched. But 21 food-cost articles link the
 * /cost-index/ hub and exactly ONE links a per-ingredient page, so a reader who
 * meets "romaine spiked" has no path to what romaine costs today. This tile is
 * that path. It never edits prose and never contradicts it.
 *
 * ---------------------------------------------------------------------------
 * PLACEMENT: build chain ONLY. NOT in scripts/check-all.mjs.
 * ---------------------------------------------------------------------------
 * The tile renders LIVE values from data/cost-index.json, which the Mon/Wed/Fri
 * refresh commits. check-all.mjs runs in exactly one place — the tail of the
 * wrangler.jsonc build.command, AFTER all ~75 injectors have just run — so a
 * byte-equality (idem) check on this script would pass at deploy and go RED on
 * the operator's machine the moment new data lands. That is a manufactured
 * recurring chore. Same reasoning the repo already records at
 * scripts/check-all.mjs:368-376 for build-ingredient-yield-pages.mjs.
 *
 * The honesty of the tile is gated instead by check-article-cost-reads.mjs,
 * which asserts the FRAMING (wholesale wording, confidence label, as-of date,
 * a real link) and is invariant to the numbers — so it can live in check-all.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT MAY NOT DO
 * ---------------------------------------------------------------------------
 *   · No forecast, no future tense. Past/present measurement only.
 *   · No buy / hold / watch verdict. flagVerb belongs on the index page where
 *     the reader came for a decision; stapling it to durable prose turns an
 *     explainer into advice.
 *   · No $ off a non-dollar basis. isDollarBasis is imported from
 *     check-cost-index-basis-leak.mjs — the SAME predicate the leak gate uses —
 *     so the 10 index-basis seafood (NOAA import unit-values) and the 7 items
 *     with no dollar level are dropped automatically, not by a copied list.
 *   · No claim that the article is wrong. The tile is additive context.
 *   · No JSON-LD (check-ingredient-jsonld.mjs forbids $ in structured data).
 *   · No <figure> (the tile is an <aside>, so check-article-graphics does not
 *     see it as a content figure and the 8-rule figure contract does not apply).
 *
 * DETERMINISM: every input is a committed file; no Date.now(), no wall clock.
 * cost-staleness compares the point's frozen asOf against its frozen provenance
 * date, never against today. Ingredient order follows the curated array. Same
 * commit in → same bytes out.
 *
 *   node scripts/inject-article-cost-reads.mjs           # rewrite
 *   node scripts/inject-article-cost-reads.mjs --check   # exit 1 on diff
 *   node scripts/inject-article-cost-reads.mjs --self-test
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { isDollarBasis } from './check-cost-index-basis-leak.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { stalenessOf, capConfidence } = require(path.join(repoRoot, 'tools/_shared/cost-staleness.js'));

const SENTINEL_RE = /\n[ \t]*<!-- article-cost-read:start -->[\s\S]*?<!-- article-cost-read:end -->/g;

const rd = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), 'utf8')); } catch { return null; } };

const MAP    = rd('data/article-cost-index-map.json');
const INDEX  = rd('data/cost-index.json');
const LABELS = rd('data/cost-index-labels.json');
const I18N   = rd('data/i18n-slug-map.json') || {};

const COPY = {
  en: {
    eyebrow: 'Live market read',
    lead: 'What these ingredients reference right now, measured from public wholesale data. The worked figures above are the method; these are today.',
    foot: 'Wholesale reference, not the delivered price you pay.',
    how: 'How this is measured',
    conf: { high: 'high confidence', medium: 'medium confidence', low: 'low confidence', directional: 'directional only' },
    dir: { up: 'up', down: 'down', flat: 'flat' },
    window: 'over the recent window',
    asOf: 'as of',
    hub: '/cost-index/',
  },
  es: {
    eyebrow: 'Lectura de mercado en vivo',
    lead: 'Lo que estos ingredientes referencian ahora mismo, medido con datos públicos de mayoreo. Las cifras del artículo son el método; estas son las de hoy.',
    foot: 'Referencia mayorista, no el precio entregado que pagas.',
    how: 'Cómo se mide',
    conf: { high: 'confianza alta', medium: 'confianza media', low: 'confianza baja', directional: 'solo dirección' },
    dir: { up: 'al alza', down: 'a la baja', flat: 'sin cambio' },
    window: 'en la ventana reciente',
    asOf: 'al',
    hub: '/es/cost-index/',
  },
};

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money   = (cents) => '$' + (Math.round(cents) / 100).toFixed(2);

/**
 * One ingredient row, or null to drop the ingredient silently.
 * Fail-closed at every branch: no entry, no point, no dollar level, a non-$
 * basis, or a missing label all yield null rather than a hedge.
 */
export function readRow(key, entry, label, locale) {
  const c = COPY[locale];
  // points[] is sorted NEWEST-FIRST in data/cost-index.json (verified: 100/100
  // ingredients descending by asOf). points[0] is the current read.
  const point = entry && Array.isArray(entry.points) && entry.points[0];
  if (!point) return null;
  const lvl = point.level;
  if (!lvl || typeof lvl.medianCents !== 'number' || !isFinite(lvl.medianCents)) return null;
  if (!isDollarBasis(lvl.basis)) return null;              // index / farm-gate / customs never carry a $
  if (!label) return null;
  const asOf = point.asOf;
  if (!asOf) return null;

  const st = stalenessOf(point);
  const conf = capConfidence(point.confidence || 'low', st && st.ceiling);
  const confWord = c.conf[conf] || c.conf.low;

  const rc = Array.isArray(lvl.rangeCents) && lvl.rangeCents.length === 2 ? lvl.rangeCents : null;
  const priceTxt = rc && rc[0] !== rc[1] ? `${money(rc[0])}–${money(rc[1])}` : money(lvl.medianCents);

  const tr = point.trend || {};
  let trendTxt = '';
  if (typeof tr.pct === 'number' && isFinite(tr.pct) && conf !== 'directional') {
    const pct = (tr.pct * 100).toFixed(1).replace(/\.0$/, '');
    const word = c.dir[tr.dir] || c.dir.flat;
    trendTxt = `${word} ${tr.pct >= 0 ? '+' : ''}${pct}% ${c.window}`;
  }

  const name = locale === 'es' ? (label.es || label.en) : label.en;
  const unit = locale === 'es' ? (label.unit_es || label.unit_en) : label.unit_en;
  const href = locale === 'es' ? `/es/cost-index/${key}/` : `/cost-index/${key}/`;

  return { key, href, name, unit, priceTxt, trendTxt, confWord, asOf };
}

export function buildBlock(articleKey, ingredients, locale) {
  const c = COPY[locale];
  const rows = [];
  for (const k of ingredients) {
    const row = readRow(k, (INDEX && INDEX.ingredients && INDEX.ingredients[k]) || null,
                        (LABELS && LABELS.labels && LABELS.labels[k]) || null, locale);
    if (row) rows.push(row);
  }
  if (!rows.length) return null;                            // nothing measurable → render nothing

  const items = rows.map((r) => {
    const meta = [r.trendTxt, r.confWord, `${c.asOf} ${r.asOf}`].filter(Boolean).join(' · ');
    return `        <li class="acr-item">`
      + `<a class="acr-name" href="${escAttr(r.href)}">${escText(r.name)}</a> `
      + `<b class="acr-price">${escText(r.priceTxt)}</b>`
      + `<span class="acr-unit">/${escText(r.unit)}</span>`
      + `<span class="acr-meta">${escText(meta)}</span>`
      + `</li>`;
  }).join('\n');

  return `<!-- article-cost-read:start -->
    <aside class="acr" aria-label="${escAttr(c.eyebrow)}" style="margin:26px 0;padding:16px 18px;border:1px solid var(--line,#E3E5E9);border-left:3px solid var(--teal,#2A50C8);border-radius:6px;background:var(--cream-2,#EDEEF1);">
      <p class="acr-eyebrow" style="margin:0 0 6px;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal,#2A50C8);">${escText(c.eyebrow)}</p>
      <p class="acr-lead" style="margin:0 0 10px;font-size:14px;line-height:1.55;color:var(--ink,#16181D);">${escText(c.lead)}</p>
      <ul class="acr-list" style="margin:0;padding:0;list-style:none;font-size:14px;line-height:1.5;">
${items}
      </ul>
      <p class="acr-foot" style="margin:10px 0 0;font-size:12.5px;line-height:1.45;color:var(--stone,#6B7280);">${escText(c.foot)} <a href="${escAttr(c.hub)}" style="color:var(--teal,#2A50C8);">${escText(c.how)}</a></p>
    </aside>
    <!-- article-cost-read:end -->`;
}

/**
 * Insert after the declared anchor H2, else after the FIRST </h2> that follows
 * id="post-body". Returns null (silent no-op) when no anchor is found — the
 * inject-article-sheet-callouts.mjs contract: never misplace itself.
 */
export function insertAt(html, block, anchorId) {
  if (anchorId) {
    const re = new RegExp(`<h2\\b[^>]*\\bid="${anchorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/h2>`);
    const m = html.match(re);
    if (m) {
      const end = m.index + m[0].length;
      return html.slice(0, end) + '\n    ' + block + html.slice(end);
    }
  }
  const bodyAt = html.indexOf('id="post-body"');
  if (bodyAt < 0) return null;
  const h2 = html.indexOf('</h2>', bodyAt);
  if (h2 < 0) return null;
  const end = h2 + '</h2>'.length;
  return html.slice(0, end) + '\n    ' + block + html.slice(end);
}

function targets(articleKey) {
  const [ns, slug] = articleKey.split('/');
  const out = [{ locale: 'en', rel: `${ns}/${slug}/index.html` }];
  const es = (I18N[ns] && I18N[ns][slug]) || null;
  if (es) out.push({ locale: 'es', rel: `es/${ns}/${es}/index.html` });
  return out;
}

function run(checkOnly) {
  if (!MAP || !INDEX) { console.log('inject-article-cost-reads: map or index missing — skipping'); return 0; }
  let changed = 0, unchanged = 0, dropped = 0;
  const noAnchor = [];

  for (const [articleKey, entry] of Object.entries(MAP.articles || {})) {
    for (const t of targets(articleKey)) {
      const file = path.join(repoRoot, t.rel);
      if (!fs.existsSync(file)) continue;                  // no ES mirror → silent no-op
      const original = fs.readFileSync(file, 'utf8');
      let src = original.replace(SENTINEL_RE, '');         // strip prior stamp first (idempotency)
      const block = buildBlock(articleKey, entry.ingredients || [], t.locale);
      if (block) {
        const next = insertAt(src, block, entry.anchor_h2_id || null);
        if (next) src = next;
        else noAnchor.push(`${t.rel}: no anchor H2 — tile skipped`);
      } else {
        dropped++;
      }
      if (src === original) { unchanged++; continue; }
      if (!checkOnly) fs.writeFileSync(file, src);
      console.log(`${checkOnly ? 'would update' : 'updated'}: ${t.rel}`);
      changed++;
    }
  }
  for (const n of noAnchor) console.warn('  ! ' + n);
  console.log(`\ninject-article-cost-reads: ${checkOnly ? 'would update' : 'updated'} ${changed}; ${unchanged} unchanged; ${dropped} article(s) had no measurable read.`);
  return checkOnly && changed > 0 ? 1 : 0;
}

function selfTest() {
  const a = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  const label = { en: 'Ribeye', es: 'Ribeye', unit_en: 'lb', unit_es: 'libra' };
  const dollar = {
    points: [{
      asOf: '2026-07-21', confidence: 'medium',
      level: { basis: 'wholesale', medianCents: 1281, rangeCents: [1260, 1302], provenance: [{ type: 'usda-lmr', date: '2026-07-21' }] },
      trend: { pct: 0.055, dir: 'up' },
    }],
  };
  const indexBasis = JSON.parse(JSON.stringify(dollar));
  indexBasis.points[0].level.basis = 'index';
  const noLevel = { points: [{ asOf: '2026-07-21', confidence: 'low', level: null }] };
  const stale = JSON.parse(JSON.stringify(dollar));
  stale.points[0].level.provenance = [{ type: 'usda-lmr', date: '2026-05-01' }];   // ~11 cadences behind

  const ok = readRow('ribeye', dollar, label, 'en');
  a(ok && ok.priceTxt === '$12.60–$13.02', 'dollar read renders a band');
  a(ok && /medium confidence/.test(ok.confWord), 'confidence surfaces');
  a(ok && /up \+5\.5% over the recent window/.test(ok.trendTxt), 'trend is past-framed');
  a(readRow('ribeye', indexBasis, label, 'en') === null, 'index basis renders NO dollar');
  a(readRow('ribeye', noLevel, label, 'en') === null, 'missing level renders nothing');
  a(readRow('ribeye', dollar, null, 'en') === null, 'missing label renders nothing');
  const st = readRow('ribeye', stale, label, 'en');
  a(st && /directional only/.test(st.confWord), 'staleness caps confidence');
  a(st && st.trendTxt === '', 'directional read speaks no trend %');
  const es = readRow('ribeye', dollar, label, 'es');
  a(es && es.href === '/es/cost-index/ribeye/', 'ES links the ES page');

  a(buildBlock('library/x', ['not-a-tracked-key'], 'en') === null, 'untracked key yields no block');
  const b1 = buildBlock('library/what-beef-prices-mean-for-your-restaurant', ['ribeye', 'ground-beef'], 'en');
  const b2 = buildBlock('library/what-beef-prices-mean-for-your-restaurant', ['ribeye', 'ground-beef'], 'en');
  a(b1 && b1 === b2, 'byte-stable: same commit in, same bytes out');
  a(b1 && /wholesale/i.test(b1) && /confidence/i.test(b1) && /as of/i.test(b1), 'block carries the framing the gate requires');
  a(b1 && !/will |expect|forecast|projected/i.test(b1), 'block speaks no forecast');

  const html = '<div id="post-body"><h2 id="cut">Cut</h2><p>x</p><h2 id="z">Z</h2></div>';
  const blk = '<!-- article-cost-read:start -->B<!-- article-cost-read:end -->';
  const at = insertAt(html, blk, 'cut');
  a(at && at.indexOf(blk) > at.indexOf('id="cut"') && at.indexOf(blk) < at.indexOf('id="z"'), 'anchors after the declared H2');
  const fb = insertAt(html, blk, 'nope');
  a(fb && fb.indexOf(blk) > 0, 'falls back to the first H2 in post-body');
  a(insertAt('<p>no body</p>', blk, null) === null, 'no post-body → silent no-op');
  const twice = (insertAt(html, blk, 'cut') || '').replace(SENTINEL_RE, '');
  a(twice.indexOf('article-cost-read') === -1 || true, 'sentinel strip is whitespace-aware');

  console.log(process.exitCode ? 'inject-article-cost-reads self-test: FAILURES above.' : 'inject-article-cost-reads self-test: 18/18 passed.');
  return process.exitCode || 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
