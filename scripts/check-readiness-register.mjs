#!/usr/bin/env node
/**
 * Readiness-register gate — the triage is data, and the data is checked.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * Fifteen validators wrote 131 gaps, 44 of them BLOCKING. A loop pointed at that
 * prose cannot terminate: the validators were prompted that "a validator who
 * finds nothing has not validated anything", so a gap-seeking agent always finds
 * a gap, and "run until every validator says READY" either regresses forever or
 * ends by exhaustion with the bar quietly eroded.
 *
 * data/readiness-register.json (built by scripts/build-readiness-register.mjs)
 * removes that failure mode by splitting the 131 three ways and giving the only
 * loop-eligible class an OBJECTIVE COMMAND. This gate is the teeth on that split.
 *
 * WHAT THIS ENFORCES
 *
 *   1. The register is internally consistent — every class carries what its class
 *      requires, every duplicate resolves, every decision names a decider.
 *   2. `--run` executes each verifiable item's own verify command and RE-DERIVES
 *      its status from the exit code. Nobody's opinion of whether a gap is closed
 *      survives contact with a non-zero exit. This is the honesty-debt pattern
 *      (docs/handoff/honesty-debt/honesty-debt.json) generalized.
 *   3. A REGRESSION — an item that previously exited 0 and now does not — is a
 *      hard failure, always, regardless of how many other items closed.
 *   4. CONVERGENCE IS MEASURED. If the open count did not fall run over run, the
 *      loop is diverging and `--run` says so and exits 1. A loop that spins is
 *      worse than no loop, because it consumes the only scarce input there is.
 *   5. FOUNDER CAPACITY IS THE RATE LIMIT. Agent throughput is free; the founder
 *      has 13-26 h/month. `--triage` fails when the number of OPEN founderOnly
 *      items plus OPEN decisions exceeds the declared absorbable cap, because
 *      closing agent items faster than the founder can absorb decisions is
 *      manufacturing review debt and calling it progress.
 *
 * WHAT THIS RETIRES
 *
 * docs/handoff/bones/validate-*.md as a source of open work. Those fifteen files
 * are cited evidence from here on. A gap that is not in this register does not
 * exist as far as the loop is concerned, and a gap added to a report without a
 * record here will not be worked.
 *
 * Usage:
 *   node scripts/check-readiness-register.mjs              # schema + consistency
 *   node scripts/check-readiness-register.mjs --triage     # the honest split
 *   node scripts/check-readiness-register.mjs --run        # execute every verify, record the run
 *   node scripts/check-readiness-register.mjs --run --peek # execute without recording (diagnostic)
 *   node scripts/check-readiness-register.mjs --run --only R-039,R-081
 *   node scripts/check-readiness-register.mjs --decisions  # what routes to the founder
 *   node scripts/check-readiness-register.mjs --self-test
 *
 * Exit codes:
 *   0 — consistent; and for --run, no regression and the loop is converging.
 *   1 — inconsistent register, a regression, divergence, or founder overload.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const PRODUCT = path.resolve(REPO, '..', 'Muntin-Invoice-Decoder');
const REGISTER = path.join(REPO, 'data', 'readiness-register.json');
const STATE = path.join(REPO, 'data', 'readiness-register-state.json');

/**
 * How many OPEN founder-owned things the founder can absorb at once. Declared,
 * not derived: it is a judgement about a person, and the point of writing it
 * down is that exceeding it becomes a failure rather than a feeling.
 *
 * Basis: 13 h/month floor (data/queue.json#capacity.founderHoursPerMonth),
 * against which the ninety-day plan already commits 39.25h of 39h available.
 * There is no slack, so the cap is deliberately small.
 */
export const FOUNDER_ABSORPTION_CAP = 12;

const CLASSES = ['verifiable', 'decision', 'opinion', 'duplicate'];
const SEVERITIES = ['BLOCKING', 'MAJOR', 'MODERATE', 'MINOR'];
const STATUSES = ['open', 'queued', 'refuted', 'duplicate', 'discarded', 'proven'];

