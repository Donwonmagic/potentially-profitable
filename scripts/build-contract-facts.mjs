#!/usr/bin/env node
/**
 * build-contract-facts.mjs — compile the contract's factual claims. Stop typing them.
 *
 * ============================== WHY ==============================
 *
 * On 2026-08-07 `CLAUDE.md` — the file that governs an absolute fact gate — was
 * wrong about its own repository in three separate places:
 *
 *   line 21  "`scripts/` — build, inject, and check scripts. ~70 of them."
 *            Measured: 390 .mjs files directly under scripts/. Off by 5.6x.
 *   line 52  "check-claim-usage's inverse direction indexed 483 of 1428 pages"
 *            Measured: 1,327 routable pages (data/surface-inventory.json
 *            summary.pages), 1,314 of them index.html.
 *   line 54  "`check-all` `--check`s 96 `(idem)` builders … Today: 83 builders"
 *            One bullet, two numbers, and `node scripts/check-idem-coverage.mjs`
 *            says 83. The 96 was never right.
 *
 * These were all correct once. Correcting them by hand recreates the same decay
 * site. The company already invented the cure for exactly this in its PUBLIC
 * prose — `<!-- count:KEY -->N<!-- /count -->` sentinels re-derived from
 * `data/site-counts.json` — and never pointed it at the file a session reads
 * first. This is that mechanism, aimed inward.
 *
 * ============================ WHAT IT DOES ============================
 *
 *   1. Measures a small, declared set of facts about this repo, each from a
 *      NAMED source (a generated manifest, or a directory listing). Every fact
 *      records `derivedFrom` so a reader can re-run the measurement.
 *   2. Writes `data/contract-facts.json`.
 *   3. Rewrites `<!-- fact:KEY -->VALUE<!-- /fact -->` sentinels in the target
 *      files. An unknown KEY fails loudly rather than shipping a blank.
 *   4. Refuses to let any committed file state a literal git branch name as
 *      "the current branch" (BRANCH_CLAIM). Four artifacts declared four
 *      different current branches on 2026-08-07 — CLAUDE.md, the board header,
 *      the board's CURRENT STATE block and the product CLAUDE.md — against an
 *      actual HEAD none of them named. The fix is not to edit four strings; it
 *      is to make the branch un-restatable. Write the command, not the value.
 *
 * ====================== HOW IT AVOIDS BECOMING A RED NOBODY CLEARS ======================
 *
 * CLAUDE.md:54 warns that a builder `check-all` verifies but nothing re-runs
 * turns drift into a red deploy no automation can clear. A script count drifts
 * every time anyone adds a script, so a bare `--check` in check-all would be
 * exactly that trap. So this builder is SELF-HEALING at the one place measured
 * to run in every session: `.claude/hooks/session-start.sh` invokes it in WRITE
 * mode. `--check` exists for CI but is registered UNWIRED with that reason.
 * A number that repairs itself before any session reads it cannot rot.
 *
 * Usage:
 *   node scripts/build-contract-facts.mjs           # measure + rewrite sentinels
 *   node scripts/build-contract-facts.mjs --check   # exit 1 if anything would change
 *   node scripts/build-contract-facts.mjs --json    # print the facts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const checkOnly = process.argv.includes('--check');
const asJson = process.argv.includes('--json');

/**
 * Files whose `fact:` sentinels this script owns.
 * Deliberately short: every target is another place a number can be read, and
 * the point of the exercise is fewer places, not more.
 */
const TARGETS = ['CLAUDE.md', 'docs/contracts/working-set.md'];

/**
 * A committed file may not state a literal branch name as THE CURRENT BRANCH.
 *
 * The pattern is deliberately narrow — present-tense claims only. A dated
 * session log or an ADR context header that says "Branch: `claude/foo`" is a
 * RECORD of where a thing happened, and records are the one memory in this
 * company that has never gone false. What rots is the present tense: on
 * 2026-08-07 four artifacts each named a different "current branch" and none
 * of them named actual HEAD.
 *
 * Widening this to every mention would produce 11 hits, 9 of them legitimate
 * history — which is the noise-then-tolerate failure CLAUDE.md:52 warns about.
 * Fix the cause (the present tense), not the count.
 */
