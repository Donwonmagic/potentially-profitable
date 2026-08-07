#!/usr/bin/env node
/**
 * check-honesty-debt.mjs — EXECUTES the honesty-debt ledger.
 *
 * ====================== WHY THIS IS A SCRIPT ======================
 *
 * The measured constraint on this company is not recording. The handoff board is
 * 1,488 immaculate lines. Prior audits close at 26%, and ZERO closures in
 * company history came from anyone working an audit's list — every fix that ever
 * landed was made by the session that found it, or incidentally. Four crons
 * already open Issues; nothing consumes that queue.
 *
 * So docs/handoff/honesty-debt/honesty-debt.json is not a report. Every item
 * carries a `check` that is a shell command, and this script RUNS them. The
 * ledger's status column is not a claim a human maintains — it is re-derived
 * from exit codes on every CI run.
 *
 * ========================== THE POSTURES ==========================
 *
 * REGRESSION (hard fail): an item marked `paid` whose check now fails. This is
 * the whole reason to run the ledger rather than read it. A repair that quietly
 * comes undone is worse than one never made, because the record says it holds.
 *
 * OWED (reported): an item marked `owed`. Printed with owner, effort and the
 * exact done-condition, newest severity first, so an agent session can be
 * pointed at the top of the list with no further context.
 *
 * SURPRISE (reported): an item marked `owed` whose check now PASSES — someone
 * fixed it, or fixed it incidentally, which is this company's dominant mode.
 * The script tells you to mark it paid so the credit is recorded.
 *
 * ===================== THE AMPLIFICATION GATE =====================
 *
 * `--amplification-gate` exits 1 while ANY item is owed. The doctrine of record
 * is that credibility is a CLOSING asset, not a demand asset: the honesty debt
 * is paid IN FULL before amplifying a single page of reach. That sentence is a
 * paragraph in a verdict file, which is the form of instruction this company has
 * measured itself failing to follow. As an exit code it is a precondition any
 * publish/broadcast workflow can depend on.
 *
 *   node scripts/check-honesty-debt.mjs                     # CI: regressions fail, owed reported
 *   node scripts/check-honesty-debt.mjs --amplification-gate # 1 while any debt is owed
 *   node scripts/check-honesty-debt.mjs --next               # the single next executable item
 *   node scripts/check-honesty-debt.mjs --self-test
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = 'docs/handoff/honesty-debt/honesty-debt.json';

/** Repos this ledger may reference, and where they sit on this machine. */
export const REPO_PATHS = {
  'potentially-profitable': REPO,
  'Muntin-Invoice-Decoder': path.resolve(REPO, '..', 'Muntin-Invoice-Decoder'),
};

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

/**
 * RECURSION GUARD. This gate is wired INTO check-all, so a ledger item whose
 * check invokes check-all makes the orchestrator run itself. That is not a
 * hypothetical: HD-13's check was written as `node scripts/check-all.mjs` on
 * 2026-08-07 and hung the gate on its first run. A ledger that executes its own
 * items must never invoke the orchestrator that executes it; the honest
 * done-condition for "the deploy is green" is a dated RECEIPT of a green run,
 * not a nested run.
 */
export const FORBIDDEN_IN_CHECK = /\bcheck-all\.mjs\b/;

export function runCheck(item) {
  if (!item.check) return { ran: false, ok: null, why: 'no machine check — closes on a human artifact' };
  if (FORBIDDEN_IN_CHECK.test(item.check)) {
    return { ran: false, ok: false, why: `check invokes check-all.mjs, which runs THIS gate — recursion. Use a dated receipt instead.` };
  }
  const cwd = REPO_PATHS[item.repo];
  if (!cwd || !existsSync(cwd)) return { ran: false, ok: null, why: `repo "${item.repo}" is not present in this container` };
  try {
    execSync(item.check, { cwd, stdio: 'pipe', timeout: 300000 });
    return { ran: true, ok: true };
  } catch (e) {
    const out = String((e.stderr || e.stdout || e.message) || '').trim().split('\n').filter(Boolean).slice(-2).join(' / ');
    return { ran: true, ok: false, why: out.slice(0, 300) };
  }
}