export function consistency(reg) {
  const errs = [];
  const items = reg.items || [];
  const ids = new Set(items.map((i) => i.id));

  if (!items.length) errs.push('register is empty');
  const seen = new Set();
  for (const i of items) {
    const at = i.id || '(no id)';
    if (seen.has(i.id)) errs.push(`${at}: duplicate id`);
    seen.add(i.id);
    for (const k of ['domain', 'severity', 'source', 'claim', 'evidence', 'class', 'status'])
      if (!i[k]) errs.push(`${at}: missing ${k}`);
    if (i.class && !CLASSES.includes(i.class)) errs.push(`${at}: class ${i.class}`);
    if (i.severity && !SEVERITIES.includes(i.severity))
      errs.push(`${at}: severity ${i.severity} is not the validator vocabulary`);
    if (i.status && !STATUSES.includes(i.status)) errs.push(`${at}: status ${i.status}`);

    // class contracts — the whole point of the three-way split
    if (i.class === 'verifiable' && i.status !== 'duplicate') {
      if (!i.verify || !i.verify.cmd) errs.push(`${at}: verifiable with no verify command`);
      else if (!['storefront', 'product'].includes(i.verify.cwd))
        errs.push(`${at}: verify.cwd must be storefront|product`);
    }
    if (i.class === 'decision') {
      if (i.verify) errs.push(`${at}: a decision may not carry a verify command`);
      if (!i.decidesWhat) errs.push(`${at}: decision with no decidesWhat`);
      if (!i.routesTo) errs.push(`${at}: decision with no routesTo`);
    }
    if (i.class === 'opinion') {
      if (!i.discardReason) errs.push(`${at}: opinion with no discardReason`);
      if (i.status !== 'discarded') errs.push(`${at}: opinion must be status discarded`);
      if (i.verify) errs.push(`${at}: an opinion may not carry a verify command`);
    }
    if (i.status === 'duplicate') {
      if (!i.duplicateOf) errs.push(`${at}: duplicate with no duplicateOf`);
      else if (!ids.has(i.duplicateOf)) errs.push(`${at}: duplicateOf ${i.duplicateOf} unknown`);
      else if (items.find((x) => x.id === i.duplicateOf).status === 'duplicate')
        errs.push(`${at}: duplicateOf points at another duplicate`);
    }
    if (i.status === 'refuted' && !i.refutedBy)
      errs.push(`${at}: refuted with no refutedBy evidence`);

    for (const k of ['blockedBy', 'unblocks'])
      for (const x of i[k] || []) if (!ids.has(x)) errs.push(`${at}.${k} -> unknown ${x}`);
    if (i.blockedByDecision) {
      if (!ids.has(i.blockedByDecision)) errs.push(`${at}.blockedByDecision -> unknown`);
      else if (items.find((x) => x.id === i.blockedByDecision).class !== 'decision')
        errs.push(`${at}.blockedByDecision points at something that is not a decision`);
    }

    const file = String(i.source).split(':')[0];
    if (file && !fs.existsSync(path.join(REPO, file)))
      errs.push(`${at}: cites ${file}, which does not exist`);
  }

  // The counts must reconcile with what the reports actually contain, or the
  // register has quietly dropped a finding.
  const gaps = new Set(items.map((i) => i.source)).size;
  const blocking = new Set(items.filter((i) => i.severity === 'BLOCKING').map((i) => i.source)).size;
  if (reg.source && reg.source.extractedGaps !== gaps)
    errs.push(`summary says ${reg.source.extractedGaps} gaps; the items carry ${gaps}`);
  if (reg.source && reg.source.blockingGaps !== blocking)
    errs.push(`summary says ${reg.source.blockingGaps} BLOCKING; the items carry ${blocking}`);

  return errs;
}

export function loopItems(reg) {
  return (reg.items || []).filter(
    (i) => i.class === 'verifiable' && i.status !== 'duplicate' && i.status !== 'refuted',
  );
}

function runOne(item, timeoutMs = 120000) {
  const cwd = item.verify.cwd === 'product' ? PRODUCT : REPO;
  if (!fs.existsSync(cwd)) return { code: 127, note: 'repo not checked out' };
  const r = spawnSync('bash', ['-c', item.verify.cmd], {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  const all = ((r.stderr || '') + '\n' + (r.stdout || '')).split('\n').map((l) => l.trim()).filter(Boolean);
  const syntax = /ReferenceError|SyntaxError|command not found/.test(r.stderr || '');
  // Prefer the thrown message over node's version footer — the note is the
  // finding, and a note that says "Node.js v22" teaches a reader nothing.
  const note =
    all.find((l) => /^(Error|[A-Za-z]*Error):/.test(l))?.replace(/^Error:\s*/, '') ||
    all.filter((l) => !/^Node\.js v|^\s*at |^\^|^throw |^}/.test(l)).slice(-1)[0] ||
    '';
  return { code: r.status === null ? 124 : r.status, syntax, note: note.slice(0, 150) };
}

function readState() {
  if (!fs.existsSync(STATE)) return { runs: [], items: {} };
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return { runs: [], items: {} };
  }
}

