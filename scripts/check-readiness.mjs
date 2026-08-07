#!/usr/bin/env node
/**
 * check-readiness.mjs — READINESS AS AN EXIT CODE, PER DOMAIN.
 *
 * ====================== WHY THIS IS A SCRIPT ======================
 *
 * Fifteen domain specialists validated the plan. Thirteen returned NOT_READY,
 * two READY_WITH_GAPS, 44 gaps marked blocking. Every one of those validators
 * was prompted that "a validator who finds nothing has not validated anything."
 * A gap-seeking agent always finds a gap. So "run the panel again until it says
 * READY" is a loop that CANNOT TERMINATE — it either regresses forever or
 * terminates by exhaustion with the bar quietly eroded until someone declares
 * victory. This company already owns 5,005 lines of planning corpus produced by
 * exactly that dynamic, and a 26% historical close rate.
 *
 * So readiness here is not a verdict anyone renders. It is an exit code:
 *
 *     A DOMAIN IS READY WHEN EVERY BLOCKING VERIFIABLE ITEM IN IT EXITS 0.
 *
 * data/readiness-register.json holds one record per blocking gap, and every
 * record of class `verifiable` carries a COMMAND. This script runs them. The
 * readiness column is not a claim a human maintains; it is re-derived from exit
 * codes on every run, exactly as check-honesty-debt.mjs re-derives the debt
 * ledger — this file is that pattern generalized from one ledger to fifteen
 * domains.
 *
 * ========================== THE POSTURES ==========================
 *
 * REGRESSION (hard fail): an item that has passed before and now fails. This is
 *   the ONLY hard failure. A readiness claim that quietly comes undone is worse
 *   than one never made, because the record says the domain is ready. Prior
 *   passes are read from the register's `lastVerdict` AND from every line of
 *   data/readiness-history.jsonl, so the ratchet cannot be lost by editing one
 *   field.
 * OPEN (reported, never blocking): a blocking verifiable item that fails. The
 *   Cloudflare deploy is already red at 320/328; a gate that is red by design is
 *   wallpaper by week two. THIS GATE IS NOT WIRED INTO check-all.
 * SURPRISE (reported): an item that passes for the first time. This company's
 *   dominant closure mode is incidental — things get fixed by the session that
 *   noticed them, not by anyone working a list. The script says so out loud so
 *   the credit is recorded in the register.
 * DECISION (routed, never blocking, never entering the agent loop): a gap for
 *   which no objective command can be written even as a receipt, because the
 *   CONTENT of the answer is the whole thing. Rule 1 of the loop: a gap with no
 *   verify command is not a gap, it is a decision, and it routes to the founder.
 *
 * ===================== THE ANTI-EROSION GUARD =====================
 *
 * The obvious way to cheat this gate is to reclassify hard items as decisions
 * until every domain is READY by having nothing left to prove. Three defenses:
 *
 *   1. A domain with ZERO blocking verifiable items is UNDECIDABLE, never READY.
 *      Readiness cannot be earned by having no tests.
 *   2. Every `decision` must carry decisionFor + whyNoTest + routeTo, asserted
 *      by --self-test. "I could not be bothered" does not typecheck.
 *   3. Every run appends one line to data/readiness-history.jsonl carrying the
 *      per-domain counts and the exact set of passing item ids. Append-only.
 *      A bar that moves leaves a trail; convergence is measurable from the file
 *      rather than from anyone's memory of last week.
 *
 * ================ THE FOUNDER-CAPACITY RATE LIMIT =================
 *
 * Founder capacity is a fixed 13-26 h/month (data/queue.json#capacity). Agents
 * close agent items in minutes. A loop that runs at agent speed piles
 * founder-only items faster than the founder can absorb them, which is
 * manufacturing review debt and calling it progress. The report sums the open
 * founder-owned and external hours against the declared floor and says plainly
 * how many months of founder capacity the open list represents.
 *
 *   node scripts/check-readiness.mjs                 # full report; fails only on regression
 *   node scripts/check-readiness.mjs --domain legal-ip
 *   node scripts/check-readiness.mjs --json
 *   node scripts/check-readiness.mjs --next          # top agent-executable open item
 *   node scripts/check-readiness.mjs --record-baseline  # arm the ratchet on what passes today
 *   node scripts/check-readiness.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTER = 'data/readiness-register.json';
const HISTORY = 'data/readiness-history.jsonl';

/** Repos this register may reference, and where they sit on this machine. */
export const REPO_PATHS = {
  storefront: REPO,
  product: path.resolve(REPO, '..', 'Muntin-Invoice-Decoder'),
};