const BRANCH_CLAIM =
  /(current(?:ly)?\s+(?:working\s+)?branch|currently\s+on|develop(?:ment)?\s+(?:on|happens\s+on)|we\s+are\s+on|both\s+repos\s+develop)[^\n]{0,80}?`?claude\/[a-z0-9-]+`?/gi;

/** Files where even a present-tense claim is the record. Every entry says why. */
const BRANCH_CLAIM_ALLOW = {
  'docs/handoff/board-archive.md': 'Append-only history. Naming the branch a shipped thread ran on is the record, not a claim about today.',
  'docs/handoff/bones/os-claude-md.md': 'A dated finding document that quotes the four disagreeing branch claims as its evidence. Rewriting it would destroy the measurement.',
  'docs/handoff/bones/os-memory.md': 'Same — quotes the five in-file branch values it found as evidence.',
  'docs/handoff/company-audit-2026-08-07.md': 'Frozen dated audit. Its branch references are the state at audit time.',
  'docs/editorial/decisions/ADR-027-the-contract-loads-through-the-hook.md': 'The ADR that establishes this rule; it quotes the failure it is fixing.',
};

const walkSkip = new Set(['.git', 'node_modules', 'dist', '.wrangler', 'assets', 'audio']);

function listDir(rel, filter) {
  const dir = path.join(REPO, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && filter(e.name))
    .map((e) => e.name);
}

