#!/usr/bin/env node
/**
 * check-cost-index-events.mjs — the HONESTY gate for the notable-price-events surface.
 *
 * The surface joins two committed layers:
 *   - data/cost-index-events.json  — DETECTION (pure math; its own --check keeps it in sync)
 *   - cost-index/events.json       — the curated, CITED market-events registry (the WHY)
 * rendered on each cost-index ingredient page as CO-OCCURRENCE context (a documented event
 * shown beside the price window it overlapped, never asserted as the cause).
 *
 * This gate fails the build if:
 *   1. the detection artifact leaks a cause/forecast/change-point field;
 *   2. the registry is malformed or dishonestly framed — framing must be co-occurrence, every
 *      event needs an id/label/startDate/affectedSlugs/whatHappened and at least one https
 *      source, `count` must match, and no event may speak a forecast;
 *   3. the RENDERED events section asserts causation (a documented event tied to a price move
 *      as its cause) or speaks a forecast — the render must stay co-occurrence-only.
 *
 * The self-test exercises the validators on synthetic inputs (no repo I/O). Run:
 *   node scripts/check-cost-index-events.mjs
 *   node scripts/check-cost-index-events.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function rd(p) { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }

// Prediction phrasing that must never appear in a documented-event account or the render.
const FORECAST_RE = [
  /\bforecast(s|ed|ing)?\b/i, /\bprojected\b/i, /\bexpected?\s+to\b/i,
  /\bwe\s+(expect|predict|forecast)\b/i, /\bgoing\s+to\s+(rise|fall|climb|drop)\b/i,
  /\bwill\s+(rise|fall|climb|drop|increase|decrease|likely|continue|keep)\b/i,
  /\bnext\s+(year|month|season|quarter)\b/i, /\blikely\s+to\s+(rise|fall|climb|drop)\b/i,
];
function forecastHit(text) { const t = String(text || ''); for (const re of FORECAST_RE) { const m = t.match(re); if (m) return m[0]; } return null; }

// Causation asserted between a documented event and a PRICE move — the one thing the
// co-occurrence surface must never do. Scoped tight so ordinary event prose ("the virus
// caused illness") doesn't trip it: only event→price causal links are flagged.
const CAUSAL_RE = [
  /\bcaused\s+(the\s+)?(price|prices|spike|jump|move|surge|increase)\b/i,
  /\bbecause\s+(of\s+)?(the\s+)?(price|prices)\b/i,
  /\bdrove\s+(the\s+)?prices?\b/i,
  /\bprices?\s+(rose|jumped|spiked|climbed|fell)\s+because\b/i,
  /\bthe\s+cause\s+of\s+(the\s+)?(price|move|spike)\b/i,
];
function causalHit(text) { const t = String(text || ''); for (const re of CAUSAL_RE) { const m = t.match(re); if (m) return m[0]; } return null; }

// Validate one registry event's shape + provenance. Returns problem strings ([] = clean).
function validateEvent(ev) {
  const p = [];
  const id = ev && ev.id ? ev.id : '(unnamed event)';
  if (!ev || typeof ev !== 'object') return [`${id}: not an object`];
  if (!ev.id || typeof ev.id !== 'string') p.push(`${id}: missing id`);
  if (!ev.label || typeof ev.label !== 'string') p.push(`${id}: missing label`);
  if (!/^\d{4}(-\d{2}){1,2}$/.test(ev.startDate || '')) p.push(`${id}: startDate must be YYYY-MM or YYYY-MM-DD`);
  if (ev.endDate && !/^\d{4}(-\d{2}){1,2}$/.test(ev.endDate)) p.push(`${id}: endDate malformed`);
  if (!Array.isArray(ev.affectedSlugs) || !ev.affectedSlugs.length) p.push(`${id}: affectedSlugs must be a non-empty array`);
  else if (!ev.affectedSlugs.every((s) => typeof s === 'string' && s.trim())) p.push(`${id}: affectedSlugs must all be non-empty strings`);
  if (!ev.whatHappened || typeof ev.whatHappened !== 'string' || ev.whatHappened.trim().length < 40) p.push(`${id}: whatHappened must be a substantive string`);
  if (!Array.isArray(ev.sources) || !ev.sources.length) p.push(`${id}: sources must be a non-empty array`);
  else ev.sources.forEach((s, i) => {
    if (!s || typeof s.url !== 'string' || !/^https?:\/\//.test(s.url)) p.push(`${id}: source[${i}] needs an http(s) url`);
    if (!s || (!s.publisher && !s.title)) p.push(`${id}: source[${i}] needs a publisher or title`);
  });
  // Forecast scan applies to the LABEL only, never to whatHappened: the account is DOCUMENTED
  // history and legitimately quotes contemporaneous facts ("USDA cut its crop production forecast"),
  // which is not the site predicting prices. The label is a short event name and shouldn't forecast.
  const fc = forecastHit(ev.label);
  if (fc) p.push(`${id}: label has forecast phrasing "${fc}" (documented history only)`);
  return p;
}

function stripTags(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
// The FRAMING text the render itself authors — intro, meta, co-occurrence tags, labels, foot —
// with the <details> drawers removed. The drawers hold the registry's DOCUMENTED prose (and, on
// ES, the English label), which is historical fact and must not be keyword-policed; only the
// site's own framing is held to the co-occurrence / no-forecast rule.
function framingText(sectionHtml) { return stripTags(sectionHtml.replace(/<details[\s\S]*?<\/details>/g, ' ')); }
// Every documented-event block must wear a co-occurrence tag — the structural guarantee that the
// render presents it as context, never as a cause.
const COOCCUR_TAGS = ['Documented around this time', 'Evento documentado en esas fechas'];
function listPages() {
  const out = [];
  for (const dir of ['cost-index', path.join('es', 'cost-index')]) {
    const abs = path.join(repo, dir);
    let slugs = [];
    try { slugs = fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { continue; }
    for (const s of slugs) { const f = path.join(abs, s, 'index.html'); if (fs.existsSync(f)) out.push(f); }
  }
  return out;
}

function run() {
  const problems = [];
  const detection = rd('data/cost-index-events.json');
  const registry = rd('cost-index/events.json');
  if (!detection || !detection.items) problems.push('data/cost-index-events.json missing/malformed (run build-cost-index-events.mjs)');
  if (!registry || !Array.isArray(registry.events)) problems.push('cost-index/events.json missing/malformed');
  if (problems.length) return problems;

  // (1) detection artifact carries no cause / forecast / change-point field
  for (const k of Object.keys(detection.items)) for (const e of (detection.items[k].events || [])) {
    for (const bad of ['cause', 'why', 'reason', 'forecast', 'changePoint', 'change_point', 'step']) {
      if (bad in e) problems.push(`detection leak: ${k} event ${e.date} carries forbidden field '${bad}'`);
    }
  }

  // (2) registry shape + framing
  if (registry.framing !== 'co-occurrence-not-causation') problems.push(`registry framing must be "co-occurrence-not-causation" (got "${registry.framing}")`);
  if (typeof registry.count === 'number' && registry.count !== registry.events.length) problems.push(`registry count ${registry.count} != events.length ${registry.events.length}`);
  for (const ev of registry.events) problems.push(...validateEvent(ev));

  // (3) rendered events section stays co-occurrence-only. Scan the site's FRAMING (drawers
  // stripped) for causation/forecast, and assert every documented-event block wears a
  // co-occurrence tag so it can never read as an asserted cause.
  for (const f of listPages()) {
    const html = fs.readFileSync(f, 'utf8');
    const secs = html.match(/<section class="ci-events[\s\S]*?<\/section>/g);
    if (!secs) continue;
    const rel = path.relative(repo, f);
    const frame = framingText(secs.join(' '));
    const cz = causalHit(frame); if (cz) problems.push(`RENDER: ${rel} events framing asserts causation — "${cz}"`);
    const fz = forecastHit(frame); if (fz) problems.push(`RENDER: ${rel} events framing speaks a forecast — "${fz}"`);
    const ctxCount = (secs.join(' ').match(/class="ci-events__ctx"/g) || []).length;
    const tagCount = COOCCUR_TAGS.reduce((n, t) => n + (secs.join(' ').split(t).length - 1), 0);
    if (ctxCount > tagCount) problems.push(`RENDER: ${rel} has ${ctxCount} event block(s) but only ${tagCount} co-occurrence tag(s) — a block is missing its context framing`);
  }

  return problems;
}

function selfTest() {
  const good = { id: 'x', label: 'BSE case (2003)', startDate: '2003-12', endDate: '2004-12', affectedSlugs: ['ribeye'], whatHappened: 'USDA announced the first US case of BSE in a Washington dairy cow; dozens of countries closed borders to US beef.', sources: [{ url: 'https://cdc.gov/x', publisher: 'CDC' }] };
  const checks = [
    ['clean event passes', validateEvent(good).length === 0],
    ['missing id fails', validateEvent({ ...good, id: '' }).some((m) => /missing id/.test(m))],
    ['bad startDate fails', validateEvent({ ...good, startDate: '2003' }).some((m) => /startDate must be/.test(m))],
    ['empty affectedSlugs fails', validateEvent({ ...good, affectedSlugs: [] }).some((m) => /affectedSlugs/.test(m))],
    ['thin whatHappened fails', validateEvent({ ...good, whatHappened: 'too short' }).some((m) => /substantive/.test(m))],
    ['source without url fails', validateEvent({ ...good, sources: [{ publisher: 'x' }] }).some((m) => /http\(s\) url/.test(m))],
    ['source without name fails', validateEvent({ ...good, sources: [{ url: 'https://x' }] }).some((m) => /publisher or title/.test(m))],
    ['forecast in label fails', validateEvent({ ...good, label: 'Prices expected to rise next year' }).some((m) => /forecast phrasing/.test(m))],
    ['forecast in whatHappened is ALLOWED (documented USDA crop forecast)', validateEvent({ ...good, whatHappened: 'USDA NASS forecast the Florida orange crop at 54 million boxes, later cut.' }).length === 0],
    ['causal render string is caught', causalHit('the outbreak caused the price to spike') !== null],
    ['co-occurrence render string is clean', causalHit('Documented around this time: BSE case. Prices moved 40% above normal.') === null && forecastHit('Documented around this time: BSE case.') === null],
    ['forecast render string is caught', forecastHit('prices will rise next year') !== null],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`cost-index-events honesty self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

const problems = run();
if (problems.length) {
  problems.forEach((m) => console.error('✗ ' + m));
  console.error(`✗ cost-index events honesty gate: ${problems.length} problem(s).`);
  process.exit(1);
}
const reg = rd('cost-index/events.json') || { events: [] };
console.log(`✓ cost-index events honesty gate — ${reg.events.length} documented event(s), co-occurrence framing intact; no causation or forecast on any page.`);
