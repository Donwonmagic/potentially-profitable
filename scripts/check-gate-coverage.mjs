#!/usr/bin/env node
/**
 * Gate-coverage gate — is every check script actually running?
 *
 * WHY THIS EXISTS (2026-07-28)
 *
 * CLAUDE.md says `check-all.mjs` "runs every `check-*.mjs` script in sequence".
 * It does not. On the day this was written there were 128 check scripts on disk
 * and 123 wired in; five had never been part of the run, and two of those five
 * FAIL today. Nobody had decided that — the scripts were written, and the wiring
 * step was quietly skipped.
 *
 * This is the same failure this repo keeps finding in other clothes: an alarm
 * that is switched off is indistinguishable from an alarm that is silent because
 * everything is fine. A gate nobody runs is not protection, it is the appearance
 * of protection, which is worse — it is why `check-cost-pressure-snapshot-fresh`
 * did not exist while its feature sat dead for 22 days, and why the storefront's
 * freshness alarms were wired only to push/PR.
 *
 * WHAT THIS ENFORCES
 *
 * Every `scripts/check-*.mjs` is either (a) referenced by `check-all.mjs`, or
 * (b) listed in UNWIRED below with a dated reason. There is no third state. A
 * new check script that nobody wires fails THIS gate, which is wired, so the
 * omission surfaces at the moment it is introduced rather than months later.
 *
 * Being on the UNWIRED list is a legitimate outcome, not a demerit — an advisory
 * reporter and a backlog tracker are both useful things that should not block a
 * deploy. What the list forbids is the omission being *accidental*.
 *
 * IMPORTANT — do not "fix" a failing unwired gate by wiring it. `check-all.mjs`
 * runs inside the Cloudflare deploy command (`wrangler.jsonc` build.command),
 * so wiring a currently-failing gate turns every deploy red. Fix the violations
 * first, then wire it, then delete its UNWIRED entry.
 *
 * Usage:
 *   node scripts/check-gate-coverage.mjs
 *   node scripts/check-gate-coverage.mjs --self-test
 *
 * Exit codes:
 *   0 — every check script is wired or documented.
 *   1 — a check script is neither.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const ORCHESTRATOR = 'scripts/check-all.mjs';

/**
 * Check scripts deliberately NOT in the deploy gate. Every entry states what it
 * would do today, so the decision can be re-examined rather than inherited.
 */
export const UNWIRED = {
  'check-css-drift.mjs': {
    since: '2026-07-28',
    status: 'FAILS — 505 drift issues across 7 files',
    why:
      'Design-system debt tracker, not a gate. It flags hardcoded hex where a token ' +
      'should be used; the backlog is large and retokenizing by hand risks visual ' +
      'regressions that cannot be verified in this container (no browser). Wiring it ' +
      'as-is would red every deploy. Run it manually when doing design-system work.',
  },
  'check-reply-time-canon.mjs': {
    since: '2026-07-28',
    status: 'FAILS — 1 violation, in a non-shipped planning doc',
    why:
      'The only hit is docs/editorial/the-hundred.md quoting the pre-canon copy ' +
      '("reply within 4 hours Mon–Fri") while discussing it. docs/ is excluded from ' +
      'the deploy tar, so nothing user-facing is affected, and every shipped surface ' +
      'is already canonical — which is the useful finding. Wire it once that quote is ' +
      'marked historical; it would then protect the shipped copy.',
  },
  'check-stone-2-usage.mjs': {
    since: '2026-07-28',
    status: 'passes — self-declares "[REPORT (non-blocking)]"',
    why: 'Advisory census of --stone-2 as a text colour (58 occurrences). Reports by design; there is no pass/fail bar to enforce.',
  },
  'check-text-content-rendering.mjs': {
    since: '2026-07-28',
    status: 'passes — advisory',
    why: 'Prints .innerHTML call sites for human review ("verify the RHS is page-authored") and then reports clean. The judgement it asks for is not mechanical.',
  },
  'check-course-mobile-css.mjs': {
    since: '2026-07-28',
    status: 'passes — 52 pages unchanged',
    why: 'Scoped entirely to /course/, which CLAUDE.md freezes ("kept live, no further investment"). Gating frozen scope adds deploy risk for a surface that is not being changed.',
  },
};

