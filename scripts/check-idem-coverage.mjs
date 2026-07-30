#!/usr/bin/env node
/**
 * Idem-builder coverage gate — who actually re-runs each self-healing builder?
 *
 * WHY THIS EXISTS (2026-07-28)
 *
 * `check-all.mjs` `--check`s 96 "(idem)" builders, and it runs at the END of the
 * Cloudflare deploy command (`wrangler.jsonc` build.command). So the arrangement
 * only works if the deploy also RUNS those builders before checking them.
 *
 * For 56 of them it does. For the other 40 it does not, and the consequence is
 * the opposite of self-healing: a builder that `check-all` verifies but nothing
 * re-runs turns any drift into a RED DEPLOY that no automation can clear. A
 * human has to notice, run the script, and commit.
 *
 * This was found the hard way. Three builders — themes-review-board,
 * theme-story-pages, cuisine-landing-pages — were filed for months under "known
 * (idem) noise, never chase them", which is exactly how a red deploy gets
 * ignored. And the risk is live, not theoretical: `inject-knit-rail` drifted
 * during the 2026-07-28 freeze work because freezing articles changed the
 * related-reading rails, and nothing but a human would have healed it.
 *
 * WHAT THIS ENFORCES
 *
 * Every "(idem)" builder in check-all is in exactly one of three states:
 *
 *   1. run by the deploy `build.command`  — genuinely self-healing;
 *   2. run by a named workflow in .github/workflows/ — healed on a cron;
 *   3. listed in MANUAL below, with WHO runs it and WHEN it drifts.
 *
 * There is no fourth state. A builder added to check-all without a healer fails
 * this gate at the moment it is introduced, rather than surfacing months later
 * as a deploy nobody can turn green.
 *
 * Being in MANUAL is legitimate — eight of these render operator-fetched public
 * data whose refresh needs keys this container does not have (ADR-013). What
 * MANUAL forbids is the dependency being undocumented.
 *
 * 2026-07-29: the 13 /course/ entries were REMOVED here, not by hand but because
 * this gate demanded it. PR #530 retired the course and deleted its builders, and
 * staleManual failed on all 13 at the next run — the registry cannot outlive the
 * thing it documents.
 *
 * Usage:
 *   node scripts/check-idem-coverage.mjs
 *   node scripts/check-idem-coverage.mjs --self-test
 *   node scripts/check-idem-coverage.mjs --report   (print the full matrix)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const ORCHESTRATOR = 'scripts/check-all.mjs';
const WRANGLER = 'wrangler.jsonc';
const WORKFLOW_DIR = '.github/workflows';

const OPERATOR_DATA = {
  since: '2026-07-28',
  who: 'the operator, on the Mac that holds the API keys',
  drifts: 'when its source JSON is refreshed by a live fetch. Per ADR-013 the fetch runs on the operator\'s machine (keys + network); this container has neither, so the builder is re-run and committed alongside the data it renders.',
};

/**
 * "(idem)" builders nothing re-runs automatically. Each entry must say WHO runs
 * it and WHEN it drifts — an undocumented manual dependency is the thing this
 * gate exists to prevent.
 */
