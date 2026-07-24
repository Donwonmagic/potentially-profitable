#!/usr/bin/env node
/**
 * build-study-dataset.mjs — the machine-readable evidence table behind the menu-pricing
 * research paper (/cost-index/menu-pricing/study/), released CC-BY 4.0. It turns the paper
 * from a publication into a citable OPEN SURFACE: the claims (its sections) × the sources
 * that ground them (the 36 used of the 61-source verified reference bank) × each source's
 * finding, how it grounds the paper's claim, the myth it corrects, its confidence, and its
 * DOI. A researcher can reuse the bibliography and the claim→source mapping directly.
 *
 * Single source of truth: the SAME data + first-appearance ordering emitStudy() renders from
 * (data/cost-research-study.json × data/research-references.json), so the dataset can never
 * drift from the paper's own citations.
 *
 * Honesty: the source titles/authors/DOIs are facts; the finding/groundsHow/myth are Muntin's
 * own compiled summaries + analysis (hence CC-BY, with attribution). The paper's underlying
 * per-ingredient NUMBERS live in the companion menu-pricing.{json,csv} (also CC-BY) — this
 * dataset is the EVIDENCE layer, not the measurements. Nothing here is a forecast.
 *
 *   node scripts/build-study-dataset.mjs            # write study.{json,csv}
 *   node scripts/build-study-dataset.mjs --check    # CI: fail if stale
 *   node scripts/build-study-dataset.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// import-safe: the write/self-test/check tail runs only on direct invocation, so check-study-
// datapackage.mjs can import buildDatapackage/parseCsv/MENU_FIELDS without triggering a disk write.
const isMain = () => import.meta.url === pathToFileURL(process.argv[1] || '').href;
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
const URL = 'https://muntin.digital/cost-index/menu-pricing/study/';

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const rd0 = (p) => fs.readFileSync(path.join(repo, p), 'utf8');
const citeKey = (s) => `${s.authors} (${s.year}), "${s.title}", ${s.venue}`;
// RFC4180 field: quote when it carries a comma, quote, CR or LF; double interior quotes.
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// A small RFC4180 parser — used by the self-test to prove the emitted study.csv round-trips
// losslessly (prose fields carry commas, quotes, and em-dashes). Returns an array of string rows.
export function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip — CRLF or bare CR */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Replicate emitStudy()'s first-appearance ordering so the dataset's numbering matches the
// paper's rendered [n] citations exactly. Returns { paper, sources, grounding }.
export function buildEvidence(study, refsData) {
  const byKey = {}; for (const s of refsData) byKey[citeKey(s)] = s;
  const num = {}; const ordered = [];
  for (const sec of (study.sections || [])) for (const c of (sec.citeStrings || [])) {
    if (num[c] == null && byKey[c]) { num[c] = ordered.length + 1; ordered.push(byKey[c]); }
  }
  // which section h2s cite each source
  const citedIn = {}; // key -> [h2]
  for (const sec of (study.sections || [])) for (const c of new Set(sec.citeStrings || [])) {
    if (num[c]) (citedIn[c] = citedIn[c] || []).push(sec.h2);
  }
  const sources = ordered.map((s, i) => ({
    ref_n: i + 1,
    kind: s.kind || null,
    layer: s.layer || null,
    authors: s.authors,
    year: s.year,
    title: s.title,
    venue: s.venue,
    doi: /^https?:\/\//.test(s.id || '') ? s.id : null,
    id: s.id || null,
    finding: s.finding || null,
    grounds_how: s.groundsHow || null,
    myth: s.myth || null,
    confidence: s.confidence || null,
    cited_in_sections: citedIn[citeKey(s)] || [],
  }));
  const grounding = (study.sections || []).map((sec) => ({
    section: sec.h2,
    grounded_in: (sec.citeStrings || []).filter((c) => num[c]).map((c) => num[c]),
  }));
  const paper = {
    title: study.title,
    url: URL,
    abstract: (study.abstract || []).join(' '),
    contribution: study.contribution || null,
    keywords: study.keywords || [],
    source_count: sources.length,
    bank_size: refsData.length,
  };
  return { paper, sources, grounding };
}

function buildJson(ev, generated) {
  return {
    _doc: 'Evidence table for the Muntin menu-pricing research paper (/cost-index/menu-pricing/study/): the paper’s claims (sections) × the ' + ev.sources.length + ' sources that ground them, each with its finding, how it grounds the claim, the myth it corrects, its confidence, and its DOI. Source facts (author/title/DOI) are public; the finding/grounds_how/myth summaries are Muntin’s compiled analysis, released CC-BY. The paper’s per-ingredient numbers are the companion menu-pricing.{json,csv}. Descriptive of the tracked record and the literature; never a forecast. Deterministic re-derivation of the paper’s own citations.',
    license: CCBY,
    attribution: 'Muntin Cost Index — Menu-Pricing Playbook (field report). CC BY 4.0.',
    generated: generated || null,
    paper: ev.paper,
    sources: ev.sources,
    grounding: ev.grounding,
  };
}

