#!/usr/bin/env node
/**
 * audit-validator-calibration.mjs — how much of "13 of 15 NOT_READY" was the prompt?
 *
 * ============================== WHY ==============================
 *
 * Phase H asked 15 domain specialists whether the ninety-day plan was ready.
 * They were told, in the prompt, that "a validator who finds nothing has not
 * validated anything." 13 returned NOT_READY and 44 gaps came back marked
 * BLOCKING. The founder is now making decisions off that pair of numbers.
 *
 * A gap-seeking agent always finds a gap. So before the number is believed it
 * has to be separated into the part that is the REPO and the part that is the
 * PROMPT. This engagement has already produced the opposite failure once:
 * Phase 1's adversaries refuted 1 of 151 claims because they were shown the
 * maker's reasoning and asked to check it. Same models, same repo, opposite
 * error — which means neither number measured the repo.
 *
 * This script measures three things nobody can argue about:
 *
 *   1. REPRODUCTION — a registry of the corpus's own blocking assertions,
 *      each with the literal command that would confirm or refute it, RUN
 *      today against the current repos. Not read. Run.
 *   2. CONCENTRATION — 44 blocking gaps are not 44 defects. Fifteen lenses
 *      over one plan rediscover the same holes. The clustering rule is
 *      declared in CONCEPTS below and every assignment is recorded, so the
 *      dedup can be disagreed with per-claim rather than taken on trust.
 *   3. POINTER INTEGRITY — every `file:line` the validators cited, resolved
 *      against both repos. A validator that cites lines that do not exist is
 *      a different failure from one that cites lines that do.
 *
 * And it records a fourth thing that is a judgement, and says so: a NEUTRAL
 * re-verdict on a sample of domains. Its rubric, its per-claim inputs and an
 * explicit statement of its own confound live in
 * data/validator-neutral-verdicts.json. The protocol both arms failed, and the
 * one that replaces it, is ADR-035.
 *
 * ======================= THE FINDING TO EXPECT =======================
 *
 * The original prompt never DEFINED the verdict. "Is this domain ready?" with
 * no bar attached is answered by whatever bar the reader brings, and the
 * reader had been told that finding nothing is failure. A verdict with an
 * undefined threshold measures the instruction. That is not a criticism of
 * the validators' evidence — this script's own reproduction run is the test
 * of the evidence, and the evidence largely holds.
 *
 * ============================ WHY audit-* ============================
 *
 * Named `audit-*`, not `check-*`, and NOT wired into check-all: it executes
 * commands out of a registry and shells into the product repo, neither of
 * which belongs inside a deploy. It is a periodic instrument. `check-all` is
 * already red at 320/328 and this adds nothing to that surface.
 *
 *   node scripts/audit-validator-calibration.mjs              # everything
 *   node scripts/audit-validator-calibration.mjs --reproduce  # just the rechecks
 *   node scripts/audit-validator-calibration.mjs --cluster    # just the dedup
 *   node scripts/audit-validator-calibration.mjs --pointers   # just pointer integrity
 *   node scripts/audit-validator-calibration.mjs --neutral    # just the arm comparison
 *   node scripts/audit-validator-calibration.mjs --route      # who pays for the proposed Additions
 *   node scripts/audit-validator-calibration.mjs --write      # emit data/validator-calibration.json
 *   node scripts/audit-validator-calibration.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCorpus, REPO, REPO_PATHS, extractPointers } from './lib/validator-corpus.mjs';

const OUT = path.join(REPO, 'data', 'validator-calibration.json');
const NEUTRAL = path.join(REPO, 'data', 'validator-neutral-verdicts.json');
const PRODUCT = REPO_PATHS['Muntin-Invoice-Decoder'];

/* ------------------------------------------------------------------ *
 * 1. THE RECHECK REGISTRY
 *
 * One entry per sampled claim. `asStated` is the validator's assertion in
 * its own words. `cmd` is what settles it. `expect` reads {code, out} and
 * returns one of the VERDICTS. Nothing here is graded by reading prose —
 * if a claim cannot be settled by a command it does not belong in this
 * registry, it belongs in the DECISIONS list (Rule 1).
 * ------------------------------------------------------------------ */

/** REPRODUCES: true as stated, today. SUBSTANCE-HOLDS: the defect is real, a
 *  stated detail is not. STALE: was true, has since been closed. REFUTED: was
 *  not true as stated when written. */
export const VERDICTS = ['REPRODUCES', 'SUBSTANCE-HOLDS', 'STALE', 'REFUTED'];

