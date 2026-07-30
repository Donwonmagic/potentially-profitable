#!/usr/bin/env node
/**
 * One-off migration: restyle the frozen Cost Index dispatch figures in place.
 *
 * The generator (build-cost-index-dispatch.mjs) now emits viz-diverge /
 * viz-split / viz-gauge for signed data, but already-published editions are
 * frozen HTML with the old one-directional viz-bars + progress-ring markup.
 * This transforms those figures using each post's OWN rendered numbers
 * (presentation only — no data-of-record changes), then bumps dateModified.
 *
 * Transforms three figure types; leaves viz-flow / viz-spark untouched.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.argv[2] || '/home/user/potentially-profitable';
const TODAY = '2026-07-24';

const DIVERGE_AXIS = `          <div class="viz-diverge__axis"><span class="is-teal">&larr; easing (cost down)</span><span>baseline</span><span class="is-rust">building (cost up) &rarr;</span></div>`;

const esc = (s) => s;
// parse a signed number out of a rendered label like "+3.5 pts", "&minus;55.9%", "−2.4 pts"
function signedVal(numHtml) {
  const t = numHtml.replace(/<[^>]+>/g, '')
    .replace(/&minus;|&ndash;|−|–/g, '-')
    .replace(/&plus;/g, '+')
    .replace(/[%]|pts|\s/g, '')
    .trim();
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : 0;
}
const plainNum = (numHtml) => numHtml.replace(/<[^>]+>/g, '')
  .replace(/&minus;|−/g, '−').replace(/&plus;/g, '+').trim();

function divergeRows(items, max) {
  return items.map((it) => {
    const tone = it.value >= 0 ? 'rust' : 'teal';
    const w = (max > 0 ? Math.min(1, Math.abs(it.value) / max) : 0).toFixed(3);
    return `          <div class="viz-diverge__row">
            <p class="viz-diverge__label">${it.label}</p>
            <div class="viz-diverge__track"><span class="viz-diverge__zero"></span><span class="viz-diverge__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-diverge__num">${it.num}</p>
          </div>`;
  }).join('\n');
}

// pull the {label,num} rows out of an old viz-bars figure
function extractBarRows(fig) {
  const rows = [];
  const re = /<div class="viz-bars__row">([\s\S]*?)<\/div>\s*<\/div>|<div class="viz-bars__row">([\s\S]*?)<p class="viz-bars__num"[^>]*>([\s\S]*?)<\/p>\s*<\/div>/g;
  const rowRe = /<p class="viz-bars__label">([\s\S]*?)<\/p>\s*<div class="viz-bars__track">[\s\S]*?data-tone="(\w+)"[\s\S]*?<\/div>\s*<p class="viz-bars__num"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = rowRe.exec(fig)) !== null) {
    rows.push({ labelHtml: m[1].trim(), tone: m[2], numHtml: m[3].trim() });
  }
  return rows;
}

// "Vegetable oil <span style=opacity:.6>(12% of basket)</span>" -> {name, weight}
function splitLabel(labelHtml) {
  const wm = labelHtml.match(/\((\d+)%\s*of\s*basket\)/i);
  const weight = wm ? parseInt(wm[1], 10) : null;
  const nameHtml = labelHtml.replace(/\s*<span[^>]*>\([\s\S]*?\)<\/span>/i, '').trim();
  return { nameHtml, weight };
}

function newLabel(labelHtml) {
  const { nameHtml, weight } = splitLabel(labelHtml);
  return weight != null ? `${nameHtml} <small>${weight}% of basket</small>` : nameHtml;
}

function rebuildDiverge({ rows, title, note, figcaption, alt, wrapperClass }) {
  const ordered = [...rows].map((r) => ({ ...r, value: signedVal(r.numHtml) }))
    .sort((a, b) => b.value - a.value);
  const max = Math.max(...ordered.map((r) => Math.abs(r.value)), 0.0001);
  const barRows = divergeRows(ordered.map((r) => ({
    label: newLabel(r.labelHtml), value: r.value, num: plainNum(r.numHtml),
  })), max);
  const narr = ordered.map((r) => `${splitLabel(r.labelHtml).nameHtml.replace(/<[^>]+>/g, '')} ${plainNum(r.numHtml)}`).join('; ');
  const altText = alt(narr, ordered);
  return `      <figure class="${wrapperClass}" data-audio-alt="${altText}">
        <div class="viz-diverge">
          <p class="viz-diverge__title">${title}</p>
${barRows}
${DIVERGE_AXIS}
          <p class="viz-diverge__note">${note}</p>
        </div>
        <figcaption>${figcaption}</figcaption>
      </figure>`;
}

function spreadSplit(up, down, flat, total) {
  const seg = (n) => (n / total).toFixed(4);
  return `          <div class="viz-split">
            <p class="viz-split__title">All ${total} tracked ingredients, by where they read</p>
            <div class="viz-split__bar">
              <span class="viz-split__seg" data-tone="teal" style="--w:${seg(down)}"></span>
              <span class="viz-split__seg" data-tone="stone" style="--w:${seg(flat)}"></span>
              <span class="viz-split__seg" data-tone="rust" style="--w:${seg(up)}"></span>
            </div>
            <div class="viz-split__legend">
              <span class="viz-split__key"><span class="viz-split__swatch" data-tone="teal"></span>Below &mdash; easing <strong>${down}</strong></span>
              <span class="viz-split__key"><span class="viz-split__swatch" data-tone="stone"></span>Flat <strong>${flat}</strong></span>
              <span class="viz-split__key"><span class="viz-split__swatch" data-tone="rust"></span>Above &mdash; building <strong>${up}</strong></span>
            </div>
          </div>`;
}

function basketGauge(pctText, sub) {
  const pct = signedVal(pctText); // percentage points, e.g. -5.0
  const tone = pct > 0 ? 'rust' : pct < 0 ? 'teal' : 'stone';
  const pctPoints = Math.abs(pct);
  const range = Math.max(10, Math.ceil((pctPoints * 1.4) / 5) * 5);
  const half = Math.min(1, pctPoints / range) * 50;
  const dotLeft = pct < 0 ? 50 - half : 50 + half;
  const fillLeft = pct < 0 ? 50 - half : 50;
  const word = pct > 0 ? 'above baseline' : pct < 0 ? 'below baseline' : 'at baseline';
  return `          <div class="viz-gauge">
            <p class="viz-gauge__big" data-tone="${tone}">${plainNum(pctText)}</p>
            <p class="viz-gauge__sub"><strong>${word}</strong> &middot; ${sub}</p>
            <div class="viz-gauge__track">
              <span class="viz-gauge__line"></span>
              <span class="viz-gauge__fill" data-tone="${tone}" style="left:${fillLeft.toFixed(2)}%;width:${half.toFixed(2)}%"></span>
              <span class="viz-gauge__zero"></span>
              <span class="viz-gauge__dot" data-tone="${tone}" style="left:${dotLeft.toFixed(2)}%"></span>
            </div>
            <div class="viz-gauge__ends"><span>&minus;${range}%</span><span class="mid">baseline</span><span>+${range}%</span></div>
          </div>`;
}

function rebuildRings(fig, asOf) {
  // spread ring: num "24/81"; label "<strong>Above baseline</strong>36 below · 21 flat"
  const spreadNum = (fig.match(/viz-ring__num[^>]*>\s*(\d+)\s*\/\s*(\d+)/) || []);
  const up = parseInt(spreadNum[1], 10), total = parseInt(spreadNum[2], 10);
  const belowFlat = (fig.match(/Above baseline<\/strong>\s*(\d+)\s*below[\s\S]*?(\d+)\s*flat/) || []);
  const down = parseInt(belowFlat[1], 10), flat = parseInt(belowFlat[2], 10);
  // basket ring: num "−5.0%"; label "<strong>Weighted basket</strong>high confidence · 16 ingredients"
  const basketNumM = fig.match(/ring-basket[\s\S]*?viz-ring__num[^>]*>([\s\S]*?)<\/text>/);
  const basketPctText = basketNumM ? basketNumM[1].trim() : '&mdash;';
  const basketLabelM = fig.match(/Weighted basket<\/strong>([\s\S]*?)<\/p>/);
  const sub = basketLabelM ? basketLabelM[1].replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim() : `${total} ingredients`;
  const subHtml = sub.replace(/·/g, '&middot;');

  const alt = `Two readings of where the panel sits this week. First, the spread across all ${total} tracked ingredients: ${up} read above their own baseline window (cost building), ${down} below it (cost easing), and ${flat} flat — shown as one stacked bar so every part is visible. Second, the weighted basket reads ${plainNum(basketPctText).replace(/−/g, 'minus ')} against its baseline (${sub.replace(/&[a-z]+;/g, '')}), placed as a position left or right of the baseline line. Both are state-of-play reads versus each baseline window, never a move since last week.`;
  return `      <figure class="viz-figure article-figure" data-audio-alt="${alt}">
        <div class="viz-pair">
${spreadSplit(up, down, flat, total)}
${basketGauge(basketPctText, subHtml)}
        </div>
        <figcaption>Where the panel sits, week of ${asOf}: the spread of reads across the panel, and the weighted basket's position against its baseline. Both are reads versus each baseline window, not a week-over-week move.</figcaption>
      </figure>`;
}

// Generic: any signed viz-bars (has BOTH rust and teal rows) → diverging,
// preserving the figure's OWN title / note / figcaption / narration.
function rebuildDivergeGeneric(fig) {
  const rows = extractBarRows(fig);
  if (rows.length < 2) return null;
  const tones = new Set(rows.map((r) => r.tone));
  if (!(tones.has('rust') && tones.has('teal'))) return null; // single-direction → legitimate viz-bars, keep
  const ordered = rows.map((r) => ({ ...r, value: signedVal(r.numHtml) })).sort((a, b) => b.value - a.value);
  const max = Math.max(...ordered.map((r) => Math.abs(r.value)), 0.0001);
  const barRows = divergeRows(ordered.map((r) => ({ label: newLabel(r.labelHtml), value: r.value, num: plainNum(r.numHtml) })), max);
  const title = (fig.match(/viz-bars__title">([\s\S]*?)<\/p>/) || [])[1] || '';
  const note = (fig.match(/viz-bars__note">([\s\S]*?)<\/p>/) || [])[1] || '';
  const figcaption = (fig.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '';
  const alt = (fig.match(/data-audio-alt="([\s\S]*?)"/) || [])[1] || '';
  const wrapperClass = /article-figure/.test(fig) ? 'viz-figure article-figure' : 'viz-figure';
  const noteHtml = note ? `\n          <p class="viz-diverge__note">${note}</p>` : '';
  return `      <figure class="${wrapperClass}" data-audio-alt="${alt}">
        <div class="viz-diverge">
          <p class="viz-diverge__title">${title}</p>
${barRows}
${DIVERGE_AXIS}${noteHtml}
        </div>
        <figcaption>${figcaption}</figcaption>
      </figure>`;
}

function migratePost(file) {
  let html = fs.readFileSync(file, 'utf8');
  const slug = path.basename(path.dirname(file));
  const asOfM = slug.match(/(\d{4}-\d{2}-\d{2})/);
  const asOf = asOfM ? asOfM[1] : (html.match(/read as of (\d{4}-\d{2}-\d{2})/) || html.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || TODAY;
  const figs = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/g) || [];
  let changed = 0;
  for (const fig of figs) {
    let out = null;
    if (/viz-rings/.test(fig)) {
      out = rebuildRings(fig, asOf);
    } else if (/viz-bars/.test(fig) && /(moving the basket|biggest individual pulls)/i.test(fig)) {
      const rows = extractBarRows(fig);
      if (rows.length >= 2) out = rebuildDiverge({
        rows,
        wrapperClass: /article-figure/.test(fig) ? 'viz-figure article-figure' : 'viz-figure',
        title: `What's moving the basket this week &mdash; each staple's contribution (weight &times; its own read)`,
        note: `A "point" is one one-hundredth of the basket percentage. Distance from the centre is how hard a staple pushes; <strong>side is which way</strong>. A heavy staple barely moving sits near the centre; a light one moving hard reaches out.`,
        figcaption: `The basket read for the week of ${asOf}, decomposed: each staple's contribution is its weight times its own read. Right of centre pushes the basket up, left pulls it down.`,
        alt: (narr) => `What makes up the basket reading this week, ingredient by ingredient, on a zero-centred axis. Each staple's contribution is its weight times its own read: bars to the right of centre (rust) are staples pushing the basket up, bars to the left (teal) are pulling it down, and distance from the centre is how hard. ${narr}. A couple of movers usually do most of the talking while the steady staples hold the middle.`,
      });
    } else if (/viz-bars/.test(fig) && /widest gaps/i.test(fig)) {
      const rows = extractBarRows(fig);
      if (rows.length >= 2) out = rebuildDiverge({
        rows,
        wrapperClass: /article-figure/.test(fig) ? 'viz-figure article-figure' : 'viz-figure',
        title: `Widest gaps from baseline this week &mdash; building cost to the right, easing to the left`,
        note: `Each bar is a read versus <strong>that ingredient's own tracked baseline window</strong> &mdash; distance from the centre is the size of the gap, side is the direction. A state-of-play snapshot, not a move since last week.`,
        figcaption: `The widest gaps from each ingredient's tracked baseline, week of ${asOf}. Right of centre is building cost; left is easing.`,
        alt: (narr) => `The widest gaps from baseline across the tracked panel this week, on a zero-centred axis so the direction is unmistakable. Bars to the right of centre (rust) are ingredients reading above their own baseline window — cost building; bars to the left (teal) are reading below it — cost easing. Distance from the centre is how wide the gap. Reading the bars: ${narr}.`,
      });
    } else if (/viz-bars/.test(fig)) {
      out = rebuildDivergeGeneric(fig); // any other SIGNED bars (e.g. the seasonal arc); single-direction charts return null
    }
    if (out && out !== fig) { html = html.replace(fig, out); changed++; }
  }
  if (changed) {
    html = html.replace(/("dateModified":\s*")\d{4}-\d{2}-\d{2}(")/g, `$1${TODAY}$2`);
    fs.writeFileSync(file, html);
  }
  return { slug, figs: figs.length, changed };
}

// discover dispatch posts
const blogDir = path.join(REPO, 'blog');
const posts = fs.readdirSync(blogDir)
  .filter((d) => /^cost-index-(week-\d{4}-\d{2}-\d{2}|\d{4}-\d{2})$/.test(d))
  .map((d) => path.join(blogDir, d, 'index.html'))
  .filter((f) => fs.existsSync(f));

for (const f of posts) {
  const r = migratePost(f);
  console.log(`${r.slug}: ${r.changed}/${r.figs} figure(s) restyled`);
}
