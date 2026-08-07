#!/usr/bin/env node
/**
 * loop-driver.mjs — THE THING THAT POINTS A SESSION AT THE BACKLOG.
 *
 * ============================== WHY ==============================
 *
 * The measured failure of this company is not recording and it is not analysis.
 * It is that ONLY AN AGENT SESSION PRODUCES WORK, AND NO SESSION HAS EVER BEEN
 * POINTED AT THE BACKLOG. Prior audits close at 26%; zero closures in company
 * history came from anyone working a list; 14 of 24 fixes were made by the same
 * session that found the problem, and every other closure was incidental. There
 * are now 5,005 lines of planning corpus across 18 artifacts, 50 queue items,
 * 133 register records and 14 honesty-debt items. Nothing consumes any of it.
 *
 * This is the consumer. It fires, it decides, it claims, it hands one session
 * one item with the proof command already written, and it records what happened.
 *
 * ==================== WHY IT CANNOT RUN FOREVER ====================
 *
 * "Loop until every validator says READY" cannot terminate. The 15 validators
 * were each told that "a validator who finds nothing has not validated
 * anything", so a gap-seeking agent always finds a gap; such a loop regresses
 * forever or terminates by exhaustion with the bar quietly eroded. Four things
 * make this one stop:
 *
 *   1. READINESS IS AN EXIT CODE. A domain is ready when every blocking
 *      verifiable item in it exits 0 (check-readiness.mjs). No opinion enters.
 *   2. A GAP WITH NO VERIFY COMMAND IS A DECISION, NOT WORK. It routes to the
 *      founder and never enters the loop. 18 of the 101 records are decisions.
 *   3. THE FOUNDER-CAPACITY RATE LIMIT. Below.
 *   4. THE DIVERGENCE HALT. Five briefs with zero closures = spinning = stop.
 *
 * And the target is not "ready". It is READY ENOUGH TO START, which the founder
 * already wrote down: data/queue.json#capacity.floorPlan.whatIsNeverDropped —
 * Q-002, Q-001, Q-013, Q-014. When those four close, the driver says START GATE
 * OPEN and execution proceeds concurrently with the rest of the loop.
 *
 * ================= THE FOUNDER-CAPACITY RATE LIMIT =================
 *
 * Agent throughput is free; founder capacity is a fixed 13-26 h/month, forever.
 * A loop that closes agent items quickly piles founder-only items faster than
 * he can absorb them. Every threshold is in data/loop-policy.json WITH ITS
 * ARITHMETIC. Summary: 13 (floor) − 2.5 (unpriced review overhead) = 10.5
 * executable founder-hours per window. Three limits, not one:
 *
 *   INTAKE, per window   closes at 10.5h open. Blocks PROMOTION only — agent
 *                        execution is never blocked by founder load, because
 *                        punishing the cheap lane for the expensive one closes
 *                        the loop entirely. Measured 2026-08-07: M1 is at 14.5h,
 *                        so INTAKE INTO M1 IS ALREADY CLOSED.
 *   GROWTH, per 5 briefs halts if the loop has ADDED more than 10.5h of founder
 *                        work. The inherited backlog is not the loop's fault;
 *                        growing it is. This is the limit that actually binds.
 *   GLOBAL, ninety days  warns over 31.5h (floor budget), HALTS over 70.5h
 *                        (ceiling budget) — the same floor-warns/ceiling-fails
 *                        rule check-queue --budget already applies per window.
 *                        Measured today: 34h — over the floor, warn, loop runs.
 *
 * ========================== WHAT IT WRITES ==========================
 *
 * Exactly three paths, asserted by --self-test:
 *   data/loop-lease.json   — the selection lock, O_EXCL, 90-minute TTL
 *   data/loop-runs.jsonl   — append-only run ledger
 *   data/queue.json        — ONLY by shelling out to check-queue.mjs --claim.
 *                            The driver never edits the queue itself, so claims
 *                            keep going through the one code path that also
 *                            re-renders QUEUE.md and reconciles stale claims.
 *
 * ====================== WHY IT IS NOT IN check-all ======================
 *
 * check-all runs inside the Cloudflare deploy, which is already red at 320/328.
 * This gate is SUPPOSED to exit non-zero when the loop must halt; wiring it
 * would make a red deploy the normal state, which is how gates become wallpaper.
 * It is registered UNWIRED with that reason and fires from the session-start
 * hook and from the founder's one command.
 *
 * Usage:
 *   node scripts/loop-driver.mjs                 # --status: read-only, decides nothing
 *   node scripts/loop-driver.mjs --brief         # two lines for the session-start hook
 *   node scripts/loop-driver.mjs --fire --by "session:$ID"   # claim one item, print the brief
 *   node scripts/loop-driver.mjs --fire --lanes 2 --by ...   # N isolated worktrees
 *   node scripts/loop-driver.mjs --release-lease
 *   node scripts/loop-driver.mjs --json
 *   node scripts/loop-driver.mjs --self-test
 *
 * Exit codes:
 *   0 — a brief was issued, or the loop is IDLE, or status printed.
 *   1 — HALT. The reason is named and the loop must not be run again until it
 *       is cleared. This is escalation, not failure.
 *   2 — self-test failure / malformed policy or queue.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { actionable, rank, budget, overdueCheckpoints, isOpen, validate } from './check-queue.mjs';
import { normalizeRegister, readHistory } from './check-readiness.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POLICY_PATH = path.join(REPO, 'data', 'loop-policy.json');
const QUEUE_PATH = path.join(REPO, 'data', 'queue.json');
const REGISTER_PATH = path.join(REPO, 'data', 'readiness-register.json');
const READINESS_HISTORY = path.join(REPO, 'data', 'readiness-history.jsonl');
const LEASE_PATH = path.join(REPO, 'data', 'loop-lease.json');
const RUNS_PATH = path.join(REPO, 'data', 'loop-runs.jsonl');

/** The complete write surface. Asserted by --self-test so it cannot grow silently. */
export const WRITABLE = ['data/loop-lease.json', 'data/loop-runs.jsonl', 'data/queue.json (via check-queue --claim only)'];

