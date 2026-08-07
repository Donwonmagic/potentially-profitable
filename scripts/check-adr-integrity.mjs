#!/usr/bin/env node
/**
 * check-adr-integrity.mjs — an ADR number is an ADDRESS, and two files may not share one.
 *
 * ============================== WHY ==============================
 *
 * ADR-027 made the contract load through a hook because a rule that lives only in
 * prose loads 1% of the time. ADR-024 made the queue the plan because a plan with
 * no citation surface dies silently. Both decisions rest on the same move: a
 * decision becomes real when something CITES it and that citation is checked.
 *
 * That move has a load-bearing precondition nobody had checked — that the citation
 * RESOLVES. `ADR-034` is not a title, it is an address, and this repo has been
 * handing out the same address twice.
 *
 * Measured on 2026-08-07, before this gate existed: FIVE numbers were claimed by
 * two files each — 010, 011, 012, 013, and 034. Four of those five are months old
 * and committed. The fifth was created twice in the same HOUR by two concurrent
 * agent sessions that both reached for "the next number" by reading `ls` and both
 * got the same answer, 40 seconds apart. Neither was wrong; nothing arbitrated.
 *
 * The consequence is not cosmetic. `Muntin-Invoice-Decoder/.claude/hooks/session-start.sh`
 * cites "storefront ADR-034" for the loop driver, in a COMMITTED file. While two
 * ADR-034s existed, that committed citation named an ambiguity — and the whole
 * argument for the hook is that a citation is what makes a decision inescapable.
 * A citation that resolves to two documents is exactly as good as no citation.
 *
 * ============================ WHAT IT ASSERTS ============================
 *
 *   A1  FAIL — no two ADR files share a number, except the dated GRANDFATHERED
 *              pairs below. A new collision is a hard failure.
 *   A2  FAIL — every ADR file's H1 states its own number. A file named ADR-034
 *              whose title says ADR-035 is how BOTH of tonight's renames went
 *              wrong: the mover renamed the file and left the title behind.
 *   A3  WARN — ADR filename citations that resolve to no file on disk, in either
 *              repo. Reported, never halting. See HONEST LIMITS.
 *
 * ====================== WHY A2 IS A GATE AND NOT A NICETY ======================
 *
 * Both renames tonight produced a file whose name and whose H1 disagreed, and in
 * both cases the *title* was what a reader would have believed. A1 alone cannot
 * see that failure: after a rename the filenames are unique and the corpus looks
 * healthy. A2 is the assertion that actually caught it.
 *
 * ============================ GRANDFATHERED ============================
 *
 * The four pre-existing pairs are NOT fixed here, and that is deliberate. An ADR's
 * number is cited from CLAUDE.md, from other ADRs, and from data/queue.json;
 * renumbering a committed decision of record is itself a decision, and it belongs
 * to the founder, not to the gate that found it. They are recorded with a date and
 * the ambiguity each one creates, so the debt is visible rather than silent — the
 * same shape as check-gate-coverage's UNWIRED registry and check-article-graphics'
 * HISTORICAL_WAIVERS. The gate's job today is that the list never grows.
 *
 * ============================ HONEST LIMITS ============================
 *
 *   - A3 does not fail. 16 citations dangle when only this repo is scanned; 11 of
 *     those are legitimate cross-repo references to the PRODUCT repo's
 *     docs/ux/decisions/ and resolve when it is checked out, leaving 5 genuinely
 *     stale (measured 2026-08-07). That repo is not on disk in every environment
 *     this runs in — and a gate that fails on the absence of a repo it does not
 *     own would red the deploy for a reason the deploy cannot fix. So it resolves
 *     against both repos when both are present, and reports either way.
 *   - It does not read an ADR's CONTENT. Whether a decision is good, or is even a
 *     decision, is not checkable; ADR-035 (the judge protocol) is the argument for
 *     why that line is drawn where it is.
 *   - It does not check that a Status of ACCEPTED is true of the world.
 *
 * ROOTS: docs/editorial/decisions/ + docs/design/decisions/ (storefront ADRs).
 * Citation scanning walks scripts/, data/, docs/, _includes/, .claude/, CLAUDE.md.
 * OMITTED: node_modules and .git (not authored); assets/ and the article corpus
 * (prose that has never cited an ADR filename — verified 0 hits when scanned).
 *
 * Usage:  node scripts/check-adr-integrity.mjs [--self-test] [--report]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ADR_ROOTS = ['docs/editorial/decisions', 'docs/design/decisions'];
const CITE_ROOTS = ['scripts', 'data', 'docs', '_includes', '.claude', 'CLAUDE.md'];
const SCANNABLE = /\.(mjs|js|json|md|sh|html)$/;
const SKIP_DIR = /(^|\/)(node_modules|\.git)(\/|$)/;

/** Sibling repo, when checked out beside us. Its ADRs are a legitimate citation target. */
const SIBLING_ADR_DIRS = [
  '../Muntin-Invoice-Decoder/docs/ux/decisions',
  '../Muntin-Invoice-Decoder/docs/security/decisions',
];