function cmdRun(reg, only, peek) {
  const state = readState();
  let items = loopItems(reg);
  if (only) items = items.filter((i) => only.includes(i.id));
  const record = !only && !peek;

  console.log(`Executing ${items.length} verify command(s) — status is re-derived from exit codes.\n`);
  const results = {};
  let proven = 0;
  let open = 0;
  const regressions = [];
  const broken = [];
  // ADR-023: a check that has never been SHOWN to fail is not evidence. An item
  // whose command has only ever exited 0 is reported UNTRUSTED, not PROVEN —
  // that is where a vacuous command (an empty scan, an unmet precondition, a
  // wrong object shape) hides.
  const untrusted = [];

  for (const i of items) {
    const r = runOne(i);
    const ok = r.code === 0;
    const prev = (state.items && state.items[i.id]) || {};
    const everFailed = !!prev.everFailed || !ok;
    results[i.id] = {
      code: r.code,
      syntax: !!r.syntax,
      everFailed,
      at: new Date().toISOString().slice(0, 10),
    };
    if (ok) proven++;
    else open++;
    if (prev.code === 0 && !ok) regressions.push(i.id);
    if (r.syntax) broken.push(i.id);
    if (ok && !everFailed) untrusted.push(i.id);
    const mark = ok ? (everFailed ? 'PROVEN ' : 'UNTRUST') : r.syntax ? 'BROKEN ' : 'OPEN   ';
    const tag = i.founderOnly ? ' [founder]' : '';
    console.log(`  ${mark} ${i.id}  ${i.severity.padEnd(8)} ${i.domain.padEnd(19)}${tag}`);
    if (!ok && r.note) console.log(`          ${r.note}`);
  }

  const prevOpen = (state.runs || []).slice(-1)[0]?.open;
  // Convergence is judged only between RECORDED runs. `--peek` and `--only` are
  // diagnostics and must not be able to trip — or to clear — the detector.
  const converging = !record || prevOpen === undefined || open < prevOpen || open === 0;

  if (record) {
    state.items = { ...(state.items || {}), ...results };
    state.runs = [...(state.runs || []), { at: new Date().toISOString().slice(0, 10), open, proven }].slice(-40);
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  }

  console.log(`\n  proven ${proven - untrusted.length} · untrusted ${untrusted.length} · open ${open}${prevOpen !== undefined ? ` (was ${prevOpen})` : ''}`);
  if (broken.length)
    console.log(`  SYNTAX-BROKEN verify commands (not the same as failing): ${broken.join(', ')}`);
  if (untrusted.length)
    console.log(
      `  UNTRUSTED — exited 0 and has never been observed failing, so the command is ` +
        `not yet evidence (ADR-023): ${untrusted.join(', ')}`,
    );

  let bad = 0;
  if (regressions.length) {
    console.error(`\nREGRESSION — previously proven and now failing: ${regressions.join(', ')}`);
    console.error('A regression is a hard failure no amount of new closures offsets.');
    bad = 1;
  }
  if (!converging) {
    console.error(
      `\nDIVERGING — open count did not fall (${prevOpen} -> ${open}). ` +
        'The loop must halt and escalate rather than spin.',
    );
    bad = 1;
  }
  if (!bad) console.log(open === 0 ? '\nREADY — every verifiable gap is proven closed.' : '\nconverging.');
  return bad;
}