export const CLASSES = ['verifiable', 'decision'];
export const OWNERS = ['agent', 'founder', 'external'];
export const AGENT_OWNED = 'agent';

/**
 * RECURSION GUARD, inherited from check-honesty-debt.mjs. A register item whose
 * verify invokes check-all makes the orchestrator run itself if this gate is ever
 * wired. HD-13's check was written that way on 2026-08-07 and hung the gate on
 * its first run.
 */
export const FORBIDDEN_IN_VERIFY = /\bcheck-all\.mjs\b/;

/**
 * THE QUOTING-BUG DETECTOR. validate-ci-integrity found all ten checkpoint
 * verify commands failing on `ReferenceError: Q is not defined` — a double-quoted
 * JS array inside a double-quoted `node -e "..."`, which bash unquotes. A
 * falsifier that always fires is not a falsifier, and this register would inherit
 * the same defect for free. Any verify whose failure output looks like a syntax
 * error is reported as BROKEN-TEST, not as an open gap, because the two are
 * indistinguishable at the exit-code level and only one of them is about the work.
 */
export function looksSyntaxBroken(raw) {
  const lines = String(raw || '').split('\n').map((l) => l.trim());
  // A deliberate `throw new Error("...")` prints a line starting exactly `Error: `.
  // A quoting bug prints one starting `ReferenceError: ` / `SyntaxError: `. Anchoring
  // to line starts matters: node echoes the offending SOURCE line too, so an
  // unanchored match here fired on this detector's own regex literal on the first run.
  const deliberate = lines.some((l) => /^Error: /.test(l));
  const syntactic = lines.some((l) => /^(ReferenceError|SyntaxError|TypeError): /.test(l))
    || lines.some((l) => /: (command not found|No such file or directory)$/.test(l));
  return syntactic && !deliberate;
}

export function runVerify(item, { repoPaths = REPO_PATHS, exec = execSync } = {}) {
  if (item.class === 'decision') return { ran: false, ok: null, why: 'decision — routed to the founder, never run' };
  if (!item.verify) return { ran: false, ok: null, why: 'class is verifiable but no verify command is present' };
  if (FORBIDDEN_IN_VERIFY.test(item.verify)) {
    return { ran: false, ok: false, why: 'verify invokes check-all.mjs — recursion. Use a dated receipt instead.' };
  }
  const cwd = repoPaths[item.repo];
  if (!cwd || !existsSync(cwd)) return { ran: false, ok: null, why: `repo "${item.repo}" is not present in this container` };
  try {
    const out = exec(item.verify, { cwd, stdio: 'pipe', timeout: 180000, encoding: 'utf8' });
    return { ran: true, ok: true, why: String(out || '').trim().split('\n').filter(Boolean).pop() || '' };
  } catch (e) {
    const raw = String(e.stderr || e.stdout || e.message || '').trim();
    // Prefer the line that actually says what went wrong. Taking the tail blindly reports
    // "Node.js v22.22.2", which tells a reader nothing about the gap.
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const signal = lines.find((l) => /^(\w*Error): /.test(l)) || lines.find((l) => /Cannot find module|No such file|not found/.test(l));
    const why = (signal || lines[lines.length - 1] || '').replace(/^\w*Error:\s*/, '').slice(0, 220);
    return { ran: true, ok: false, why, broken: looksSyntaxBroken(raw) };
  }
}