/**
 * Pre-existing duplicate numbers in the EDITORIAL series, recorded 2026-08-07 by
 * this gate's first run. Each entry names the ambiguity a bare citation creates.
 * DO NOT ADD TO THIS LIST to make a new collision pass. Renumber instead.
 *
 * Keyed per SERIES, because each decisions/ directory is its own numbering space —
 * `docs/editorial/decisions/ADR-000-editorial-doctrine.md` and
 * `docs/design/decisions/ADR-000-design-doctrine.md` are both correct, and
 * CLAUDE.md says so ("Doctrine is each series' ADR-000"). The first cut of this
 * gate pooled all roots into one namespace and reported three collisions that were
 * not collisions — the same scanner-root error CLAUDE.md records learning three
 * times on 2026-07-28. Cross-series numbers do not collide; they are addressed by
 * their path, which is how every citation in this repo already writes them.
 */
const GRANDFATHERED_EDITORIAL = {
  '010': {
    since: '2026-08-07',
    files: ['ADR-010-PROPOSAL-cost-index-insight-grammar.md', 'ADR-010-cost-index-citable-publication.md'],
    ambiguity:
      'CLAUDE.md cites "ADR-010 (insight grammar)" and the Cost Index section cites ADR-010 for the ' +
      'citable publication. Both readings are live; one file is a PROPOSAL and one is the decision.',
  },
  '011': {
    since: '2026-08-07',
    files: ['ADR-011-monthly-cadence-pivot.md', 'ADR-011-notable-price-events-surface.md'],
    ambiguity: 'CLAUDE.md cites ADR-011 for the notable price events surface; the cadence pivot also claims 011.',
  },
  '012': {
    since: '2026-08-07',
    files: ['ADR-012-manual-authorship-of-the-dispatch.md', 'ADR-012-vendor-benchmark-market-context.md'],
    ambiguity: 'CLAUDE.md cites ADR-012 for Vendor Benchmark market-context; manual authorship also claims 012.',
  },
  '013': {
    since: '2026-08-07',
    files: ['ADR-013-commercial-posture-pricing-and-enterprise.md', 'ADR-013-gov-data-sources-policy.md'],
    ambiguity:
      'The sharpest one. CLAUDE.md cites "ADR-013 (NASS/Census/EIA data-sources policy)", while the ' +
      'commercial-posture file at the same number was superseded by ADR-030 (one price). A reader ' +
      'sent to "ADR-013" for pricing lands on a withdrawn posture — and the PRODUCT repo has its own ' +
      'ADR-013 (no billing code), which is the one the pricing decision actually lives in.',
  },
};