/**
 * Halt reasons, in evaluation order. ORDER IS THE DESIGN:
 *   QUEUE-MALFORMED first — while the ledger fails its own validate(), check-queue
 *     refuses every --claim and every --done, so nothing can be recorded, including
 *     the fix for anything below.
 *   REGRESSION next — a thing that came undone outranks any new thing.
 *   CHECKPOINT-DUE — a falsifier nobody is forced to read is a wish.
 *   FOUNDER-DEBT-* — capacity.
 *   DIVERGENCE last — spinning is only diagnosable once the rest is clean.
 */
export const HALTS = ['LEASE-HELD', 'CLAIM-REFUSED', 'QUEUE-MALFORMED', 'REGRESSION', 'CHECKPOINT-DUE', 'FOUNDER-DEBT-GLOBAL', 'FOUNDER-DEBT-GROWTH', 'DIVERGENCE'];

// ─────────────────────────────────────────────────────────────────────────────
// Pure logic. Everything here is testable with no disk, no clock, no git.
// ─────────────────────────────────────────────────────────────────────────────

/** Which 30-day window a moment falls in. Null outside the plan's horizon. */
export function windowFor(nowIso, windows) {
  for (const [name, w] of Object.entries(windows || {})) {
    if (nowIso >= w.from && nowIso <= w.to) return name;
  }
  return null;
}

/**
 * THE RATE LIMIT, computed from declared founderHours only — never parsed out of
 * effort prose, never guessed. Reuses check-queue's `budget()` so the driver and
 * the queue gate can never disagree about what a window costs.
 */
export function founderLoad(queue, policy) {
  const b = budget(queue);
  const open = new Set(queue.items.filter(isOpen).map((i) => i.id));
  const exec = policy.founderRateLimit.executableHoursPerWindow;
  const rows = b.rows.map((r) => {
    // budget() sums ALL items in the window; the rate limit is about OPEN work.
    const openHours = queue.items
      .filter((i) => i.window === r.window && open.has(i.id))
      .reduce((s, i) => s + (Number(i.founderHours) || 0), 0);
    return {
      window: r.window,
      label: r.label,
      openHours: Math.round(openHours * 100) / 100,
      overhead: r.overhead,
      totalWithOverhead: Math.round((openHours + r.overhead) * 100) / 100,
      executable: exec,
      headroom: Math.round((exec - openHours) * 100) / 100,
      intake: openHours >= exec ? 'CLOSED' : 'OPEN',
    };
  });
  const totalOpen = rows.reduce((s, r) => s + r.openHours, 0)
    + queue.items.filter((i) => !i.window && open.has(i.id)).reduce((s, i) => s + (Number(i.founderHours) || 0), 0);
  return {
    rows,
    executable: exec,
    totalOpenFounderHours: Math.round(totalOpen * 100) / 100,
    monthsOfFloorCapacity: Math.round((totalOpen / exec) * 100) / 100,
    floorBudget: policy.founderRateLimit.floorItemBudget,
    ceilingBudget: policy.founderRateLimit.ceilingItemBudget,
    overFloorBudget: totalOpen > policy.founderRateLimit.floorItemBudget,
    globalHalt: totalOpen > policy.founderRateLimit.ceilingItemBudget,
    openFounderItems: queue.items.filter((i) => open.has(i.id) && i.owner !== 'agent').length,
  };
}

/**
 * THE RATE LIMIT THAT ACTUALLY BINDS. The inherited backlog is not the loop's
 * fault; what the loop must not do is GROW it. This measures the loop's own
 * contribution across the convergence window and halts if it has added more than
 * one window of founder capacity in five briefs — that is manufacturing review
 * debt and calling it progress, which is the failure rule 3 names.
 */
export function founderDebtGrowth(runs, load, policy) {
  const briefs = runs.filter((r) => r.action === 'BRIEF' && typeof r.founderHoursOpen === 'number');
  const w = policy.convergence.window;
  if (briefs.length < w) return { verdict: 'WARMING', briefs: briefs.length, need: w, added: null };
  const from = briefs[briefs.length - w];
  const added = Math.round((load.totalOpenFounderHours - from.founderHoursOpen) * 100) / 100;
  const cap = policy.founderRateLimit.executableHoursPerWindow;
  return { verdict: added > cap ? 'MANUFACTURING-DEBT' : 'CONTAINED', added, cap, from: from.ts, briefs: briefs.length, need: w };
}

/**
 * CONVERGENCE. Not a raw blocking count — intake legitimately raises that, and a
 * loop halted for doing its job is a loop nobody runs twice. The test is
 * closures, which check-queue --done refuses to write without a passing verify.
 */
export function convergence(runs, policy) {
  const briefs = runs.filter((r) => r.lane === 'EXECUTE' && r.action === 'BRIEF');
  const w = policy.convergence.window;
  if (briefs.length < w) {
    return { verdict: 'WARMING', briefs: briefs.length, need: w, closuresInWindow: null };
  }
  const recent = briefs.slice(-w);
  const before = recent[0];
  const now = briefs[briefs.length - 1];
  const closed = (now.closedCount ?? 0) - (before.closedCount ?? 0);
  const passing = (now.readinessPassing ?? 0) - (before.readinessPassing ?? 0);
  const moved = closed + passing;
  return {
    verdict: moved > 0 ? 'CONVERGING' : 'DIVERGING',
    briefs: briefs.length,
    need: w,
    closuresInWindow: closed,
    readinessGainsInWindow: passing,
    from: before.ts,
  };
}

/** The founder's own "ready enough to start" set — not a bar this script invented. */
export function startGate(queue) {
  const never = queue.capacity?.floorPlan?.whatIsNeverDropped || [];
  const ids = never.map((s) => (String(s).match(/\bQ-\d{3}\b/) || [])[0]).filter(Boolean);
  const rows = ids.map((id) => {
    const it = queue.items.find((i) => i.id === id);
    return { id, closed: !!(it && it.closed), owner: it?.owner ?? null, title: it?.title ?? '(missing)' };
  });
  return { ids, rows, open: rows.filter((r) => !r.closed).length, verdict: rows.every((r) => r.closed) ? 'OPEN' : 'SHUT' };
}