export function findCheckScripts(names) {
  return names.filter((f) => /^check-.*\.mjs$/.test(f) && f !== 'check-all.mjs' && f !== 'check-gate-coverage.mjs');
}

export function classify(scripts, orchestratorSrc, unwired = UNWIRED) {
  const wired = [];
  const documented = [];
  const orphans = [];
  for (const f of scripts) {
    if (orchestratorSrc.includes(f)) wired.push(f);
    else if (unwired[f]) documented.push(f);
    else orphans.push(f);
  }
  return { wired, documented, orphans };
}

/** An UNWIRED entry for a script that is now wired is stale bookkeeping. */
export function staleEntries(scripts, orchestratorSrc, unwired = UNWIRED) {
  return Object.keys(unwired).filter(
    (f) => !scripts.includes(f) || orchestratorSrc.includes(f),
  );
}

function selfTest() {
  const scripts = ['check-a.mjs', 'check-b.mjs', 'check-c.mjs'];
  const src = 'run("check-a.mjs")';
  const unwired = { 'check-b.mjs': { since: '2026-01-01', status: 'x', why: 'y' } };
  const r = classify(scripts, src, unwired);
  const cases = [
    [r.wired.join(), 'check-a.mjs', 'a wired script is wired'],
    [r.documented.join(), 'check-b.mjs', 'a documented script is documented'],
    [r.orphans.join(), 'check-c.mjs', 'an undocumented, unwired script is an orphan'],
    [findCheckScripts(['check-x.mjs', 'build-y.mjs']).join(), 'check-x.mjs', 'only check-* scripts count'],
    [findCheckScripts(['check-all.mjs']).length, 0, 'the orchestrator does not check itself'],
    [findCheckScripts(['check-gate-coverage.mjs']).length, 0, 'this gate does not check itself'],
    [staleEntries(scripts, 'run("check-b.mjs")', unwired).join(), 'check-b.mjs', 'wiring a documented script makes its entry stale'],
    [staleEntries(scripts, src, unwired).length, 0, 'a correct entry is not stale'],
    [staleEntries([], src, unwired).join(), 'check-b.mjs', 'an entry for a deleted script is stale'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // Every real entry must carry a reason, or the list becomes a mute allowlist.
  for (const [name, e] of Object.entries(UNWIRED)) {
    if (!e.since || !e.why || e.why.length < 40) {
      console.error(`✗ self-test: UNWIRED["${name}"] needs a date and a substantive reason`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`check-gate-coverage --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  if (argv.includes('--self-test')) selfTest();

  const scripts = findCheckScripts(fs.readdirSync(path.join(REPO, 'scripts')));
  const src = fs.readFileSync(path.join(REPO, ORCHESTRATOR), 'utf8');
  const { wired, documented, orphans } = classify(scripts, src);
  const stale = staleEntries(scripts, src);

  if (!orphans.length && !stale.length) {
    console.log(
      `check-gate-coverage: ${scripts.length} check script(s) — ${wired.length} wired into check-all, ${documented.length} documented as deliberately unwired. 0 silent gates.`,
    );
    process.exit(0);
  }

  if (orphans.length) {
    console.error(`check-gate-coverage: ${orphans.length} check script(s) run NOWHERE:\n`);
    for (const o of orphans) console.error(`  ✗ scripts/${o}`);
    console.error(`
A check script that nothing invokes is not protection — it is the appearance of
protection. Resolve each one deliberately:

  • It should gate the deploy  → add it to the list in ${ORCHESTRATOR}.
    Run it FIRST. check-all runs inside the Cloudflare build command, so wiring a
    currently-failing gate turns every deploy red. Fix the violations, then wire.
  • It is advisory or scoped to frozen surface → add it to UNWIRED in this file
    with a date, its current pass/fail status, and why it should not block.`);
  }

  if (stale.length) {
    console.error(`\ncheck-gate-coverage: ${stale.length} stale UNWIRED entr(ies):\n`);
    for (const s of stale) console.error(`  ✗ ${s} — now wired, or no longer on disk. Remove its UNWIRED entry.`);
  }
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