export const MANUAL = {
  // --- operator-fetched public data (ADR-013) ------------------------------
  // build-ingredient-state-record.mjs was here until 2026-07-30. It is no longer
  // manual: its dateModified tracks data/cost-lockfloat.json's asOf, which
  // cost-index-refresh.yml regenerates and commits daily, so the record went
  // stale on that workflow's clock rather than an operator's (caught at
  // 2026-07-24 vs lockfloat's 2026-07-28). It now runs in that same workflow,
  // right after the builder that moves its input.
  'build-eia-energy-backdrop.mjs': OPERATOR_DATA,
  'build-crop-condition-backdrop.mjs': OPERATOR_DATA,
  'build-noaa-landings.mjs': OPERATOR_DATA,
  'build-ers-availability.mjs': OPERATOR_DATA,
  'build-ers-meat-chain.mjs': OPERATOR_DATA,
  'build-ers-food-dollar.mjs': OPERATOR_DATA,
  'build-open-data-catalog.mjs': OPERATOR_DATA,

  // --- content-linked: THESE ARE THE LIVE ONES -----------------------------
  'inject-knit-rail.mjs': {
    since: '2026-07-28',
    who: 'whoever adds, freezes or retires an article',
    drifts: 'whenever the article set changes — it picks related reading per post. It drifted during the 2026-07-28 freeze because frozen articles had to be swapped out of the rails. Highest-churn entry on this list; run it after any article change.',
  },
  'inject-topic-card-links.mjs': {
    since: '2026-07-28',
    who: 'whoever changes topic-page membership or an article slug/namespace',
    drifts: 'when a topic page gains or loses an article card, or a slug moves between /blog/ and /library/.',
  },
  'inject-topic-eyebrow.mjs': {
    since: '2026-07-28',
    who: 'whoever changes topic-page membership',
    drifts: 'when a topic page\'s article count changes, since the eyebrow renders that count.',
  },
  'build-article-graphics.mjs': {
    since: '2026-07-28',
    who: 'whoever adds or edits an article figure',
    drifts: 'when a figure is added, removed or retoned. The manifest is currently empty, so drift is rare, but the gate that reads it is fail-CI.',
  },
  'build-claims-json.mjs': {
    since: '2026-07-28',
    who: 'whoever edits data/sourced-claims.json',
    drifts: 'on every registry edit. Already documented in CLAUDE.md as a required manual step: "Edit data/sourced-claims.json → also run build-claims-json + commit claims.json." It publishes /claims.json, a public artifact.',
  },
  'inject-receipts-kpis.mjs': {
    since: '2026-07-28',
    who: 'whoever edits the KPI source',
    drifts: 'when the KPI doc changes; /receipts/ renders those numbers.',
  },
  'inject-ledger-cta.mjs': {
    since: '2026-07-28',
    who: 'whoever changes the Ledger CTA copy',
    drifts: 'when the shared Ledger call-to-action text changes and needs re-stamping site-wide.',
  },
  'inject-glossary-faq.mjs': {
    since: '2026-07-28',
    who: 'whoever edits data/glossary-faq.json',
    drifts: 'when a glossary FAQ entry is added or reworded.',
  },
  'inject-glossary-seo.mjs': {
    since: '2026-07-28',
    who: 'whoever edits data/glossary-seo.json',
    drifts: 'when a glossary term\'s meta description changes.',
  },
  'build-image-formats.mjs': {
    since: '2026-07-28',
    who: 'whoever adds a raster image',
    drifts: 'when a new PNG/JPG lands without its AVIF/WebP siblings. Needs image tooling this container does not have.',
  },

  // --- theme / cuisine landing pages ---------------------------------------
  'build-themes-review-board.mjs': {
    since: '2026-07-28',
    who: 'whoever edits the themes data',
    drifts: 'when theme entries change. Filed for months as "(idem) noise"; it is not noise, it is an unhealed deploy dependency. Its 2026-07-28 red traced to a stale CSS cache-bust hash upstream, not to theme data.',
  },
  'build-theme-story-pages.mjs': {
    since: '2026-07-28',
    who: 'whoever edits the themes data',
    drifts: 'same trigger as build-themes-review-board; the two move together.',
  },
  'build-cuisine-landing-pages.mjs': {
    since: '2026-07-28',
    who: 'whoever edits the cuisine data',
    drifts: 'when cuisine entries change. Same "(idem) noise" misfiling as the theme builders.',
  },
};