/**
 * SELECTION. Deterministic: same tree, same sha, same answer. Queue first —
 * those items are already priced, windowed and carry a proof command. The
 * register is the intake lane and never auto-promotes, because writing a
 * doneWhen and a proof command is a judgement (the same reason the product
 * repo's queue-consumer refuses to promote its own findings).
 */
export function select(queue, register, policy, staleClaimDays, now) {
  const ready = actionable(queue.items, staleClaimDays, now)
    .filter((i) => i.owner === 'agent' || i.owner === 'both')
    .sort((a, b) => {
      const [ap, aph, aid] = rank(a); const [bp, bph, bid] = rank(b);
      return ap - bp || aph - bph || (aid < bid ? -1 : aid > bid ? 1 : 0);
    });
  if (ready.length) return { lane: 'EXECUTE', item: ready[0], pool: ready.length };

  const unqueued = (register.items || []).filter(
    (i) => i.class === 'verifiable' && i.owner === 'agent' && i.status === 'open' && !i.queueItem,
  );
  if (unqueued.length) {
    const bySeverity = { BLOCKING: 0, MAJOR: 1, MODERATE: 2, MINOR: 3 };
    unqueued.sort((a, b) => (bySeverity[a.severity] ?? 9) - (bySeverity[b.severity] ?? 9) || (a.id < b.id ? -1 : 1));
    return { lane: 'INTAKE', item: unqueued[0], pool: unqueued.length };
  }
  return { lane: 'IDLE', item: null, pool: 0 };
}

/**
 * THE INTAKE GATE. Promotion is the only thing in the loop that can manufacture
 * founder debt, so it is the only thing the rate limit blocks. Agent execution
 * is never blocked by founder load — that would be punishing the cheap lane for
 * the expensive one.
 */
export function mayPromote(candidate, load, currentWindow, policy) {
  const hours = candidate.founderHours;
  if (candidate.owner !== 'agent' && (hours === null || hours === undefined)) {
    return { ok: false, why: `UNPRICED: ${candidate.id} routes to the founder with no declared founderHours. You cannot rate-limit what nobody has priced (loop-policy#unpricedFounderItems).` };
  }
  const row = load.rows.find((r) => r.window === currentWindow);
  if ((hours || 0) > 0 && row && row.intake === 'CLOSED') {
    return {
      ok: false,
      why: `INTAKE CLOSED for ${currentWindow}: ${row.openHours}h of open founder work against ${row.executable}h executable (${policy.founderRateLimit.executableDerivation.split('.')[0]}). Per data/queue.json#capacity.floorPlan.ifItGrowsAgain, this item must carry founderHours 0 or NAME THE DROP-ORDER ROW IT DISPLACES.`,
    };
  }
  return {
    ok: true,
    why: (hours || 0) === 0
      ? `zero declared founder hours — it costs the founder nothing, so no window can be full for it. This is the escape data/queue.json#capacity.floorPlan.ifItGrowsAgain names.`
      : `${currentWindow} has ${row ? row.headroom : '?'}h of headroom against ${load.executable ?? policy.founderRateLimit.executableHoursPerWindow}h executable.`,
  };
}

/** A lease is live if it exists and has not aged past its TTL. */
export function leaseLive(lease, ttlMinutes, now) {
  if (!lease || !lease.at) return false;
  return (now - Date.parse(lease.at)) / 60000 < ttlMinutes;
}

// ─────────────────────────────────────────────────────────────────────────────
// I/O
// ─────────────────────────────────────────────────────────────────────────────

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const arg = (argv, flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };

function readRuns() {
  if (!fs.existsSync(RUNS_PATH)) return [];
  return fs.readFileSync(RUNS_PATH, 'utf8').split('\n').filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function appendRun(rec) { fs.appendFileSync(RUNS_PATH, JSON.stringify(rec) + '\n'); }

/**
 * ATOMIC. `wx` is O_CREAT|O_EXCL: the kernel decides the winner of a race, not
 * this script. Six agents in one tree corrupted their own measurements earlier
 * in this engagement; that happened because nothing arbitrated.
 */
function acquireLease(who, ttlMinutes, now) {
  if (fs.existsSync(LEASE_PATH)) {
    let held = null;
    try { held = readJson(LEASE_PATH); } catch { /* a corrupt lease is a dead lease */ }
    if (leaseLive(held, ttlMinutes, now)) return { ok: false, held };
    fs.unlinkSync(LEASE_PATH); // expired — reclaim
  }
  try {
    fs.writeFileSync(LEASE_PATH, JSON.stringify({ by: who, at: new Date(now).toISOString(), ttlMinutes }, null, 2) + '\n', { flag: 'wx' });
    return { ok: true };
  } catch (e) {
    if (e.code === 'EEXIST') {
      let held = null; try { held = readJson(LEASE_PATH); } catch { /* raced and lost */ }
      return { ok: false, held, raced: true };
    }
    throw e;
  }
}

function sh(cmd, args, cwd = REPO) {
  return spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 300000 });
}

function headSha() {
  const r = sh('git', ['rev-parse', 'HEAD']);
  return r.status === 0 ? r.stdout.trim() : null;
}

/**
 * ISOLATION. The claim is taken in the MAIN tree (single writer); the SESSION
 * gets a detached worktree pinned to the brief's sha, so whatever it measures is
 * measured against a denominator that cannot move underneath it.
 */
function makeWorktree(policy, lane, sha) {
  if (!sha) return { path: null, why: 'not a git repo — nothing to pin' };
  const root = path.join(REPO, policy.isolation.worktreeRoot);
  const dir = path.join(root, `lane-${lane}-${sha.slice(0, 8)}`);
  if (fs.existsSync(dir)) return { path: dir, reused: true };
  fs.mkdirSync(root, { recursive: true });
  const r = sh('git', ['worktree', 'add', '--detach', dir, sha]);
  if (r.status !== 0) return { path: null, why: (r.stderr || '').trim().split('\n').pop() };
  return { path: dir };
}

/** The last recorded readiness snapshot. Re-running 83 commands per fire is not free. */
function readinessSnapshot() {
  const hist = readHistory(READINESS_HISTORY);
  const last = hist[hist.length - 1] || null;
  return last ? { ts: last.ts, ...last.totals } : null;
}

