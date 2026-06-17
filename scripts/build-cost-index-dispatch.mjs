/* build-cost-index-dispatch.mjs — the weekly Cost Index write-up.
 *
 * Turns the scheduled measured-index refresh (data/cost-index.json) into an honest,
 * dated dispatch: where the basket stands, which ingredients are flashing a re-price
 * or watch signal, the biggest gaps from each item's tracked baseline, and the driver
 * context (feed/diesel) behind the moves. Every number is the measured index's own
 * read — nothing invented — so it stays inside the fact gate.
 *
 * HONESTY: trend.pct is each ingredient's read vs ITS OWN tracked baseline window, not a
 * week-over-week delta (we don't archive weekly snapshots yet). So the framing is a
 * state-of-play "what's flashing this week", never "X moved Y% since last week".
 *
 *   node scripts/build-cost-index-dispatch.mjs --json      # print the computed insight as JSON, write nothing
 *   node scripts/build-cost-index-dispatch.mjs --dry-run   # print the computed narrative, write nothing
 *   node scripts/build-cost-index-dispatch.mjs             # emit the dated dispatch at blog/cost-index-week-<asOf>/
 *
 * The default invocation writes one dated post per week, unique by the insight's
 * asOf date. Re-running for the same week overwrites in place and bumps dateModified.
 * It also upserts the post's blog-index card source (data/library-tags.json), pruning
 * any prior cost-index-week-* entry so the registration files never grow unbounded.
 * After emission, run scripts/sync-includes.mjs and the build-chain inject/build scripts
 * (build-blog-index, build-rss, build-sitemap, build-llms-txt, inject-* CTAs) so the post
 * registers in the blog index, RSS, sitemap, smart-next, and the post-end CTA.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// The SAME predicate the hub uses to decide a live reading vs an "expanding
// coverage" page — so the email never flags an ingredient the hub can't show.
const { isShippable } = require('../tools/_shared/cost-confidence.js');
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const arg = (f) => process.argv.includes(f);
const pct = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

// ---- compute the week's insight from the measured index --------------------
function computeInsight() {
  const ci = rd('data/cost-index.json');
  const labels = (rd('data/cost-index-labels.json').labels) || {};
  const driverNames = (rd('data/cost-index-labels.json').drivers) || {};
  const name = (k) => (labels[k] && labels[k].en) || k;
  const nameEs = (k) => (labels[k] && (labels[k].es || labels[k].en)) || k;

  const items = [];
  for (const [key, r] of Object.entries(ci.ingredients || {})) {
    const p = (r.points || [])[0] || {};   // points[0] is the CURRENT read (the hub's canonical point); later entries are older baseline
    const t = p.trend || {};
    const f = r.flag || {};
    if (typeof t.pct !== 'number') continue;
    // Only ingredients that earn a live reading on the hub — never flag an item
    // a clicked-through subscriber would find under "expanding coverage".
    if (!isShippable(p)) continue;
    // The measured dollar LEVEL behind the percentage — so the write-up can ground
    // every "+4.1%" in a real wholesale price ("about $12.14/lb"), not an abstraction.
    const lvl = p.level || {};
    items.push({
      key, name: name(key), nameEs: nameEs(key), pct: t.pct, dir: t.dir || (t.pct > 0 ? 'up' : t.pct < 0 ? 'down' : 'flat'),
      verdict: f.verdict || null, bias: f.actionBias || null, reason: f.reason || null,
      confidence: p.confidence || null, seasonal: !!(labels[key] && labels[key].seasonal),
      medianCents: typeof lvl.medianCents === 'number' ? lvl.medianCents : null,
      rangeCents: Array.isArray(lvl.rangeCents) && lvl.rangeCents.length === 2 ? lvl.rangeCents : null,
      unit: (labels[key] && labels[key].unit_en) || null,
      unitEs: (labels[key] && labels[key].unit_es) || null,
    });
  }

  const up = items.filter((i) => i.dir === 'up').length;
  const down = items.filter((i) => i.dir === 'down').length;
  const flat = items.length - up - down;

  // Actionable signals first (the calibrated suggestion, low-regret order): re-price > watch.
  const reprice = items.filter((i) => i.bias === 're-price').sort((a, b) => b.pct - a.pct);
  const watch = items.filter((i) => i.bias === 'watch').sort((a, b) => b.pct - a.pct);

  // Biggest gaps from baseline, both directions (the "movers").
  const risers = items.filter((i) => i.dir === 'up').sort((a, b) => b.pct - a.pct).slice(0, 4);
  const fallers = items.filter((i) => i.dir === 'down').sort((a, b) => a.pct - b.pct).slice(0, 4);

  // Driver context — only inputs with a named lead set AND a sane move (diesel/electricity
  // come through with empty leads + artifact %, so they're filtered out as not-credible).
  const drivers = Object.entries(ci.drivers || {}).map(([dk, d]) => ({
    key: dk, name: (driverNames[dk] && driverNames[dk].en) || dk,
    nameEs: (driverNames[dk] && (driverNames[dk].es || driverNames[dk].en)) || dk,
    pct: (d.trend || {}).pct, dir: (d.trend || {}).dir, leads: (d.leads || []).map(name)
  })).filter((d) => typeof d.pct === 'number' && d.leads.length > 0 && Math.abs(d.pct) < 1);

  // "Week of" = the freshest read across the panel (not the first item's).
  const asOfs = [];
  for (const r of Object.values(ci.ingredients || {})) { const a = ((r.points || [])[0] || {}).asOf; if (a) asOfs.push(a); }
  const asOf = asOfs.sort().slice(-1)[0] || ci._lastReviewed || ci.generatedAt || new Date().toISOString().slice(0, 10);
  const basket = ci.basket || null;

  // Decompose the basket so the headline number is a story, not a figure to take on
  // faith: each staple's CONTRIBUTION is its weight × its own read (points = weight*pct,
  // in the same units as the basket %). A heavy item barely moving anchors the basket;
  // a light item moving hard can still swing it. We use the basket's OWN contributor
  // reads (not the live per-item trend) so the parts reconcile to the whole it explains.
  const contributors = ((basket && basket.contributors) || [])
    .filter((c) => typeof c.pct === 'number' && typeof c.weight === 'number')
    .map((c) => ({
      key: c.ingredient, name: name(c.ingredient), nameEs: nameEs(c.ingredient),
      pct: c.pct, weight: c.weight, points: c.weight * c.pct,
    }))
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const heaviest = contributors.length
    ? contributors.reduce((m, c) => (c.weight > m.weight ? c : m), contributors[0]) : null;
  const topPush = contributors.find((c) => c.points > 0) || null;
  const topEase = [...contributors].reverse().find((c) => c.points < 0) || null;

  return { asOf, count: items.length, up, down, flat, reprice, watch, risers, fallers, drivers, basket, contributors, heaviest, topPush, topEase };
}

// ---- dry-run: print the narrative (no file written) ------------------------
function narrate(ins) {
  const L = [];
  L.push(`MUNTIN RESTAURANT COST INDEX — week of ${ins.asOf}\n`);
  if (ins.basket && typeof ins.basket.pct === 'number')
    L.push(`Basket${ins.basket.asOf ? ` (as of ${ins.basket.asOf})` : ''}: ${pct(ins.basket.pct)} ${ins.basket.dir || ''} (${ins.basket.confidence || '?'} confidence, ${ins.basket.nContributing || ins.count} ingredients).`);
  L.push(`Spread: ${ins.up} of ${ins.count} reading above their tracked baseline, ${ins.down} below, ${ins.flat} flat.\n`);

  if (ins.contributors && ins.contributors.length) {
    L.push('WHAT\'S MOVING THE BASKET (weight × each staple\'s own read = contribution):');
    for (const c of ins.contributors.slice(0, 6))
      L.push(`  • ${c.name} (${Math.round(c.weight * 100)}% of basket, ${pct(c.pct)}) → ${(c.points >= 0 ? '+' : '-')}${Math.abs(c.points * 100).toFixed(1)} pts`);
    L.push('');
  }

  L.push('WHAT\'S FLASHING (calibrated suggestions — directional, not advice):');
  const dol = (i) => { const d = dollarPhrase(i); return d ? `, ${d}` : ''; };
  if (ins.reprice.length) for (const i of ins.reprice) L.push(`  • RE-PRICE  ${i.name} — ${pct(i.pct)}${dol(i)}, ${i.reason || i.verdict || 'structural'}${i.seasonal ? ' (typically eases in season)' : ''}`);
  if (ins.watch.length) for (const i of ins.watch) L.push(`  • WATCH     ${i.name} — ${pct(i.pct)}${dol(i)}, ${i.reason || i.verdict || 'emerging'}`);
  if (!ins.reprice.length && !ins.watch.length) L.push('  • Nothing structural this week — the panel reads hold across the board.');
  L.push('');

  L.push('BIGGEST GAPS FROM BASELINE:');
  L.push('  Up:   ' + (ins.risers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('  Down: ' + (ins.fallers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('');

  if (ins.drivers.length) {
    L.push('DRIVER CONTEXT:');
    for (const d of ins.drivers) L.push(`  • ${d.name} ${pct(d.pct)} ${d.dir || ''} — leads ${d.leads.slice(0, 4).join(', ')}${d.leads.length > 4 ? ', …' : ''}`);
  }
  return L.join('\n');
}

// ---- HTML emission ---------------------------------------------------------
// The donor supplies byte-identical chrome (head boilerplate, batch banner,
// platform-script + nav, footer, tail scripts) so sync-includes and every
// idempotency gate accept the generated post without a rewrite.
const DONOR = 'blog/ai-local-pack-restaurant-phone-calls-2026/index.html';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const widthOf = (p, max) => (max > 0 ? Math.min(1, Math.abs(p) / max) : 0);
const fmtPct = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}%`; // − for display
const fmtPctPlain = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x * 100).toFixed(1)}%`; // ascii, for narration
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const fmtPts = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)} pts`; // basket contribution, display
const fmtPtsPlain = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x * 100).toFixed(1)} points`; // for narration
// Ground a percentage in the measured wholesale dollar level behind it, so a "+4.1%"
// reads as a real price ("about $12.14/lb, range $11.72–$12.56"). Empty when the item
// carries no level — never invents one.
function dollarPhrase(i, { es = false } = {}) {
  if (!i || i.medianCents == null) return '';
  const u = (es ? i.unitEs : i.unit) ? `/${es ? i.unitEs : i.unit}` : '';
  const range = i.rangeCents ? ` (${es ? 'rango' : 'range'} ${money(i.rangeCents[0])}–${money(i.rangeCents[1])})` : '';
  return `${es ? 'unos' : 'about'} ${money(i.medianCents)}${u} ${es ? 'mayorista' : 'wholesale'}${range}`;
}

function sliceDonor(html, startMarker, endMarker, { includeStart = true, includeEnd = true } = {}) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker, s + startMarker.length);
  if (s === -1 || e === -1) throw new Error(`donor missing marker ${startMarker} / ${endMarker}`);
  return html.slice(includeStart ? s : s + startMarker.length, includeEnd ? e + endMarker.length : e);
}

function buildBars(ins) {
  const movers = [...ins.risers, ...ins.fallers]
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 6);
  const max = Math.max(...movers.map((m) => Math.abs(m.pct)), 0.0001);
  const rows = movers.map((m) => {
    const tone = m.pct >= 0 ? 'rust' : 'teal';
    const w = widthOf(m.pct, max).toFixed(3);
    return `          <div class="viz-bars__row">
            <p class="viz-bars__label">${esc(m.name)}</p>
            <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-bars__num">${fmtPct(m.pct)}</p>
          </div>`;
  }).join('\n');

  const narr = movers.map((m) => `${m.name} ${fmtPctPlain(m.pct)} vs its tracked baseline`).join('; ');
  const alt = `The widest gaps from baseline across the tracked panel this week, with bars scaled so the largest mover fills the track. Rust bars are ingredients reading above their own baseline window (cost building); teal bars are reading below it (cost easing). Each percentage is a state-of-play read versus that ingredient's own tracked baseline, not a week-over-week change. Reading the bars: ${narr}.`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-bars">
          <p class="viz-bars__title">Widest gaps from baseline this week (bars scaled to the largest mover; rust is building cost, teal is easing)</p>
${rows}
          <p class="viz-bars__note">Each bar is a read versus <strong>that ingredient's own tracked baseline window</strong> &mdash; a state-of-play snapshot of what's flashing, not a move since last week.</p>
        </div>
        <figcaption>The widest gaps from each ingredient's tracked baseline this week. Rust bars are building cost; teal bars are easing.</figcaption>
      </figure>`;
}

function buildRings(ins) {
  const total = ins.count || (ins.up + ins.down + ins.flat);
  const upScore = total > 0 ? Math.round((ins.up / total) * 100) : 0;
  const basket = ins.basket || {};
  const basketPct = typeof basket.pct === 'number' ? basket.pct : null;
  const basketScore = basketPct == null ? 0 : Math.min(100, Math.round((Math.abs(basketPct) / 0.5) * 100));
  const basketBand = basketPct == null ? 'warn' : basketPct > 0 ? 'bad' : 'good';

  const alt = `Two readings of where the panel sits this week. The first ring shows the spread: ${ins.up} of ${total} tracked ingredients are reading above their own baseline window, ${ins.down} below, and ${ins.flat} flat. The second ring shows the weighted basket${basket.asOf ? `, as of ${basket.asOf}` : ''}: it reads ${basketPct == null ? 'no value this week' : fmtPctPlain(basketPct)} against its baseline at ${basket.confidence || 'unstated'} confidence across ${basket.nContributing || total} contributing ingredients. Both are state-of-play reads versus each baseline window, never a move since last week.`;

  const spreadRing = `          <div class="viz-ring" data-band="${ins.up > ins.down ? 'bad' : 'good'}" style="--score:${upScore};">
            <svg class="viz-ring__svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="ring-spread" focusable="false">
              <title id="ring-spread">${ins.up} of ${total} ingredients reading above baseline</title>
              <circle class="viz-ring__track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
              <circle class="viz-ring__fill" cx="60" cy="60" r="52" fill="none" stroke-width="8" transform="rotate(-90 60 60)"/>
              <text class="viz-ring__num" x="60" y="60" text-anchor="middle">${ins.up}/${total}</text>
            </svg>
            <p class="viz-ring__label"><strong>Above baseline</strong>${ins.down} below &middot; ${ins.flat} flat</p>
          </div>`;
  const basketRing = `          <div class="viz-ring" data-band="${basketBand}" style="--score:${basketScore};--delay:120ms;">
            <svg class="viz-ring__svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="ring-basket" focusable="false">
              <title id="ring-basket">Weighted basket reads ${basketPct == null ? 'no value' : fmtPctPlain(basketPct)} against baseline</title>
              <circle class="viz-ring__track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
              <circle class="viz-ring__fill" cx="60" cy="60" r="52" fill="none" stroke-width="8" transform="rotate(-90 60 60)"/>
              <text class="viz-ring__num" x="60" y="60" text-anchor="middle">${basketPct == null ? '&mdash;' : fmtPct(basketPct)}</text>
            </svg>
            <p class="viz-ring__label"><strong>Weighted basket</strong>${basket.confidence || 'n/a'} confidence &middot; ${basket.nContributing || total} ingredients</p>
          </div>`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-rings">
${spreadRing}
${basketRing}
        </div>
        <figcaption>Where the panel sits this week: the spread of reads above baseline, and the weighted basket's own reading. Both are reads versus each baseline window, not a week-over-week move.</figcaption>
      </figure>`;
}

function buildFlow(ins) {
  if (!ins.drivers.length) return '';
  const d = ins.drivers[0];
  const leads = d.leads.slice(0, 4).join(', ');
  const dir = d.dir === 'down' ? 'easing' : 'building';
  const tone = d.dir === 'down' ? 'teal' : 'rust';
  const alt = `How the feed and input drivers connect to the proteins on the panel. Step one: ${d.name} reads ${fmtPctPlain(d.pct)} against its baseline this week. Step two: ${d.name} is a tracked input behind ${d.leads.length} of the proteins on the panel, including ${leads}. Step three: a feed read that is ${dir} flows through to those proteins on a lag, which is the context behind their own reads above or below baseline this week. The chain is directional context drawn from the measured index, never a forecast and never a delivered price.`;
  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-flow">
          <ol class="viz-flow__list">
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">1</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">${esc(d.name)} reads ${fmtPct(d.pct)}</p>
                <p class="viz-flow__detail">A tracked feed input, read against its own baseline window this week.</p>
              </div>
            </li>
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">2</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">It sits behind ${d.leads.length} proteins on the panel</p>
                <p class="viz-flow__detail">Including ${esc(leads)} &mdash; the items whose cost the feed market helps set.</p>
              </div>
            </li>
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">3</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">The read flows through on a lag</p>
                <p class="viz-flow__detail">A ${dir} feed market is the context behind those proteins' own reads &mdash; directional, not a forecast.</p>
              </div>
            </li>
          </ol>
        </div>
        <figcaption>The feed-to-protein chain behind this week's reads. Directional context from the measured index, never a forecast.</figcaption>
      </figure>`;
}

function buildContrib(ins) {
  const rows = (ins.contributors || []).slice(0, 6);
  if (rows.length < 2) return '';
  const max = Math.max(...rows.map((c) => Math.abs(c.points)), 0.0001);
  const barRows = rows.map((c) => {
    const tone = c.points >= 0 ? 'rust' : 'teal';
    const w = widthOf(c.points, max).toFixed(3);
    const wpct = Math.round(c.weight * 100);
    return `          <div class="viz-bars__row">
            <p class="viz-bars__label">${esc(c.name)} <span style="opacity:.6">(${wpct}% of basket)</span></p>
            <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-bars__num">${fmtPts(c.points)}</p>
          </div>`;
  }).join('\n');

  const narr = rows.map((c) => `${c.name}, ${Math.round(c.weight * 100)} percent of the basket and reading ${fmtPctPlain(c.pct)} against baseline, contributes ${fmtPtsPlain(c.points)}`).join('; ');
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const alt = `What makes up the basket reading this week, ingredient by ingredient. The weighted basket reads ${basketPlain} against baseline, and that single number is the sum of each staple's weight times its own read. Rust bars push the basket up, teal bars pull it down; the bars are scaled so the largest contributor fills the track. ${narr}. The contributions sum, with offsets, to the headline basket figure — a couple of movers usually do most of the talking while the steady staples hold it down.`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-bars">
          <p class="viz-bars__title">What's moving the basket this week (each staple's weight × its own read; rust pushes the basket up, teal pulls it down)</p>
${barRows}
          <p class="viz-bars__note">A "point" is one one-hundredth of the basket percentage. Each bar is <strong>weight × that ingredient's read</strong> &mdash; a heavy staple barely moving anchors the basket, a light one moving hard can still swing it.</p>
        </div>
        <figcaption>The basket figure, decomposed: each staple's contribution is its weight times its own read. Rust pushes up, teal pulls down.</figcaption>
      </figure>`;
}

function repriceList(ins) {
  const items = [];
  for (const i of ins.reprice) items.push({ tag: 'Re-price', i });
  for (const i of ins.watch) items.push({ tag: 'Watch', i });
  if (!items.length) return '<p>Nothing structural is flashing this week &mdash; the panel reads hold across the board. That is its own signal: hold your prices and keep watching.</p>';
  const lis = items.map(({ tag, i }) => {
    const seasonal = i.seasonal ? ' This one is seasonal, so it typically eases when the season turns.' : '';
    const dollar = dollarPhrase(i);
    const grounded = dollar ? ` &mdash; ${dollar}` : '';
    return `        <li><strong>${tag} &mdash; ${esc(i.name)}.</strong> It reads ${fmtPct(i.pct)} against its baseline${grounded}; ${esc(i.reason || i.verdict || 'a move worth tracking')}.${seasonal}</li>`;
  }).join('\n');
  return `      <ul>\n${lis}\n      </ul>`;
}

function upsertLibraryTags(slug, asOf, basketPlain, ins) {
  // build-blog-index.mjs renders the blog index card from this entry. One weekly
  // dispatch entry at a time; prune stale cost-index-week-* keys so it never grows.
  const f = path.join(repoRoot, 'data/library-tags.json');
  const data = JSON.parse(readFileSync(f, 'utf8'));
  data.blog_posts = data.blog_posts || {};
  for (const k of Object.keys(data.blog_posts)) {
    if (/^cost-index-week-\d{4}-\d{2}-\d{2}$/.test(k) && k !== slug) delete data.blog_posts[k];
  }
  data.blog_posts[slug] = {
    topics: ['operations-margin'],
    title: `Restaurant Cost Index: where the basket stands, week of ${asOf}`,
    dek: `The weekly read on wholesale ingredient costs: the basket sits at ${basketPlain} against baseline, ${ins.up} of ${ins.count} ingredients above their tracked window. What's flashing a re-price or watch signal, and the feed context behind it. Public wholesale levels, never your delivered price.`,
    date: asOf,
    read_min: 5,
    hide_from_recents: true,
  };
  writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
}

function emit() {
  const ins = computeInsight();
  const asOf = ins.asOf;
  const slug = `cost-index-week-${asOf}`;
  const url = `https://muntin.digital/blog/${slug}/`;
  const today = new Date().toISOString().slice(0, 10);

  const donorHtml = readFileSync(path.join(repoRoot, DONOR), 'utf8');
  const headBoiler = sliceDonor(donorHtml,
    '<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-variable-latin-wght-normal.woff2" crossorigin>',
    '<!-- /lazy-load:p -->');
  const plausibleInit = sliceDonor(donorHtml,
    "<script>window.plausible=window.plausible", '})</script>');
  const batchBanner = sliceDonor(donorHtml, '<!-- batch-banner:start -->', '<!-- batch-banner:end -->');
  const navBlock = sliceDonor(donorHtml, '<script>\n  /* Platform-aware kbd hint.', '</header>');
  const footerBlock = sliceDonor(donorHtml, '<footer>', '</footer>');
  const tailScripts = sliceDonor(donorHtml, '<!-- Phase 3D-perf', '<!-- /lazy-load:site -->');

  const title = `Restaurant Cost Index: where the basket stands, week of ${asOf}`;
  const descFull = `Week of ${asOf}: the basket reads ${fmtPctPlain(ins.basket && ins.basket.pct)} against baseline, ${ins.up} of ${ins.count} ingredients above their tracked window. Wholesale levels, not your delivered price.`;
  const desc = descFull.length <= 155 ? descFull : (descFull.slice(0, 152).replace(/\s+\S*$/, '') + '…');
  const basketRead = ins.basket && typeof ins.basket.pct === 'number' ? fmtPct(ins.basket.pct) : '&mdash;';
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const basketConf = (ins.basket && ins.basket.confidence) || 'unstated';

  const tldr = [
    `The weekly restaurant cost index for the week of ${asOf}: the weighted basket reads ${basketPlain} against its baseline at ${basketConf} confidence.`,
    `${ins.up} of ${ins.count} tracked ingredients are reading above their own baseline window, ${ins.down} below, ${ins.flat} flat.`,
    ins.reprice.length
      ? `Flashing re-price: ${ins.reprice.map((i) => `${i.name} (${fmtPctPlain(i.pct)})`).join(', ')}. Each read is state-of-play versus that item's baseline, never a move since last week.`
      : `Nothing structural is flashing this week; the panel reads hold across the board.`,
  ];
  const takeaways = [
    `The basket reads ${basketPlain} against its baseline this week &mdash; public wholesale levels, never your delivered price.`,
    `Each ingredient's percentage is a read versus its own tracked baseline window, a state-of-play "what's flashing", not a week-over-week move.`,
    ins.reprice.length
      ? `${ins.reprice[0].name} is the structural signal to act on first; ${ins.watch.length ? `${ins.watch[0].name} is on watch.` : 'nothing else is flashing yet.'}`
      : `Nothing structural this week is a signal too: hold your prices and keep the panel in view.`,
    `${ins.drivers.length ? `Feed context: ${ins.drivers.map((d) => `${d.name} ${fmtPctPlain(d.pct)}`).join(', ')}.` : 'No credible feed-driver read this week.'} Watch your own delivered invoices, not the wholesale panel alone.`,
  ];

  const barsFig = buildBars(ins);
  const ringsFig = buildRings(ins);
  const flowFig = buildFlow(ins);
  const contribFig = buildContrib(ins);

  // Plain-language decomposition of the basket headline — names the staple doing the
  // pushing, the one easing, and the heavy anchor, all from the basket's own contributors.
  const heaviest = ins.heaviest, topPush = ins.topPush, topEase = ins.topEase;
  const contribLead = (contribFig && topPush)
    ? `<p>The basket is not one number &mdash; it is a weighted blend of ${ins.basket && ins.basket.nContributing || ins.count} staples, so the headline ${basketRead} is really a tug-of-war. ${heaviest ? `A heavy line barely moving anchors it: ${esc(heaviest.name)} is ${Math.round(heaviest.weight * 100)}% of the basket, so it steadies the whole read. ` : ''}But the swing comes from elsewhere. This week ${esc(topPush.name)}, at just ${Math.round(topPush.weight * 100)}% of the basket but reading ${fmtPct(topPush.pct)} against its baseline, adds about ${fmtPts(topPush.points)}${topEase ? `, while ${esc(topEase.name)} pulls back ${fmtPts(topEase.points)}` : ''}. Here is the headline taken apart, so ${basketRead} is a story you can see rather than a figure to take on faith.</p>`
    : '';
  const contribClose = (contribFig && topPush)
    ? `<p>That is the honest shape of an index: a couple of volatile lines do most of the talking, and the steady staples keep it from whipping around. So read ${basketRead} as &ldquo;${esc(topPush.name)} pushing${topEase ? `, ${esc(topEase.name)} easing` : ''}&rdquo; &mdash; not as every shelf in the walk-in moving together. If the line doing the pushing is not one you carry, the basket may be louder than your own invoice this week.</p>`
    : '';
  const contribSection = contribFig
    ? `      <h2 id="what-s-moving-the-basket">What's moving the basket</h2>
${contribLead}
${contribFig}
${contribClose}
`
    : '';

  const tldrLis = tldr.map((t) => `        <li>${esc(t)}</li>`).join('\n');
  const takeLis = takeaways.map((t) => `        <li>${esc(t)}</li>`).join('\n');

  const risersStr = ins.risers.map((i) => `${esc(i.name)} ${fmtPct(i.pct)}`).join(' &middot; ') || '&mdash;';
  const fallersStr = ins.fallers.map((i) => `${esc(i.name)} ${fmtPct(i.pct)}`).join(' &middot; ') || '&mdash;';
  const driverCtx = ins.drivers.length
    ? ins.drivers.map((d) => `${esc(d.name)} reads ${fmtPct(d.pct)} against its baseline`).join(', and ')
    : '';

  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${esc(title)} | Muntin Digital</title>
<meta name="description" content="${escAttr(desc)}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${url}" />
<!-- i18n:hreflang START (generated by scripts/stamp-hreflang.mjs) -->
<link rel="alternate" hreflang="en" href="${url}" />
<link rel="alternate" hreflang="x-default" href="${url}" />
<meta property="og:locale" content="en_US" />
<!-- i18n:hreflang END -->

<meta property="og:type" content="article" />
<meta property="og:title" content="${escAttr(title)}" />
<meta property="og:description" content="${escAttr(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Muntin Digital" />

<meta property="og:image" content="https://muntin.digital/brand/og/blog-restaurant-cost.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="article:published_time" content="${asOf}T13:00:00-04:00" />
<meta property="article:author" content="Don Goldstein" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "${url}#article",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(desc)},
      "url": "${url}",
      "inLanguage": "en-US",
      "datePublished": "${asOf}T13:00:00-04:00",
      "dateModified": "${today}",
      "author": {
        "@id": "https://muntin.digital/#don-goldstein",
        "@type": "Person",
        "name": "Don Goldstein",
        "url": "https://muntin.digital/about/"
      },
      "publisher": {
        "@id": "https://muntin.digital/#business"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://muntin.digital/brand/og/blog-restaurant-cost.png",
        "width": 1200,
        "height": 630,
        "caption": ${JSON.stringify(title)}
      },
      "mainEntityOfPage": {
        "@id": "${url}"
      },
      "keywords": [
        "restaurant cost index ${asOf}",
        "restaurant food cost trends 2026",
        "wholesale ingredient prices restaurant",
        "restaurant menu re-price signal",
        "restaurant cost pulse weekly"
      ],
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [
          "article#post-body",
          "h1",
          ".post-dek"
        ]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Muntin Digital",
          "item": "https://muntin.digital/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": "https://muntin.digital/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": ${JSON.stringify(title)},
          "item": "${url}"
        }
      ]
    }
  ]
}
</script>

<style>
.breadcrumb{padding-top:100px}
.callout{padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px;margin:24px 0}
.callout p{margin:0;font-size:15.5px;line-height:1.6;color:var(--ink)}
</style>
<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#16181D;color:#F6F7F8;padding:12px 16px;z-index:100}
a{color:inherit}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer}
.btn-primary{background:var(--ink);color:var(--cream)}
.btn-ghost{background:transparent;color:var(--ink);border:1px solid #D7DAE0}
header.nav{min-height:64px}
</style>
${headBoiler}
${plausibleInit}
</head>
<body>

<a class="skip-link" href="#main">Skip to main content</a>

${batchBanner}
${navBlock}

<main id="main">
  <nav class="breadcrumb container" aria-label="Breadcrumb" style="margin-top:90px">
    <ol style="list-style:none;padding:0;margin:0;display:flex;gap:8px;font-size:13px;color:var(--stone)">
      <li><a href="/" style="color:var(--teal)">Home</a></li>
      <li aria-hidden="true">›</li>
      <li><a href="/blog/" style="color:var(--teal)">Articles</a></li>
      <li aria-hidden="true">›</li>
      <li aria-current="page">Cost Index &middot; week of ${asOf}</li>
    </ol>
  </nav>

  <article class="container article-body" id="post-body" style="max-width:720px;margin:32px auto 80px;padding:0 var(--pad-x)">
    <header style="margin-bottom:32px">
      <p class="eyebrow">The Cost Index &middot; week of ${asOf} &middot; 5 min read &middot; By <a href="/about/#don-goldstein" style="color:var(--teal)">Don Goldstein</a></p>
      <h1 style="font-family:var(--font-display);font-size:clamp(36px,5.5vw,56px);font-weight:500;line-height:1.05;letter-spacing:-0.5px;margin:0 0 18px">
        Where the basket stands this week. <span class="serif-italic">What's flashing.</span>
      </h1>
      <p class="post-dek" style="font-size:18px;line-height:1.55;color:var(--ink-soft);margin:0">The restaurant cost index for the week of ${asOf}: the weighted basket reads ${basketRead} against its baseline, ${ins.up} of ${ins.count} tracked ingredients above their own window. These are public wholesale levels, never your delivered price &mdash; a read on the market, so you can tell a real move from a vendor markup.</p>
    </header>

      <!-- article-tldr:start -->
            <aside class="tldr" data-llm="tldr" aria-label="In short">
              <p class="tldr__eyebrow">In short</p>
              <ul class="tldr__list">
${tldrLis}
              </ul>
            </aside>
            <!-- article-tldr:end -->

      <p>Here is the read I run on a Tuesday between the produce drop and the pre-shift, and it is the same read this dispatch carries. The cost index for the week of ${asOf} has the weighted basket sitting at <strong>${basketRead}</strong> against its baseline, at ${basketConf} confidence across ${ins.basket && ins.basket.nContributing || ins.count} contributing ingredients. You already watch your own invoices &mdash; this is the wholesale market underneath them, so a delivered-price jump can be checked against whether the market actually moved or your vendor did.</p>

      <p>One honesty line before the numbers, because it changes how you read every one of them. Each ingredient's percentage here is its read against <em>its own tracked baseline window</em> &mdash; a state-of-play "what's flashing this week," never "moved ${basketPlain} since last week." The panel does not archive weekly snapshots yet, so I will not pretend it measures a week-over-week delta it cannot see. And every figure is a <strong>public wholesale level, never your delivered price</strong>: this is a read on the <a href="/glossary/cost-index/">cost index</a>, not a line for your <a href="/glossary/food-cost/">food cost</a> sheet. The point is direction and gap, not a number to paste into a cost sheet.</p>

${ringsFig}

${contribSection}
      <h2 id="what-s-flashing-this-week">What's flashing this week</h2>
      <p>The panel sorts into a short action list: ${ins.reprice.length ? `${ins.reprice.length} re-price signal${ins.reprice.length > 1 ? 's' : ''}` : 'no re-price signal'}, ${ins.watch.length ? `${ins.watch.length} on watch` : 'nothing on watch'}. A re-price flag means the move looks structural &mdash; elevated and sustained against the baseline. A watch flag means a real move that has not persisted long enough to act on yet. Neither is advice; both are calibrated, low-regret reads off the measured index.</p>

${repriceList(ins)}

      <p>If nothing here matches a line on your own menu, that is fine &mdash; only act where the flashing item is something you actually buy. The whole panel is filtered to the index's shippable set, so every name above is an ingredient the hub can show a live reading for.</p>

      <h2 id="the-widest-gaps-from-baseline">The widest gaps from baseline</h2>
      <p>Beyond the action flags, here is the full spread of movement. Reading above baseline this week: ${risersStr}. Reading below: ${fallersStr}. The bars below scale to the largest mover so the gaps are legible &mdash; rust where cost is building, teal where it is easing.</p>

${barsFig}

      <p>Read these as gaps, not verdicts. A wide rust bar on a seasonal item often unwinds when the season turns; a wide teal bar can be a vendor clearing inventory rather than a durable easing. The bar tells you where to look; your delivered invoice tells you whether it reached your back door.</p>

      ${driverCtx ? `<h2 id="the-feed-context-behind-the-proteins">The feed context behind the proteins</h2>
      <p>Proteins do not move on their own &mdash; the feed market underneath them sets a floor that flows through on a lag. This week, ${driverCtx}. A feed read that is easing is the context behind a protein reading softer than its baseline; a feed read that is building is the early-warning on one heading the other way.</p>

${flowFig}

      <p>The feed-to-protein chain is directional context, drawn from the same measured index &mdash; never a forecast and never a delivered price. It tells you which way the wind is blowing on the proteins you carry, so a quote that moves the other way is worth a question to your vendor.</p>` : ''}

      <h2 id="how-to-read-this-and-what-it-is-not">How to read this, and what it is not</h2>
      <p>Three rules keep this honest. First, every number is a <strong>public wholesale level, never your delivered price</strong> &mdash; freight, contract, and pack size all sit between this panel and your invoice. Second, each percentage is a read versus that ingredient's <em>own tracked baseline window</em>, a state-of-play snapshot of what is flashing, not a week-over-week move. Third, the panel is drawn from public USDA, BLS, and FRED data; when an input cannot earn a credible reading, it stays off the page rather than showing you a guess. Watch your own delivered invoices against these reads &mdash; the gap between the two is where a vendor conversation lives, and it is the first place a moving <a href="/glossary/prime-cost/">prime cost</a> shows up.</p>

  <!-- article-takeaways:start -->
            <aside class="key-takeaways" data-llm="takeaways" aria-label="Key takeaways">
              <p class="key-takeaways__eyebrow">Key takeaways</p>
              <ul class="key-takeaways__list">
${takeLis}
              </ul>
            </aside>
            <!-- article-takeaways:end -->
  </article>

  <aside class="post-end-mark" aria-hidden="true">
    <hr/>
    <span class="post-end-glyph"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
      <line x1="4" y1="10" x2="20" y2="10"/>
    </svg></span>
    <p>More from the library.</p>
  </aside>

  <!-- post-end-cta:start -->
    <aside class="post-end-cta" aria-label="Workshop next step">
      <p class="post-end-cta-headline">Get this read in your inbox every week.</p>
      <p class="post-end-cta-body">The Cost Index sends one short note a week &mdash; where the basket stands, what's flashing a re-price or watch signal, and the feed context behind the proteins. Sign up on the hub, then open Cost Pulse to see every tracked ingredient at once. Public wholesale levels, never your delivered price.</p>
      <a class="btn btn-primary" href="/cost-index/">Open the Cost Index<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg></a>
    </aside>
    <!-- post-end-cta:end -->
<!-- knit-rail:start --><!-- knit-rail:end -->

  <!-- smart-next:start --><!-- smart-next:end -->

</main>

${footerBlock}
${tailScripts}
  <!-- listen-script:start --><!-- listen-script:end -->

</body>
</html>
`;

  upsertLibraryTags(slug, asOf, basketPlain, ins);

  const outDir = path.join(repoRoot, 'blog', slug);
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  const existed = existsSync(outFile);
  writeFileSync(outFile, body);
  console.log(`${existed ? 'overwrote' : 'wrote'} blog/${slug}/index.html  (basket ${basketPlain}, ${ins.up}/${ins.count} above baseline, asOf ${asOf})`);
  console.log('Next: node scripts/sync-includes.mjs  +  node scripts/inject-library-cost-index-hero.mjs  +  the build-chain inject/build scripts, then node scripts/check-all.mjs');
  return { slug, url, asOf };
}

if (arg('--json') || arg('--dry-run')) {
  const ins = computeInsight();
  if (arg('--json')) console.log(JSON.stringify(ins, null, 2));
  else console.log(narrate(ins));
  process.exit(0);
}

emit();
