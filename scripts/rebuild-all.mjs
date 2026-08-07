#!/usr/bin/env node
/**
 * rebuild-all.mjs — reach a green tree locally, in one command.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * The order in which this repo's 79 build steps must run exists in exactly one place: a
 * 3,867-character `build.command` string inside wrangler.jsonc, executed only by
 * Cloudflare's build container. A human cannot run it. The 2026-08-07 company audit
 * measured what that costs — three consecutive local `check-all` passes landed on
 * 312 -> 317 -> 312 failures, because clearing reds in an ad-hoc order does not converge,
 * and 3 of the 8 reds a founder sees locally are phantoms the deploy heals. A 37.5%
 * false-alarm rate on the only feedback loop is how a red deploy becomes background noise.
 *
 * This runs the order. It is not a second copy of it — copies drift, and a drifted copy of
 * a build order is worse than none. Every step is READ FROM `data/system-graph.json`,
 * which scripts/build-system-graph.mjs derives from wrangler.jsonc itself. Change
 * build.command and rerun the graph; this file needs no edit, ever.
 *
 * WHAT IT ADDS TO THE DEPLOY ORDER
 *
 * The deploy heals its own chain: a builder inside build.command that drifts is re-run
 * before check-all sees it. So a red that SURVIVES a deploy can only come from a builder
 * check-all --checks that the deploy never runs. The graph finds those (21 today) and the
 * plan puts them in a `pre` phase ahead of the spine. That is the difference between this
 * and pasting build.command into a shell.
 *
 *   node scripts/rebuild-all.mjs                # run the plan, stop at the first failure
 *   node scripts/rebuild-all.mjs --list         # print the plan, run nothing
 *   node scripts/rebuild-all.mjs --dry-run      # same as --list, with the resolved commands
 *   node scripts/rebuild-all.mjs --pre-only     # only the out-of-chain builders
 *   node scripts/rebuild-all.mjs --no-check     # skip the final check-all (fast inner loop)
 *   node scripts/rebuild-all.mjs --keep-going   # run every step, report failures at the end
 *   node scripts/rebuild-all.mjs --from=<name>  # resume at the first step matching <name>
 *   node scripts/rebuild-all.mjs --with-network # include steps that need the network
 *   node scripts/rebuild-all.mjs --with-secrets # include steps that need an API secret
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 *   - It does not stage dist/, npm-install lightningcss, or run pagefind. Those are the
 *     five non-node deploy steps; they need the network and produce nothing the working
 *     tree keeps. `plan.notes` names them.
 *   - It does not skip a failing step to reach a green summary. A step that exits non-zero
 *     stops the run (or is reported at the end under --keep-going). Green here has to mean
 *     the same thing green means in the deploy.
 *   - It does not fetch. Steps that need the network or a secret are LISTED and SKIPPED by
 *     default, because the container this repo is usually edited in has neither. A skipped
 *     step is printed as skipped — never silently passed.
 *
 * Node 22 built-ins only; no dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename_ = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename_), '..');
const GRAPH = path.join(REPO, 'data', 'system-graph.json');

/** Load the plan, refusing to guess if the graph is absent or shaped wrong. */
export function loadPlan(raw) {
  let doc;
  try { doc = JSON.parse(raw); } catch { throw new Error('data/system-graph.json is not valid JSON.'); }
  if (!doc?.plan?.steps?.length) throw new Error('data/system-graph.json carries no plan.steps.');
  for (const s of doc.plan.steps) {
    if (!s.script || !Array.isArray(s.args) || !Array.isArray(s.requires)) {
      throw new Error(`Malformed plan step: ${JSON.stringify(s)}`);
    }
  }
  return doc;
}

/** Apply the CLI filters to the plan. Pure, so the self-test can pin the semantics. */
export function selectSteps(steps, opts) {
  let out = steps;
  if (opts.preOnly) out = out.filter((s) => s.phase === 'pre');
  if (opts.noCheck) out = out.filter((s) => s.script !== 'scripts/check-all.mjs');
  if (opts.from) {
    const at = out.findIndex((s) => s.script.includes(opts.from));
    if (at === -1) throw new Error(`--from=${opts.from} matched no step in the plan.`);
    out = out.slice(at);
  }
  return out.map((s) => {
    const needsNet = s.requires.includes('network');
    const needsSecret = s.requires.some((r) => r.startsWith('secret:'));
    const skip = (needsNet && !opts.withNetwork) || (needsSecret && !opts.withSecrets);
    return { ...s, skip, skipReason: skip ? s.requires.join(', ') : null };
  });
}

function parseArgs(argv) {
  const has = (f) => argv.includes(f);
  const from = (argv.find((a) => a.startsWith('--from=')) || '').slice('--from='.length);
  return {
    list: has('--list'),
    dryRun: has('--dry-run'),
    preOnly: has('--pre-only'),
    noCheck: has('--no-check'),
    keepGoing: has('--keep-going'),
    withNetwork: has('--with-network'),
    withSecrets: has('--with-secrets'),
    selfTest: has('--self-test'),
    from: from || null,
  };
}