function honestyDebt() {
  const r = sh('node', ['scripts/check-honesty-debt.mjs']);
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/OWED: (\d+) \((\d+) agent-executable, (\d+) needing the founder\)/);
  return { regressed: r.status !== 0, owed: m ? Number(m[1]) : null, agentOwed: m ? Number(m[2]) : null, tail: out.trim().split('\n').pop() };
}

// ─────────────────────────────────────────────────────────────────────────────

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };
  const policy = readJson(POLICY_PATH);
  const queue = readJson(QUEUE_PATH);

  // --- the rate limit's arithmetic ----------------------------------------
  const fr = policy.founderRateLimit;
  ok(fr.executableHoursPerWindow === fr.floorHoursPerMonth - fr.reviewOverheadPerMonth,
    'executable hours = floor − review overhead, and the file shows the subtraction');
  ok(fr.floorHoursPerMonth === queue.capacity.founderHoursPerMonth.floor
    && fr.ceilingHoursPerMonth === queue.capacity.founderHoursPerMonth.ceiling
    && fr.reviewOverheadPerMonth === queue.capacity.reviewOverheadPerMonth.hours,
    'the policy does not restate capacity — it must equal data/queue.json, or one of them is fiction');
  ok(queue.capacity.founderHoursPerMonth.planAgainst === 'floor',
    'the rate limit uses the FLOOR because the plan of record says planAgainst:"floor" — not because 13 is a nicer number');
  const nWin = Object.keys(queue.capacity.windows).length;
  ok(fr.floorItemBudget === fr.executableHoursPerWindow * nWin,
    'the floor item-budget is executable × windows — the whole ninety days at the floor');
  ok(fr.ceilingItemBudget === (fr.ceilingHoursPerMonth - fr.reviewOverheadPerMonth) * nWin,
    'the ceiling item-budget is the same subtraction at the ceiling');
  ok(fr.ceilingItemBudget > fr.floorItemBudget,
    'FLOOR WARNS, CEILING FAILS — the same rule check-queue --budget applies per window. A cliff at the floor halted this driver on its first real run over a 0.25h overage, and a driver that never fires delivers nothing.');
  ok(fr.growthHalt.capHours === fr.executableHoursPerWindow,
    'the growth cap is one window of executable capacity — the loop may not add more founder work in five briefs than the founder can do in a month');

  // --- the rate limit reproduces the plan's own published numbers ----------
  const b = budget(queue);
  // Pin the INVARIANT, not a snapshot. An earlier version of this test asserted
  // M2 === 11.25h and went red the moment the driver windowed 1.25h of
  // previously-unbudgeted work into M2 — i.e. it went red for the rate limit
  // working. A number that is true on one afternoon is not a test.
  for (const r of b.rows) {
    const declared = queue.items.filter((i) => i.window === r.window).reduce((a, i) => a + (Number(i.founderHours) || 0), 0);
    ok(Math.abs(r.total - (declared + r.overhead)) < 1e-9,
      `${r.window}: budget() total must equal declared founderHours + overhead, with nothing parsed out of effort prose`);
  }
  const load0 = founderLoad(queue, policy);
  for (const r of load0.rows) {
    const b0 = b.rows.find((x) => x.window === r.window);
    ok(r.openHours <= b0.itemHours + 1e-9,
      `${r.window}: the rate limit counts OPEN hours, which can never exceed budget()'s all-items total`);
  }
  ok(typeof fr.measuredAtAuthoring.asOf === 'string' && /^20\d\d-\d\d-\d\d$/.test(fr.measuredAtAuthoring.asOf),
    'the policy\'s measured figures carry a date, so a stale snapshot reads as stale rather than as a claim about today');

  // --- the halt ladder -----------------------------------------------------
  const load = founderLoad(queue, policy);
  ok(load.rows.every((r) => r.intake === (r.openHours >= r.executable ? 'CLOSED' : 'OPEN')), 'intake state is derived, never set');
  ok(mayPromote({ id: 'X', owner: 'founder', founderHours: null }, load, 'M2', policy).ok === false,
    'an UNPRICED founder item can never be promoted — uncapped debt is the failure this limit exists to prevent');
  ok(mayPromote({ id: 'X', owner: 'agent', founderHours: 0 }, load, 'M1', policy).ok === true,
    'agent work is NEVER blocked by founder load — punishing the cheap lane for the expensive one closes the loop entirely');
  const closedWin = { rows: [{ window: 'M1', openHours: 14.5, executable: 10.5, intake: 'CLOSED' }] };
  ok(mayPromote({ id: 'X', owner: 'founder', founderHours: 1 }, closedWin, 'M1', policy).ok === false,
    'a priced founder item is refused into a window whose intake is closed');
  ok(mayPromote({ id: 'X', owner: 'founder', founderHours: 0 }, closedWin, 'M1', policy).ok === true,
    'a zero-hour item still fits a closed window — that is exactly the escape floorPlan.ifItGrowsAgain names');

  // --- convergence ---------------------------------------------------------
  const mk = (n, closed) => Array.from({ length: n }, (_, i) => ({ lane: 'EXECUTE', action: 'BRIEF', ts: `t${i}`, closedCount: closed, readinessPassing: 0 }));
  ok(convergence(mk(3, 1), policy).verdict === 'WARMING', 'fewer briefs than the window is WARMING, not a verdict');
  ok(convergence(mk(5, 1), policy).verdict === 'DIVERGING', 'five briefs and zero closures is DIVERGENCE — the loop is spinning');
  const moving = [...mk(4, 1), { lane: 'EXECUTE', action: 'BRIEF', ts: 't4', closedCount: 3, readinessPassing: 0 }];
  ok(convergence(moving, policy).verdict === 'CONVERGING', 'a closure inside the window clears divergence');
  const viaReadiness = [...mk(4, 1), { lane: 'EXECUTE', action: 'BRIEF', ts: 't4', closedCount: 1, readinessPassing: 2 }];
  ok(convergence(viaReadiness, policy).verdict === 'CONVERGING', 'a readiness item passing for the first time also counts as movement');
  ok(convergence([{ lane: 'INTAKE', action: 'BRIEF' }, ...mk(4, 1)], policy).verdict === 'WARMING',
    'INTAKE briefs are not counted — intake raises the blocking count by design and must not be able to trip its own halt');

  // --- the limit that actually binds: growth the LOOP caused ---------------
  const g = (n, hours) => Array.from({ length: n }, (_, i) => ({ action: 'BRIEF', ts: `t${i}`, founderHoursOpen: hours }));
  ok(founderDebtGrowth(g(3, 34), { totalOpenFounderHours: 34 }, policy).verdict === 'WARMING', 'growth needs a full window of briefs before it renders a verdict');
  ok(founderDebtGrowth(g(5, 34), { totalOpenFounderHours: 34 }, policy).verdict === 'CONTAINED', 'flat founder load across five briefs is CONTAINED');
  ok(founderDebtGrowth(g(5, 34), { totalOpenFounderHours: 45 }, policy).verdict === 'MANUFACTURING-DEBT',
    '+11h of founder work in five briefs exceeds one window of capacity — the loop is manufacturing review debt and calling it progress');
  ok(founderDebtGrowth(g(5, 34), { totalOpenFounderHours: 44 }, policy).verdict === 'CONTAINED', 'exactly at the cap is not over it');
  ok(founderDebtGrowth(g(5, 40), { totalOpenFounderHours: 34 }, policy).added === -6, 'founder load falling is recorded as negative growth, never clamped');

  // --- a malformed ledger is not an empty one -----------------------------
  ok(validate(queue).length === 0,
    'the live queue passes its own validate() — while it does not, check-queue refuses every --claim and every --done, and the loop can neither start nor finish anything');
  ok(HALTS.includes('QUEUE-MALFORMED'),
    'QUEUE-MALFORMED is a halt reason. The driver\'s first real fire hit exactly this and reported IDLE, which reads as "no work" instead of "the ledger is broken".');

  // --- the lease -----------------------------------------------------------
  const t = Date.parse('2026-08-07T12:00:00Z');
  ok(leaseLive({ at: '2026-08-07T11:30:00Z' }, 90, t) === true, 'a 30-minute-old lease is live under a 90-minute TTL');
  ok(leaseLive({ at: '2026-08-07T09:00:00Z' }, 90, t) === false, 'a 3-hour-old lease is expired and reclaimable');
  ok(leaseLive(null, 90, t) === false, 'no lease is not a live lease');

  // --- the start gate is the FOUNDER's set, read from the queue -------------
  const sg = startGate(queue);
  ok(sg.ids.length === 4 && sg.ids.join(',') === 'Q-002,Q-001,Q-013,Q-014',
    `"ready enough to start" is capacity.floorPlan.whatIsNeverDropped, not a bar this script invented; got ${sg.ids.join(',')}`);

  // --- selection is deterministic ------------------------------------------
  const reg = normalizeRegister(readJson(REGISTER_PATH));
  const now = Date.now();
  const a = select(queue, reg, policy, queue.policy.staleClaimDays, now);
  const c = select(queue, reg, policy, queue.policy.staleClaimDays, now);
  ok(a.item?.id === c.item?.id, 'selection is deterministic — same tree, same answer');
  ok(a.lane === 'EXECUTE' || a.lane === 'INTAKE' || a.lane === 'IDLE', 'there are exactly three lanes');
  ok(!select(queue, reg, policy, queue.policy.staleClaimDays, now).item?.owner
    || ['agent', 'both'].includes(a.item.owner) || a.lane === 'INTAKE',
    'the EXECUTE lane never hands a session a founder-only item');

  // --- the halt ladder is WIRED, not merely computed -----------------------
  // Each pure function above is tested; this proves halts() actually surfaces them.
  const clean = { malformed: [], overdue: [], load: { globalHalt: false, totalOpenFounderHours: 1, ceilingBudget: 70.5, floorBudget: 31.5 }, growth: { verdict: 'CONTAINED' }, conv: { verdict: 'CONVERGING' } };
  const reasons = (over) => halts({ ...clean, ...over }, null).map((x) => x.reason);
  ok(reasons({}).length === 0, 'a clean state halts on nothing');
  ok(reasons({ malformed: ['Q-999: bad'] })[0] === 'QUEUE-MALFORMED', 'a malformed ledger halts');
  ok(reasons({ overdue: [{ id: 'CP-30' }] })[0] === 'CHECKPOINT-DUE', 'an overdue checkpoint with result:null halts — closing items does not clear it');
  ok(reasons({ load: { ...clean.load, globalHalt: true } })[0] === 'FOUNDER-DEBT-GLOBAL', 'the ninety-day ceiling budget halts');
  ok(reasons({ growth: { verdict: 'MANUFACTURING-DEBT', added: 12, cap: 10.5, need: 5, from: 't' } })[0] === 'FOUNDER-DEBT-GROWTH', 'loop-caused founder-debt growth halts');
  ok(reasons({ conv: { verdict: 'DIVERGING', need: 5, from: 't' } })[0] === 'DIVERGENCE', 'five briefs with zero closures halts');
  const stacked = halts({ ...clean, malformed: ['x'], overdue: [{ id: 'CP-30' }], conv: { verdict: 'DIVERGING', need: 5, from: 't' } }, { regressed: true, tail: 'x' }).map((x) => x.reason);
  ok(stacked.join(',') === 'QUEUE-MALFORMED,REGRESSION,CHECKPOINT-DUE,DIVERGENCE',
    `ORDER IS THE DESIGN: the ledger first (while it is malformed nothing can be claimed OR closed, including the fix for the regression), then what came undone, then the falsifier, then capacity, then spinning. Got: ${stacked.join(',')}`);
  ok(HALTS.length === 8 && HALTS.includes('CLAIM-REFUSED'), 'every halt reason the driver can emit is enumerated in HALTS');

  // --- what it RETIRES, enforced ------------------------------------------
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  ok(!/docs\/handoff\/bones\/validate-/.test(src.split('Usage:')[1] || src.slice(4000)),
    'the driver does not read the validator reports — they are retired as a work source (loop-policy#retires)');
  ok(policy.retires.items.length >= 3, 'the policy names what this mechanism retires — a mechanism that only adds is a tax');
  ok(WRITABLE.length === 3 && WRITABLE.some((w) => w.includes('check-queue')),
    'the write surface is three paths and the queue is only ever written through check-queue --claim');

  // --- the handoff boundary is declared, not discovered --------------------
  ok(policy.handoffLimits.theLoopCannot.length >= 5,
    'the policy names what an agent session cannot do — a loop that generates work it can only pretend to do is worse than none');

  console.log(`loop-driver self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

// ─────────────────────────────────────────────────────────────────────────────

function assemble(now) {
  const policy = readJson(POLICY_PATH);
  const queue = readJson(QUEUE_PATH);
  const register = normalizeRegister(readJson(REGISTER_PATH));
  const runs = readRuns();
  const nowIso = new Date(now).toISOString().slice(0, 10);
  const win = windowFor(nowIso, queue.capacity.windows);
  const load = founderLoad(queue, policy);
  const conv = convergence(runs, policy);
  const growth = founderDebtGrowth(runs, load, policy);
  const gate = startGate(queue);
  const overdue = overdueCheckpoints(queue, now);
  const readiness = readinessSnapshot();
  const malformed = validate(queue);
  const closedCount = queue.items.filter((i) => i.closed).length;
  return { policy, queue, register, runs, nowIso, win, load, conv, growth, gate, overdue, readiness, closedCount, malformed };
}

/** The halt ladder. Order is the design: a thing that came undone outranks a new thing. */
function halts(s, debt) {
  const out = [];
  if (s.malformed && s.malformed.length) {
    // Found by the driver's FIRST real fire, 2026-08-07: Q-084..Q-087 were promoted
    // into the queue without priority, window, blockedBy or evidence, so
    // check-queue's own validate() rejected the file and NO --claim and NO --done
    // could run at all. The loop reported IDLE, which read as "no work" instead of
    // "the ledger is broken". A malformed ledger is not an empty one.
    out.push({
      reason: 'QUEUE-MALFORMED',
      detail: `data/queue.json fails its own validate() with ${s.malformed.length} error(s) — check-queue refuses every --claim and every --done while this holds, so nothing can be claimed OR closed. First: ${s.malformed[0]}`,
      fix: 'node scripts/check-queue.mjs   (it prints all of them)',
    });
  }
  if (debt && debt.regressed) {
    out.push({ reason: 'REGRESSION', detail: `check-honesty-debt.mjs exits non-zero — a PAID item has come undone. ${debt.tail}`, fix: 'node scripts/check-honesty-debt.mjs' });
  }
  if (s.overdue.length) {
    out.push({ reason: 'CHECKPOINT-DUE', detail: `${s.overdue.map((c) => c.id).join(', ')} passed with result:null. Two of the three kill criteria END the strategy; closing items does not clear one.`, fix: 'node scripts/check-queue.mjs --checkpoints' });
  }
  if (s.load.globalHalt) {
    out.push({ reason: 'FOUNDER-DEBT-GLOBAL', detail: `${s.load.totalOpenFounderHours}h of open founder work exceeds ${s.load.ceilingBudget}h — the ninety-day founder budget at the CEILING. Past this the queue is not a plan, it is a list. (Over the FLOOR budget of ${s.load.floorBudget}h only warns, mirroring check-queue --budget: over the ceiling fails, over the floor warns.)`, fix: 'Close or cut founder items before the loop runs again. capacity.floorPlan.dropOrderToReach13h names the cuts in advance.' });
  }
  if (s.growth.verdict === 'MANUFACTURING-DEBT') {
    out.push({ reason: 'FOUNDER-DEBT-GROWTH', detail: `The loop has added ${s.growth.added}h of founder work since ${s.growth.from} — more than one window's executable capacity (${s.growth.cap}h) in ${s.growth.need} briefs. That is review debt manufactured at agent speed and called progress.`, fix: 'Stop intake. Close founder items, or re-route these to owner:agent with a proof command.' });
  }
  if (s.conv.verdict === 'DIVERGING') {
    out.push({ reason: 'DIVERGENCE', detail: `${s.conv.need} briefs issued since ${s.conv.from} and ZERO items closed. The loop is spinning.`, fix: 'Escalate: the selected items are not closable as written, or their verify commands are broken.' });
  }
  return out;
}