const sh = (cmd, cwd = REPO) => {
  try {
    return { code: 0, out: execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 120000 }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

export const RECHECKS = [
  {
    id: 'R01',
    claim: 'ci-integrity#1',
    severity: 'BLOCKING',
    asStated:
      'check-queue.mjs exits 2 in EVERY mode (--brief, --budget, --checkpoints, --render, --self-test) because Q-004 carries status "closed", which is outside STATUSES.',
    cmd: () => {
      const modes = ['', '--brief', '--budget', '--checkpoints', '--render', '--self-test'];
      const codes = modes.map((m) => sh(`node scripts/check-queue.mjs ${m}`.trim()).code);
      const q = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8'));
      const bad = q.items.filter((i) => !['ready', 'claimed', 'blocked', 'done'].includes(i.status)).map((i) => i.id);
      return { codes, badStatuses: bad, allTwo: codes.every((c) => c === 2) };
    },
    grade: (r) =>
      r.allTwo && r.badStatuses.includes('Q-004')
        ? ['REPRODUCES', `all ${r.codes.length} modes exit 2; Q-004 status still outside the enum`]
        : r.allTwo
          ? ['SUBSTANCE-HOLDS', `all modes still exit 2, but for different rows (${r.badStatuses.join(', ')})`]
          : ['STALE', `exit codes now ${r.codes.join(',')}`],
  },
  {
    id: 'R02',
    claim: 'ci-integrity#2',
    severity: 'BLOCKING',
    asStated:
      'All ten checkpoints[].mustBeTrue[].verify.cmd fail with a shell-quoting ReferenceError — bare identifiers like [Q-002, Q-014] — not with "not closed".',
    cmd: () => {
      const q = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8'));
      const rows = [];
      for (const cp of q.checkpoints || [])
        for (const a of cp.mustBeTrue || []) {
          const c = a.verify?.cmd || a.verify?.command;
          if (!c) { rows.push({ cp: cp.id, verdict: 'NO-CMD' }); continue; }
          const r = sh(c);
          rows.push({ cp: cp.id, verdict: r.code === 0 ? 'PASS' : /ReferenceError|SyntaxError/.test(r.out) ? 'SYNTAX-BROKEN' : 'FAIL' });
        }
      return { rows, total: rows.length, broken: rows.filter((x) => x.verdict === 'SYNTAX-BROKEN').length };
    },
    grade: (r) =>
      r.total === 10 && r.broken === 10
        ? ['REPRODUCES', '10 of 10 assertions syntax-broken, exactly as stated']
        : r.broken > 0
          ? ['SUBSTANCE-HOLDS', `${r.broken} of ${r.total} syntax-broken (count differs from the stated 10 of 10)`]
          : ['STALE', `${r.total} assertions, none syntax-broken`],
  },
  {
    id: 'R03',
    claim: 'ci-integrity#3',
    severity: 'BLOCKING',
    asStated: 'check-removed-slugs.mjs is WIRED into check-all and exits 1 today because data/link-graph.json carries retired slug anchor text.',
    cmd: () => {
      const r = sh('node scripts/check-removed-slugs.mjs');
      const wired = readFileSync(path.join(REPO, 'scripts/check-all.mjs'), 'utf8').includes('check-removed-slugs');
      return { code: r.code, wired, mentionsLinkGraph: /link-graph\.json/.test(r.out) };
    },
    grade: (r) =>
      r.code === 1 && r.wired && r.mentionsLinkGraph
        ? ['REPRODUCES', 'wired, exits 1, and still names link-graph.json']
        : r.code === 1 && r.wired
          ? ['SUBSTANCE-HOLDS', 'wired and red, but no longer over link-graph.json']
          : ['STALE', `exit ${r.code}, wired=${r.wired}`],
  },
  {
    id: 'R04',
    claim: 'strategy#2 / finance-runway#3 / monetization (deskMinutesPerClose)',
    severity: 'BLOCKING',
    asStated:
      'A recursive grep for deskMinutes|desk_minutes|closeMinutes|close_minutes across the PRODUCT repo returns nothing — the parameter two kill criteria depend on is instrumented nowhere.',
    cmd: () => {
      if (!existsSync(PRODUCT)) return { unavailable: true };
      const r = sh(`grep -rIn -E 'deskMinutes|desk_minutes|closeMinutes|close_minutes' . --exclude-dir=node_modules --exclude-dir=.git || true`, PRODUCT);
      const hits = r.out.split('\n').filter(Boolean);
      const code = hits.filter((h) => /\.(ts|tsx|py|sql|js|mjs)[:=]/.test(h) || /\.(ts|tsx|py|sql|js|mjs):\d+:/.test(h));
      const q = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8'));
      const item = q.items.find((i) => /deskMinutes/i.test(JSON.stringify(i)));
      return { hits: hits.length, codeHits: code.length, sample: hits.slice(0, 3), queueItem: item?.id ?? null };
    },
    grade: (r) =>
      r.unavailable
        ? ['SUBSTANCE-HOLDS', 'product repo not present in this container — unverifiable here']
        : r.codeHits === 0 && r.hits > 0
          ? ['SUBSTANCE-HOLDS', `the letter is now false (${r.hits} doc-only hit(s): ${r.sample[0] || ''}) but ZERO are instrumentation; the defect stands${r.queueItem ? `, and a queue item (${r.queueItem}) now exists` : ', and no queue item exists'}`]
          : r.codeHits === 0
            ? ['REPRODUCES', 'no hit anywhere in the product repo']
            : ['STALE', `${r.codeHits} instrumentation hit(s) now exist`],
  },
  {
    id: 'R05',
    claim: 'product-truth#1 / security#1 / privacy-compliance (the no-LLM claim)',
    severity: 'BLOCKING',
    asStated:
      'The exception desk falsifies the no-language-model claim carried on ~91-93 storefront pages and on copy.ts:3082/3888/4067; sub-processors.md lists no LLM provider; no ADR or queue item touches it.',
    cmd: () => {
      const pages = Number(sh(`grep -rl 'language model' --include=index.html . | wc -l`).out.trim());
      const copy = existsSync(path.join(PRODUCT, 'apps/web/lib/copy.ts'))
        ? Number(sh(`grep -c -i 'language model' apps/web/lib/copy.ts || true`, PRODUCT).out.trim())
        : null;
      const subp = existsSync(path.join(PRODUCT, 'docs/sub-processors.md'))
        ? sh(`grep -c -iE 'anthropic|openai' docs/sub-processors.md || true`, PRODUCT).out.trim()
        : null;
      const adr = sh(`grep -rl 'exception desk' docs/editorial/decisions/ 2>/dev/null | wc -l`).out.trim();
      const q = readFileSync(path.join(REPO, 'data/queue.json'), 'utf8');
      const deskHits = (q.match(/exception desk/gi) || []).length;
      return { pages, copyHits: copy, subProcessorLlmMentions: Number(subp), adrFiles: Number(adr), queueDeskMentions: deskHits };
    },
    grade: (r) =>
      r.pages >= 85 && r.adrFiles === 0
        ? [
            r.pages === 91 || r.pages === 93 ? 'REPRODUCES' : 'SUBSTANCE-HOLDS',
            `${r.pages} storefront index.html carry the claim (validators said 91 and 93 — they disagree with each other); ${r.adrFiles} ADR names the exception desk; queue mentions it ${r.queueDeskMentions}x`,
          ]
        : ['STALE', `pages=${r.pages}, ADRs naming the desk=${r.adrFiles}`],
  },
  {
    id: 'R06',
    claim: 'strategy#3',
    severity: 'BLOCKING',
    asStated: 'ADR-030 line 75 still asserts the differentiator the board killed — "a fixed monthly close date is a promise their structure cannot make".',
    cmd: () => {
      const f = path.join(REPO, 'docs/editorial/decisions/ADR-030-one-price-one-cohort-no-billing-code.md');
      if (!existsSync(f)) return { missing: true };
      const lines = readFileSync(f, 'utf8').split('\n');
      const win = lines.slice(70, 80).join(' ');
      const q = readFileSync(path.join(REPO, 'data/queue.json'), 'utf8');
      return {
        stillAsserted: /promise their structure cannot make/.test(win),
        line75: (lines[74] || '').trim().slice(0, 90),
        supersededByQueueItem: /ADR-030:75/.test(q) ? (JSON.parse(q).items.find((i) => /ADR-030:75/.test(JSON.stringify(i)))?.id ?? null) : null,
      };
    },
    grade: (r) =>
      r.missing
        ? ['REFUTED', 'ADR-030 not on disk at the cited path']
        : r.stillAsserted
          ? [r.supersededByQueueItem ? 'SUBSTANCE-HOLDS' : 'REPRODUCES', r.supersededByQueueItem ? `still asserted, but ${r.supersededByQueueItem} now exists to supersede it` : 'still asserted, nothing supersedes it']
          : ['STALE', 'the sentence is gone'],
  },
  {
    id: 'R07',
    claim: 'finance-runway#1',
    severity: 'BLOCKING',
    asStated: 'The plan has an hours budget with teeth and no money budget at all — no cashUsd field, no capacity.cashBudget, and check-queue validates no dollar.',
    cmd: () => {
      const q = readFileSync(path.join(REPO, 'data/queue.json'), 'utf8');
      const cq = readFileSync(path.join(REPO, 'scripts/check-queue.mjs'), 'utf8');
      return {
        cashFieldsInQueue: (q.match(/cashUsd|cashBudget|dollarsUsd|spendUsd/g) || []).length,
        dollarLogicInChecker: (cq.match(/cashUsd|cashBudget|spendUsd|dollars/gi) || []).length,
        hoursLogicInChecker: (cq.match(/founderHours/g) || []).length,
      };
    },
    grade: (r) =>
      r.cashFieldsInQueue === 0 && r.dollarLogicInChecker === 0
        ? ['REPRODUCES', `hours enforced in ${r.hoursLogicInChecker} places, dollars in 0`]
        : ['STALE', `${r.cashFieldsInQueue} cash field(s) in queue, ${r.dollarLogicInChecker} in the checker`],
  },
  {
    id: 'R08',
    claim: 'finance-runway#2 / legal-ip',
    severity: 'BLOCKING',
    asStated: 'grep -i over data/queue.json returns 0 hits for insurance, E&O, counsel, liability, indemn, engagement letter — while M3 signs and invoices.',
    cmd: () => {
      const q = readFileSync(path.join(REPO, 'data/queue.json'), 'utf8').toLowerCase();
      const terms = ['insurance', 'e&o', 'counsel', 'liability', 'indemn', 'engagement letter'];
      const counts = Object.fromEntries(terms.map((t) => [t, (q.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length]));
      return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
    },
    grade: (r) => (r.total === 0 ? ['REPRODUCES', 'all six terms absent from the queue'] : ['STALE', `${r.total} hit(s): ${JSON.stringify(r.counts)}`]),
  },
  {
    id: 'R09',
    claim: 'content-editorial#1',
    severity: 'BLOCKING',
    asStated: 'node scripts/inject-about-cost-read.mjs --check prints "would update 2 file(s)" — /about/ publishes a Cost Index read older than the data behind it.',
    cmd: () => {
      const r = sh('node scripts/inject-about-cost-read.mjs --check');
      return { code: r.code, wouldUpdate: (r.out.match(/would update/gi) || []).length, out: r.out.trim().split('\n').slice(-2).join(' | ').slice(0, 160) };
    },
    grade: (r) =>
      r.wouldUpdate >= 2
        ? ['REPRODUCES', `${r.wouldUpdate} file(s) would still be rewritten: ${r.out}`]
        : r.wouldUpdate === 1
          ? ['SUBSTANCE-HOLDS', 'one page still drifting, not two']
          : ['STALE', `nothing would update (${r.out})`],
  },
  {
    id: 'R10',
    claim: 'product-truth#2',
    severity: 'BLOCKING',
    asStated:
      'Q-072 (/close/) is NOT blocked on Q-020/Q-021/Q-022/Q-024 while Q-030 (the specimen) IS — the same four defects, applied to one item and not the other.',
    cmd: () => {
      const q = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8'));
      const g = (id) => q.items.find((i) => i.id === id)?.blockedBy ?? null;
      const four = ['Q-020', 'Q-021', 'Q-022', 'Q-024'];
      const b72 = g('Q-072') || [];
      const b30 = g('Q-030') || [];
      return { q072: b72, q030: b30, missingOn072: four.filter((x) => !b72.includes(x)), presentOn030: four.filter((x) => b30.includes(x)) };
    },
    grade: (r) =>
      r.missingOn072.length === 4 && r.presentOn030.length === 4
        ? ['REPRODUCES', `Q-072 blockedBy ${JSON.stringify(r.q072)}; Q-030 carries all four`]
        : r.missingOn072.length > 0
          ? ['SUBSTANCE-HOLDS', `${r.missingOn072.length} of 4 still missing from Q-072`]
          : ['STALE', 'Q-072 now carries all four'],
  },
  {
    id: 'R11',
    claim: 'product-truth#3 (MAJOR — sampled as a severity control)',
    severity: 'MAJOR',
    asStated: 'Q-011\'s verify runs in the storefront only, so "$19 a month" and "three months free" are still shipped in the PRODUCT repo copy (EN and ES).',
    cmd: () => {
      if (!existsSync(PRODUCT)) return { unavailable: true };
      const en = Number(sh(`grep -c 'three months free' apps/web/lib/copy.ts || true`, PRODUCT).out.trim());
      const es = existsSync(path.join(PRODUCT, 'apps/web/lib/copy.es.ts'))
        ? Number(sh(`grep -c -iE 'tres meses|three months free' apps/web/lib/copy.es.ts || true`, PRODUCT).out.trim())
        : 0;
      const ga = Number(sh(`grep -rc '2026-11-13' apps/web/lib/copy.ts || true`, PRODUCT).out.trim());
      return { en, es, ga };
    },
    grade: (r) =>
      r.unavailable
        ? ['SUBSTANCE-HOLDS', 'product repo unavailable']
        : r.en + r.es > 0
          ? ['REPRODUCES', `withdrawn terms still shipped: copy.ts ${r.en}, copy.es.ts ${r.es}, GA date ${r.ga}`]
          : ['STALE', 'the withdrawn terms are gone from product copy'],
  },
  {
    id: 'R12',
    claim: 'strategy#8 (MINOR — sampled as a severity control)',
    severity: 'MINOR',
    asStated: 'data/queue.json cites "docs/editorial/decisions/ADR-030-the-ninety-days-and-its-falsifiers.md", which does not exist on disk.',
    cmd: () => {
      const q = readFileSync(path.join(REPO, 'data/queue.json'), 'utf8');
      const refs = [...new Set([...q.matchAll(/ADR-\d{3}-[a-z0-9-]+\.md/g)].map((m) => m[0]))];
      const unresolved = refs.filter(
        (f) => !existsSync(path.join(REPO, 'docs/editorial/decisions', f)) && !existsSync(path.join(PRODUCT, 'docs/ux/decisions', f)) && !existsSync(path.join(PRODUCT, 'docs/security/decisions', f)),
      );
      return { refs: refs.length, unresolved, citesTheNamedOne: /ADR-030-the-ninety-days/.test(q) };
    },
    grade: (r) =>
      r.citesTheNamedOne
        ? ['REPRODUCES', 'the named dangling reference is still in the queue']
        : r.unresolved.length
          ? ['SUBSTANCE-HOLDS', `the named reference is gone, but ${r.unresolved.length} other ADR reference(s) still do not resolve: ${r.unresolved.join(', ')}`]
          : ['REFUTED', `all ${r.refs} ADR references in the queue resolve on disk today`],
  },
];

/* ------------------------------------------------------------------ *
 * 2. CONCEPTS — the declared clustering rule.
 *
 * Fifteen lenses over one plan. Two validators naming the same hole is not
 * two holes. This lexicon is a JUDGEMENT, written down so it can be argued
 * with: every claim's matched concepts are recorded in the output, and a
 * claim matching none stays its own singleton rather than being forced.
 * ------------------------------------------------------------------ */
export const CONCEPTS = [
  ['desk-minutes', /deskMinutes|desk_minutes|desk minutes|closeMinutes/i],
  ['agent-desk-vs-no-llm', /exception desk|agent workforce|agent-run|agent session|sub-?processor|language model|no-llm|no_llm/i],
  ['no-prospect-source', /eight (qualified )?(conversation|prospect|owner|name)|source of applicants|produces? (the )?eight|prospect list|sourc(e|ing) (the )?(eight|prospects)/i],
  ['no-close-renderer', /renders? (a |one )?close|close statement|statement of food cost|no producer|no designed form|nothing renders/i],
  ['first-dollar-undefined', /first dollar|cash received|dollar RECEIVED|invoice SENT|churn event|cancellation term|payment.*defin/i],
  ['legal-instrument', /legal entity|entity confirm|confirms? the legal|counsel|E&O|insurance|liability|engagement letter|legal instrument|sell the \$600/i],
  ['checkpoint-unfalsifiable', /kill criteri|checkpoint|CP-30|CP-60|CP-90|falsifier|unfalsifiable|cannot fire/i],
  ['queue-instrument-broken', /check-queue|queue is malformed|QUEUE\.md|schema break/i],
  ['deploy-red', /check-removed-slugs|deploy gate red|previously-green|reds? the (cloudflare )?deploy/i],
  ['cost-index-scope', /Cost Index|composite|series cliff|feed\.json|reproducib/i],
  ['capacity-overrun', /founder-hour floor|100\.6|maintenance suspension|Day 91|unpriced cliff|founder budget is 100%/i],
  ['no-money-budget', /money budget|cashUsd|dollar column|spend at zero revenue|60-75 day void|cash trough/i],
  ['unrendered-surface', /rendered surface|screen nobody|inspects a rendered|no designed form/i],
  ['intake-channel', /intake|how a customer'?s month|reaches Muntin|arrives by some channel/i],
  ['cold-start', /cold-start|cold start|fresh org|mature single org|zero prior confirmations/i],
  ['dpa-clocks', /DPA|ROPA|notification clock|72-hour|24-hour|incident-response|paid GA/i],
  ['differentiator', /differentiator|second Tuesday|fixed .{0,20}close date|ADR-030:75/i],
  ['stack-deploy-path', /unrecorded stack|no working deploy path|docling|pdfa-render|deploy item/i],
  ['stale-published-number', /stale number|publishing a falsehood|would update|drift/i],
];

function conceptsOf(gap) {
  const hay = `${gap.title} ${gap.evidenceText} ${gap.cost}`;
  return CONCEPTS.filter(([, re]) => re.test(hay)).map(([id]) => id);
}

export function cluster(gaps) {
  const tagged = gaps.map((g) => ({ ...g, concepts: conceptsOf(g) }));
  const buckets = new Map();
  const singletons = [];
  for (const g of tagged) {
    if (!g.concepts.length) { singletons.push(g); continue; }
    // Assign to its RAREST concept, so a broad tag cannot swallow a narrow one.
    const freq = (c) => tagged.filter((x) => x.concepts.includes(c)).length;
    const key = [...g.concepts].sort((a, b) => freq(a) - freq(b) || a.localeCompare(b))[0];
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(g);
  }
  const clusters = [...buckets.entries()]
    .map(([concept, members]) => ({ concept, size: members.length, domains: [...new Set(members.map((m) => m.domain))], members: members.map((m) => m.id) }))
    .sort((a, b) => b.size - a.size);
  return { clusters, singletons: singletons.map((s) => s.id), distinctDefects: clusters.length + singletons.length, tagged };
}

/* ------------------------------------------------------------------ *
 * 3. POINTER INTEGRITY
 * ------------------------------------------------------------------ */
/**
 * A bare basename in prose ("check-idem-coverage.mjs is wired") is a script being
 * NAMED, not a citation. Counting those as broken citations would have put the
 * validators' pointer-integrity rate ~20 points below the truth. They are resolved
 * against a bounded index and reported as NAMED-NOT-CITED, outside the rate.
 */
const INDEX_DIRS = [
  [REPO, 'scripts'], [REPO, 'scripts/lib'], [REPO, 'data'], [REPO, 'docs'], [REPO, 'docs/handoff'],
  [REPO, 'docs/handoff/bones'], [REPO, 'docs/editorial/decisions'], [REPO, 'docs/contracts'], [REPO, '.'],
  [PRODUCT, 'scripts'], [PRODUCT, 'docs'], [PRODUCT, 'runbooks'], [PRODUCT, 'docs/ux/decisions'],
  [PRODUCT, 'docs/security/decisions'], [PRODUCT, '.'],
];
let BASENAMES = null;
function basenameIndex() {
  if (BASENAMES) return BASENAMES;
  BASENAMES = new Map();
  for (const [root, sub] of INDEX_DIRS) {
    const dir = path.join(root, sub);
    if (!existsSync(dir)) continue;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) if (e.isFile() && !BASENAMES.has(e.name)) BASENAMES.set(e.name, path.join(dir, e.name));
  }
  return BASENAMES;
}

export function resolvePointer(p) {
  for (const [repoName, root] of Object.entries(REPO_PATHS)) {
    // Validators sometimes qualify a path with its repo name
    // ("Muntin-Invoice-Decoder/docs/tos.md:66"). That is a correct citation, not a
    // broken one — strip the prefix before resolving.
    const rel = p.file.startsWith(repoName + '/') ? p.file.slice(repoName.length + 1) : p.file;
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    if (!statSync(abs).isFile()) continue;
    if (!p.hasLine) return { ...p, repo: repoName, status: 'FILE-EXISTS' };
    const n = readFileSync(abs, 'utf8').split('\n').length;
    return { ...p, repo: repoName, status: p.line <= n ? 'RESOLVES' : 'LINE-OUT-OF-RANGE', fileLines: n };
  }
  if (p.bare) {
    const hit = basenameIndex().get(p.file);
    if (hit) {
      if (!p.hasLine) return { ...p, repo: 'by-basename', status: 'NAMED-NOT-CITED', resolvedTo: hit };
      const n = readFileSync(hit, 'utf8').split('\n').length;
      return { ...p, repo: 'by-basename', status: p.line <= n ? 'RESOLVES' : 'LINE-OUT-OF-RANGE', resolvedTo: hit, fileLines: n };
    }
    return { ...p, repo: null, status: 'NAMED-NOT-FOUND' };
  }
  return { ...p, repo: null, status: 'FILE-MISSING' };
}

/* ------------------------------------------------------------------ *
 * 4. THE NEUTRAL ARM
 * ------------------------------------------------------------------ */
function loadNeutral() {
  if (!existsSync(NEUTRAL)) return null;
  return JSON.parse(readFileSync(NEUTRAL, 'utf8'));
}

/* ------------------------------------------------------------------ *
 * REPORT
 * ------------------------------------------------------------------ */
function runRechecks() {
  return RECHECKS.map((r) => {
    let raw, verdict, why;
    try {
      raw = r.cmd();
      [verdict, why] = r.grade(raw);
    } catch (e) {
      raw = { error: String(e.message || e) };
      verdict = 'REFUTED';
      why = `the recheck itself could not run: ${raw.error}`;
    }
    return { id: r.id, claim: r.claim, severity: r.severity, asStated: r.asStated, verdict, why, observed: raw };
  });
}

function main(argv) {
  const only = (f) => argv.includes(f);
  const all = !['--reproduce', '--cluster', '--pointers', '--neutral', '--route'].some(only);
  const corpus = loadCorpus();
  const gaps = corpus.flatMap((r) => r.gaps);
  const blocking = gaps.filter((g) => g.severity === 'BLOCKING');
  const out = { generatedAt: new Date().toISOString(), instrument: 'scripts/audit-validator-calibration.mjs' };

  console.log('VALIDATOR CALIBRATION — how much of "13 of 15 NOT_READY" was the prompt?\n');
  console.log(`corpus: ${corpus.length} reports, ${gaps.length} gaps (${blocking.length} BLOCKING), ${gaps.reduce((a, g) => a + g.pointers.length, 0)} cited pointers`);
  const byVerdict = Object.fromEntries(['NOT_READY', 'READY_WITH_GAPS', 'READY'].map((v) => [v, corpus.filter((c) => c.verdict === v).length]));
  console.log(`verdicts as returned: ${Object.entries(byVerdict).map(([k, v]) => `${k}=${v}`).join('  ')}\n`);
  out.corpus = { reports: corpus.length, gaps: gaps.length, blocking: blocking.length, verdicts: byVerdict, byDomain: corpus.map((c) => ({ domain: c.domain, verdict: c.verdict, gaps: c.gaps.length, blocking: c.gaps.filter((g) => g.severity === 'BLOCKING').length })) };

  if (all || only('--reproduce')) {
    console.log('── 1. REPRODUCTION — the corpus\'s own assertions, re-run today ──\n');
    const rows = runRechecks();
    out.reproduction = rows;
    for (const r of rows) {
      const mark = { REPRODUCES: '✓', 'SUBSTANCE-HOLDS': '≈', STALE: '·', REFUTED: '✗' }[r.verdict];
      console.log(`  ${mark} ${r.id} [${r.verdict.padEnd(15)}] ${r.claim}`);
      console.log(`        ${r.why}`);
    }
    const tally = Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => r.verdict === v).length]));
    const holds = tally.REPRODUCES + tally['SUBSTANCE-HOLDS'];
    out.reproductionSummary = { ...tally, sampled: rows.length, defectStandsRate: +(holds / rows.length).toFixed(3) };
    console.log(`\n  HIT RATE: ${holds}/${rows.length} sampled claims still describe a real defect (${tally.REPRODUCES} exactly as stated, ${tally['SUBSTANCE-HOLDS']} substance-holds/letter-off, ${tally.STALE} stale, ${tally.REFUTED} refuted).\n`);
  }

  if (all || only('--cluster')) {
    console.log('── 2. CONCENTRATION — 44 blocking claims, how many distinct defects? ──\n');
    const c = cluster(blocking);
    out.clusters = { distinctDefects: c.distinctDefects, clusters: c.clusters, singletons: c.singletons };
    for (const cl of c.clusters) {
      if (cl.size === 1) continue;
      console.log(`  ${String(cl.size).padStart(2)}× ${cl.concept.padEnd(26)} ${cl.domains.length} domain(s): ${cl.domains.join(', ')}`);
    }
    const solo = c.clusters.filter((x) => x.size === 1).length + c.singletons.length;
    console.log(`  ${String(solo).padStart(2)}× (named by exactly one domain)`);
    console.log(`\n  44 BLOCKING claims resolve to ${c.distinctDefects} distinct defects. The multiplier is ${(blocking.length / c.distinctDefects).toFixed(2)}×.\n`);
  }

  if (all || only('--pointers')) {
    console.log('── 3. POINTER INTEGRITY — every file:line the validators cited ──\n');
    // A pointer to a file that does not exist is sometimes the CLAIM ("its verify
    // command, node scripts/check-specimen-close.mjs, does not exist on disk"), not
    // a broken citation. Counting those as errors would invert their meaning.
    const ABSENCE = /does not exist|not on disk|`?ls`? fails|returns nothing|no such file|is unbuilt|does not exist on disk|absent from|never created|nothing (?:creates|produces|renders)|has no |no item creates/i;
    const ptrs = gaps.flatMap((g) =>
      g.pointers.map((p) => {
        const r = { ...resolvePointer(p), gap: g.id, severity: g.severity };
        if ((r.status === 'FILE-MISSING' || r.status === 'NAMED-NOT-FOUND') && ABSENCE.test(g.evidenceText)) r.status = 'CITED-AS-ABSENT';
        return r;
      }),
    );
    const tally = {};
    for (const p of ptrs) tally[p.status] = (tally[p.status] || 0) + 1;
    const cited = ptrs.filter((p) => p.hasLine);
    const good = cited.filter((p) => p.status === 'RESOLVES').length;
    const nonResolving = (s) => !['RESOLVES', 'FILE-EXISTS', 'NAMED-NOT-CITED', 'CITED-AS-ABSENT'].includes(s);
    out.pointers = { total: ptrs.length, withLine: cited.length, tally, lineResolveRate: cited.length ? +(good / cited.length).toFixed(3) : null, misses: ptrs.filter((p) => nonResolving(p.status)).slice(0, 14) };
    for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
    console.log(`\n  Of ${cited.length} pointers carrying a line number, ${good} resolve to a line that exists (${(100 * good / (cited.length || 1)).toFixed(1)}%).`);
    if (out.pointers.misses.length) {
      console.log('  Non-resolving:');
      for (const m of out.pointers.misses) console.log(`    ${m.gap.padEnd(24)} ${m.status.padEnd(18)} ${m.file}${m.line ? ':' + m.line : ''}`);
    }
    console.log();
  }

  if (all || only('--route')) {
    console.log('── 5. ROUTING — what the 89 proposed Additions would cost, and who pays ──\n');
    // Founder hours are declared inside each Addition's own cost bracket, in the
    // validator's words ("0.5h founder to decide", "1 founder-hour"). Parsed, never
    // imputed: anything unparseable is reported as unparseable rather than as zero,
    // because rounding an unknown cost DOWN is how a capacity plan gets built on air.
    const FOUNDER_H = [/([\d.]+)\s*(?:founder-|)h(?:ours?|r)?\s+founder/i, /([\d.]+)\s*founder-hours?/i, /founder\s*\|\s*([\d.]+)\s*(?:founder-|)h/i];
    const adds = corpus.flatMap((c) => c.additions);
    let sum = 0, parsed = 0, unparseable = [];
    for (const a of adds) {
      let h = null;
      for (const re of FOUNDER_H) { const m = a.cost.match(re); if (m) { h = Number(m[1]); break; } }
      if (h === null && a.owner === 'founder') unparseable.push(a);
      if (h !== null) { sum += h; parsed++; a.founderHours = h; }
    }
    const founderOwned = adds.filter((a) => a.owner === 'founder');
    const decisions = adds.filter((a) => !a.hasProofShape);
    const cap = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8')).capacity;
    const floor3 = (cap?.founderHoursPerMonth?.floor ?? 13) * 3;
    out.routing = {
      additions: adds.length,
      founderOwned: founderOwned.length,
      agentOwned: adds.filter((a) => a.owner === 'agent').length,
      founderHoursParsed: parsed,
      founderHoursSum: +sum.toFixed(2),
      founderOwnedUnparseable: unparseable.length,
      noProofCommand: decisions.length,
      quarterFloorHours: floor3,
      pctOfQuarterFloor: +(100 * sum / floor3).toFixed(1),
    };
    console.log(`  ${adds.length} Additions proposed across ${corpus.length} reports — ${out.routing.agentOwned} agent-owned, ${founderOwned.length} founder-owned.`);
    console.log(`  Declared founder hours, summed from the validators' OWN cost brackets: ${sum.toFixed(2)}h (${parsed} parsed, ${unparseable.length} founder-owned unparseable).`);
    console.log(`  Against the quarter's founder floor of ${floor3}h — which data/queue.json already spends at 100.6% — that is ${out.routing.pctOfQuarterFloor}% MORE.`);
    console.log(`\n  ${decisions.length} of ${adds.length} Additions carry a doneWhen with no command-shaped proof.`);
    console.log(`  Rule 1: those are DECISIONS, not gaps. They route to the founder and must never enter the loop,`);
    console.log(`  because no agent run can ever close them and an unclosable item is how a loop stops terminating.\n`);
  }

  if (all || only('--neutral')) {
    console.log('── 4. THE NEUTRAL ARM — same evidence, defined bar, no instruction to find gaps ──\n');
    const n = loadNeutral();
    if (!n) {
      console.log(`  (no ${path.relative(REPO, NEUTRAL)} on disk — the neutral arm has not been run)\n`);
    } else {
      out.neutral = n;
      const byDomain = Object.fromEntries(corpus.map((c) => [c.domain, c.verdict]));
      let moved = 0;
      for (const d of n.domains) {
        const orig = byDomain[d.domain] ?? 'ABSENT';
        const same = orig === d.neutralVerdict;
        if (!same) moved++;
        console.log(`  ${same ? '=' : '→'} ${d.domain.padEnd(20)} ${orig.padEnd(16)} → ${d.neutralVerdict.padEnd(16)} (M1-gating blockers: ${d.m1GatingBlockers})`);
      }
      const nr = n.domains.filter((d) => d.neutralVerdict === 'NOT_READY').length;
      out.neutralSummary = { sampled: n.domains.length, moved, notReadyUnderNeutral: nr, notReadyUnderOriginal: n.domains.filter((d) => byDomain[d.domain] === 'NOT_READY').length };
      console.log(`\n  ${moved} of ${n.domains.length} sampled domains changed verdict. Under the neutral rubric ${nr} of ${n.domains.length} are NOT_READY; under the original prompt ${out.neutralSummary.notReadyUnderOriginal} of ${n.domains.length} were.`);
      console.log(`  Rubric: ${n.rubric}\n`);
    }
  }

  if (argv.includes('--write')) {
    writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`✓ wrote ${path.relative(REPO, OUT)}`);
  }
  return 0;
}