/** Everything this item has ever been. `everPassed` folds the register field and the whole history file. */
export function classifyItem(item, result, everPassed = false) {
  if (item.class === 'decision') return 'DECISION';
  if (result.ok === null) return 'UNVERIFIABLE';
  if (result.broken) return 'BROKEN-TEST';
  const prior = everPassed || item.lastVerdict === 'pass';
  if (result.ok === true) return prior ? 'HOLDING' : 'SURPRISE';
  return prior ? 'REGRESSION' : 'OPEN';
}

/**
 * THE WHOLE DEFINITION. A domain is READY when every blocking verifiable item in
 * it passes. Decisions never block — a domain held hostage by an unanswerable
 * question is a domain that never closes. But a domain with nothing left to
 * prove is UNDECIDABLE, never READY: readiness is not earned by deleting tests.
 */
export function domainVerdict(rows) {
  const verifiable = rows.filter((r) => r.item.class === 'verifiable');
  if (verifiable.length === 0) return 'UNDECIDABLE';
  const unresolved = verifiable.filter((r) => r.verdict !== 'HOLDING' && r.verdict !== 'SURPRISE');
  return unresolved.length === 0 ? 'READY' : 'NOT_READY';
}

export function readHistory(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

export function everPassedSet(history) {
  const s = new Set();
  for (const line of history) for (const id of line.passing || []) s.add(id);
  return s;
}

/**
 * ============================ THE ADAPTER ============================
 *
 * `scripts/build-readiness-register.mjs` emits one schema; this gate was written
 * against another. Both were written on 2026-08-07 by different sessions and
 * NEITHER WAS EVER RUN AGAINST THE OTHER — `--brief` threw
 * `TypeError: Cannot read properties of undefined (reading 'map')` on `reg.domains`
 * out of `.claude/hooks/session-start.sh`, on every session, swallowed by `|| true`.
 * That is this company's failure mode in miniature: two correct artifacts, no
 * seam, and a hook quietly printing a stack trace nobody read.
 *
 * So the seam is code, not a migration. The builder stays the source of truth
 * (it re-derives from the 15 validator reports); this normalizes its output into
 * the shape the posture table above operates on. Nothing is invented here —
 * every field is either copied, derived by a stated rule, or left NULL and
 * reported as unpriced.
 */
export const PANEL_VERDICTS = {
  'ci-integrity': 'NOT_READY', 'content-editorial': 'READY_WITH_GAPS', 'customer-growth': 'NOT_READY',
  'data-moat': 'NOT_READY', 'design-ux': 'NOT_READY', 'engineering': 'NOT_READY',
  'finance-runway': 'NOT_READY', 'legal-ip': 'NOT_READY', 'marketing-seo': 'NOT_READY',
  'monetization': 'NOT_READY', 'ops-capacity': 'READY_WITH_GAPS', 'privacy-compliance': 'NOT_READY',
  'product-truth': 'NOT_READY', 'security': 'NOT_READY', 'strategy': 'NOT_READY',
};

/** Classes the builder emits that never enter the loop, and why. */
export const NON_LOOP_CLASSES = {
  opinion: 'a judgement with no falsifier — discarded at intake, never carried forward',
  duplicate: 'the same gap found by a second panel — collapsed onto the original',
};

export function normalizeRegister(raw, { panelVerdicts = PANEL_VERDICTS } = {}) {
  const kept = (raw.items || []).filter((i) => !NON_LOOP_CLASSES[i.class]);
  const items = kept.map((i) => ({
    ...i,
    owner: i.class === 'decision' ? (i.routesTo || 'founder') : (i.founderOnly ? 'founder' : 'agent'),
    repo: i.verify?.cwd || 'storefront',
    verify: i.verify?.cmd || null,
    gap: i.claim,
    sourceLine: i.source,
    // The register proves closure by COMMAND; its prose slot is the claim the
    // command retires. Derived, so no done-condition is authored twice.
    doneWhen: i.class === 'decision' ? `founder answers: ${i.decidesWhat}` : `verify exits 0 — ${i.claim}`,
    decisionFor: i.decidesWhat,
    routeTo: i.routesTo,
    whyNoTest: i.class === 'decision'
      ? 'no command can evaluate the CONTENT of the closing artifact (register _classes.decision)'
      : undefined,
    // NOT INVENTED. The builder prices nothing; an agent item costs zero founder
    // hours by definition, and a founder item stays null until someone declares it.
    founderHours: i.class !== 'decision' && !i.founderOnly ? 0 : (typeof i.founderHours === 'number' ? i.founderHours : null),
  }));
  const domains = [...new Set(items.map((i) => i.domain))].map((name) => ({
    name, panelVerdict: panelVerdicts[name] || 'UNRECORDED',
  }));
  return { ...raw, items, domains, clusters: raw.clusters || {}, dropped: (raw.items || []).length - items.length };
}

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };

  // --- the posture table -------------------------------------------------
  ok(classifyItem({ class: 'decision' }, { ok: null }) === 'DECISION', 'a decision is never run and never blocks');
  ok(classifyItem({ class: 'verifiable' }, { ok: false }, true) === 'REGRESSION', 'an item that passed before and now fails is a REGRESSION');
  ok(classifyItem({ class: 'verifiable', lastVerdict: 'pass' }, { ok: false }) === 'REGRESSION', 'the register field alone arms the ratchet');
  ok(classifyItem({ class: 'verifiable' }, { ok: false }) === 'OPEN', 'an item that has never passed and fails is OPEN, not a failure of this gate');
  ok(classifyItem({ class: 'verifiable' }, { ok: true }) === 'SURPRISE', 'a first pass is a SURPRISE — this company closes things incidentally');
  ok(classifyItem({ class: 'verifiable' }, { ok: true }, true) === 'HOLDING', 'a repeat pass is HOLDING');
  ok(classifyItem({ class: 'verifiable' }, { ok: null }) === 'UNVERIFIABLE', 'an unrunnable item is flagged, never assumed');
  ok(classifyItem({ class: 'verifiable' }, { ok: false, broken: true }) === 'BROKEN-TEST', 'a syntax-broken verify is a broken TEST, not an open gap — the exact defect that killed all ten checkpoint criteria');

  // --- the readiness definition ------------------------------------------
  ok(domainVerdict([{ item: { class: 'verifiable' }, verdict: 'HOLDING' }]) === 'READY', 'all verifiable items passing = READY');
  ok(domainVerdict([{ item: { class: 'verifiable' }, verdict: 'OPEN' }]) === 'NOT_READY', 'one open verifiable item = NOT_READY');
  ok(domainVerdict([{ item: { class: 'verifiable' }, verdict: 'HOLDING' }, { item: { class: 'decision' }, verdict: 'DECISION' }]) === 'READY',
    'ANTI-HOSTAGE: an open decision does not block a domain whose tests all pass');
  ok(domainVerdict([{ item: { class: 'decision' }, verdict: 'DECISION' }]) === 'UNDECIDABLE',
    'ANTI-EROSION: a domain with only decisions is UNDECIDABLE, never READY — readiness is not earned by deleting tests');
  ok(domainVerdict([]) === 'UNDECIDABLE', 'a domain with no items proves nothing');
  ok(domainVerdict([{ item: { class: 'verifiable' }, verdict: 'BROKEN-TEST' }]) === 'NOT_READY', 'a broken test cannot certify readiness');

  // --- the runner ---------------------------------------------------------
  ok(runVerify({ class: 'verifiable', verify: 'exit 0', repo: 'storefront' }).ok === true, 'a passing command runs and reports ok');
  ok(runVerify({ class: 'verifiable', verify: 'exit 3', repo: 'storefront' }).ok === false, 'a failing command runs and reports not-ok');
  ok(runVerify({ class: 'decision', verify: 'exit 0', repo: 'storefront' }).ran === false, 'a decision is not executed even if someone attaches a command');
  ok(runVerify({ class: 'verifiable', verify: 'exit 0', repo: 'nope' }).ran === false, 'an absent repo is reported, not silently passed');
  ok(runVerify({ class: 'verifiable', verify: 'node scripts/check-all.mjs', repo: 'storefront' }).ok === false, 'RECURSION GUARD: a verify invoking check-all is refused, not run');
  ok(runVerify({ class: 'verifiable', verify: 'node -e "const need=["A"]; console.log(need)"', repo: 'storefront' }).broken === true,
    'QUOTING-BUG DETECTOR: the exact shape that broke all ten checkpoint criteria is caught as BROKEN-TEST');
  ok(runVerify({ class: 'verifiable', verify: 'node -e \'throw new Error("the work is not done")\'', repo: 'storefront' }).broken === false,
    'a DELIBERATE throw is an open gap, not a broken test — these must never be confused, and confusing them is why the checkpoints are unreadable');
  ok(looksSyntaxBroken('  const r=/ReferenceError|SyntaxError/.test(x)\n  ^\nError: 10 commands fail') === false,
    'the detector does not fire on its own regex literal echoed back in a node source line — it did on the first real run');
  ok(looksSyntaxBroken('ReferenceError: Q is not defined') === true, 'a bare ReferenceError at line start is a broken test');

  // --- history ------------------------------------------------------------
  ok(everPassedSet([{ passing: ['R-A'] }, { passing: ['R-B'] }]).has('R-A'), 'the ratchet folds every line of history, not just the last');
  ok(readHistory('/no/such/file.jsonl').length === 0, 'a missing history file is empty, not an error');

  // --- the adapter --------------------------------------------------------
  const rawReg = JSON.parse(readFileSync(path.join(REPO, REGISTER), 'utf8'));
  const reg = normalizeRegister(rawReg);
  ok(rawReg.items.length > reg.items.length, 'the adapter DROPS opinions and duplicates — they never enter the loop');
  ok(reg.domains.length === 15, 'fifteen domains are derived from the items, not authored twice');
  // The panel table is a claim about files on disk, so it is CHECKED against disk.
  for (const [name, verdict] of Object.entries(PANEL_VERDICTS)) {
    const f = path.join(REPO, 'docs/handoff/bones', `validate-${name}.md`);
    const onDisk = existsSync(f) ? (readFileSync(f, 'utf8').split('\n')[2] || '').replace(/\*/g, '').trim() : null;
    ok(onDisk === verdict, `PANEL_VERDICTS.${name} says ${verdict}; validate-${name}.md line 3 says ${onDisk}`);
  }
  ok(normalizeRegister({ items: [{ class: 'verifiable', domain: 'x', verify: { cwd: 'product', cmd: 'exit 0' } }] }).items[0].repo === 'product',
    'verify.cwd becomes the repo the command runs in');
  ok(normalizeRegister({ items: [{ class: 'decision', domain: 'x', decidesWhat: 'q', routesTo: 'founder' }] }).items[0].verify === null,
    'a decision normalizes to no command — or it was never a decision');

  // --- the register's own shape ------------------------------------------
  const items = reg.items;
  ok(items.length > 0, 'the register has items');
  ok(new Set(items.map((i) => i.id)).size === items.length, 'ids are unique');
  ok(items.every((i) => CLASSES.includes(i.class)), 'every item is verifiable or a decision — there is no third state');
  ok(items.every((i) => OWNERS.includes(i.owner)), 'every owner is agent|founder|external');
  ok(items.every((i) => REPO_PATHS[i.repo] !== undefined), 'every item names a known repo');
  ok(items.every((i) => i.gap && i.sourceLine), 'every item cites the validator finding it came from — no invented gaps');
  ok(items.every((i) => reg.domains.some((d) => d.name === i.domain)), 'every item belongs to a declared domain');
  ok(items.filter((i) => i.class === 'verifiable').every((i) => i.verify && i.doneWhen),
    'every verifiable item has BOTH a command and a written done-condition');
  ok(items.filter((i) => i.class === 'decision').every((i) => i.decisionFor && i.whyNoTest && i.routeTo),
    'ANTI-EROSION: every decision must say what the question is, why no test can be written, and who answers — "I could not be bothered" does not typecheck');
  ok(items.filter((i) => i.class === 'decision').every((i) => !i.verify),
    'a decision carries no verify command, or it was never a decision');
  ok(items.filter((i) => i.owner === AGENT_OWNED).every((i) => i.founderHours === 0),
    'an agent-owned item costs zero founder hours by definition');
  ok(items.filter((i) => i.owner !== AGENT_OWNED).every((i) => i.founderHours === null || typeof i.founderHours === 'number'),
    'a founder item is priced or explicitly UNPRICED — never guessed. Unpriced founder items are what block promotion into the queue (loop-driver.mjs INTAKE).');
  ok(reg.domains.every((d) => items.some((i) => i.domain === d.name)),
    'every declared domain has at least one item — a domain with no items would report UNDECIDABLE forever');
  ok(!items.some((i) => i.verify && FORBIDDEN_IN_VERIFY.test(i.verify)), 'no item verify invokes check-all');

  console.log(`readiness self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

// ---------------------------------------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

  const regPath = path.join(REPO, REGISTER);
  const rawReg = JSON.parse(readFileSync(regPath, 'utf8'));
  const reg = normalizeRegister(rawReg);
  const only = argv.includes('--domain') ? argv[argv.indexOf('--domain') + 1] : null;
  if (only && !reg.domains.some((d) => d.name === only)) {
    console.error(`Unknown domain "${only}". Known: ${reg.domains.map((d) => d.name).join(', ')}`);
    process.exit(2);
  }

  const historyPath = path.join(REPO, HISTORY);
  const everPassed = everPassedSet(readHistory(historyPath));

  const scope = only ? reg.items.filter((i) => i.domain === only) : reg.items;
  const rows = scope.map((item) => {
    const result = runVerify(item);
    return { item, result, verdict: classifyItem(item, result, everPassed.has(item.id)) };
  });

  const domains = (only ? reg.domains.filter((d) => d.name === only) : reg.domains).map((d) => {
    const drs = rows.filter((r) => r.item.domain === d.name);
    const v = drs.filter((r) => r.item.class === 'verifiable');
    return {
      name: d.name,
      panelVerdict: d.panelVerdict,
      verdict: domainVerdict(drs),
      verifiable: v.length,
      passing: v.filter((r) => r.verdict === 'HOLDING' || r.verdict === 'SURPRISE').length,
      open: v.filter((r) => r.verdict === 'OPEN').length,
      regressed: v.filter((r) => r.verdict === 'REGRESSION').length,
      brokenTest: v.filter((r) => r.verdict === 'BROKEN-TEST').length,
      unverifiable: v.filter((r) => r.verdict === 'UNVERIFIABLE').length,
      decisions: drs.filter((r) => r.item.class === 'decision').length,
    };
  });

  const of = (v) => rows.filter((r) => r.verdict === v);
  const passingIds = rows.filter((r) => r.verdict === 'HOLDING' || r.verdict === 'SURPRISE').map((r) => r.item.id);
  const regressions = of('REGRESSION');

  // ---- founder rate limit --------------------------------------------------
  let floor = null, ceiling = null;
  try {
    const q = JSON.parse(readFileSync(path.join(REPO, 'data/queue.json'), 'utf8'));
    floor = q.capacity?.founderHoursPerMonth?.floor ?? null;
    ceiling = q.capacity?.founderHoursPerMonth?.ceiling ?? null;
  } catch { /* the queue is allowed to be broken; that is item R-CI1 */ }
  const openRows = rows.filter((r) => r.verdict === 'OPEN' || r.verdict === 'REGRESSION' || r.verdict === 'DECISION');
  const founderHoursOpen = openRows.filter((r) => r.item.owner !== AGENT_OWNED).reduce((a, r) => a + (r.item.founderHours || 0), 0);
  const agentOpen = openRows.filter((r) => r.item.owner === AGENT_OWNED).length;

  if (argv.includes('--next')) {
    const next = of('OPEN').filter((r) => r.item.owner === AGENT_OWNED)[0];
    if (!next) {
      console.log('No agent-executable readiness item is open. What remains needs the founder or a third party.');
      process.exit(0);
    }
    console.log(JSON.stringify({
      id: next.item.id, domain: next.item.domain, repo: next.item.repo, gap: next.item.gap,
      sourceLine: next.item.sourceLine, doneWhen: next.item.doneWhen, verify: next.item.verify,
      failingBecause: next.result.why,
    }, null, 2));
    process.exit(0);
  }

  const payload = {
    ts: new Date().toISOString(),
    scope: only || 'all',
    domains: domains.map(({ name, verdict, verifiable, passing, open, regressed, decisions }) => ({ name, verdict, verifiable, passing, open, regressed, decisions })),
    totals: {
      items: rows.length,
      verifiable: rows.filter((r) => r.item.class === 'verifiable').length,
      decisions: rows.filter((r) => r.item.class === 'decision').length,
      passing: passingIds.length,
      open: of('OPEN').length,
      regressed: regressions.length,
      brokenTest: of('BROKEN-TEST').length,
      unverifiable: of('UNVERIFIABLE').length,
      domainsReady: domains.filter((d) => d.verdict === 'READY').length,
      domainsTotal: domains.length,
      founderHoursOpen,
      agentItemsOpen: agentOpen,
    },
    passing: passingIds.sort(),
  };

  if (argv.includes('--brief')) {
    // One line for the session-start hook. It must never be silent on failure and never
    // more than two lines, or it joins the NOTEs that go invisible by week two.
    const t = payload.totals;
    console.log(`READINESS: ${t.domainsReady}/${t.domainsTotal} domains ready — ${t.passing}/${t.verifiable} blocking items proved, ${t.decisions} decisions waiting on the founder.${regressions.length ? `  ✗ ${regressions.length} REGRESSED.` : ''}`);
    const next = of('OPEN').filter((r) => r.item.owner === AGENT_OWNED)[0];
    if (next) console.log(`  next (agent): ${next.item.id} [${next.item.domain}] ${next.item.doneWhen.slice(0, 120)}`);
    if (!argv.includes('--no-history')) appendFileSync(historyPath, JSON.stringify(payload) + '\n');
    process.exit(regressions.length ? 1 : 0);
  }

  if (argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`READINESS — ${rows.length} blocking gap(s) from ${domains.length} domain(s), re-derived from exit codes on ${payload.ts.slice(0, 10)}\n`);
    const w = Math.max(...domains.map((d) => d.name.length));
    for (const d of domains) {
      const mark = { READY: '✓', NOT_READY: '·', UNDECIDABLE: '?' }[d.verdict];
      const extra = [
        d.regressed ? `${d.regressed} REGRESSED` : null,
        d.brokenTest ? `${d.brokenTest} broken-test` : null,
        d.unverifiable ? `${d.unverifiable} unverifiable` : null,
        d.decisions ? `${d.decisions} decision${d.decisions > 1 ? 's' : ''} → founder` : null,
      ].filter(Boolean).join(', ');
      console.log(`  ${mark} ${d.name.padEnd(w)}  ${d.verdict.padEnd(12)} ${String(d.passing).padStart(2)}/${d.verifiable} verifiable passing${extra ? '   (' + extra + ')' : ''}   [panel said ${d.panelVerdict}]`);
    }

    if (regressions.length) {
      console.log(`\n✗ REGRESSED — passed before, fails now:`);
      regressions.forEach((r) => console.log(`    ${r.item.id} ${r.item.domain} — ${r.item.gap}\n        ${r.result.why}`));
    }
    const surprises = of('SURPRISE');
    if (surprises.length) {
      console.log(`\n! ${surprises.length} item(s) PASS for the first time. Set lastVerdict:"pass" in ${REGISTER} so the credit is recorded and the ratchet holds:`);
      surprises.forEach((r) => console.log(`    ${r.item.id} ${r.item.domain} — ${r.result.why || r.item.doneWhen}`));
    }
    const broken = of('BROKEN-TEST');
    if (broken.length) {
      console.log(`\n⚠ ${broken.length} verify command(s) fail on a SYNTAX error, not on work-not-done. Fix the test before reading the result:`);
      broken.forEach((r) => console.log(`    ${r.item.id} — ${r.result.why}`));
    }
    const unver = of('UNVERIFIABLE');
    if (unver.length) {
      console.log(`\n? ${unver.length} item(s) could not be run in this container:`);
      unver.forEach((r) => console.log(`    ${r.item.id} — ${r.result.why}`));
    }

    const decisions = of('DECISION');
    if (decisions.length) {
      console.log(`\n→ ${decisions.length} DECISION(S) — no objective test can be written; these route to the founder and DO NOT block readiness:`);
      decisions.forEach((r) => console.log(`    ${r.item.id} ${r.item.domain} (${r.item.founderHours == null ? 'UNPRICED' : r.item.founderHours + 'h'}, → ${r.item.routeTo})\n        Q: ${r.item.decisionFor}`));
    }

    const clusters = {};
    for (const r of openRows) if (r.item.cluster) (clusters[r.item.cluster] ||= []).push(r.item.id);
    const multi = Object.entries(clusters).filter(([, ids]) => ids.length > 1).sort((a, b) => b[1].length - a[1].length);
    if (multi.length) {
      console.log(`\nSHARED ROOTS — one fix closes several domains:`);
      multi.forEach(([c, ids]) => console.log(`    ${c.padEnd(12)} ${ids.length} items (${ids.join(', ')}) — ${reg.clusters[c]}`));
    }

    console.log(`\nDOMAINS READY: ${payload.totals.domainsReady}/${payload.totals.domainsTotal}.  ITEMS: ${payload.totals.passing} passing, ${payload.totals.open} open, ${payload.totals.decisions} decisions.`);
    if (floor != null) {
      const months = founderHoursOpen / floor;
      console.log(`FOUNDER LOAD: ${founderHoursOpen}h of founder/external work is open against a declared ${floor}-${ceiling} h/month — ${months.toFixed(2)} months of capacity at the floor, before any of the 50 queue items.`);
      console.log(`AGENT LOAD:   ${agentOpen} agent-executable item(s) open. Run --next for the top one.`);
      if (months > 1) console.log(`  ⚠ RATE LIMIT: the founder-only list already exceeds one month of floor capacity. Closing agent items faster does not move a single domain that waits on these.`);
    }
  }

  // ---- append-only history: this is what makes convergence measurable -------
  if (!argv.includes('--no-history') && !only) {
    appendFileSync(historyPath, JSON.stringify(payload) + '\n');
  }

  if (argv.includes('--record-baseline')) {
    const ids = new Set(passingIds);
    let n = 0;
    // Write to the RAW register — `reg` is the normalized view and persisting it
    // would overwrite the builder's schema with this gate's.
    for (const it of rawReg.items) if (ids.has(it.id) && it.lastVerdict !== 'pass') { it.lastVerdict = 'pass'; n++; }
    writeFileSync(regPath, JSON.stringify(rawReg, null, 2) + '\n');
    console.log(`\nBaseline armed: ${n} item(s) recorded as passing. They now hard-fail this gate if they come undone.`);
  }

  if (regressions.length) {
    console.error(`\n✗ readiness: ${regressions.length} item(s) REGRESSED. A readiness claim that came undone is worse than one never made — the record says the domain is ready.`);
    process.exit(1);
  }
  if (!argv.includes('--json')) {
    console.log(`\n✓ readiness: no regressions. This gate fails on regression ONLY; open gaps are reported, never red. It is deliberately NOT wired into check-all.`);
  }
}