function printStatus(s, debt, json) {
  if (json) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(), window: s.win, startGate: s.gate, founderLoad: s.load,
      convergence: s.conv, founderDebtGrowth: s.growth, overdueCheckpoints: s.overdue.map((c) => c.id), readiness: s.readiness,
      honestyDebt: debt, halts: halts(s, debt),
    }, null, 2));
    return;
  }
  const h = halts(s, debt);
  console.log(`LOOP DRIVER — ${s.nowIso}, window ${s.win || '(outside the plan)'}\n`);

  console.log(`START GATE (capacity.floorPlan.whatIsNeverDropped) — ${s.gate.verdict}, ${s.gate.open}/4 still open:`);
  for (const r of s.gate.rows) console.log(`   ${r.closed ? '✓' : '·'} ${r.id} [${r.owner}] ${r.title.slice(0, 78)}`);

  console.log(`\nFOUNDER RATE LIMIT — ${s.load.executable}h executable per window (floor ${s.policy.founderRateLimit.floorHoursPerMonth} − ${s.policy.founderRateLimit.reviewOverheadPerMonth} review overhead):`);
  for (const r of s.load.rows) {
    const mark = r.intake === 'CLOSED' ? '✗' : '✓';
    console.log(`   ${mark} ${r.window}  open ${String(r.openHours).padStart(5)}h + ${r.overhead}h overhead = ${String(r.totalWithOverhead).padStart(5)}h   headroom ${r.headroom > 0 ? '+' : ''}${r.headroom}h   INTAKE ${r.intake}`);
  }
  console.log(`   TOTAL ${s.load.totalOpenFounderHours}h declared founder work is open across ${s.load.openFounderItems} founder/both items = ${s.load.monthsOfFloorCapacity} windows of executable capacity.\n   Ninety-day item budget: floor ${s.load.floorBudget}h (${s.load.overFloorBudget ? 'EXCEEDED — warn' : 'fits'}), ceiling ${s.load.ceilingBudget}h (halt).\n   Loop-attributable growth: ${s.growth.verdict}${s.growth.added === null ? ` (${s.growth.briefs}/${s.growth.need} briefs recorded)` : ` (${s.growth.added >= 0 ? '+' : ''}${s.growth.added}h in the last ${s.growth.need} briefs, cap ${s.growth.cap}h)`}.`);

  console.log(`\nCONVERGENCE — ${s.conv.verdict} (${s.conv.briefs}/${s.conv.need} briefs recorded${s.conv.closuresInWindow !== null ? `, ${s.conv.closuresInWindow} closures + ${s.conv.readinessGainsInWindow} readiness gains in window` : ''}).`);
  if (s.readiness) {
    console.log(`READINESS  — ${s.readiness.domainsReady}/${s.readiness.domainsTotal} domains, ${s.readiness.passing}/${s.readiness.verifiable} verifiable proved, ${s.readiness.decisions} decisions → founder  [snapshot ${s.readiness.ts.slice(0, 10)}]`);
  } else {
    console.log(`READINESS  — no snapshot yet. Run: node scripts/check-readiness.mjs`);
  }
  if (debt) console.log(`HONESTY    — ${debt.owed == null ? 'unparsed' : `${debt.owed} owed (${debt.agentOwed} agent-executable)`}${debt.regressed ? '  ✗ REGRESSED' : ''}`);

  if (h.length) {
    console.log(`\n✗ HALTED — ${h.length} reason(s). The loop must not fire until these clear:`);
    for (const x of h) console.log(`   [${x.reason}] ${x.detail}\n        fix: ${x.fix}`);
  } else {
    const sel = select(s.queue, s.register, s.policy, s.queue.policy.staleClaimDays, Date.now());
    console.log(`\n✓ CLEAR TO FIRE — lane ${sel.lane}${sel.item ? `, next ${sel.item.id} (${sel.pool} candidate${sel.pool === 1 ? '' : 's'} in pool)` : ''}.`);
    console.log(`  node scripts/loop-driver.mjs --fire --by "session:$ID"`);
  }
  console.log(`\nHANDOFF — the loop cannot: ${s.policy.handoffLimits.theLoopCannot.slice(0, 3).map((x) => x.split('—')[0].trim()).join('; ')}; +${s.policy.handoffLimits.theLoopCannot.length - 3} more in data/loop-policy.json.`);
}

