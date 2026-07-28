#!/usr/bin/env node
/**
 * check-study-engine-parity.mjs — render-parity gate for the menu-pricing field-report study
 * (cost-index/menu-pricing/study/index.html + its ES mirror).
 *
 * The committed study pages run AHEAD of the in-container engine in their nav / head CSS / JSON-LD
 * (the ADR-018 "engine-behind-pages" hazard), so a full engine regen is never run for them. But the
 * study BODY — and specifically the four matter-of-fact closing blocks (Methods, How-sure /
 * confidence, Limitations, and the CC-BY-critical Data-availability block) — is engine-owned: it is
 * rendered by studyMlBlocks() in scripts/lib/cost-research.mjs from data/cost-research-study.json.
 * Before ADR-019 the committed pages shipped confidence + data-availability but emitStudy() did NOT
 * render them, so any regen would have silently DROPPED both. This gate pins the fix: the engine's
 * studyMlBlocks() output must match the committed ML region for BOTH locales (normalized for
 * insignificant HTML whitespace + entity encoding — the committed page uses named entities the
 * uniform escaper renders as their literal glyphs, which are byte-different but render-identical).
 *
 * It also holds the honesty structure of the data-availability block (it links the public CC-BY
 * downloads and the in-page #methods anchor, and keeps the "descriptive … never a forecast and never
 * a measured cause" contract) and EN/ES field parity.
 *
 *   node scripts/check-study-engine-parity.mjs
 *   node scripts/check-study-engine-parity.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { studyMlBlocks, studyAnswersBlock, studyEvidenceData, studyEvidenceBlock, STUDY_ANSWERS_SENTINEL, STUDY_ANSWERS_CSS_SENTINEL, STUDY_EVIDENCE_SENTINEL, STUDY_EVIDENCE_CSS_SENTINEL } from './lib/cost-research.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_PAGE = 'cost-index/menu-pricing/study/index.html';
const ES_PAGE = 'es/cost-index/menu-pricing/study/index.html';
const STUDY_JSON = 'data/cost-research-study.json';
const REFS_JSON = 'data/research-references.json';
const CANON = { en: 'https://muntin.digital/cost-index/menu-pricing/study/', es: 'https://muntin.digital/es/cost-index/menu-pricing/study/' };

// the host escaper — kept byte-identical to escHtml() in scripts/build-cost-index-pages.mjs
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Normalize two HTML fragments for a render-equivalence compare: decode the cosmetic named entities
// the committed page uses (&rsquo;/&mdash;/… render identically to their glyphs), then drop
// insignificant whitespace between tags and collapse the rest. Structural entities (&lt;/&gt;/&amp;)
// are decoded on BOTH sides equally so real <a> tags stay tags and escaped text stays comparable.
function norm(s) {
  return String(s)
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

// The committed ML region: the four contiguous pb-ml blocks between the paper sections and the
// takeaway — from the Methods div (which carries id="methods") through the last </div> before the
// takeaway paragraph. studyMlBlocks() renders exactly this region.
function committedMlRegion(html) {
  const start = html.indexOf('<div class="pb-ml"><h2 id="methods">');
  if (start < 0) return null;
  const end = html.indexOf('<p class="pb-takeaway">', start);
  if (end < 0) return null;
  return html.slice(start, end);
}

function limParaCount(mlRegion, label) {
  const m = mlRegion.match(new RegExp('<div class="pb-ml"><h2>' + label + '</h2>([\\s\\S]*?)</div>'));
  return m ? (m[1].match(/<p>/g) || []).length : -1;
}

function check({ study, refsData, enPage, esPage }) {
  const errs = [];
  const LOCS = [
    { loc: 'en', es: false, page: enPage, name: 'EN', confH: 'How sure we are', daH: 'Data availability', limH: 'Limitations' },
    { loc: 'es', es: true, page: esPage, name: 'ES', confH: 'Qué tan seguros estamos', daH: 'Disponibilidad de datos', limH: 'Limitaciones' },
  ];

  for (const L of LOCS) {
    const s = study[L.loc];
    if (!s) { errs.push(`${L.name}: no "${L.loc}" object in ${STUDY_JSON}`); continue; }

    // JSON honesty/shape
    if (!s.confidence || typeof s.confidence !== 'string') errs.push(`${L.name}: study.${L.loc}.confidence missing or not a string`);
    if (!Array.isArray(s.limitations) || !s.limitations.length) errs.push(`${L.name}: study.${L.loc}.limitations must be a non-empty array of paragraphs`);
    if (!s.dataAvailability || typeof s.dataAvailability !== 'string') errs.push(`${L.name}: study.${L.loc}.dataAvailability missing or not a string`);
    else {
      if (!/<a /.test(s.dataAvailability)) errs.push(`${L.name}: dataAvailability carries no <a> link (the CC-BY downloads must be linked)`);
      if (!s.dataAvailability.includes('href="/cost-index/menu-pricing.json"')) errs.push(`${L.name}: dataAvailability does not link the CC-BY menu-pricing.json download`);
      if (!s.dataAvailability.includes('href="#methods"')) errs.push(`${L.name}: dataAvailability does not link the in-page #methods anchor`);
    }

    // ENGINE render vs COMMITTED region (normalized render-equivalence)
    const rendered = studyMlBlocks(s, L.es, escHtml);
    const committed = committedMlRegion(L.page);
    if (!committed) { errs.push(`${L.name}: could not locate the committed ML region (missing <h2 id="methods"> or takeaway anchor)`); continue; }
    if (norm(rendered) !== norm(committed)) {
      let i = 0; const a = norm(rendered), b = norm(committed);
      while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
      errs.push(`${L.name}: engine studyMlBlocks() render DRIFTS from the committed page near "${b.slice(Math.max(0, i - 20), i + 30)}" — a regen would change the shipped body`);
    }

    // committed structure (defence in depth — must show all four blocks with the right anchors)
    if (!committed.includes('<h2 id="methods">')) errs.push(`${L.name}: committed Methods heading is missing its id="methods" (the data-availability #methods link would dangle)`);
    if (!committed.includes(`<h2>${L.confH}</h2>`)) errs.push(`${L.name}: committed page is missing the "${L.confH}" (confidence) block`);
    if (!committed.includes(`<h2>${L.daH}</h2>`)) errs.push(`${L.name}: committed page is missing the "${L.daH}" (data-availability) block`);
    const nLim = limParaCount(committed, L.limH);
    if (nLim !== s.limitations.length) errs.push(`${L.name}: committed Limitations has ${nLim} paragraph(s) but the JSON carries ${s.limitations.length}`);

    // "Ask this paper" answer layer (§B): JSON shape → engine render → committed region parity
    if (!Array.isArray(s.answers) || !s.answers.length) errs.push(`${L.name}: study.${L.loc}.answers must be a non-empty array`);
    else {
      for (const x of s.answers) if (!x.q || !x.a || !x.slug) errs.push(`${L.name}: an answer atom is missing q/a/slug`);
      const start = L.page.indexOf(STUDY_ANSWERS_SENTINEL.start);
      const end = L.page.indexOf(STUDY_ANSWERS_SENTINEL.end);
      if (start < 0 || end < 0) errs.push(`${L.name}: committed page is missing the study-answers sentinel block`);
      else {
        const committedAns = L.page.slice(start, end + STUDY_ANSWERS_SENTINEL.end.length);
        const rendered = studyAnswersBlock(s, L.es, escHtml, CANON[L.loc]);
        if (norm(rendered) !== norm(committedAns)) {
          const a = norm(rendered), b = norm(committedAns); let i = 0; while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
          errs.push(`${L.name}: engine studyAnswersBlock() render DRIFTS from the committed page near "${b.slice(Math.max(0, i - 20), i + 30)}"`);
        }
        if (!committedAns.includes('"FAQPage"')) errs.push(`${L.name}: answers block is missing its FAQPage JSON-LD`);
        for (const x of (s.answers || [])) if (!committedAns.includes(`id="ans-${x.slug}"`)) errs.push(`${L.name}: committed answers block is missing anchor id="ans-${x.slug}"`);
      }
      if (!L.page.includes(STUDY_ANSWERS_CSS_SENTINEL.start)) errs.push(`${L.name}: committed <head> is missing the study-answers CSS block (the answer cards would be unstyled)`);
    }

    // "The evidence, on the page" (§C): engine render → committed region parity + honesty invariants
    if (refsData) {
      const eStart = L.page.indexOf(STUDY_EVIDENCE_SENTINEL.start);
      const eEnd = L.page.indexOf(STUDY_EVIDENCE_SENTINEL.end);
      if (eStart < 0 || eEnd < 0) errs.push(`${L.name}: committed page is missing the study-evidence sentinel block`);
      else {
        const committedEvi = L.page.slice(eStart, eEnd + STUDY_EVIDENCE_SENTINEL.end.length);
        const evData = studyEvidenceData(s, refsData, repo);
        if (norm(studyEvidenceBlock(evData, L.es, escHtml)) !== norm(committedEvi)) {
          const a = norm(studyEvidenceBlock(evData, L.es, escHtml)), b = norm(committedEvi); let i = 0; while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
          errs.push(`${L.name}: engine studyEvidenceBlock() render DRIFTS from the committed page near "${b.slice(Math.max(0, i - 20), i + 30)}" — re-run the study propagation`);
        }
        const rows = (committedEvi.match(/id="claim-ref\d+"/g) || []).length;
        if (rows !== evData.sources.length) errs.push(`${L.name}: evidence table has ${rows} rows, expected ${evData.sources.length}`);
        if (!/Category trim multipliers|Multiplicadores de merma por categor/.test(committedEvi)) errs.push(`${L.name}: figure 2 is not titled "Category trim multipliers"`);
        if (/trim[-\s]tax range|rango de merma/i.test(committedEvi)) errs.push(`${L.name}: the category-multiplier figure uses a banned "range" label (it is a category average, not a per-ingredient range)`);
        if (!/li[mn][ae] 2\.86×/.test(committedEvi)) errs.push(`${L.name}: the category figure does not reconcile category-vs-individual (lime 2.86×)`);
      }
      if (!L.page.includes(STUDY_EVIDENCE_CSS_SENTINEL.start)) errs.push(`${L.name}: committed <head> is missing the study-evidence CSS block`);
    }
  }

  // EN/ES field parity for the engine-owned fields
  const need = ['methods', 'confidence', 'limitations', 'dataAvailability', 'answers'];
  if (study.en && study.es) {
    for (const k of need) {
      const inEn = study.en[k] != null, inEs = study.es[k] != null;
      if (inEn !== inEs) errs.push(`parity: study.${k} is present in ${inEn ? 'EN' : 'ES'} but not ${inEn ? 'ES' : 'EN'}`);
    }
  }

  return errs;
}

function selfTest() {
  const ans = (n) => [{ slug: 'x', q: 'Q?', a: 'A' + n, groundsRefs: [1] }];
  const mk = () => ({
    en: { methods: 'M', confidence: 'C', limitations: ['a', 'b'], dataAvailability: 'x <a href="/cost-index/menu-pricing.json">j</a> <a href="#methods">m</a> y', answers: ans('en') },
    es: { methods: 'Mx', confidence: 'Cx', limitations: ['ax', 'bx'], dataAvailability: 'xs <a href="/cost-index/menu-pricing.json">j</a> <a href="#methods">m</a> ys', answers: ans('es') },
  });
  const pageOf = (study, es, opts = {}) => {
    const s = es ? study.es : study.en;
    const ml = opts.mlOverride != null ? opts.mlOverride : studyMlBlocks(s, es, escHtml);
    const answers = opts.ansOverride != null ? opts.ansOverride : studyAnswersBlock(s, es, escHtml, CANON[es ? 'es' : 'en']);
    return `<head><style>${STUDY_ANSWERS_CSS_SENTINEL.start} ${STUDY_ANSWERS_CSS_SENTINEL.end}</style></head><main><div class="pb-study">${answers}${opts.pre || ''}${ml}<p class="pb-takeaway">t</p></div></main>`;
  };

  // sanity: studyMlBlocks emits all four blocks in order
  const r = studyMlBlocks(mk().en, false, escHtml);
  const order = ['id="methods"', 'How sure we are', 'Limitations', 'Data availability'].map((t) => r.indexOf(t));
  if (order.some((i) => i < 0) || order.slice(1).some((v, i) => v < order[i])) {
    console.error('SELF-TEST FAIL — studyMlBlocks did not emit Methods→confidence→Limitations→Data-availability in order:', order); process.exit(1);
  }

  const good = mk();
  const clean = check({ study: good, enPage: pageOf(good, false), esPage: pageOf(good, true) });
  if (clean.length) { console.error('SELF-TEST FAIL — clean study produced errors:', clean); process.exit(1); }

  const cases = [
    // engine drops the data-availability block from the committed page (regen regression)
    ['committed missing data-availability', () => {
      const g = mk();
      const dropped = studyMlBlocks(g.en, false, escHtml).replace(/<div class="pb-ml"><h2>Data availability<\/h2>[\s\S]*?<\/div>/, '');
      return { study: g, enPage: pageOf(g, false, { mlOverride: dropped }), esPage: pageOf(g, true) };
    }, 'DRIFTS'],
    // JSON loses the confidence field
    ['json missing confidence', () => { const g = mk(); delete g.en.confidence; return { study: g, enPage: pageOf(g, false), esPage: pageOf(g, true) }; }, 'confidence missing'],
    // data-availability no longer links the CC-BY download
    ['data-availability unlinked', () => { const g = mk(); g.en.dataAvailability = 'no links here'; return { study: g, enPage: pageOf(g, false), esPage: pageOf(g, true) }; }, 'menu-pricing.json'],
    // #methods anchor target removed → dangling in-page link
    ['methods id removed', () => {
      const g = mk();
      const noId = studyMlBlocks(g.en, false, escHtml).replace('<h2 id="methods">', '<h2>');
      return { study: g, enPage: pageOf(g, false, { mlOverride: noId }), esPage: pageOf(g, true) };
    }, 'id="methods"'],
    // EN/ES parity break
    ['parity break', () => { const g = mk(); delete g.es.dataAvailability; return { study: g, enPage: pageOf(g, false), esPage: pageOf(g, true) }; }, 'parity'],
    // committed page drops the whole answers block
    ['answers block dropped', () => { const g = mk(); return { study: g, enPage: pageOf(g, false, { ansOverride: '' }), esPage: pageOf(g, true) }; }, 'sentinel block'],
    // answers block present but FAQPage stripped
    ['FAQPage stripped', () => { const g = mk(); const a = studyAnswersBlock(g.en, false, escHtml, CANON.en).replace(/<script[\s\S]*?<\/script>/, ''); return { study: g, enPage: pageOf(g, false, { ansOverride: a }), esPage: pageOf(g, true) }; }, 'FAQPage'],
    // head CSS block missing → unstyled cards
    ['answers CSS missing', () => { const g = mk(); const p = pageOf(g, false).replace(STUDY_ANSWERS_CSS_SENTINEL.start, ''); return { study: g, enPage: p, esPage: pageOf(g, true) }; }, 'CSS block'],
  ];
  const missed = [];
  for (const [name, build, want] of cases) {
    const got = check(build());
    if (!got.some((e) => e.includes(want))) missed.push(`${name} (wanted "${want}", got: ${JSON.stringify(got)})`);
  }
  if (missed.length) { console.error('SELF-TEST FAIL — missed:', missed); process.exit(1); }
  console.log('✓ self-test: clean study passes; caught all', cases.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();

let study, refsData, enPage, esPage;
try {
  study = JSON.parse(fs.readFileSync(path.join(repo, STUDY_JSON), 'utf8'));
  refsData = (JSON.parse(fs.readFileSync(path.join(repo, REFS_JSON), 'utf8')).studies) || [];
  enPage = fs.readFileSync(path.join(repo, EN_PAGE), 'utf8');
  esPage = fs.readFileSync(path.join(repo, ES_PAGE), 'utf8');
} catch (e) { console.error(`check-study-engine-parity: cannot read a source file: ${e.message}`); process.exit(1); }

const errors = check({ study, refsData, enPage, esPage });
if (errors.length) {
  console.error(`✗ Study engine-parity gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('✓ Study engine-parity gate — engine studyMlBlocks() renders the committed Methods/confidence/Limitations/Data-availability blocks byte-equivalent in EN+ES; data-availability links the CC-BY downloads + #methods anchor; EN/ES field parity holds.');
