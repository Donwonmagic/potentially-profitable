#!/usr/bin/env node
/**
 * check-agent-guardrails.mjs — enforces the repo's own standing conventions, the ones that
 * were written in prose, relied on, and then quietly broken.
 *
 * WHY THIS EXISTS. The dominant failure mode here is the engine-behind-pages hazard: a
 * generator or injector rewrites committed HTML inside a build chain, so a hand-edit
 * silently reverts and, worse, a SKIPPED injector silently rots the committed page. The
 * mitigation has been stated repeatedly in CLAUDE.md and the handoff board —
 *
 *     "Injectors that own page regions must be registered in BOTH
 *      cost-index-refresh.yml (run + pre-commit --check) and check-all.mjs."
 *
 * — and nothing enforced it. On 2026-07-28 that gap had already bitten:
 * inject-about-cost-read.mjs ran in the M/W/F refresh with no --check in check-all, and
 * /about/ + /es/about/ were serving a STALE live basket read — "Eggs +71.7%" against a
 * committed +132.1%, and "Chicken breast (boneless) down 25.3%" where the data said "Whole
 * chicken UP 27.6%": a different ingredient, the opposite direction, stamped three days
 * old. A published market read that was simply wrong, undetected because one line was
 * missing from one table.
 *
 * A convention that only lives in prose is a convention that is already broken somewhere.
 *
 * THE RULES (each mechanically decidable; a rule that needs judgement does not belong here):
 *
 *   R1  Every inject-*.mjs RUN in cost-index-refresh.yml — a chain that COMMITS its output
 *       — must be registered in check-all.mjs. check-all is what gates PRs and the deploy;
 *       without an entry there, nothing ever re-verifies the committed page.
 *   R2  ...and must also carry its own pre-commit `--check` inside refresh.yml, so a bad
 *       run fails before it commits rather than after.
 *   R3  Every script named in check-all.mjs's CHECKS table must exist on disk. A typo
 *       silently drops a gate.
 *   R4  Every baseline expectedFail entry must carry a dated reason (`YYYY-MM-DD: why`),
 *       so a permanent exemption cannot masquerade as a temporary one.
 *
 * Scoped to injectors on purpose. Applying R1/R2 to every build-* in the refresh would fire
 * on ~24 scripts whose outputs are legitimately gated elsewhere or which ARE gates
 * themselves — a rule with false positives gets suppressed, and a suppressed rule protects
 * nothing.
 *
 *   node scripts/check-agent-guardrails.mjs
 *   node scripts/check-agent-guardrails.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Scripts invoked in a workflow, split by whether that invocation passes --check. */
export function parseWorkflow(yml) {
  const run = new Set(), checked = new Set();
  for (const m of yml.matchAll(/node scripts\/([A-Za-z0-9._-]+\.mjs)([^\n]*)/g)) {
    (m[2].includes('--check') ? checked : run).add(m[1]);
  }
  return { run, checked };
}

/** Script filenames referenced anywhere in check-all's table. */
export function parseCheckAll(src) {
  return new Set([...src.matchAll(/'([A-Za-z0-9._-]+\.mjs)'/g)].map((m) => m[1]));
}