function fire(s, debt, argv, now) {
  const who = arg(argv, '--by') || `session:${process.env.CLAUDE_SESSION_ID || 'unnamed'}`;
  const lanes = Math.min(Number(arg(argv, '--lanes') || 1) || 1, s.policy.isolation.maxLanes);

  const lease = acquireLease(who, s.policy.lease.ttlMinutes, now);
  if (!lease.ok) {
    console.error(`✗ HALT [LEASE-HELD] — ${lease.held?.by || 'another driver'} holds the selection lease (${lease.held?.at}).`);
    console.error(`  The lease guards read-decide-claim, not the work. If that session is dead: node scripts/loop-driver.mjs --release-lease`);
    return 1;
  }

  try {
    const h = halts(s, debt);
    if (h.length) {
      console.error(`✗ HALT — the loop is not permitted to fire:`);
      for (const x of h) console.error(`   [${x.reason}] ${x.detail}\n        fix: ${x.fix}`);
      appendRun({ ts: new Date(now).toISOString(), by: who, lane: 'HALT', action: 'HALT', reasons: h.map((x) => x.reason), closedCount: s.closedCount, readinessPassing: s.readiness?.passing ?? 0 });
      return 1;
    }

    const sha = headSha();
    const issued = [];
    const claimedNow = new Set();

    for (let lane = 1; lane <= lanes; lane++) {
      // Re-read the queue each lane: the previous lane's claim is already on disk.
      const q = readJson(QUEUE_PATH);
      const sel = select(q, s.register, s.policy, q.policy.staleClaimDays, now);
      if (sel.lane === 'IDLE') break;
      if (claimedNow.has(sel.item.id)) break;

      if (sel.lane === 'INTAKE') {
        const may = mayPromote({ ...sel.item, founderHours: sel.item.founderHours }, s.load, s.win, s.policy);
        issued.push({ lane: 'INTAKE', item: sel.item, may, worktree: null, pool: sel.pool });
        break; // intake is a judgement; one at a time, never parallel
      }

      const r = sh('node', ['scripts/check-queue.mjs', '--claim', sel.item.id, '--by', who, '--note', `loop-driver lane ${lane}`]);
      if (r.status !== 0) {
        const why = (r.stderr || r.stdout || '').trim().split('\n').filter(Boolean).pop();
        console.error(`✗ HALT [CLAIM-REFUSED] — check-queue would not claim ${sel.item.id}: ${why}`);
        console.error(`  A refused claim is NOT an idle loop. Nothing was written.`);
        appendRun({ ts: new Date(now).toISOString(), by: who, lane: 'HALT', action: 'CLAIM-REFUSED', item: sel.item.id, why, closedCount: s.closedCount, readinessPassing: s.readiness?.passing ?? 0 });
        return 1;
      }
      claimedNow.add(sel.item.id);
      const wt = lanes > 1 ? makeWorktree(s.policy, lane, sha) : { path: null, why: 'serial run — the main tree IS the isolation' };
      issued.push({ lane: 'EXECUTE', item: sel.item, worktree: wt, pool: sel.pool });
    }

    if (!issued.length) {
      console.log('LOOP IDLE — nothing actionable. Every open item is claimed, blocked, or founder-owned.');
      console.log(`  ${s.load.openFounderItems} founder item(s) are open (${s.load.totalOpenFounderHours}h). Closing agent items faster does not move one of them.`);
      appendRun({ ts: new Date(now).toISOString(), by: who, lane: 'IDLE', action: 'IDLE', closedCount: s.closedCount, readinessPassing: s.readiness?.passing ?? 0 });
      return 0;
    }

    for (const b of issued) printBrief(b, s, sha, who);
    for (const b of issued) {
      appendRun({
        ts: new Date(now).toISOString(), by: who, lane: b.lane, action: 'BRIEF', item: b.item.id,
        sha, worktree: b.worktree?.path || null, promoteRefused: b.may && !b.may.ok ? b.may.why : null,
        closedCount: s.closedCount, readinessPassing: s.readiness?.passing ?? 0,
        founderHoursOpen: s.load.totalOpenFounderHours, window: s.win,
      });
    }
    return 0;
  } finally {
    // The lease guards SELECTION only. Holding it through the work would serialize
    // the whole session and a dead session would park the loop for 90 minutes.
    if (fs.existsSync(LEASE_PATH)) fs.unlinkSync(LEASE_PATH);
  }
}