function readJson(rel) {
  const p = path.join(REPO, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function walkMd(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || walkSkip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function countLines(p) {
  return fs.readFileSync(p, 'utf8').split('\n').length;
}

// ---------------------------------------------------------------------------
// The facts. Every entry states where it comes from, in the file itself.
// ---------------------------------------------------------------------------

function measure() {
  const facts = {};
  const add = (key, value, derivedFrom) => {
    facts[key] = { value, derivedFrom };
  };

  const mjs = listDir('scripts', (n) => n.endsWith('.mjs'));
  const anyScript = listDir('scripts', (n) => /\.(mjs|js|sh|py|ts)$/.test(n));
  add('scripts.mjs', mjs.length, 'ls scripts/*.mjs');
  add('scripts.total', anyScript.length, 'ls scripts/*.{mjs,js,sh,py,ts}');
  add('scripts.checks', mjs.filter((n) => n.startsWith('check-')).length, 'ls scripts/check-*.mjs');
  add('scripts.builders', mjs.filter((n) => n.startsWith('build-')).length, 'ls scripts/build-*.mjs');
  add('scripts.injectors', mjs.filter((n) => n.startsWith('inject-')).length, 'ls scripts/inject-*.mjs');
  add('scripts.lib', listDir('scripts/lib', () => true).length, 'ls scripts/lib/');

  // check-all entries: parse the entry tuples, not raw lines. 99 lines contain
  // "(idem)"; 10 of them are comments, which is how a hand count drifts.
  const checkAllPath = path.join(REPO, 'scripts', 'check-all.mjs');
  if (fs.existsSync(checkAllPath)) {
    const lines = fs.readFileSync(checkAllPath, 'utf8').split('\n');
    const entry = lines.filter((l) => /^\s*\[\s*['"]/.test(l));
    add('gates.checkAllEntries', entry.length, "scripts/check-all.mjs — lines matching /^\\s*\\['/ (entry tuples)");
    add('gates.idemEntries', entry.filter((l) => l.includes('(idem)')).length, "scripts/check-all.mjs — entry tuples whose label contains '(idem)'");
  }

  // idem coverage classification, read from the gate's own registry rather than
  // re-derived, so the two cannot disagree.
  const idemSrc = path.join(REPO, 'scripts', 'check-idem-coverage.mjs');
  if (fs.existsSync(idemSrc)) {
    const src = fs.readFileSync(idemSrc, 'utf8');
    const manualBlock = src.match(/const MANUAL\s*=\s*\{([\s\S]*?)\n\};/);
    if (manualBlock) {
      const keys = manualBlock[1].match(/^\s*'[^']+\.mjs'\s*:/gm) || [];
      add('idem.manual', keys.length, "scripts/check-idem-coverage.mjs MANUAL registry keys");
    }
  }

  const gateCov = path.join(REPO, 'scripts', 'check-gate-coverage.mjs');
  if (fs.existsSync(gateCov)) {
    const src = fs.readFileSync(gateCov, 'utf8');
    const block = src.match(/export const UNWIRED\s*=\s*\{([\s\S]*?)\n\};/);
    const keys = block ? block[1].match(/^\s*'[^']+\.mjs'\s*:/gm) || [] : [];
    add('gates.unwired', keys.length, 'scripts/check-gate-coverage.mjs UNWIRED registry keys');
  }

  const surf = readJson('data/surface-inventory.json');
  if (surf?.summary) {
    add('pages.routable', surf.summary.pages, 'data/surface-inventory.json summary.pages');
    add('pages.indexable', surf.summary.indexable, 'data/surface-inventory.json summary.indexable');
    add('pages.noindex', surf.summary.noindex, 'data/surface-inventory.json summary.noindex');
    add('pages.orphans', surf.summary.orphans, 'data/surface-inventory.json summary.orphans');
  }

  const sg = readJson('data/system-graph.json');
  if (sg?.summary) {
    add('deploy.steps', sg.summary.deployStepCount, 'data/system-graph.json summary.deployStepCount');
    add('deploy.distinctScripts', sg.summary.deployDistinctScripts, 'data/system-graph.json summary.deployDistinctScripts');
    add('scripts.orphaned', sg.summary.invocation?.orphan, 'data/system-graph.json summary.invocation.orphan — scripts no runner invokes');
  }

  const disp = readJson('data/surface-disposition.json');
  if (disp?.summary) {
    for (const k of ['keep', 'freeze', 'freeze-noindex', 'merge', 'delete']) {
      if (disp.summary[k] !== undefined) add(`disposition.${k}`, disp.summary[k], `data/surface-disposition.json summary.${k}`);
    }
  }

  const docs = walkMd(path.join(REPO, 'docs'));
  add('docs.files', docs.length, 'find docs -name "*.md"');
  add('docs.lines', docs.reduce((a, p) => a + countLines(p), 0), 'wc -l on every docs/**/*.md');
  add(
    'adrs.editorial',
    listDir('docs/editorial/decisions', (n) => /^ADR-\d+.*\.md$/.test(n)).length,
    'ls docs/editorial/decisions/ADR-*.md',
  );

  const board = path.join(REPO, 'docs/handoff/strategic-council-board.md');
  if (fs.existsSync(board)) add('board.lines', countLines(board), 'wc -l docs/handoff/strategic-council-board.md');

  const ws = readJson('docs/contracts/working-set.json');
  if (ws?.budget) {
    add('workingSet.budgetLines', ws.budget.lines, 'docs/contracts/working-set.json budget.lines');
  }

  const rules = readJson('docs/contracts/rules.json');
  if (rules?.rules) {
    add('contract.rules', rules.rules.filter((r) => r.status !== 'retired').length, 'docs/contracts/rules.json — active rules');
    add('contract.core', rules.rules.filter((r) => r.status !== 'retired' && r.priority === 0).length, 'docs/contracts/rules.json — priority 0');
    add(
      'contract.undetected',
      rules.rules.filter((r) => r.status !== 'retired' && r.enforcedBy === 'none').length,
      'docs/contracts/rules.json — rules with enforcedBy "none"',
    );
  }

  return facts;
}

// ---------------------------------------------------------------------------

const SENTINEL = /<!-- fact:([\w.]+) -->[^<]*<!-- \/fact -->/g;

function injectInto(rel, facts) {
  const p = path.join(REPO, rel);
  if (!fs.existsSync(p)) return { changed: 0, missing: [] };
  const before = fs.readFileSync(p, 'utf8');
  const missing = [];
  const after = before.replace(SENTINEL, (whole, key) => {
    if (!(key in facts)) {
      missing.push(key);
      return whole;
    }
    return `<!-- fact:${key} -->${facts[key].value}<!-- /fact -->`;
  });
  if (missing.length) return { changed: 0, missing };
  if (after !== before) {
    if (!checkOnly) fs.writeFileSync(p, after);
    return { changed: 1, missing: [] };
  }
  return { changed: 0, missing: [] };
}

function scanBranchClaims() {
  const hits = [];
  const roots = ['docs', 'CLAUDE.md', 'README.md'];
  const files = [];
  for (const r of roots) {
    const abs = path.join(REPO, r);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) files.push(...walkMd(abs));
    else files.push(abs);
  }
  for (const f of files) {
    const rel = path.relative(REPO, f);
    if (BRANCH_CLAIM_ALLOW[rel]) continue;
    const txt = fs.readFileSync(f, 'utf8');
    const lines = txt.split('\n');
    lines.forEach((l, i) => {
      BRANCH_CLAIM.lastIndex = 0;
      if (BRANCH_CLAIM.test(l)) hits.push(`${rel}:${i + 1}  ${l.trim().slice(0, 120)}`);
    });
  }
  return hits;
}

// ---------------------------------------------------------------------------

const facts = measure();

if (asJson) {
  console.log(JSON.stringify(facts, null, 2));
  process.exit(0);
}

const out = {
  _doc:
    'COMPILED. Every value here is measured from a named source on each run and injected into <!-- fact:KEY -->…<!-- /fact --> sentinels by scripts/build-contract-facts.mjs. Never hand-edit; never restate one of these numbers in prose without a sentinel.',
  _why:
    "CLAUDE.md governs an absolute fact gate and was itself wrong about this repo in three places on 2026-08-07 ('~70' scripts against 390; '1428 pages' against 1,327; '96 (idem) builders' and '83' in one bullet).",
  _asOf: new Date().toISOString().slice(0, 10),
  _generator: 'scripts/build-contract-facts.mjs',
  facts,
};

const factsPath = path.join(REPO, 'data', 'contract-facts.json');
const serialised = JSON.stringify(out, null, 2) + '\n';
let factsChanged = false;
if (fs.existsSync(factsPath)) {
  const prev = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
  // _asOf is wall-clock; compare only the measured values so the file is
  // byte-stable across days on which nothing actually changed.
  factsChanged = JSON.stringify(prev.facts) !== JSON.stringify(facts);
  if (factsChanged) out._asOf = new Date().toISOString().slice(0, 10);
  else out._asOf = prev._asOf;
} else {
  factsChanged = true;
}
if (factsChanged && !checkOnly) {
  fs.writeFileSync(factsPath, JSON.stringify(out, null, 2) + '\n');
}

let changed = factsChanged ? 1 : 0;
const missing = [];
for (const t of TARGETS) {
  const r = injectInto(t, facts);
  changed += r.changed;
  missing.push(...r.missing.map((k) => `${t}: unknown fact key '${k}'`));
}

const branchHits = scanBranchClaims();

let bad = 0;
if (missing.length) {
  console.error('build-contract-facts: UNKNOWN SENTINEL KEYS');
  for (const m of missing) console.error('  ' + m);
  bad = 1;
}
if (branchHits.length) {
  console.error(`build-contract-facts: ${branchHits.length} file(s) state a literal branch as the current branch.`);
  console.error('  A branch name is not a fact a document can hold — it is `git branch --show-current`.');
  for (const h of branchHits) console.error('  ' + h);
  bad = 1;
}

if (checkOnly) {
  if (changed) {
    console.error(`build-contract-facts --check: ${changed} file(s) would change. Run: node scripts/build-contract-facts.mjs`);
    bad = 1;
  }
  if (!bad) console.log(`build-contract-facts --check: OK — ${Object.keys(facts).length} facts current, 0 branch claims.`);
  process.exit(bad);
}

console.log(
  `build-contract-facts: ${Object.keys(facts).length} facts measured; ${changed} file(s) updated; ${branchHits.length} branch claim(s).`,
);
process.exit(bad);