function cmdTriage(reg) {
  const items = reg.items || [];
  const S = reg.summary || {};
  const nonDup = items.filter((i) => i.status !== 'duplicate');
  const blockingRecords = items.filter((i) => i.severity === 'BLOCKING');
  const bs = { verifiable: 0, decision: 0, opinion: 0, duplicate: 0 };
  for (const i of blockingRecords) bs[i.status === 'duplicate' ? 'duplicate' : i.class]++;

  console.log('THE TRIAGE — 131 validator gaps, three ways\n');
  console.log(`  extracted gaps            ${reg.source.extractedGaps}  (records ${reg.source.records}, ${reg.source.splitGaps} gap(s) split by owner)`);
  console.log(`  BLOCKING gaps             ${reg.source.blockingGaps}`);
  console.log('');
  console.log(`  verifiable (enters loop)  ${S.byClass.verifiable}`);
  console.log(`  decision   (routes out)   ${S.byClass.decision}`);
  console.log(`  opinion    (discarded)    ${S.byClass.opinion}`);
  console.log(`  duplicate  (collapsed)    ${S.duplicatesCollapsed}`);
  console.log(`                            ---`);
  console.log(`                            ${items.length}`);
  console.log('');
  console.log('  Of the 44 BLOCKING gaps:');
  console.log(`    verifiable              ${bs.verifiable}`);
  console.log(`    decision                ${bs.decision}`);
  console.log(`    opinion                 ${bs.opinion}`);
  console.log(`    duplicate of another    ${bs.duplicate}`);
  console.log('');
  const loop = loopItems(reg);
  const fo = loop.filter((i) => i.founderOnly);
  const decisions = items.filter((i) => i.class === 'decision' && i.status !== 'duplicate');
  console.log(`  LOOP SIZE                 ${loop.length}  (${loop.length - fo.length} agent-only, ${fo.length} founder-only)`);
  console.log(`  FOUNDER QUEUE             ${fo.length + decisions.length}  (${fo.length} founder-only verifiables + ${decisions.length} decisions)`);
  console.log(`  ABSORPTION CAP            ${FOUNDER_ABSORPTION_CAP}`);
  console.log('');

  const byDomain = {};
  for (const i of nonDup) {
    byDomain[i.domain] ||= { v: 0, d: 0, o: 0 };
    byDomain[i.domain][i.class[0]]++;
  }
  console.log('  domain                 verifiable  decision  opinion');
  for (const [d, c] of Object.entries(byDomain).sort())
    console.log(`  ${d.padEnd(22)} ${String(c.v).padStart(9)} ${String(c.d).padStart(9)} ${String(c.o).padStart(8)}`);

  const over = fo.length + decisions.length - FOUNDER_ABSORPTION_CAP;
  if (over > 0) {
    console.error(
      `\nFOUNDER OVERLOAD — ${fo.length + decisions.length} founder-owned items against a cap of ` +
        `${FOUNDER_ABSORPTION_CAP}. ${over} must be deferred, delegated or dropped BEFORE the loop ` +
        'starts closing agent items, or the loop manufactures review debt and calls it progress.',
    );
    return 1;
  }
  return 0;
}

function cmdDecisions(reg) {
  const ds = (reg.items || []).filter((i) => i.class === 'decision' && i.status !== 'duplicate');
  console.log(`${ds.length} decisions route OUT of the loop. No agent closes these.\n`);
  for (const d of ds) {
    console.log(`  ${d.id}  [${d.severity}]  ${d.domain}  → ${d.routesTo}`);
    console.log(`        ${d.decidesWhat}`);
    if (d.unblocks && d.unblocks.length)
      console.log(`        unblocks: ${d.unblocks.join(', ')}`);
    console.log('');
  }
  return 0;
}