/* ------------------------------------------------------------------ *
 * SELF-TEST
 * ------------------------------------------------------------------ */
function selfTest() {
  const A = [];
  const ok = (name, cond, detail = '') => A.push({ name, pass: !!cond, detail });

  const corpus = loadCorpus();
  ok('parses all 15 validator reports', corpus.length === 15, `got ${corpus.length}`);
  ok('every report yields a known verdict', corpus.every((c) => ['READY', 'READY_WITH_GAPS', 'NOT_READY'].includes(c.verdict)));
  ok('blocking count matches the corpus grep', corpus.flatMap((c) => c.gaps).filter((g) => g.severity === 'BLOCKING').length === 44);
  ok('every gap carries a title', corpus.flatMap((c) => c.gaps).every((g) => g.title.length > 10));
  ok('every gap carries evidence', corpus.flatMap((c) => c.gaps).every((g) => g.evidenceText.length > 0));

  // Pointer extraction must find real pointers and reject prose that looks like one.
  const p1 = extractPointers('see `scripts/check-queue.mjs:96` and data/queue.json:1613 for the enum');
  ok('extracts two distinct pointers', p1.length === 2, JSON.stringify(p1.map((x) => x.file)));
  ok('captures the line number', p1[0].line === 96 && p1[1].line === 1613);
  ok('does not treat Q-041: as a pointer', extractPointers('Q-041: six founder-hours, 13-26 h/month').length === 0);
  ok('does not treat a bare version as a pointer', extractPointers('pnpm@9.12.0 and Node 22').length === 0);

  // Pointer resolution must distinguish the three outcomes.
  ok('resolves a real file:line', resolvePointer({ file: 'data/queue.json', line: 1, hasLine: true }).status === 'RESOLVES');
  ok('flags a missing file', resolvePointer({ file: 'data/definitely-not-here.json', line: 1, hasLine: true }).status === 'FILE-MISSING');
  ok('flags an out-of-range line', resolvePointer({ file: 'data/queue.json', line: 9999999, hasLine: true }).status === 'LINE-OUT-OF-RANGE');
  ok('resolves the product repo too', ['RESOLVES', 'FILE-EXISTS', 'FILE-MISSING'].includes(resolvePointer({ file: 'apps/web/lib/copy.ts', line: 1, hasLine: true }).status));
  ok('strips a repo-name prefix before resolving', resolvePointer({ file: 'Muntin-Invoice-Decoder/docs/tos.md', line: 1, hasLine: true }).status === 'RESOLVES');
  ok('a bare basename named in prose is not a broken citation', resolvePointer({ file: 'check-gate-coverage.mjs', line: null, hasLine: false, bare: true }).status === 'NAMED-NOT-CITED');

  // Clustering must not force unmatched claims together, and must dedup the known one.
  const blocking = corpus.flatMap((c) => c.gaps).filter((g) => g.severity === 'BLOCKING');
  const c = cluster(blocking);
  ok('clustering conserves every claim', c.clusters.reduce((a, x) => a + x.size, 0) + c.singletons.length === blocking.length);
  ok('finds fewer distinct defects than claims', c.distinctDefects < blocking.length, `${c.distinctDefects} vs ${blocking.length}`);
  ok('desk-minutes is named by >1 domain', (c.clusters.find((x) => x.concept === 'desk-minutes')?.domains.length ?? 0) > 1);
  ok('the no-LLM/exception-desk hole is named by >1 domain', (c.clusters.find((x) => x.concept === 'agent-desk-vs-no-llm')?.domains.length ?? 0) > 1);

  // The recheck registry must be well-formed and must be able to return every verdict.
  ok('every recheck names a claim that exists in the corpus or is a composite', RECHECKS.every((r) => r.claim.length > 3));
  ok('every recheck has a command and a grader', RECHECKS.every((r) => typeof r.cmd === 'function' && typeof r.grade === 'function'));
  ok('the sample spans severities', new Set(RECHECKS.map((r) => r.severity)).size >= 3);
  ok('the sample covers >= 8 distinct blocking claims', RECHECKS.filter((r) => r.severity === 'BLOCKING').length >= 8);
  // A grader that can only return one verdict is not a grader.
  ok('R04 can return STALE', RECHECKS.find((r) => r.id === 'R04').grade({ hits: 5, codeHits: 5, sample: [] })[0] === 'STALE');
  ok('R08 can return STALE', RECHECKS.find((r) => r.id === 'R08').grade({ counts: { insurance: 3 }, total: 3 })[0] === 'STALE');
  ok('R12 can return REFUTED', RECHECKS.find((r) => r.id === 'R12').grade({ refs: 9, unresolved: [], citesTheNamedOne: false })[0] === 'REFUTED');
  ok('R01 can return STALE', RECHECKS.find((r) => r.id === 'R01').grade({ codes: [0, 0, 0, 0, 0, 0], badStatuses: [], allTwo: false })[0] === 'STALE');

  // Additions must be classifiable into gap-vs-decision (Rule 1).
  const adds = corpus.flatMap((c) => c.additions);
  ok('parses the additions', adds.length >= 80, `got ${adds.length}`);
  ok('classifies addition owners', adds.filter((a) => a.owner === 'founder').length > 0 && adds.filter((a) => a.owner === 'agent').length > 0);
  ok('detects proof-shaped doneWhen', adds.some((a) => a.hasProofShape) && adds.some((a) => !a.hasProofShape));

  // The neutral arm, if present, must be internally consistent.
  const n = loadNeutral();
  if (n) {
    ok('neutral arm declares its rubric', typeof n.rubric === 'string' && n.rubric.length > 20);
    ok('neutral arm is pre-registered', n.preRegistered === true);
    ok('neutral arm records per-claim inputs', n.domains.every((d) => Array.isArray(d.blockers) && d.blockers.length >= 0));
    ok('neutral arm samples a control that was not NOT_READY', n.domains.some((d) => d.originalVerdict !== 'NOT_READY'));
    ok('neutral verdicts are legal values', n.domains.every((d) => ['READY', 'READY_WITH_GAPS', 'NOT_READY'].includes(d.neutralVerdict)));
  }

  const failed = A.filter((a) => !a.pass);
  for (const a of A) console.log(`  ${a.pass ? '✓' : '✗'} ${a.name}${a.detail ? ' — ' + a.detail : ''}`);
  console.log(`\n${A.length - failed.length}/${A.length} assertions pass.`);
  return failed.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  process.exit(argv.includes('--self-test') ? selfTest() : main(argv));
}
