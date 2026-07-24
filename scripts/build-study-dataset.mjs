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
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
const URL = 'https://muntin.digital/cost-index/menu-pricing/study/';

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const citeKey = (s) => `${s.authors} (${s.year}), "${s.title}", ${s.venue}`;
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

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

function buildCsv(ev) {
  const cols = ['ref_n', 'kind', 'layer', 'authors', 'year', 'title', 'venue', 'doi', 'confidence', 'cited_in_sections'];
  const rows = ev.sources.map((s) => ({ ...s, cited_in_sections: (s.cited_in_sections || []).join(' | ') }));
  return cols.join(',') + '\n' + rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

function artifacts() {
  const studyFile = rd('data/cost-research-study.json');
  const study = studyFile.en;
  const refsData = rd('data/research-references.json').studies || [];
  const ev = buildEvidence(study, refsData);
  return [
    { rel: 'cost-index/menu-pricing/study/study.json', content: JSON.stringify(buildJson(ev, studyFile.generated), null, 2) + '\n' },
    { rel: 'cost-index/menu-pricing/study/study.csv', content: buildCsv(ev) },
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
  eq('csv header', csv.split('\n')[0], 'ref_n,kind,layer,authors,year,title,venue,doi,confidence,cited_in_sections');
  eq('csv joins sections with pipe', csv.split('\n')[1].endsWith('S1 | S2'), true);
  // live: the real paper uses 36 sources with zero unmatched citeStrings
  const live = buildEvidence(rd('data/cost-research-study.json').en, rd('data/research-references.json').studies || []);
  eq('live paper cites 36 sources', live.sources.length, 36);
  eq('live every source carries a persistent id', live.sources.every((s) => s.id), true);
  eq('live 35 of 36 have a DOI (the lone book uses OCLC/ISBN)', live.sources.filter((s) => s.doi).length, 35);
  console.log(`build-study-dataset self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

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
console.log(`Wrote study.{json,csv} — ${JSON.parse(arts[0].content).paper.source_count} sources.`);