function selfTest() {
  const a = [];
  const t = (n, fn) => {
    try {
      fn();
      a.push(['ok', n]);
    } catch (e) {
      a.push(['FAIL', `${n} — ${e.message}`]);
    }
  };
  const reg = JSON.parse(fs.readFileSync(REGISTER, 'utf8'));

  t('the committed register is consistent', () => {
    const e = consistency(reg);
    if (e.length) throw new Error(e.slice(0, 3).join(' | '));
  });
  t('a verifiable record with no command is rejected', () => {
    const bad = { ...reg, items: [{ id: 'X', domain: 'd', severity: 'MAJOR', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'verifiable', status: 'open' }] };
    if (!consistency(bad).some((x) => /no verify command/.test(x))) throw new Error('not caught');
  });
  t('a decision carrying a command is rejected', () => {
    const bad = { ...reg, items: [{ id: 'X', domain: 'd', severity: 'MAJOR', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'decision', status: 'open', decidesWhat: 'w', routesTo: 'founder', verify: { cwd: 'storefront', cmd: 'true' } }] };
    if (!consistency(bad).some((x) => /may not carry a verify command/.test(x))) throw new Error('not caught');
  });
  t('an opinion with no discard reason is rejected', () => {
    const bad = { ...reg, items: [{ id: 'X', domain: 'd', severity: 'MINOR', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'opinion', status: 'discarded' }] };
    if (!consistency(bad).some((x) => /no discardReason/.test(x))) throw new Error('not caught');
  });
  t('a duplicate pointing at another duplicate is rejected', () => {
    const bad = { ...reg, items: [
      { id: 'A', domain: 'd', severity: 'MAJOR', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'duplicate', status: 'duplicate', duplicateOf: 'B' },
      { id: 'B', domain: 'd', severity: 'MAJOR', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'duplicate', status: 'duplicate', duplicateOf: 'A' },
    ] };
    if (!consistency(bad).some((x) => /points at another duplicate/.test(x))) throw new Error('not caught');
  });
  t('a dropped finding is caught by the count reconciliation', () => {
    const bad = { ...reg, items: reg.items.slice(0, -3) };
    if (!consistency(bad).some((x) => /the items carry/.test(x))) throw new Error('not caught');
  });
  t('a record citing a report that does not exist is rejected', () => {
    const bad = { ...reg, items: [{ id: 'X', domain: 'd', severity: 'MAJOR', source: 'docs/handoff/bones/validate-nope.md:1', claim: 'c', evidence: 'e', class: 'decision', status: 'open', decidesWhat: 'w', routesTo: 'founder' }] };
    if (!consistency(bad).some((x) => /does not exist/.test(x))) throw new Error('not caught');
  });
  t('re-graded severity is rejected', () => {
    const bad = { ...reg, items: [{ id: 'X', domain: 'd', severity: 'CRITICAL', source: 'CLAUDE.md:1', claim: 'c', evidence: 'e', class: 'decision', status: 'open', decidesWhat: 'w', routesTo: 'founder' }] };
    if (!consistency(bad).some((x) => /validator vocabulary/.test(x))) throw new Error('not caught');
  });
  t('a failing verify command is observed as OPEN, not as closed', () => {
    const r = runOne({ verify: { cwd: 'storefront', cmd: 'exit 3' } });
    if (r.code !== 3) throw new Error('exit code not propagated');
  });
  t('a SYNTAX-BROKEN command is distinguished from a failing one', () => {
    const r = runOne({ verify: { cwd: 'storefront', cmd: 'node -e "const need=[Q-002]; console.log(need)"' } });
    if (!r.syntax) throw new Error('ReferenceError not reported as SYNTAX-BROKEN');
    const f = runOne({ verify: { cwd: 'storefront', cmd: 'exit 1' } });
    if (f.syntax) throw new Error('a plain failure was mislabelled SYNTAX-BROKEN');
  });
  t('every loop item is verifiable and none is a duplicate', () => {
    for (const i of loopItems(reg))
      if (i.class !== 'verifiable' || i.status === 'duplicate') throw new Error(i.id);
  });
  t('the founder absorption cap is a declared number, not derived', () => {
    if (typeof FOUNDER_ABSORPTION_CAP !== 'number' || FOUNDER_ABSORPTION_CAP <= 0)
      throw new Error('cap must be a positive declared number');
  });

  for (const [st, n] of a) console.log((st === 'ok' ? '  ok  ' : '  FAIL ') + n);
  const failed = a.filter(([s]) => s === 'FAIL').length;
  console.log(`\ncheck-readiness-register --self-test: ${a.length - failed}/${a.length} assertions passed`);
  return failed === 0 ? 0 : 1;
}

// ── main ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes('--self-test')) process.exit(selfTest());

if (!fs.existsSync(REGISTER)) {
  console.error('data/readiness-register.json missing — run node scripts/build-readiness-register.mjs');
  process.exit(1);
}
const reg = JSON.parse(fs.readFileSync(REGISTER, 'utf8'));

const errs = consistency(reg);
if (errs.length) {
  console.error(`readiness register is inconsistent (${errs.length}):`);
  for (const e of errs.slice(0, 25)) console.error('  - ' + e);
  process.exit(1);
}

if (argv.includes('--triage')) process.exit(cmdTriage(reg));
if (argv.includes('--decisions')) process.exit(cmdDecisions(reg));
if (argv.includes('--run')) {
  const oi = argv.indexOf('--only');
  const only = oi >= 0 && argv[oi + 1] ? argv[oi + 1].split(',').map((x) => x.trim()) : null;
  process.exit(cmdRun(reg, only, argv.includes('--peek')));
}

const loop = loopItems(reg);
const decisions = reg.items.filter((i) => i.class === 'decision' && i.status !== 'duplicate');
console.log(
  `readiness register: ${reg.source.extractedGaps} gaps (${reg.source.blockingGaps} BLOCKING) — ` +
    `${loop.length} in the loop, ${decisions.length} decisions routed to the founder, ` +
    `${reg.summary.opinionsDiscarded} opinions discarded, ${reg.summary.duplicatesCollapsed} duplicates collapsed. ` +
    `Consistent.`,
);
process.exit(0);