/** Every `[label containing (idem), script.mjs]` pair in the orchestrator. */
export function idemEntries(src) {
  const re = /\[\s*'([^']*\(idem\)[^']*)'\s*,\s*'([\w.-]+\.mjs)'/g;
  return [...src.matchAll(re)].map((m) => ({ label: m[1], script: m[2] }));
}

/** The deploy build command, as one string. */
export function deployCommand(wrangler) {
  return (wrangler.match(/"command":\s*"([\s\S]*?)"\n/) || [])[1] || '';
}

export function classify(entries, deploy, workflows, manual = MANUAL) {
  const out = { deploy: [], workflow: [], manual: [], orphans: [] };
  for (const e of entries) {
    if (deploy.includes(e.script)) { out.deploy.push(e); continue; }
    const wf = Object.keys(workflows).find((f) => workflows[f].includes(e.script));
    if (wf) { out.workflow.push({ ...e, wf }); continue; }
    if (manual[e.script]) { out.manual.push(e); continue; }
    out.orphans.push(e);
  }
  return out;
}

/** A MANUAL entry for a builder that is now automated, or gone, is stale. */
export function staleManual(entries, deploy, workflows, manual = MANUAL) {
  const known = new Set(entries.map((e) => e.script));
  return Object.keys(manual).filter((s) => {
    if (!known.has(s)) return true;
    if (deploy.includes(s)) return true;
    return Object.values(workflows).some((w) => w.includes(s));
  });
}

function readWorkflows() {
  const dir = path.join(REPO, WORKFLOW_DIR);
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    out[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  }
  return out;
}

function selfTest() {
  const entries = idemEntries(`
    ['Alpha (idem)', 'build-a.mjs', '--check'],
    ['Beta (idem)',  'build-b.mjs', '--check'],
    ['Gamma (idem)', 'build-c.mjs', '--check'],
    ['Delta (idem)', 'build-d.mjs', '--check'],
    ['NotIdem',      'build-e.mjs', '--check'],
  `);
  const deploy = 'node scripts/build-a.mjs && node scripts/check-all.mjs';
  const workflows = { 'refresh.yml': 'run: node scripts/build-b.mjs' };
  const manual = { 'build-c.mjs': { since: '2026-01-01', who: 'a person', drifts: 'when the underlying source data is edited by hand' } };
  const r = classify(entries, deploy, workflows, manual);
  const cases = [
    [entries.length, 4, 'only (idem) rows are collected'],
    [r.deploy.map((e) => e.script).join(), 'build-a.mjs', 'deploy-run builders are classified as deploy'],
    [r.workflow.map((e) => e.script).join(), 'build-b.mjs', 'workflow-run builders are classified as workflow'],
    [r.workflow[0].wf, 'refresh.yml', 'the healing workflow is named'],
    [r.manual.map((e) => e.script).join(), 'build-c.mjs', 'documented manual builders are classified as manual'],
    [r.orphans.map((e) => e.script).join(), 'build-d.mjs', 'an undocumented unhealed builder is an orphan'],
    [staleManual(entries, deploy, workflows, manual).length, 0, 'a correct manual entry is not stale'],
    [staleManual(entries, 'node scripts/build-c.mjs', workflows, manual).join(), 'build-c.mjs', 'automating a manual builder makes its entry stale'],
    [staleManual([], deploy, workflows, manual).join(), 'build-c.mjs', 'an entry for a removed builder is stale'],
    [deployCommand('"command": "node x.mjs"\n'), 'node x.mjs', 'the deploy command is extracted'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  for (const [name, e] of Object.entries(MANUAL)) {
    if (!e.since || !e.who || !e.drifts || e.drifts.length < 40) {
      console.error(`✗ self-test: MANUAL["${name}"] needs since, who, and a substantive "drifts" note`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`check-idem-coverage --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  if (argv.includes('--self-test')) selfTest();

  const entries = idemEntries(fs.readFileSync(path.join(REPO, ORCHESTRATOR), 'utf8'));
  const deploy = deployCommand(fs.readFileSync(path.join(REPO, WRANGLER), 'utf8'));
  const workflows = readWorkflows();
  const r = classify(entries, deploy, workflows);
  const stale = staleManual(entries, deploy, workflows);

  if (argv.includes('--report')) {
    for (const e of r.deploy) console.log(`  deploy    ${e.script}`);
    for (const e of r.workflow) console.log(`  ${e.wf.padEnd(10)}${e.script}`);
    for (const e of r.manual) console.log(`  MANUAL    ${e.script}  — ${MANUAL[e.script].who}`);
  }

  if (!r.orphans.length && !stale.length) {
    console.log(
      `check-idem-coverage: ${entries.length} (idem) builder(s) — ${r.deploy.length} run by the deploy, ${r.workflow.length} by a workflow, ${r.manual.length} documented as manual. 0 unhealed.`,
    );
    process.exit(0);
  }

  if (r.orphans.length) {
    console.error(`check-idem-coverage: ${r.orphans.length} (idem) builder(s) that NOTHING re-runs:\n`);
    for (const o of r.orphans) console.error(`  ✗ ${o.script}   (${o.label})`);
    console.error(`
check-all runs at the END of the Cloudflare build command, so a builder it
--checks but nothing RUNS turns any drift into a red deploy that no automation
can clear. Resolve each one:

  • It should self-heal → add it to build.command in ${WRANGLER}, before
    check-all.
  • A cron already owns it → add it to that workflow.
  • It genuinely needs a human → add it to MANUAL in this file with WHO runs it
    and WHEN it drifts.`);
  }

  if (stale.length) {
    console.error(`\ncheck-idem-coverage: ${stale.length} stale MANUAL entr(ies):\n`);
    for (const s of stale) console.error(`  ✗ ${s} — now automated, or no longer in check-all. Remove its MANUAL entry.`);
  }
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