function selfTest() {
  const steps = [
    { phase: 'pre', script: 'scripts/a.mjs', args: [], requires: [], why: '' },
    { phase: 'deploy', script: 'scripts/b.mjs', args: ['--es'], requires: ['network'], why: '' },
    { phase: 'deploy', script: 'scripts/c.mjs', args: [], requires: ['secret:FRED_KEY'], why: '' },
    { phase: 'deploy', script: 'scripts/check-all.mjs', args: [], requires: [], why: '' },
  ];
  const base = { preOnly: false, noCheck: false, from: null, withNetwork: false, withSecrets: false };
  const cases = [
    [selectSteps(steps, base).length, 4, 'every step is selected by default'],
    [selectSteps(steps, base).filter((s) => s.skip).map((s) => s.script).join(), 'scripts/b.mjs,scripts/c.mjs',
      'network and secret steps are skipped by default'],
    [selectSteps(steps, { ...base, withNetwork: true }).filter((s) => s.skip).map((s) => s.script).join(), 'scripts/c.mjs',
      '--with-network un-skips only the network step'],
    [selectSteps(steps, { ...base, withNetwork: true, withSecrets: true }).filter((s) => s.skip).length, 0,
      'both flags un-skip everything'],
    [selectSteps(steps, { ...base, preOnly: true }).map((s) => s.script).join(), 'scripts/a.mjs', '--pre-only keeps the pre phase'],
    [selectSteps(steps, { ...base, noCheck: true }).map((s) => s.script).join(), 'scripts/a.mjs,scripts/b.mjs,scripts/c.mjs',
      '--no-check drops the orchestrator'],
    [selectSteps(steps, { ...base, from: 'c.mjs' }).map((s) => s.script).join(), 'scripts/c.mjs,scripts/check-all.mjs',
      '--from resumes at the first match and keeps the tail'],
    [(() => { try { selectSteps(steps, { ...base, from: 'nope' }); return 'no throw'; } catch (e) { return 'threw'; } })(), 'threw',
      '--from with no match fails loudly rather than running nothing'],
    [(() => { try { loadPlan('{}'); return 'no throw'; } catch { return 'threw'; } })(), 'threw',
      'a graph with no plan is an error, not an empty run'],
    [loadPlan(JSON.stringify({ plan: { steps: [{ script: 'x', args: [], requires: [] }] } })).plan.steps.length, 1,
      'a well-formed plan loads'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`x self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // Every script the committed plan names must exist. A plan that points at a deleted
  // builder is exactly the rot this file is meant to replace.
  let missing = 0;
  if (fs.existsSync(GRAPH)) {
    const doc = loadPlan(fs.readFileSync(GRAPH, 'utf8'));
    for (const s of doc.plan.steps) {
      if (!fs.existsSync(path.join(REPO, s.script))) { console.error(`x self-test: plan names a missing script — ${s.script}`); missing++; }
    }
    if (missing) process.exit(2);
    pass += doc.plan.steps.length;
  }
  console.log(`rebuild-all --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.selfTest) selfTest();

  if (!fs.existsSync(GRAPH)) {
    console.error('rebuild-all: data/system-graph.json is missing. Run `node scripts/build-system-graph.mjs` first — the plan is derived, never hand-written.');
    process.exit(2);
  }
  let doc;
  try { doc = loadPlan(fs.readFileSync(GRAPH, 'utf8')); } catch (e) { console.error(`rebuild-all: ${e.message}`); process.exit(2); }

  let steps;
  try { steps = selectSteps(doc.plan.steps, opts); } catch (e) { console.error(`rebuild-all: ${e.message}`); process.exit(2); }

  const pre = steps.filter((s) => s.phase === 'pre').length;
  console.log(`rebuild-all: ${steps.length} step(s) — ${pre} out-of-chain builder(s) the deploy never runs, then the ${steps.length - pre} step(s) of wrangler.jsonc build.command.`);
  console.log(`             plan derived from data/system-graph.json (asOf ${doc.asOf}); regenerate with \`node scripts/build-system-graph.mjs\`.`);
  for (const n of doc.plan.notes || []) console.log(`             note: ${n}`);
  console.log('');

  if (opts.list || opts.dryRun) {
    steps.forEach((s, i) => {
      const cmd = ['node', s.script, ...s.args].join(' ');
      console.log(`${String(i + 1).padStart(3)}  ${s.phase.padEnd(6)} ${s.skip ? 'SKIP' : '    '}  ${cmd}${s.skip ? `   [needs ${s.skipReason}]` : ''}`);
      if (opts.dryRun && s.phase === 'pre') console.log(`       why: ${s.why}`);
    });
    process.exit(0);
  }

  const failures = [];
  const skipped = [];
  const t0 = Date.now();
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const label = `${String(i + 1).padStart(3)}/${steps.length}  ${s.script}${s.args.length ? ' ' + s.args.join(' ') : ''}`;
    if (s.skip) { skipped.push(s); console.log(`${label}  — SKIPPED (needs ${s.skipReason})`); continue; }
    const started = Date.now();
    const r = spawnSync(process.execPath, [path.join(REPO, s.script), ...s.args], { cwd: REPO, stdio: 'inherit' });
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    if (r.status !== 0) {
      failures.push({ step: i + 1, script: s.script, code: r.status });
      console.error(`${label}  — FAILED (exit ${r.status}) after ${secs}s`);
      if (!opts.keepGoing) {
        console.error('');
        console.error(`rebuild-all: stopped at step ${i + 1}. Fix it, then resume with:`);
        console.error(`  node scripts/rebuild-all.mjs --from=${path.basename(s.script)}`);
        process.exit(1);
      }
    } else {
      console.log(`${label}  — ok (${secs}s)`);
    }
  }

  const mins = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  console.log('');
  if (skipped.length) {
    console.log(`rebuild-all: ${skipped.length} step(s) skipped for want of network or a secret — they were NOT run and NOT verified:`);
    for (const s of skipped) console.log(`  ${s.script}  [${s.skipReason}]`);
  }
  if (failures.length) {
    console.error(`rebuild-all: ${failures.length} step(s) FAILED in ${mins} min:`);
    for (const f of failures) console.error(`  step ${f.step}: ${f.script} (exit ${f.code})`);
    process.exit(1);
  }
  console.log(`rebuild-all: all ${steps.length - skipped.length} executed step(s) passed in ${mins} min.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