function printBrief(b, s, sha, who) {
  const it = b.item;
  const bar = '─'.repeat(78);
  console.log(`\n${bar}\n  ${b.lane} BRIEF — ${it.id}\n${bar}`);
  if (b.lane === 'EXECUTE') {
    console.log(`  ${it.title}\n`);
    console.log(`  priority ${it.priority} · phase ${it.phase} · repo ${it.repo} · window ${it.window} · effort ${it.effort} · founderHours ${it.founderHours}`);
    console.log(`  claimed for: ${who}   tree sha: ${sha || '(no git)'}`);
    if (b.worktree?.path) console.log(`  ISOLATED WORKTREE: ${b.worktree.path}  (detached at the sha above — your denominator cannot move)`);
    else if (b.worktree?.why) console.log(`  isolation: ${b.worktree.why}`);
    console.log(`\n  WHY: ${it.why}`);
    console.log(`\n  DONE WHEN: ${it.doneWhen}`);
    console.log(`\n  PROVE IT (this exact command must exit 0 — nothing else closes the item):`);
    console.log(`      cwd: ${it.verify.cwd}`);
    console.log(`      ${it.verify.cmd}`);
    console.log(`\n  CLOSE IT:  node scripts/check-queue.mjs --done ${it.id} --by "${who}"`);
    console.log(`  GIVE UP:   node scripts/check-queue.mjs --release ${it.id}   (a claim you cannot finish is worse than none)`);
    console.log(`\n  CONTRACT:  node scripts/lib/contract.mjs <every path you will touch>`);
    console.log(`  RULES:     do not wire a failing gate into check-all; do not repropose a price, tier, GA date,`);
    console.log(`             submitter lane or traffic goal (ADR-030/031/032); never invent a statistic.`);
  } else {
    console.log(`  ${it.claim}\n`);
    console.log(`  domain ${it.domain} · severity ${it.severity} · repo ${it.repo} · owner ${it.owner} · from ${it.sourceLine}`);
    console.log(`\n  EVIDENCE: ${it.evidence}`);
    console.log(`\n  THE QUEUE HAS NO ACTIONABLE AGENT ITEM. This is INTAKE: promote this register`);
    console.log(`  record into data/queue.json as a queue item. That needs a doneWhen and a proof`);
    console.log(`  command, which is a JUDGEMENT — the driver will not write it for you, for the same`);
    console.log(`  reason the product repo's queue-consumer never promotes its own findings.`);
    console.log(`\n  A candidate proof command already exists in the register:`);
    console.log(`      cwd: ${it.repo}`);
    console.log(`      ${it.verify}`);
    if (b.may && !b.may.ok) {
      console.log(`\n  ✗ PROMOTION REFUSED — ${b.may.why}`);
    } else {
      console.log(`\n  ✓ INTAKE PERMITTED into ${s.win} — ${b.may.why}`);
      console.log(`    The new item MUST declare founderHours and window, or the rate limit is blind to it.`);
    }
  }
  console.log(bar);
}