export function audit({ workflow, checkAll, baseline, exists }) {
  const { run, checked } = parseWorkflow(workflow);
  const registered = parseCheckAll(checkAll);
  const violations = [];

  const injectors = [...run].filter((s) => s.startsWith('inject-')).sort();
  for (const s of injectors) {
    if (!registered.has(s)) {
      violations.push({ rule: 'R1', what: s, why: `runs in the committing refresh chain but is absent from check-all.mjs — if the run step is ever dropped, nothing re-verifies the committed page.` });
    }
    if (!checked.has(s)) {
      violations.push({ rule: 'R2', what: s, why: `runs in cost-index-refresh.yml with no pre-commit "--check" there — a bad run would commit before anything noticed.` });
    }
  }

  for (const s of [...registered].sort()) {
    if (!exists(s)) violations.push({ rule: 'R3', what: s, why: `named in check-all.mjs but not present in scripts/ — a typo here silently drops a gate.` });
  }

  for (const e of (baseline.expectedFail || [])) {
    const reason = String(e && e.reason || '');
    if (!/^\d{4}-\d{2}-\d{2}:/.test(reason)) {
      violations.push({ rule: 'R4', what: String(e && e.label || '(unlabelled)'), why: `baseline exemption has no dated reason ("YYYY-MM-DD: why") — a permanent waiver must not look like a temporary one.` });
    }
  }

  return { violations, injectorCount: injectors.length, registeredCount: registered.size };
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0, ran = 0;
  const t = (n, c) => { ran++; if (!c) { console.error('  ✗', n); fail++; } };

  const wf = `
      run: |
        node scripts/build-cost-index-pages.mjs
        node scripts/inject-good.mjs
        node scripts/inject-unregistered.mjs
        node scripts/inject-unchecked.mjs
      run: |
        node scripts/inject-good.mjs --check
        node scripts/inject-unregistered.mjs --check
  `;
  const p = parseWorkflow(wf);
  t('separates run steps from --check steps', p.run.has('inject-unchecked.mjs') && p.checked.has('inject-good.mjs'));
  t('a script both run and checked appears in both sets', p.run.has('inject-good.mjs') && p.checked.has('inject-good.mjs'));
  t('non-injector builds are still parsed', p.run.has('build-cost-index-pages.mjs'));

  const ca = `const CHECKS = [ ['A','inject-good.mjs','--check'], ['B','inject-unchecked.mjs','--check'], ['C','missing-file.mjs'] ];`;
  t('reads script names out of the checks table', parseCheckAll(ca).has('inject-good.mjs'));

  const base = { expectedFail: [{ label: 'ok', reason: '2026-07-16: dated.' }, { label: 'sloppy', reason: 'because' }] };
  const present = new Set(['inject-good.mjs', 'inject-unchecked.mjs', 'inject-unregistered.mjs']);
  const { violations } = audit({ workflow: wf, checkAll: ca, baseline: base, exists: (s) => present.has(s) });
  const has = (r, w) => violations.some((v) => v.rule === r && v.what === w);

  t('R1 fires on a refresh injector missing from check-all', has('R1', 'inject-unregistered.mjs'));
  t('R1 stays silent on a properly registered injector', !has('R1', 'inject-good.mjs'));
  t('R2 fires on a refresh injector with no pre-commit --check', has('R2', 'inject-unchecked.mjs'));
  t('R2 stays silent when the --check is present', !has('R2', 'inject-good.mjs'));
  t('R1 and R2 are independent (one script can trip only one)', has('R1', 'inject-unregistered.mjs') && !has('R2', 'inject-unregistered.mjs'));
  t('R3 fires on a check-all entry with no file behind it', has('R3', 'missing-file.mjs'));
  t('R3 stays silent for scripts that exist', !has('R3', 'inject-good.mjs'));
  t('R4 fires on an undated baseline exemption', has('R4', 'sloppy'));
  t('R4 stays silent on a dated one', !has('R4', 'ok'));
  t('build-* scripts are deliberately out of R1/R2 scope', !violations.some((v) => v.what.startsWith('build-')));
  t('a fully clean input yields no violations', audit({
    workflow: 'node scripts/inject-good.mjs\nnode scripts/inject-good.mjs --check',
    checkAll: `['A','inject-good.mjs','--check']`,
    baseline: { expectedFail: [] }, exists: () => true,
  }).violations.length === 0);
  t('a missing expectedFail array does not throw', audit({ workflow: '', checkAll: '', baseline: {}, exists: () => true }).violations.length === 0);

  if (fail) { console.error(`check-agent-guardrails self-test: ${fail} of ${ran} failed.`); process.exit(1); }
  console.log(`check-agent-guardrails self-test: ${ran}/${ran} passed (workflow parse, R1-R4 fire and stay silent, scope, empty input).`);
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
function run() {
  const workflow = fs.readFileSync(path.join(repo, '.github/workflows/cost-index-refresh.yml'), 'utf8');
  const checkAll = fs.readFileSync(path.join(repo, 'scripts/check-all.mjs'), 'utf8');
  const baseline = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/check-all-baseline.json'), 'utf8'));
  const exists = (s) => fs.existsSync(path.join(repo, 'scripts', s));

  const { violations, injectorCount, registeredCount } = audit({ workflow, checkAll, baseline, exists });

  // A parser that silently matches nothing must not read as compliance.
  if (!injectorCount || registeredCount < 50) {
    console.error(`✗ agent-guardrails: parsed ${injectorCount} refresh injector(s) and ${registeredCount} check-all entr(ies) — the parser is not seeing the real files. Fix it before trusting a pass.`);
    process.exit(1);
  }

  for (const v of violations) console.error(`  ✗ [${v.rule}] ${v.what} — ${v.why}`);
  if (violations.length) {
    console.error(`✗ agent-guardrails: ${violations.length} convention violation(s). These rules exist because each one has already been broken in this repo.`);
    process.exit(1);
  }
  console.log(`✓ agent-guardrails: ${injectorCount} refresh injector(s) registered in both places, ${registeredCount} check-all entr(ies) resolve, every baseline exemption dated.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
