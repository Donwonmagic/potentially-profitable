#!/usr/bin/env node
/**
 * build-cost-index-embed.mjs — the embeddable wholesale-reference CARD.
 *
 * Frontier idea #3 ("be the embeddable source"): a neutral, self-contained price
 * card an operator can drop on their OWN site, so the Cost Index reaches people
 * who never touch a search page — distribution that survives a Google de-index.
 * The companion machine-readable feed already ships (cost-index/<slug>/series.json);
 * this adds the human-visible half.
 *
 * Design constraints (so an operator trusts pasting it, and we stay on-canon):
 *   - ZERO external requests: inline CSS + inline-SVG sparkline (reuses the shared
 *     sparkline primitive), no fonts, no images, no tracker. It loads instantly on
 *     someone else's page and never phones home from their visitors' browsers.
 *   - noindex: it's an <iframe> fragment, not a content page — it must not compete
 *     in search with the canonical ingredient page, and the sitemap walker (index.html
 *     only) already skips it.
 *   - NO forecast: shows the latest MEASURED wholesale reference + the historical
 *     sparkline, never a predicted price — the methodology promise is untouched.
 *   - Authoritative + drift-free: data comes from the published series.json, so the
 *     card can never disagree with the page that produced the feed.
 *   - Measurement: the visible link carries ?ref=embed, so an engaged embed shows up
 *     as a referral on the destination page (cookieless Plausible), with no tracking
 *     placed on the operator's site.
 *
 * Probe scope: EMBED_SLUGS is deliberately one ingredient (ribeye). Standalone on
 * purpose — it does NOT run the 82-page generator (whose output is an intermediate,
 * pre-sync-includes state), so it touches nothing but the embed files.
 *
 *   node scripts/build-cost-index-embed.mjs            # write the embed cards
 *   node scripts/build-cost-index-embed.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-embed.mjs --self-test
 *   node scripts/build-cost-index-embed.mjs --snippet  # print the paste-in iframe code
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Spark = require(path.join(repo, 'tools/_shared/sparkline.js'));

// Probe: keep this to one ingredient until the embed earns wider rollout.
const EMBED_SLUGS = ['ribeye'];
const ORIGIN = 'https://muntin.digital';
const BRAND = '#2A50C8';                 // same stroke the on-page sparkline uses

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
const LABELS = (rd('data/cost-index-labels.json') || {}).labels || {};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const money = (usd) => '$' + Number(usd).toFixed(2);

// Build one card from the published feed (series.json) — the authoritative source.
function embedHtml(slug, locale) {
  const es = locale === 'es';
  const series = rd(`cost-index/${slug}/series.json`);
  if (!series || !Array.isArray(series.observations) || !series.observations.length) return null;
  const obs = series.observations.filter((o) => typeof o.priceUsd === 'number');
  if (!obs.length) return null;
  const last = obs[obs.length - 1];
  const lab = LABELS[slug] || {};
  const name = es ? (lab.es || series.name || slug) : (lab.en || series.name || slug);
  const unit = es ? (lab.unit_es || series.unit || '') : (lab.unit_en || series.unit || '');
  const base = es ? '/es' : '';
  const href = `${ORIGIN}${base}/cost-index/${slug}/?ref=embed`;
  const vals = obs.map((o) => o.priceUsd);

  const svg = Spark.render(vals, {
    width: 268, height: 48, stroke: BRAND,
    ariaLabel: es ? `Historial de precio de ${name}` : `${name} price history`,
  });

  const t = es ? {
    kicker: 'Referencia mayorista', unitSep: 'por',
    asOf: 'al', wholesale: 'Referencia mayorista de fuentes públicas de EE. UU. No es el precio entregado.',
    via: 'Muntin Cost Index',
  } : {
    kicker: 'Wholesale reference', unitSep: 'per',
    asOf: 'as of', wholesale: 'Wholesale reference from public U.S. sources. Not a delivered price.',
    via: 'Muntin Cost Index',
  };

  // Self-contained: inline CSS, inline SVG, no external requests, noindex.
  return `<!DOCTYPE html>
<html lang="${es ? 'es' : 'en'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(name)} — ${esc(t.kicker)}</title>
<style>
*{box-sizing:border-box;margin:0}
html,body{background:#fff}
.c{font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#16213a;
  width:300px;padding:14px 16px;border:1px solid #e3e7f0;border-radius:12px}
.c .k{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#5b6680;font-weight:600}
.c .n{font-size:16px;font-weight:700;margin:1px 0 6px}
.c .p{font-size:26px;font-weight:700;line-height:1}
.c .u{font-size:13px;font-weight:500;color:#5b6680}
.c .d{font-size:12px;color:#5b6680;margin-top:3px}
.c svg{display:block;margin:8px 0 4px}
.c .src{font-size:11px;color:#5b6680;margin-top:6px}
.c .via{display:inline-block;margin-top:9px;font-size:12px;font-weight:600;color:${BRAND};text-decoration:none}
.c .via:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="c">
  <div class="k">${esc(t.kicker)}</div>
  <div class="n">${esc(name)}</div>
  <div class="p">${money(last.priceUsd)} <span class="u">${esc(t.unitSep)} ${esc(unit)}</span></div>
  <div class="d">${esc(t.asOf)} ${esc(series.asOf || last.date)}</div>
  ${svg}
  <div class="src">${esc(t.wholesale)}</div>
  <a class="via" href="${esc(href)}" target="_blank" rel="noopener">${esc(t.via)} <span aria-hidden="true">&#8599;</span></a>
</div>
</body>
</html>
`;
}

function snippet(slug) {
  const url = `${ORIGIN}/cost-index/${slug}/embed.html`;
  return `<iframe src="${url}" title="Muntin Cost Index — ${slug} wholesale reference" ` +
    `width="332" height="232" loading="lazy" style="border:0;max-width:100%"></iframe>`;
}

function targets() {
  const out = [];
  for (const slug of EMBED_SLUGS) {
    const en = embedHtml(slug, 'en');
    const es = embedHtml(slug, 'es');
    if (en) out.push({ path: `cost-index/${slug}/embed.html`, content: en });
    if (es) out.push({ path: `es/cost-index/${slug}/embed.html`, content: es });
  }
  return out;
}

function main() {
  const tg = targets();

  if (process.argv.includes('--snippet')) {
    for (const slug of EMBED_SLUGS) console.log(snippet(slug));
    return;
  }

  if (process.argv.includes('--self-test')) {
    const en = embedHtml('ribeye', 'en');
    const series = rd('cost-index/ribeye/series.json');
    const noExternal = !/(src|href)\s*=\s*["']https?:\/\/(?!muntin\.digital)/i.test(en) && !/<script/i.test(en);
    const checks = [
      ['builds EN + ES for each slug', tg.length === EMBED_SLUGS.length * 2],
      ['noindex present', /name="robots"[^>]*noindex/i.test(en)],
      ['shows the published asOf', en.includes(series.asOf)],
      ['links canonical page with ?ref=embed', en.includes('/cost-index/ribeye/?ref=embed')],
      ['no external requests / no scripts', noExternal],
      ['deterministic (rebuild equal)', JSON.stringify(targets()) === JSON.stringify(tg)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-embed self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let drift = 0;
    for (const t of tg) {
      const fp = path.join(repo, t.path);
      const cur = existsSync(fp) ? readFileSync(fp, 'utf8') : null;
      if (cur !== t.content) { drift++; console.log(`would update ${t.path}`); }
    }
    if (drift) { console.error(`✗ cost-index embed is stale (${drift}) — run: node scripts/build-cost-index-embed.mjs`); process.exit(1); }
    console.log(`✓ cost-index embed in sync (${tg.length} file(s)).`);
    return;
  }

  for (const t of tg) {
    const fp = path.join(repo, t.path);
    mkdirSync(path.dirname(fp), { recursive: true });
    writeFileSync(fp, t.content);
  }
  console.log(`Wrote ${tg.length} embed card(s): ${EMBED_SLUGS.join(', ')} (EN+ES).`);
  console.log(`Paste-in snippet: ${snippet(EMBED_SLUGS[0])}`);
}

main();