// Lossless 13-column CSV: adds finding / grounds_how / myth (the compiled analysis) so the CSV
// carries every field the JSON does — RFC4180-quoted, since those prose fields hold commas + quotes.
const STUDY_COLS = ['ref_n', 'kind', 'layer', 'authors', 'year', 'title', 'venue', 'doi', 'finding', 'grounds_how', 'myth', 'confidence', 'cited_in_sections'];
function buildCsv(ev) {
  const rows = ev.sources.map((s) => ({ ...s, cited_in_sections: (s.cited_in_sections || []).join(' | ') }));
  return STUDY_COLS.join(',') + '\n' + rows.map((r) => STUDY_COLS.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

// Frictionless Data Package descriptor for the two CSV resources (study.csv here + the sibling
// menu-pricing.csv built elsewhere). Each resource pins bytes + a sha256 hash of the exact emitted
// bytes, so check-study-datapackage.mjs can prove the descriptor never drifts from the data. Field
// descriptions carry units + type labels (incl. the trim_tax per-row-vs-category note) and the
// per-node license split (§8 / ADR-015). Deterministic — no clock, version tracks the study date.
const STUDY_FIELDS = [
  { name: 'ref_n', type: 'integer', title: 'Citation number', description: 'Citation number in first-appearance order in the paper.', constraints: { required: true } },
  { name: 'kind', type: 'string', description: 'Source kind (econ, food-science, industry…).' },
  { name: 'layer', type: 'string', description: 'The analytical layer this source grounds.' },
  { name: 'authors', type: 'string', description: 'Source authors — public bibliographic fact.' },
  { name: 'year', type: 'integer', description: 'Publication year — public bibliographic fact.' },
  { name: 'title', type: 'string', description: 'Source title — public bibliographic fact.' },
  { name: 'venue', type: 'string', description: 'Publication venue — public bibliographic fact.' },
  { name: 'doi', type: 'string', description: 'Resolvable DOI where present — public fact; blank for the lone book (OCLC/ISBN in study.json).' },
  { name: 'finding', type: 'string', description: "Muntin's compiled one-line summary of the source's finding — CC BY 4.0 analysis." },
  { name: 'grounds_how', type: 'string', description: "Muntin's note on how the source grounds the paper's claim — CC BY 4.0 analysis." },
  { name: 'myth', type: 'string', description: "The myth the source corrects, where applicable — Muntin's compiled reading, CC BY 4.0." },
  { name: 'confidence', type: 'string', description: "Muntin's stated confidence in the grounding — not a statistical confidence level." },
  { name: 'cited_in_sections', type: 'string', description: 'Paper section headings that cite this source, pipe-joined ( | ).' },
];
const MENU_FIELDS = [
  { name: 'slug', type: 'string', description: 'Ingredient slug — stable key.', constraints: { required: true } },
  { name: 'name', type: 'string', description: 'Display name.' },
  { name: 'category', type: 'string', description: 'Yield-reference category grouping.' },
  { name: 'posture', type: 'string', description: "Pricing posture read against the ingredient's own baseline window.", constraints: { enum: ['lock', 'cushion', 'float', 'withhold'] } },
  { name: 'band_pct', type: 'number', unit: '%', description: "Half-width of the wholesale-reference band around the ingredient's own baseline — a market-direction spread, never a delivered $/lb." },
  { name: 'withhold_reason', type: 'string', description: 'Why a withhold: no_series (no public wholesale series to read) or too_volatile (series too wide to anchor). Blank unless posture=withhold.', constraints: { enum: ['no_series', 'too_volatile', ''] } },
  { name: 'coverage_pct', type: 'number', unit: '%', description: 'Share of the baseline window with usable wholesale coverage.' },
  { name: 'edible_yield_pct', type: 'number', unit: '%', description: 'Edible yield from the 134-ingredient reference — a reference figure, not a measured yield.' },
  { name: 'trim_tax', type: 'number', unit: '×', description: 'Per-ingredient reciprocal of the edible-yield reference ratio (1 ÷ yield); a reference multiplier, not a delivered cost; computed per row, independent of the category trim multiplier.' },
  { name: 'cheapest_month', type: 'integer', description: 'Month index 1–12, seasonal low in the tracked record; blank where the dispersion noise gate did not clear.', constraints: { minimum: 1, maximum: 12 } },
  { name: 'save_pct', type: 'number', unit: '%', description: "Saving in the cheapest month vs the ingredient's own high; blank where no window cleared." },
  { name: 'comover', type: 'string', description: 'A checked co-moving ingredient in the tracked record; blank where none — co-occurrence, never a measured cause.' },
  { name: 'comover_shared', type: 'integer', description: 'Number of shared large-move episodes with the co-mover.' },
  { name: 'comover_of', type: 'integer', description: 'Total large-move episodes considered for the co-mover test.' },
];
const LIC_CCBY = [{ name: 'CC-BY-4.0', path: CCBY, title: 'Creative Commons Attribution 4.0 International' }];

function buildDatapackage({ studyCsv, menuCsv, version }) {
  const dialect = { csvddfVersion: 1.2, delimiter: ',', doubleQuote: true, lineTerminator: '\n', quoteChar: '"', header: true };
  return {
    profile: 'tabular-data-package',
    name: 'muntin-menu-pricing-study',
    title: 'Muntin Menu-Pricing Field Report — evidence table & per-ingredient instrument',
    description: "Two CC BY 4.0 tables behind the menu-pricing field report (/cost-index/menu-pricing/study/): study.csv is the evidence table (the paper's claims × the sources that ground them, each with Muntin's compiled finding/grounds/myth summary + DOI); menu-pricing.csv is the per-ingredient instrument (posture, band, trim tax, cheapest month, co-mover). Descriptive of a tracked record and the published literature — never a forecast, never a measured cause. The per-ingredient numbers are Muntin's own read of US-government public-domain wholesale references; the summaries are Muntin's compiled analysis.",
    homepage: URL,
    version,
    licenses: LIC_CCBY,
    keywords: ['menu pricing', 'edible yield', 'trim tax', 'restaurant cost control', 'open data', 'CC-BY'],
    resources: [
      {
        name: 'study', path: 'study.csv', profile: 'tabular-data-resource',
        title: 'Evidence table — claims × grounding sources',
        format: 'csv', mediatype: 'text/csv', encoding: 'utf-8',
        bytes: Buffer.byteLength(studyCsv, 'utf8'), hash: 'sha256:' + sha256(studyCsv),
        dialect,
        schema: { fields: STUDY_FIELDS, primaryKey: 'ref_n' },
        licenses: LIC_CCBY,
        description: "Source facts (author/title/DOI) are public; the finding/grounds_how/myth summaries are Muntin's compiled analysis, released CC BY 4.0.",
      },
      {
        name: 'menu-pricing', path: '../../menu-pricing.csv', profile: 'tabular-data-resource',
        title: 'Per-ingredient pricing instrument',
        format: 'csv', mediatype: 'text/csv', encoding: 'utf-8',
        bytes: Buffer.byteLength(menuCsv, 'utf8'), hash: 'sha256:' + sha256(menuCsv),
        dialect,
        schema: { fields: MENU_FIELDS, primaryKey: 'slug' },
        licenses: LIC_CCBY,
        description: 'CC BY 4.0 joins computed over US-government public-domain source series (NASS/Census/EIA/PPI); the upstream series are public domain (CC0-equivalent), redistributed with retrieval dates. A wholesale reference, never a delivered price.',
      },
    ],
  };
}

function artifacts() {
  const studyFile = rd('data/cost-research-study.json');
  const study = studyFile.en;
  const refsData = rd('data/research-references.json').studies || [];
  const ev = buildEvidence(study, refsData);
  const studyCsv = buildCsv(ev);
  // menu-pricing.csv is a committed sibling built by build-cost-index-pages.mjs; the datapackage
  // pins ITS bytes/hash too, so the descriptor goes stale (and --check fails) if either CSV changes.
  const menuCsv = fs.readFileSync(path.join(repo, 'cost-index/menu-pricing.csv'), 'utf8');
  const version = String(studyFile.generated || '').replace(/-/g, '.') || null;
  const dp = buildDatapackage({ studyCsv, menuCsv, version });
  return [
    { rel: 'cost-index/menu-pricing/study/study.json', content: JSON.stringify(buildJson(ev, studyFile.generated), null, 2) + '\n' },
    { rel: 'cost-index/menu-pricing/study/study.csv', content: studyCsv },
    { rel: 'cost-index/menu-pricing/study/datapackage.json', content: JSON.stringify(dp, null, 2) + '\n' },
  ];
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error(`  ✗ ${n} got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const study = { title: 'T', abstract: ['a'], sections: [
    { h2: 'S1', citeStrings: ['A (2001), "X", V', 'B (2002), "Y", W'] },
    { h2: 'S2', citeStrings: ['A (2001), "X", V'] },      // A re-cited → still ref 1, S2 added to cited_in
    { h2: 'S3', citeStrings: ['Z (2009), "Q", V'] },       // no matching ref → dropped
  ] };
  const refs = [
    { authors: 'A', year: 2001, title: 'X', venue: 'V', id: 'https://doi.org/10.1/x', finding: 'f', groundsHow: 'g', myth: 'm', confidence: 'high', kind: 'econ', layer: 'l' },
    { authors: 'B', year: 2002, title: 'Y', venue: 'W', id: 'not-a-url', finding: 'f2', confidence: 'medium' },
  ];
  const ev = buildEvidence(study, refs);
  eq('first-appearance order: A=1, B=2', ev.sources.map((s) => [s.authors, s.ref_n]), [['A', 1], ['B', 2]]);
  eq('unmatched citeString dropped', ev.sources.length, 2);
  eq('A cited in S1 + S2', ev.sources[0].cited_in_sections, ['S1', 'S2']);
  eq('DOI extracted when url', ev.sources[0].doi, 'https://doi.org/10.1/x');
  eq('non-url id → doi null but id kept', [ev.sources[1].doi, ev.sources[1].id], [null, 'not-a-url']);
  eq('grounding maps section→ref numbers', ev.grounding, [{ section: 'S1', grounded_in: [1, 2] }, { section: 'S2', grounded_in: [1] }, { section: 'S3', grounded_in: [] }]);
  const csv = buildCsv(ev);
  eq('csv header is the 13 lossless columns', csv.split('\n')[0], 'ref_n,kind,layer,authors,year,title,venue,doi,finding,grounds_how,myth,confidence,cited_in_sections');
  eq('csv joins sections with pipe', parseCsv(csv)[1][12], 'S1 | S2');
  eq('csv carries the finding column', parseCsv(csv)[1][8], 'f');
  // RFC4180 round-trip: a prose field with a comma, a quote and a newline survives escape→parse
  const trickyRefs = [{ authors: 'C', year: 2003, title: 'Z', venue: 'V', id: 'https://doi.org/10.1/z', finding: 'a, "b"\nc', groundsHow: 'g', myth: 'm', confidence: 'high', kind: 'k', layer: 'l' }];
  const tEv = buildEvidence({ title: 'T', sections: [{ h2: 'S', citeStrings: ['C (2003), "Z", V'] }] }, trickyRefs);
  const parsed = parseCsv(buildCsv(tEv));
  eq('every parsed row has exactly 13 fields', parsed.every((r) => r.length === 13), true);
  eq('RFC4180 round-trips a comma+quote+newline field', parsed[1][8], 'a, "b"\nc');
  // datapackage: sha256/bytes must match the exact emitted CSV bytes (the sync guarantee)
  const menuCsv = rd0('cost-index/menu-pricing.csv');
  const dp = buildDatapackage({ studyCsv: csv, menuCsv, version: '2026.07.11' });
  eq('datapackage has 2 tabular resources', dp.resources.length, 2);
  eq('study resource hash matches emitted study.csv', dp.resources[0].hash, 'sha256:' + sha256(csv));
  eq('study resource bytes match emitted study.csv', dp.resources[0].bytes, Buffer.byteLength(csv, 'utf8'));
  eq('menu resource hash matches on-disk menu-pricing.csv', dp.resources[1].hash, 'sha256:' + sha256(menuCsv));
  eq('study schema has 13 fields', dp.resources[0].schema.fields.length, 13);
  eq('menu schema has 14 fields', dp.resources[1].schema.fields.length, 14);
  eq('study primaryKey is ref_n', dp.resources[0].schema.primaryKey, 'ref_n');
  eq('posture field carries the four-posture enum', dp.resources[1].schema.fields.find((f) => f.name === 'posture').constraints.enum, ['lock', 'cushion', 'float', 'withhold']);
  // live: the real paper uses 36 sources with zero unmatched citeStrings
  const live = buildEvidence(rd('data/cost-research-study.json').en, rd('data/research-references.json').studies || []);
  eq('live paper cites 36 sources', live.sources.length, 36);
  eq('live every source carries a persistent id', live.sources.every((s) => s.id), true);
  eq('live 35 of 36 have a DOI (the lone book uses OCLC/ISBN)', live.sources.filter((s) => s.doi).length, 35);
  console.log(`build-study-dataset self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

if (isMain()) {
  const args = new Set(process.argv.slice(2));
  if (args.has('--self-test')) selfTest();
  const arts = artifacts();
  if (args.has('--check')) {
    let drift = 0;
    for (const a of arts) { const p = path.join(repo, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-study-dataset.mjs`); } }
    if (drift) process.exit(1);
    console.log(`✓ study dataset in sync (${arts.length} artifact(s)).`);
    process.exit(0);
  }
  for (const a of arts) fs.writeFileSync(path.join(repo, a.rel), a.content);
  console.log(`Wrote study.{json,csv,datapackage.json} — ${JSON.parse(arts[0].content).paper.source_count} sources.`);
}