export function classify(item, result) {
  if (item.status === 'paid') {
    if (result.ok === false) return 'REGRESSION';
    if (result.ok === true) return 'HOLDING';
    return 'PAID-UNVERIFIABLE';
  }
  if (result.ok === true) return 'SURPRISE';
  return 'OWED';
}

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };
  ok(classify({ status: 'paid' }, { ok: false }) === 'REGRESSION', 'a paid item whose check fails is a REGRESSION');
  ok(classify({ status: 'paid' }, { ok: true }) === 'HOLDING', 'a paid item whose check passes is HOLDING');
  ok(classify({ status: 'paid' }, { ok: null }) === 'PAID-UNVERIFIABLE', 'a paid item with no runnable check is flagged, not assumed');
  ok(classify({ status: 'owed' }, { ok: true }) === 'SURPRISE', 'an owed item whose check passes is a SURPRISE — this company fixes things incidentally');
  ok(classify({ status: 'owed' }, { ok: false }) === 'OWED', 'an owed item whose check fails is OWED');
  ok(classify({ status: 'owed' }, { ok: null }) === 'OWED', 'an owed item with no check stays OWED');
  ok(runCheck({ check: 'exit 0', repo: 'potentially-profitable' }).ok === true, 'a passing command runs and reports ok');
  ok(runCheck({ check: 'exit 3', repo: 'potentially-profitable' }).ok === false, 'a failing command runs and reports not-ok');
  ok(runCheck({ check: null }).ran === false, 'a null check does not run');
  ok(runCheck({ check: 'exit 0', repo: 'no-such-repo' }).ran === false, 'an absent repo is reported, not silently passed');
  ok(runCheck({ check: 'node scripts/check-all.mjs', repo: 'potentially-profitable' }).ok === false, 'RECURSION GUARD: a check invoking check-all is refused, not run');

  // The ledger's own shape.
  const led = JSON.parse(readFileSync(path.join(REPO, LEDGER), 'utf8'));
  ok(led.items.length > 0, 'the ledger has items');
  ok(led.items.every((i) => i.id && i.title && i.owner && i.status), 'every item has id, title, owner, status');
  ok(led.items.every((i) => ['agent', 'founder', 'both'].includes(i.owner)), 'every owner is agent|founder|both');
  ok(led.items.every((i) => i.check || i.verifyBy), 'every item has a machine check OR a named human verification artifact — no item closes on nothing');
  ok(led.items.filter((i) => i.status === 'paid').every((i) => i.check && i.paidOn), 'every PAID item is machine-verifiable and dated — a paid claim with no check is exactly the failure this ledger exists to end');
  ok(led.items.every((i) => REPO_PATHS[i.repo] !== undefined), 'every item names a known repo');
  ok(new Set(led.items.map((i) => i.id)).size === led.items.length, 'ids are unique');

  console.log(`honesty-debt self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

  const ledger = JSON.parse(readFileSync(path.join(REPO, LEDGER), 'utf8'));
  const rows = ledger.items.map((item) => {
    const result = runCheck(item);
    return { item, result, verdict: classify(item, result) };
  });

  const bySev = (a, b) => SEVERITY_ORDER.indexOf(a.item.severity) - SEVERITY_ORDER.indexOf(b.item.severity);
  const of = (v) => rows.filter((r) => r.verdict === v).sort(bySev);

  if (argv.includes('--next')) {
    const next = of('OWED').find((r) => r.item.owner === 'agent');
    if (!next) { console.log('No agent-executable item is owed. The remaining debt is founder-only.'); process.exit(0); }
    console.log(JSON.stringify({
      id: next.item.id, title: next.item.title, repo: next.item.repo, surface: next.item.surface,
      what: next.item.what, fix: next.item.fix, doneWhen: next.item.doneWhen, check: next.item.check, effort: next.item.effort,
    }, null, 2));
    process.exit(0);
  }

  const regressions = of('REGRESSION');
  const owed = of('OWED');
  const surprises = of('SURPRISE');
  const unverifiable = of('PAID-UNVERIFIABLE');

  console.log(`HONESTY DEBT — ${rows.length} item(s), re-derived from exit codes on ${new Date().toISOString().slice(0, 10)}\n`);
  for (const r of rows.sort(bySev)) {
    const mark = { HOLDING: '✓', REGRESSION: '✗', OWED: '·', SURPRISE: '!', 'PAID-UNVERIFIABLE': '?' }[r.verdict];
    console.log(`  ${mark} [${r.verdict.padEnd(18)}] ${r.item.id} ${r.item.severity.padEnd(8)} ${r.item.owner.padEnd(7)} ${r.item.title}`);
    if (r.verdict === 'OWED') console.log(`        done when: ${r.item.doneWhen || r.item.verifyBy}`);
    if (r.verdict === 'REGRESSION') console.log(`        ${r.result.why}`);
  }

  if (surprises.length) {
    console.log(`\n! ${surprises.length} item(s) marked owed now PASS their own check. Mark them paid in ${LEDGER} so the credit is recorded:`);
    surprises.forEach((r) => console.log(`    ${r.item.id} — ${r.item.title}`));
  }
  if (unverifiable.length) {
    console.log(`\n? ${unverifiable.length} paid item(s) could not be verified in this container (missing repo or human-only artifact).`);
  }

  const agentOwed = owed.filter((r) => r.item.owner === 'agent').length;
  const founderOwed = owed.filter((r) => r.item.owner !== 'agent').length;
  console.log(`\nOWED: ${owed.length} (${agentOwed} agent-executable, ${founderOwed} needing the founder). PAID AND HOLDING: ${of('HOLDING').length}.`);

  if (argv.includes('--amplification-gate')) {
    if (owed.length) {
      console.error(`\n✗ AMPLIFICATION GATE: ${owed.length} honesty-debt item(s) are still owed. The doctrine of record is that credibility is a CLOSING asset — the debt is paid IN FULL before any page of reach is amplified. Do not broadcast, do not promote, do not seed.`);
      process.exit(1);
    }
    console.log('\n✓ AMPLIFICATION GATE: the honesty debt is paid in full. Amplification is unblocked.');
    process.exit(0);
  }

  if (regressions.length) {
    console.error(`\n✗ honesty-debt: ${regressions.length} PAID item(s) regressed. A repair that came undone is worse than one never made — the record says it holds.`);
    process.exit(1);
  }
  console.log(`\n✓ honesty-debt: no regressions. ${owed.length} item(s) owed (run --next for the top agent-executable one).`);
}