// ─────────────────────────────────────────────────────────────────────────────

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest() ? 0 : 2);

  if (argv.includes('--release-lease')) {
    if (fs.existsSync(LEASE_PATH)) { fs.unlinkSync(LEASE_PATH); console.log('lease released.'); }
    else console.log('no lease held.');
    process.exit(0);
  }

  const now = Date.now();
  const s = assemble(now);
  const skipDebt = argv.includes('--brief'); // the hook must be fast and must never block a session
  const debt = skipDebt ? null : honestyDebt();

  if (argv.includes('--brief')) {
    const h = halts(s, debt);
    const sel = select(s.queue, s.register, s.policy, s.queue.policy.staleClaimDays, now);
    if (h.length) {
      console.log(`LOOP: HALTED — ${h.map((x) => x.reason).join(', ')}. Run: node scripts/loop-driver.mjs`);
    } else {
      console.log(`LOOP: ${sel.lane}${sel.item ? ` — next ${sel.item.id}` : ''}. START GATE ${s.gate.verdict} (${s.gate.open}/4 open). Founder load ${s.load.totalOpenFounderHours}h (floor budget ${s.load.floorBudget}h, halt ${s.load.ceilingBudget}h); ${s.load.rows.filter((r) => r.intake === 'CLOSED').map((r) => r.window).join(',') || 'no window'} intake closed.`);
      console.log(`  fire it: node scripts/loop-driver.mjs --fire --by "session:$ID"`);
    }
    process.exit(0);
  }

  // Shows the INTAKE lane without draining the queue first: what the loop would hand a
  // session once every agent item is claimed, and whether the rate limit lets it promote.
  // Writes nothing and claims nothing.
  if (argv.includes('--explain-intake')) {
    const drained = { ...s.queue, items: s.queue.items.map((i) => (i.owner === 'agent' || i.owner === 'both') && !i.closed ? { ...i, claim: { by: 'explain', at: new Date(now).toISOString() } } : i) };
    const sel = select(drained, s.register, s.policy, s.queue.policy.staleClaimDays, now);
    if (sel.lane !== 'INTAKE') { console.log(`No INTAKE candidate: lane would be ${sel.lane}.`); process.exit(0); }
    printBrief({ lane: 'INTAKE', item: sel.item, pool: sel.pool, may: mayPromote(sel.item, s.load, s.win, s.policy) }, s, headSha(), 'explain');
    process.exit(0);
  }

  if (argv.includes('--fire')) process.exit(fire(s, debt, argv, now));

  printStatus(s, debt, argv.includes('--json'));
  process.exit(halts(s, debt).length ? 1 : 0);
}
