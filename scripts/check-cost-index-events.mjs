#!/usr/bin/env node
/**
 * check-cost-index-events.mjs — the HONESTY gate for the notable-price-events surface.
 *
 * The surface has two halves:
 *   - data/cost-index-events.json       — DETECTION (pure math; its own --check keeps it in sync)
 *   - data/cost-index-event-notes.json  — the WHY (hand-curated, source-gated narratives)
 *
 * This gate guards the second half and the rendered pages. It fails the build if:
 *   1. a note is malformed (unknown ingredient, bad period, empty text/sources, or doesn't
 *      line up with a detected event within the engine's 12-week merge window);
 *   2. a note claims verified:true without a real https source (url_status:'live') AND a
 *      date_verified — "verified" must mean a human actually checked the source;
 *   3. an UNVERIFIED note's cause text has leaked into any built cost-index page — nothing
 *      unverified may ever reach the public HTML (the core promise of "I draft, you verify");
 *   4. a note speaks a FORECAST (this is price history, never prediction) or frames a
 *      Pettitt-style "regime/step change" as market fact (gated off per the 2026-07 audit);
 *   5. the detection artifact leaks a cause/forecast/change-point field.
 *
 * The self-test exercises the validators on synthetic inputs (no repo I/O), so the gate's
 * own logic is pinned. Run:
 *   node scripts/check-cost-index-events.mjs
 *   node scripts/check-cost-index-events.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MERGE_MS = 84 * 864e5;                 // 12 weeks — the engine's event-merge window
const CONFIDENCE = new Set(['high', 'medium', 'low']);

function rd(p) { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }

// Prediction / regime-step phrasing that must never appear in an event note.
const FORECAST_RE = [
  /\bforecast(s|ed|ing)?\b/i, /\bprojected\b/i, /\bexpected?\s+to\b/i,
  /\bwe\s+(expect|predict|forecast)\b/i, /\bgoing\s+to\s+(rise|fall|climb|drop)\b/i,
  /\bwill\s+(rise|fall|climb|drop|increase|decrease|likely|continue|keep)\b/i,
  /\bnext\s+(year|month|season|quarter)\b/i, /\blikely\s+to\s+(rise|fall|climb|drop)\b/i,
];
const REGIME_RE = [/\bregime\s+(change|shift|break)\b/i, /\bstep[-\s]change\b/i, /\bpettitt\b/i, /\bpermanently\s+(higher|lower|shifted)\b/i];
function bannedPhrase(text) {
  const t = String(text || '');
  for (const re of [...FORECAST_RE, ...REGIME_RE]) { const m = t.match(re); if (m) return m[0]; }
  return null;
}

// Validate one note's shape + provenance against the known ingredients and detected events.
// Returns an array of problem strings ([] = clean).
function validateNote(note, knownIngredients, eventsByIng) {
  const p = [];
  const id = note && note.ingredient ? `${note.ingredient}@${note.period}` : '(unnamed note)';
  if (!note || typeof note !== 'object') return [`${id}: not an object`];
  if (!note.ingredient || !knownIngredients.has(note.ingredient)) p.push(`${id}: unknown ingredient`);
  if (!/^\d{4}-\d{2}$/.test(note.period || '')) p.push(`${id}: period must be YYYY-MM`);
  for (const f of ['title', 'what', 'impact']) if (typeof note[f] !== 'string' || !note[f].trim()) p.push(`${id}: ${f} must be a non-empty string`);
  if (!CONFIDENCE.has(note.confidence)) p.push(`${id}: confidence must be high|medium|low`);
  if (typeof note.verified !== 'boolean') p.push(`${id}: verified must be boolean`);
  if (!Array.isArray(note.sources) || !note.sources.length) p.push(`${id}: sources must be a non-empty array`);
  else note.sources.forEach((s, i) => {
    if (!s || typeof s.name !== 'string' || !s.name.trim()) p.push(`${id}: source[${i}] missing name`);
    if (!s || typeof s.url !== 'string' || !/^https:\/\//.test(s.url)) p.push(`${id}: source[${i}] url must be https`);
  });
  // banned phrasing in any human text
  for (const f of ['title', 'what', 'impact']) { const hit = bannedPhrase(note[f]); if (hit) p.push(`${id}: ${f} contains banned phrase "${hit}" (no forecast / no regime-step)`); }
  // verified means a human checked it: every source live + a date
  if (note.verified === true) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date_verified || '')) p.push(`${id}: verified:true needs date_verified YYYY-MM-DD`);
    (note.sources || []).forEach((s, i) => { if (!s || s.url_status !== 'live') p.push(`${id}: verified but source[${i}] url_status is not 'live'`); });
  }
  // the note must line up with a real detected event (so a note can't invent an event)
  if (/^\d{4}-\d{2}$/.test(note.period || '') && knownIngredients.has(note.ingredient)) {
    const evs = eventsByIng[note.ingredient] || [];
    const pt = Date.parse(`${note.period}-15`);
    const near = evs.some((e) => Math.abs(Date.parse(e.date) - pt) <= MERGE_MS);
    if (evs.length && !near) p.push(`${id}: no detected event within 12 weeks — note does not match the price record`);
  }
  return p;
}

// Minimal HTML-entity escape (mirrors the page builder's escHtml) so a title with & < > " '
// is searched in its rendered form too.
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function stripTags(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
// Did an unverified note's cause text leak into the rendered pages? Checks the title and a
// distinctive slice of the 'what' against both the raw HTML and its tag-stripped text.
function leakedInto(note, pagesRaw, pagesText) {
  const needles = [note.title, String(note.what || '').slice(0, 48)].filter((s) => s && s.trim());
  for (const n of needles) {
    if (pagesText.includes(n) || pagesRaw.includes(esc(n)) || pagesRaw.includes(n)) return n;
  }
  return null;
}

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
  const events = rd('data/cost-index-events.json');
  const notesDoc = rd('data/cost-index-event-notes.json');
  if (!events || !events.items) problems.push('data/cost-index-events.json missing or malformed (run build-cost-index-events.mjs)');
  if (!notesDoc || !Array.isArray(notesDoc.notes)) problems.push('data/cost-index-event-notes.json missing or malformed');
  if (problems.length) return problems;

  const known = new Set(Object.keys(events.items));
  const eventsByIng = {};
  for (const k of known) eventsByIng[k] = (events.items[k].events || []);

  // (5) detection artifact must carry no cause / forecast / change-point field
  for (const k of known) for (const e of eventsByIng[k]) {
    for (const bad of ['cause', 'why', 'reason', 'forecast', 'changePoint', 'change_point', 'step']) {
      if (bad in e) problems.push(`detection leak: ${k} event ${e.date} carries forbidden field '${bad}'`);
    }
  }

  // (1)(2)(4) per-note validation
  for (const note of notesDoc.notes) problems.push(...validateNote(note, known, eventsByIng));

  // (3) no unverified note text may appear in any built page
  const pages = listPages();
  const raw = pages.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const text = stripTags(raw);
  let verifiedRendered = 0, verifiedTotal = 0;
  for (const note of notesDoc.notes) {
    if (note.verified === true) {
      verifiedTotal++;
      if (leakedInto(note, raw, text)) verifiedRendered++;   // present = good, expected
      continue;
    }
    const leak = leakedInto(note, raw, text);
    if (leak) problems.push(`HONESTY: unverified note ${note.ingredient}@${note.period} leaked into a built page — "${leak}"`);
  }

  // informational (not a failure): verified notes that didn't render (period out of top-N, ES untranslated, etc.)
  if (verifiedTotal && verifiedRendered < verifiedTotal) {
    console.log(`  note: ${verifiedTotal - verifiedRendered}/${verifiedTotal} verified note(s) not visible on a page yet (event outside top-N or ES not translated) — allowed.`);
  }

  return problems;
}

function selfTest() {
  const known = new Set(['eggs', 'butter']);
  const eventsByIng = { eggs: [{ date: '2025-02-17' }], butter: [{ date: '2014-10-04' }] };
  const good = { ingredient: 'eggs', period: '2025-02', title: 'Avian flu drove egg prices', what: 'A wave of avian influenza cut the laying flock.', impact: 'Prices ran well above normal for weeks.', sources: [{ name: 'USDA APHIS', url: 'https://www.aphis.usda.gov/x', url_status: 'pending-live-verify' }], confidence: 'high', verified: false, date_verified: null };
  const checks = [
    ['clean unverified note passes', validateNote(good, known, eventsByIng).length === 0],
    ['unknown ingredient fails', validateNote({ ...good, ingredient: 'unicorn' }, known, eventsByIng).some((m) => /unknown ingredient/.test(m))],
    ['bad period fails', validateNote({ ...good, period: '2025' }, known, eventsByIng).some((m) => /YYYY-MM/.test(m))],
    ['empty what fails', validateNote({ ...good, what: '' }, known, eventsByIng).some((m) => /what must be/.test(m))],
    ['http (not https) source fails', validateNote({ ...good, sources: [{ name: 'x', url: 'http://x' }] }, known, eventsByIng).some((m) => /url must be https/.test(m))],
    ['verified without date fails', validateNote({ ...good, verified: true, date_verified: null, sources: [{ name: 'x', url: 'https://x', url_status: 'live' }] }, known, eventsByIng).some((m) => /date_verified/.test(m))],
    ['verified with non-live source fails', validateNote({ ...good, verified: true, date_verified: '2026-07-07' }, known, eventsByIng).some((m) => /not 'live'/.test(m))],
    ['verified + live + date passes', validateNote({ ...good, verified: true, date_verified: '2026-07-07', sources: [{ name: 'x', url: 'https://x', url_status: 'live' }] }, known, eventsByIng).length === 0],
    ['off-record note (no nearby event) fails', validateNote({ ...good, period: '2000-01' }, known, eventsByIng).some((m) => /no detected event/.test(m))],
    ['forecast phrasing fails', validateNote({ ...good, impact: 'Prices are expected to rise next year.' }, known, eventsByIng).some((m) => /banned phrase/.test(m))],
    ['regime-step phrasing fails', validateNote({ ...good, what: 'This was a permanent regime shift in the market.' }, known, eventsByIng).some((m) => /banned phrase/.test(m))],
    ['leak detector finds unverified title', leakedInto(good, '<p>Avian flu drove egg prices</p>', 'Avian flu drove egg prices') !== null],
    ['leak detector clears absent title', leakedInto(good, '<p>nothing here</p>', 'nothing here') === null],
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
const notes = (rd('data/cost-index-event-notes.json') || {}).notes || [];
const verified = notes.filter((n) => n.verified === true).length;
console.log(`✓ cost-index events honesty gate — ${notes.length} note(s), ${verified} verified/${notes.length - verified} drafted; no unverified cause on any page.`);