/** Series → its grandfathered pairs. A series absent here must be collision-free. */
const GRANDFATHERED = {
  'docs/editorial/decisions': GRANDFATHERED_EDITORIAL,
  'docs/design/decisions': {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure core (exported for --self-test)
// ─────────────────────────────────────────────────────────────────────────────

export const adrNumber = (f) => (f.match(/^ADR-(\d{3})/) || [])[1] || null;

/** A1 — group files by number, minus the grandfathered pairs. */
export function findCollisions(files, grandfathered = GRANDFATHERED) {
  const byNum = new Map();
  for (const f of files) {
    const n = adrNumber(f);
    if (!n) continue;
    if (!byNum.has(n)) byNum.set(n, []);
    byNum.get(n).push(f);
  }
  const out = [];
  for (const [num, fs_] of [...byNum].sort()) {
    if (fs_.length < 2) continue;
    const g = grandfathered[num];
    const same = g && g.files.length === fs_.length && g.files.every((x) => fs_.includes(x));
    if (!same) out.push({ num, files: fs_.slice().sort() });
  }
  return out;
}

/** A2 — the H1 must state the number the filename claims. */
export function titleMismatch(file, text) {
  const num = adrNumber(file);
  if (!num) return null;
  const h1 = (text.match(/^#\s+(.+)$/m) || [])[1];
  if (!h1) return { file, expected: num, found: null, why: 'no H1' };
  const stated = (h1.match(/ADR-(\d{3})/) || [])[1];
  if (!stated) return { file, expected: num, found: null, why: 'H1 states no ADR number' };
  if (stated !== num) return { file, expected: num, found: stated, why: 'H1 states a different number' };
  return null;
}

/** A grandfathered entry that no longer describes reality is stale — it must not outlive its subject. */
export function staleGrandfathered(files, grandfathered = GRANDFATHERED) {
  const have = new Set(files);
  const stale = [];
  for (const [num, g] of Object.entries(grandfathered)) {
    const missing = g.files.filter((f) => !have.has(f));
    if (missing.length) stale.push({ num, missing });
  }
  return stale;
}

// ─────────────────────────────────────────────────────────────────────────────
// I/O
// ─────────────────────────────────────────────────────────────────────────────

function listAdrFiles() {
  const out = [];
  for (const root of ADR_ROOTS) {
    const dir = path.join(REPO, root);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (/^ADR-\d{3}.*\.md$/.test(f)) out.push({ root, file: f });
  }
  return out;
}

function walk(p, hit) {
  let st;
  try { st = fs.statSync(p); } catch { return; }
  if (st.isDirectory()) {
    if (SKIP_DIR.test(p)) return;
    for (const f of fs.readdirSync(p)) walk(path.join(p, f), hit);
    return;
  }
  if (!SCANNABLE.test(p)) return;
  let t;
  try { t = fs.readFileSync(p, 'utf8'); } catch { return; }
  hit(path.relative(REPO, p), t);
}

/** This file's own self-test fixtures are ADR-shaped strings, not citations. */
const SELF = 'scripts/check-adr-integrity.mjs';

function collectCitations() {
  const cites = new Map();
  for (const root of CITE_ROOTS) {
    walk(path.join(REPO, root), (rel, text) => {
      if (rel === SELF) return;
      for (const m of text.matchAll(/ADR-\d{3}-[A-Za-z0-9._-]+\.md/g)) {
        if (!cites.has(m[0])) cites.set(m[0], new Set());
        cites.get(m[0]).add(rel);
      }
    });
  }
  return cites;
}

function resolvableNames() {
  const names = new Set(listAdrFiles().map((x) => x.file));
  for (const d of SIBLING_ADR_DIRS) {
    const dir = path.resolve(REPO, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (/\.md$/.test(f)) names.add(f);
  }
  return names;
}

// ─────────────────────────────────────────────────────────────────────────────
// Self-test
// ─────────────────────────────────────────────────────────────────────────────

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.error(`  FAIL  ${label}`); } };

  ok(adrNumber('ADR-034-x.md') === '034', 'adrNumber parses a three-digit number');
  ok(adrNumber('NOTES.md') === null, 'adrNumber rejects a non-ADR filename');

  ok(findCollisions(['ADR-001-a.md', 'ADR-002-b.md'], {}).length === 0, 'unique numbers do not collide');
  ok(findCollisions(['ADR-001-a.md', 'ADR-001-b.md'], {}).length === 1, 'a shared number is a collision');
  ok(
    findCollisions(['ADR-001-a.md', 'ADR-001-b.md'], { '001': { files: ['ADR-001-a.md', 'ADR-001-b.md'] } }).length === 0,
    'an exactly-matching grandfathered pair is exempt',
  );
  // The assertion that makes the registry a waiver and not a blanket amnesty.
  ok(
    findCollisions(['ADR-001-a.md', 'ADR-001-b.md', 'ADR-001-c.md'], { '001': { files: ['ADR-001-a.md', 'ADR-001-b.md'] } }).length === 1,
    'a THIRD file on a grandfathered number still fails — the waiver covers a pair, not a number',
  );

  ok(titleMismatch('ADR-034-x.md', '# ADR-034 — Title\n') === null, 'a matching H1 passes');
  ok(titleMismatch('ADR-034-x.md', '# ADR-035 — Title\n').found === '035', 'a mismatched H1 is caught');
  ok(titleMismatch('ADR-034-x.md', 'no heading here').why === 'no H1', 'a missing H1 is caught');
  ok(titleMismatch('ADR-034-x.md', '# The Loop Driver\n').why === 'H1 states no ADR number', 'an H1 with no number is caught');
  // This is the exact shape of tonight's two renames.
  ok(titleMismatch('ADR-035-the-judge-protocol.md', '# ADR-034 — The judge protocol\n') !== null,
    'the rename-left-the-title-behind failure is caught');

  ok(staleGrandfathered(['ADR-001-a.md', 'ADR-001-b.md'], { '001': { files: ['ADR-001-a.md', 'ADR-001-b.md'] } }).length === 0,
    'a grandfathered pair that still exists is not stale');
  ok(staleGrandfathered(['ADR-001-a.md'], { '001': { files: ['ADR-001-a.md', 'ADR-001-b.md'] } }).length === 1,
    'a grandfathered entry outliving its files is stale');

  console.log(`check-adr-integrity --self-test: ${pass}/${pass + fail} assertions passed`);
  process.exit(fail ? 1 : 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) selfTest();

const adrs = listAdrFiles();
let bad = 0;
const say = (s) => console.error(s);

// A1 — collisions, computed WITHIN each series
for (const root of ADR_ROOTS) {
  const names = adrs.filter((a) => a.root === root).map((a) => a.file);
  if (!names.length) continue;
  const gf = GRANDFATHERED[root] || {};

  const collisions = findCollisions(names, gf);
  if (collisions.length) {
    say(`check-adr-integrity: ${collisions.length} ADR number(s) claimed by more than one file in ${root}/\n`);
    for (const c of collisions) {
      say(`  ADR-${c.num} is claimed by ${c.files.length} files:`);
      for (const f of c.files) say(`      ${f}`);
    }
    say('\n  An ADR number is an address. Renumber the one that is not yet cited, and update its H1.');
    bad = 1;
  }

  // A1b — a waiver may not outlive its subject
  const stale = staleGrandfathered(names, gf);
  if (stale.length) {
    say(`check-adr-integrity: ${stale.length} grandfathered entr(ies) in ${root}/ name files that no longer exist:`);
    for (const s of stale) say(`  ADR-${s.num} — missing: ${s.missing.join(', ')}`);
    say('  The collision was resolved. Delete the entry from GRANDFATHERED in this script.');
    bad = 1;
  }
}

// A2 — title states its own number
const mismatches = [];
for (const { root, file } of adrs) {
  const m = titleMismatch(file, fs.readFileSync(path.join(REPO, root, file), 'utf8'));
  if (m) mismatches.push(m);
}
if (mismatches.length) {
  say(`\ncheck-adr-integrity: ${mismatches.length} ADR file(s) whose H1 disagrees with the filename:`);
  for (const m of mismatches) {
    say(`  ${m.file} — ${m.why}${m.found ? ` (H1 says ADR-${m.found}, filename says ADR-${m.expected})` : ''}`);
  }
  say('  A rename that leaves the title behind makes the title the lie a reader believes.');
  bad = 1;
}

// A3 — dangling citations, REPORTED not halting
const resolvable = resolvableNames();
const dangling = [...collectCitations()].filter(([name]) => !resolvable.has(name));
const siblingPresent = SIBLING_ADR_DIRS.some((d) => fs.existsSync(path.resolve(REPO, d)));

if (dangling.length) {
  say(`\n⚠ ${dangling.length} ADR filename citation(s) resolve to no file (reported, not halting):`);
  const show = process.argv.includes('--report') ? dangling : dangling.slice(0, 8);
  for (const [name, where] of show) say(`    ${name}  <- ${[...where].slice(0, 2).join(', ')}`);
  if (!process.argv.includes('--report') && dangling.length > show.length) {
    say(`    … ${dangling.length - show.length} more — run with --report`);
  }
  say(`    Sibling product repo ${siblingPresent ? 'IS' : 'is NOT'} on disk, so cross-repo citations ${siblingPresent ? 'were resolved' : 'CANNOT be resolved here'}.`);
}

if (!bad) {
  const gcount = Object.values(GRANDFATHERED).reduce((a, g) => a + Object.keys(g).length, 0);
  console.log(
    `check-adr-integrity: OK — ${adrs.length} ADR files across ${ADR_ROOTS.length} roots, ` +
      `every number unique except ${gcount} dated grandfathered pair(s), every H1 agrees with its filename` +
      `${dangling.length ? `; ${dangling.length} dangling citation(s) reported` : ''}.`,
  );
}
process.exit(bad);
