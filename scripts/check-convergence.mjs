#!/usr/bin/env node
/**
 * check-convergence.mjs — the instrument that proves the readiness loop is
 * CLOSING, or stops it.
 *
 * ====================== WHY THIS IS A SCRIPT ======================
 *
 * check-readiness.mjs turned 44 validator opinions into 43 commands, so a domain
 * is READY on an exit code rather than on a panel's mood. That solves the wrong
 * half of the trap. The remaining half is that a loop can run forever while
 * *looking* productive: close three items, discover four, print a busy report,
 * repeat. Blocking count flat, hours burned, morale intact. Nothing in the
 * register can see that, because the register only knows about NOW.
 *
 * docs/handoff/telemetry/readiness-history.jsonl knows about THEN. This script is the only thing
 * that reads it as a time series and answers the two questions a loop owner
 * actually has:
 *
 *   1. Is the blocking count falling run over run?
 *   2. Is closure outrunning discovery, or is discovery outrunning closure?
 *
 * If the answer to (2) is no for long enough, the loop HALTS and escalates. It
 * does not "try harder". This company has a measured 26% audit close rate and
 * 5,005 lines of planning corpus produced by a loop with no halt condition.
 *
 * ========================== WHAT A RUN IS =========================
 *
 * Not a line. A LINE is what check-readiness appends every time anyone types the
 * command; four of them landed 40 seconds apart while the register was being
 * written. Four identical measurements taken during one sitting are one
 * observation, not four stalled passes.
 *
 * So consecutive lines whose BODY is byte-identical are coalesced into one
 * OBSERVATION *if* they fall inside COALESCE_MS (15 minutes). Past that window an
 * identical body is a distinct observation and therefore a zero-net pass, which
 * is exactly what should trip the stall detector — an agent pass on this corpus
 * cannot complete in under fifteen minutes, so a repeat measurement a day later
 * is real evidence that a pass moved nothing.
 *
 * This is the honest limit of the instrument and it is stated rather than hidden:
 * the history carries no run id, so the script infers passes from wall clock and
 * payload identity. If the loop ever stamps its own passes, prefer that.
 *
 * ====================== THE FOUR HALT CONDITIONS ==================
 *
 * H1 STALL — STALL_RUNS (3) consecutive observations with net closure ≤ 0.
 *   Why 3: one flat pass is normal (the register holds multi-hour items; a pass
 *   can legitimately spend itself on one of them and close nothing). Two can be
 *   a stretch blocked on the founder, who has 13 h/month. Three consecutive
 *   passes that moved the blocking count zero or backwards is the point where
 *   the loop has spent three full agent passes to learn nothing, and there is no
 *   evidence in this company's history that a fourth does better — the measured
 *   close rate for list-work is 26%, and zero closures ever came from working a
 *   list. Three is also cheap to escalate: it costs one founder decision, well
 *   inside the floor.
 *
 * H2 DIVERGENCE — over DIVERGE_WINDOW (5) observations, cumulative net ≤ 0 while
 *   items were actually closing. This is THE failure mode named in the brief:
 *   close 3, discover 4, alternate so that H1's "three in a row" never fires.
 *   Activity is not progress. A window that nets zero while churning is a loop
 *   converting founder money into motion.
 *
 * H3 REVIEW DEBT — the loop is rate-limited by FOUNDER capacity, not agent
 *   throughput. If open founder/external hours are RISING across the window and
 *   already exceed DEBT_MONTHS (2) × the declared floor, the loop is
 *   manufacturing review debt and calling it progress. Agents closing agent items
 *   faster does not move a domain that waits on the founder.
 *
 * H4 ERODED BAR — the count of blocking verifiable items FELL while the number of
 *   READY domains ROSE, and the fall was not explained by items passing. That is
 *   readiness bought by deleting tests. check-readiness defends the static form
 *   of this (a domain with no tests is UNDECIDABLE); only the time series can see
 *   the bar being lowered in motion.
 *
 * ==================== THE OPPOSITE PATHOLOGY ======================
 *
 * A loop that games its own metric is WORSE than one that stalls, because it
 * terminates confidently. Six detectors, none of which trusts the loop's own
 * report. Two of them read the PROOFS THEMSELVES rather than the numbers, which
 * is the only place gaming is visible before it has already happened.
 *
 * G1 TRIVIAL VERIFY (halting) — a verify that CANNOT FAIL: `|| true`, a trailing
 *   `; exit 0`, a bare `echo`, a `node -e` that asserts nothing. A gap whose
 *   proof cannot fail is not proved, and one of these anywhere in the corpus
 *   makes every readiness number unreadable.
 * G2 WEAK VERIFY (reported) — proof by existence: a verify that only checks a
 *   file is there, or parses it without asserting a value. Legitimate for a
 *   receipt whose content is a separate item's job; suspicious in volume.
 * G3 FLAPPER (halting) — an item that passed, failed, then passed again across
 *   observations. Either the verify is flaky or something is toggling it. Both
 *   mean the ratchet is not a ratchet. These are the items that "keep
 *   regenerating" and they are named in the escalation.
 * G4 VELOCITY (reported) — an observation that closed ≥ VELOCITY_ITEMS (5) items
 *   within VELOCITY_MS (10 min) of the previous one. Not proof of gaming; proof
 *   that a human should look.
 * G5 BROKEN VERIFY (halting) — the MIRROR of G1. A trivial verify always passes,
 *   so its item closes for free; a broken one can never RUN, so its item can
 *   never close and regenerates on every pass forever. Detected statically: a
 *   double-quoted `node -e "…"` whose program body also uses double quotes, which
 *   bash unquotes. This is the exact defect validate-ci-integrity found in all
 *   ten checkpoint criteria, and it was found live in Q-087 on the first run.
 * G6 DEAD ASSERTION (reported) — a clause that reads as a proof but whose exit
 *   status the shell discards, because a top-level `;` follows it. Found live in
 *   Q-081, whose opening `throw new Error('not wired into check-all')` can never
 *   fail the command.
 *
 * CLOSURE RE-PROOF is `--audit-closures`, which SHELLS OUT to
 *   `check-queue.mjs --verify --all` rather than reimplementing it. That command
 *   already re-runs every closed item's verify and reopens what regressed. It is
 *   opt-in because it WRITES to data/queue.json.
 *
 * ======================= WHAT THIS RETIRES ========================
 *
 * It retires re-running the 15-domain validation panel as a way of asking "is
 * this working". The panel cannot answer that question — every validator was
 * prompted that a validator who finds nothing has not validated anything, so a
 * re-run returns NOT_READY forever regardless of what changed. Progress is now
 * a delta on an append-only file, not a re-poll. It also retires the habit of
 * reading docs/handoff/strategic-council-board.md to judge momentum; that file
 * is 87% log by measurement and was frozen for this reason.
 *
 * It retires nothing from disk and adds no data file. It reads three that exist.
 *
 * ========================= NOT A DEPLOY GATE ======================
 *
 * This is a LOOP-CONTROL gate. Its consumer is whatever drives the readiness
 * loop: exit 1 means stop the loop and escalate, not "the site is broken". It is
 * deliberately NOT wired into check-all — the Cloudflare deploy is already red at
 * 320/328, and a second permanent red nobody can clear is how gates become
 * wallpaper. It is registered in check-gate-coverage.mjs UNWIRED with that
 * reason.
 *
 *   node scripts/check-convergence.mjs              # full report
 *   node scripts/check-convergence.mjs --brief      # two lines, for the hook
 *   node scripts/check-convergence.mjs --json
 *   node scripts/check-convergence.mjs --history <path>   # read an archived/candidate history
 *   node scripts/check-convergence.mjs --audit-closures   # re-proves closed queue items (WRITES)
 *   node scripts/check-convergence.mjs --self-test
 *
 * Verified behaviour on four synthetic histories of the real payload shape
 * (2026-08-07, fixtures kept OUT of the repo so no invented row can ever reach
 * the live append-only file):
 *   steady closure, no discovery         → CONVERGING, exit 0
 *   three passes that move nothing       → H1-STALL, exit 1
 *   close 1 / discover 2, alternating    → H2-DIVERGENCE + H3-REVIEW-DEBT, exit 1
 *                                          (trailing non-positive 0/3 — the run ENDS
 *                                          on a win, which is why H1 alone is not enough)
 *   an item that passes, fails, passes   → G3-FLAPPER, exit 1
 *
 * Exit codes:
 *   0 — converging, or too little history to say (which is reported as such,
 *       never dressed up as a trend).
 *   1 — HALT. A halt condition or a halting gaming detector fired. The loop stops
 *       and the founder gets the named items.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HISTORY = 'docs/handoff/telemetry/readiness-history.jsonl';
const REGISTER = 'data/readiness-register.json';
const QUEUE = 'data/queue.json';

// ---------------------------------------------------------------------------
// POLICY. Every constant carries the reason it has the value it has, because a
// threshold with no argument behind it gets tuned until the gate is quiet.
// ---------------------------------------------------------------------------

/** Identical measurements inside this window are ONE observation. An agent pass
 *  over this corpus cannot finish in fifteen minutes; four runs 40s apart are a
 *  person typing the command four times. */
export const COALESCE_MS = 15 * 60 * 1000;

/** H1. Three consecutive non-positive passes. See the header for the argument. */
export const STALL_RUNS = 3;

/** H2. The window over which churn is judged. Five passes is roughly one working
 *  session's worth of loop, and it is long enough that a 3-close/4-discover
 *  alternation cannot hide inside it. */
export const DIVERGE_WINDOW = 5;

/** H3. Founder-only work worth more than two months of FLOOR capacity, and still
 *  growing, is review debt rather than a backlog. */
export const DEBT_MONTHS = 2;

/** G4. Five closures inside ten minutes is not proof of anything; it is the
 *  threshold at which a human should read the diff. */
export const VELOCITY_ITEMS = 5;
export const VELOCITY_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// History → observations
// ---------------------------------------------------------------------------

export function readHistory(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((l) => l.ts && l.totals);
}

/** The body of a measurement, with the clock removed. Two lines with the same
 *  body measured the same world. */
export function bodyOf(line) {
  const { ts, ...rest } = line;
  return JSON.stringify(rest);
}

/**
 * Collapse consecutive identical measurements taken inside COALESCE_MS. Returns
 * observations in order, each carrying how many raw lines it represents so the
 * report can never overstate how much history exists.
 */
export function coalesce(lines, { window = COALESCE_MS } = {}) {
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (
      prev &&
      bodyOf(prev.line) === bodyOf(line) &&
      Date.parse(line.ts) - Date.parse(prev.lastTs) <= window
    ) {
      prev.rawRuns += 1;
      prev.lastTs = line.ts;
      continue;
    }
    out.push({ line, rawRuns: 1, ts: line.ts, lastTs: line.ts });
  }
  return out;
}

/** Blocking = verifiable items that are not currently proved. Regressions and
 *  broken tests are already inside this by construction: neither is passing. */
export function blockingOf(line) {
  return (line.totals.verifiable || 0) - (line.totals.passing || 0);
}

/**
 * The delta between two observations. `discovered` is the growth in the number of
 * blocking verifiable items — new gaps someone added to the register. That is the
 * only discovery signal the history carries, and the report says so rather than
 * pretending it can name the new items.
 */
export function deltaBetween(prev, cur) {
  const p = new Set(prev.passing || []);
  const c = new Set(cur.passing || []);
  const closed = [...c].filter((id) => !p.has(id));
  const reopened = [...p].filter((id) => !c.has(id));
  const dv = (cur.totals.verifiable || 0) - (prev.totals.verifiable || 0);
  const discovered = Math.max(0, dv);
  const retired = Math.max(0, -dv);
  return {
    closed,
    reopened,
    discovered,
    retired,
    net: closed.length - reopened.length - discovered,
    blockingBefore: blockingOf(prev),
    blockingAfter: blockingOf(cur),
    elapsedMs: Date.parse(cur.ts) - Date.parse(prev.ts),
    founderHoursDelta:
      (cur.totals.founderHoursOpen || 0) - (prev.totals.founderHoursOpen || 0),
    readyDelta: (cur.totals.domainsReady || 0) - (prev.totals.domainsReady || 0),
  };
}

export function deltas(observations) {
  const out = [];
  for (let i = 1; i < observations.length; i++) {
    out.push({
      index: i,
      ts: observations[i].ts,
      ...deltaBetween(observations[i - 1].line, observations[i].line),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The halt conditions
// ---------------------------------------------------------------------------

/** H1: STALL_RUNS consecutive non-positive net closures, counted from the end. */
export function trailingNonPositive(ds) {
  let n = 0;
  for (let i = ds.length - 1; i >= 0; i--) {
    if (ds[i].net <= 0) n++;
    else break;
  }
  return n;
}

/**
 * H2: over the last DIVERGE_WINDOW deltas, cumulative net ≤ 0 while work was
 * visibly happening. The `closed > 0` clause matters — a window in which nothing
 * moved at all is H1's business (a stall), not divergence. Divergence is the
 * expensive one: it looks like a working loop.
 */
export function divergenceOver(ds, { window = DIVERGE_WINDOW } = {}) {
  if (ds.length < window) return null;
  const w = ds.slice(-window);
  const net = w.reduce((a, d) => a + d.net, 0);
  const closed = w.reduce((a, d) => a + d.closed.length, 0);
  const discovered = w.reduce((a, d) => a + d.discovered, 0);
  const reopened = w.reduce((a, d) => a + d.reopened.length, 0);
  return { window, net, closed, discovered, reopened, diverging: net <= 0 && closed > 0 };
}

/** H4: the blocking bar fell for a reason other than items passing, while more
 *  domains went READY. Readiness bought by deleting tests. */
export function erodedBar(ds) {
  return ds.filter((d) => d.retired > 0 && d.readyDelta > 0);
}

/**
 * G3: an id that appears in `passing`, then does not, then does again. Passing →
 * failing → passing is not a ratchet; it is a coin. These are the items that
 * "keep regenerating", and they are what the escalation names.
 */
export function flappers(observations) {
  const ids = new Set();
  for (const o of observations) for (const id of o.line.passing || []) ids.add(id);
  const out = [];
  for (const id of ids) {
    const seq = observations.map((o) => (o.line.passing || []).includes(id));
    let drops = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i - 1] && !seq[i]) drops++;
    let recoveries = 0;
    for (let i = 1; i < seq.length; i++) if (!seq[i - 1] && seq[i] && seq.slice(0, i).includes(true)) recoveries++;
    if (drops > 0 && recoveries > 0) out.push({ id, drops, recoveries });
  }
  return out.sort((a, b) => b.drops + b.recoveries - (a.drops + a.recoveries));
}

// ---------------------------------------------------------------------------
// The gaming detectors — static analysis of the proofs themselves
// ---------------------------------------------------------------------------

/**
 * Classify a verify command by whether it can fail at all.
 *
 *   trivial — CANNOT fail. The item is closed by construction. Halting.
 *   weak    — can only fail if a file is missing or unparseable. Proof by
 *             existence. Legitimate for a receipt whose CONTENT is the point of
 *             a separate item, suspicious in volume. Reported.
 *   ok      — asserts something about a value.
 */
export function classifyVerify(cmd) {
  const raw = String(cmd || '').trim();
  if (!raw) return { grade: 'trivial', why: 'no command at all' };
  const flat = raw.replace(/\s+/g, ' ');

  // BROKEN — the mirror image of trivial. A trivial verify always passes, so its
  // item closes for free; a broken one can never RUN, so its item can never close
  // and regenerates forever. Both make the readiness number a fiction, and rule 1
  // says a gap that cannot be settled by a command is not a gap.
  //
  // The specific shape: a double-quoted `node -e "…"` whose body also uses double
  // quotes. Bash unquotes the inner pair and node receives fragments. This is the
  // exact defect validate-ci-integrity found in all ten checkpoint criteria
  // (`ReferenceError: Q is not defined`), and it is detectable statically here —
  // before it costs a loop pass — rather than only at runtime.
  // ANCHORED on purpose. Counting quotes across the WHOLE command mis-flagged
  // Q-081, where the extra double quotes belong to a later `grep -q "…"` in the
  // same chain and are perfectly correct. The program body is only unambiguous
  // when the command IS the node -e — i.e. it starts with `node -e "` and ends
  // with the matching `"`. Anything more complex is left to G6 below rather than
  // guessed at, because a wrong halt is as expensive as a missed one.
  const wholeProgram = flat.match(/^node\s+-e\s+"(.*)"$/);
  if (wholeProgram) {
    const inner = (wholeProgram[1].match(/(?<!\\)"/g) || []).length;
    if (inner > 0) return { grade: 'broken', why: `${inner} unescaped double quote(s) inside a double-quoted \`node -e "…"\` — bash unquotes them and node never receives the program` };
  }

  if (/\|\|\s*(true|:)\s*$/.test(flat)) return { grade: 'trivial', why: 'failure suppressed by `|| true`' };
  if (/;\s*exit\s+0\s*$/.test(flat)) return { grade: 'trivial', why: 'trailing `; exit 0` swallows the result' };
  if (/^(true|:|exit 0)$/.test(flat)) return { grade: 'trivial', why: 'a no-op that always exits 0' };
  if (/^(echo|printf|pwd|date|ls|cat|head|tail|wc)\b/.test(flat) && !/[|&]/.test(flat))
    return { grade: 'trivial', why: `\`${flat.split(' ')[0]}\` alone asserts nothing` };

  // What counts as "this command can fail on purpose". Each alternative earned its
  // place against a real false positive on the live corpus (2026-08-07):
  //   grep -\w*q   — `grep -rq` and `grep -rqi` are real proofs; anchoring on
  //                  `grep -q` alone mis-flagged Q-085 and Q-086.
  //   execSync     — delegating to a gate script that exits non-zero is a proof;
  //                  it mis-flagged Q-015, which shells out to a freshness gate.
  //   process.exit — any exit that is not literally `exit(0)` is an assertion;
  //                  the ternary form `process.exit(cond?0:1)` mis-flagged Q-087.
  const asserts =
    /\bthrow\b|\bassert\b|process\.exit\((?!\s*0\s*\))|\bexit\s+[1-9]|\|\|\s*exit|grep\s+-\w*q|execSync|spawnSync|\btest\s+-|\[\s|-eq\b|-ne\b|-gt\b|-lt\b/.test(raw);
  const touches = /require\(|readFileSync|existsSync|import\(|\bcat\b|\bgrep\b|\bnode\s+scripts\//.test(raw);

  if (/^node\s+-e/.test(flat) && !asserts) {
    return touches
      ? { grade: 'weak', why: 'reads a file but asserts no value — proof by existence' }
      : { grade: 'trivial', why: 'node -e that neither reads anything nor throws' };
  }
  if (/^(test|\[)\s/.test(flat) && !/&&/.test(flat))
    return { grade: 'weak', why: 'a bare file-existence test — creating an empty file satisfies it' };

  if (!asserts && !/^node\s+scripts\//.test(flat) && !/^(bash|sh|pnpm|npm)\b/.test(flat))
    return { grade: 'weak', why: 'no visible assertion; closure depends on the command failing by accident' };

  return { grade: 'ok', why: '' };
}

/**
 * A verify field is a bare string in some records and `{cwd, cmd}` in others —
 * both ledgers carry both shapes and the register changed shape mid-build on
 * 2026-08-07. Reading the object as a string yields "[object Object]", which
 * grades as weak and would have silently mis-flagged 88 sound commands. Normalize
 * once, here, and return null rather than a stringified object.
 */
export function cmdOf(verify) {
  if (typeof verify === 'string') return verify;
  if (verify && typeof verify.cmd === 'string') return verify.cmd;
  return null;
}

/**
 * G6 DEAD ASSERTION. In `A ; B && C` the shell reports only the LAST command's
 * status, so a `throw` in A is decorative — it prints and is discarded. Q-081
 * opens with a `node -e` that throws "not wired into check-all" and then a `;`,
 * which means that sentence can never fail the command. The chain still asserts
 * further right, so the verify is not broken and not trivial; it just contains a
 * clause that reads like a proof and is not one. Reported, never halting: the
 * shape is legitimate when the leading clause is genuinely a setup step, and a
 * halt on ambiguity is how a gate becomes wallpaper.
 */
export function deadAssertions(cmd) {
  const raw = String(cmd || '');
  // EVERY `;`, not the first. Q-081's first semicolon sits inside the JS program
  // (`readFileSync(...,'utf8');if(...)`), so testing only index-0 returned null and
  // the real dead clause four semicolons later went unreported.
  const balanced = (s, q) => ((s.match(new RegExp(`(?<!\\\\)${q}`, 'g')) || []).length % 2) === 0;
  for (let i = raw.indexOf(';'); i >= 0; i = raw.indexOf(';', i + 1)) {
    const head = raw.slice(0, i);
    if (!balanced(head, '"') || !balanced(head, "'")) continue; // inside a quoted program
    if (!/\bthrow\b|\bassert\b|process\.exit\((?!\s*0\s*\))/.test(head)) continue;
    return { why: 'an assertion before a top-level `;` — the shell discards its status, so that clause can never fail the verify' };
  }
  return null;
}

/** Every verify command in the corpus, from both proof ledgers. */
export function collectVerifies({ repo = REPO } = {}) {
  const out = [];
  const regPath = path.join(repo, REGISTER);
  if (existsSync(regPath)) {
    for (const it of JSON.parse(readFileSync(regPath, 'utf8')).items || []) {
      if (it.class !== 'verifiable') continue;
      const cmd = cmdOf(it.verify);
      if (cmd !== null) out.push({ id: it.id, source: 'register', cmd });
      else out.push({ id: it.id, source: 'register', cmd: '', missing: true });
    }
  }
  const qPath = path.join(repo, QUEUE);
  if (existsSync(qPath)) {
    for (const it of JSON.parse(readFileSync(qPath, 'utf8')).items || []) {
      const cmd = cmdOf(it.verify);
      if (cmd !== null) out.push({ id: it.id, source: 'queue', cmd, closed: !!it.closed });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------

export function assess(observations, { floor = null, verifies = [] } = {}) {
  const ds = deltas(observations);
  const halts = [];
  const notes = [];

  const stallRun = trailingNonPositive(ds);
  if (ds.length >= STALL_RUNS && stallRun >= STALL_RUNS) {
    halts.push({
      code: 'H1-STALL',
      detail: `${stallRun} consecutive observations with net closure ≤ 0 (threshold ${STALL_RUNS}).`,
    });
  }

  const div = divergenceOver(ds);
  if (div && div.diverging) {
    halts.push({
      code: 'H2-DIVERGENCE',
      detail: `over the last ${div.window} observations: ${div.closed} closed, ${div.reopened} reopened, ${div.discovered} newly discovered — cumulative net ${div.net}. Activity without progress.`,
    });
  }

  const last = observations[observations.length - 1];
  const hoursOpen = last ? last.line.totals.founderHoursOpen || 0 : 0;
  if (floor && ds.length) {
    const w = ds.slice(-DIVERGE_WINDOW);
    const growth = w.reduce((a, d) => a + d.founderHoursDelta, 0);
    if (growth > 0 && hoursOpen > floor * DEBT_MONTHS) {
      halts.push({
        code: 'H3-REVIEW-DEBT',
        detail: `founder/external hours open rose by ${growth}h across the window and stand at ${hoursOpen}h — more than ${DEBT_MONTHS} months of the declared ${floor} h/month floor. The loop is filling a queue only the founder can drain.`,
      });
    }
  }

  const eroded = erodedBar(ds);
  if (eroded.length) {
    halts.push({
      code: 'H4-ERODED-BAR',
      detail: `${eroded.length} observation(s) removed blocking tests while READY domains rose. Readiness cannot be bought by deleting tests.`,
    });
  }

  const flap = flappers(observations);
  if (flap.length) {
    halts.push({
      code: 'G3-FLAPPER',
      detail: `${flap.length} item(s) passed, failed, and passed again: ${flap.map((f) => f.id).join(', ')}. A ratchet that slips is not a ratchet.`,
    });
  }

  const graded = verifies.map((v) => ({ ...v, ...classifyVerify(v.cmd) }));
  const trivial = graded.filter((v) => v.grade === 'trivial');
  const weak = graded.filter((v) => v.grade === 'weak');
  const broken = graded.filter((v) => v.grade === 'broken');
  if (broken.length) {
    halts.push({
      code: 'G5-BROKEN-VERIFY',
      detail: `${broken.length} verify command(s) cannot RUN: ${broken.map((v) => v.id).join(', ')}. Their items can never close and will regenerate on every pass forever.`,
    });
  }
  if (trivial.length) {
    halts.push({
      code: 'G1-TRIVIAL-VERIFY',
      detail: `${trivial.length} verify command(s) cannot fail. Every readiness number computed from them is unreadable.`,
    });
  }
  if (weak.length) notes.push({ code: 'G2-WEAK-VERIFY', detail: `${weak.length} verify command(s) prove existence, not content.` });

  const dead = graded.map((v) => ({ ...v, dead: deadAssertions(v.cmd) })).filter((v) => v.dead);
  if (dead.length) notes.push({ code: 'G6-DEAD-ASSERTION', detail: `${dead.length} verify command(s) contain a clause that reads as a proof but whose exit status the shell discards: ${dead.map((v) => v.id).join(', ')}.` });

  const fast = ds.filter((d) => d.closed.length >= VELOCITY_ITEMS && d.elapsedMs < VELOCITY_MS);
  if (fast.length) notes.push({ code: 'G4-VELOCITY', detail: `${fast.length} observation(s) closed ≥${VELOCITY_ITEMS} items in under ${VELOCITY_MS / 60000} minutes.` });

  let trend;
  if (observations.length < 2) trend = 'INSUFFICIENT';
  else if (ds.length < STALL_RUNS) trend = 'EARLY';
  else if (halts.length) trend = 'HALT';
  else trend = 'CONVERGING';

  return { ds, halts, notes, trend, stallRun, div, flap, trivial, weak, broken, dead, fast, eroded, graded };
}

// ---------------------------------------------------------------------------

function selfTest() {
  let pass = 0,
    fail = 0;
  const ok = (c, m) => {
    if (c) pass++;
    else {
      fail++;
      console.error('  FAIL:', m);
    }
  };
  const L = (ts, verifiable, passing, extra = {}) => ({
    ts,
    passing,
    totals: {
      verifiable,
      passing: passing.length,
      founderHoursOpen: extra.hours ?? 0,
      domainsReady: extra.ready ?? 0,
    },
  });
  const T = (min) => new Date(Date.UTC(2026, 7, 7, 0, min)).toISOString();

  // --- coalescing --------------------------------------------------------
  ok(coalesce([L(T(0), 5, []), L(T(1), 5, [])]).length === 1,
    'two identical measurements a minute apart are ONE observation — four landed 40s apart on 2026-08-07');
  ok(coalesce([L(T(0), 5, []), L(T(1), 5, [])])[0].rawRuns === 2,
    'coalescing records how many raw lines it swallowed, so the report cannot overstate the history');
  ok(coalesce([L(T(0), 5, []), L(T(60), 5, [])]).length === 2,
    'an identical measurement an hour later is a distinct ZERO-NET pass, not a duplicate — this is what lets a stall be seen');
  ok(coalesce([L(T(0), 5, []), L(T(1), 5, ['R-A'])]).length === 2,
    'a changed body is never coalesced no matter how close in time');

  // --- deltas ------------------------------------------------------------
  const d1 = deltaBetween(L(T(0), 10, ['A']), L(T(10), 10, ['A', 'B']));
  ok(d1.closed.length === 1 && d1.net === 1, 'closing one item with no discovery is net +1');
  const d2 = deltaBetween(L(T(0), 10, ['A', 'B', 'C']), L(T(10), 14, ['A', 'B', 'C', 'D', 'E', 'F']));
  ok(d2.closed.length === 3 && d2.discovered === 4 && d2.net === -1,
    'THE NAMED FAILURE MODE: close 3, discover 4 — that is net -1, not "three closed"');
  const d3 = deltaBetween(L(T(0), 10, ['A', 'B']), L(T(10), 10, ['A']));
  ok(d3.reopened.length === 1 && d3.net === -1, 'a reopened item counts against net closure');
  ok(deltaBetween(L(T(0), 10, []), L(T(10), 7, [])).retired === 3,
    'shrinking the test corpus is recorded as RETIRED, never silently as progress');

  // --- H1 stall ----------------------------------------------------------
  const flat = [L(T(0), 10, ['A']), L(T(60), 10, ['A']), L(T(120), 10, ['A']), L(T(180), 10, ['A'])];
  const aFlat = assess(coalesce(flat));
  ok(aFlat.halts.some((h) => h.code === 'H1-STALL'), 'three flat passes HALT the loop');
  ok(assess(coalesce([L(T(0), 10, ['A']), L(T(60), 10, ['A'])])).halts.length === 0,
    'ONE flat pass does not halt — a pass may legitimately spend itself on one multi-hour item');

  // --- H2 divergence -----------------------------------------------------
  // Three items close and four are discovered across the window — net -1 — but the
  // deltas alternate +1/-2/+1/-2/+1 so the run ENDS on a positive pass and H1's
  // "three in a row" never fires. This is the exact shape the brief names.
  const churn = [
    L(T(0), 10, []),
    L(T(60), 10, ['A']),
    L(T(120), 12, ['A']),
    L(T(180), 12, ['A', 'B']),
    L(T(240), 14, ['A', 'B']),
    L(T(300), 14, ['A', 'B', 'C']),
  ];
  const aChurn = assess(coalesce(churn));
  ok(aChurn.div.closed === 3 && aChurn.div.discovered === 4 && aChurn.div.net === -1,
    'the fixture really is close-3/discover-4 netting -1 — a fixture that does not diverge cannot test divergence');
  ok(aChurn.stallRun < STALL_RUNS, 'the churn pattern deliberately never trips the stall detector');
  ok(aChurn.halts.some((h) => h.code === 'H2-DIVERGENCE'),
    'H2 catches alternating close/discover that nets zero — activity that is not progress');
  const real = [
    L(T(0), 10, []),
    L(T(60), 10, ['A', 'B']),
    L(T(120), 10, ['A', 'B', 'C']),
    L(T(180), 10, ['A', 'B', 'C', 'D']),
    L(T(240), 10, ['A', 'B', 'C', 'D', 'E']),
    L(T(300), 10, ['A', 'B', 'C', 'D', 'E', 'F']),
  ];
  ok(assess(coalesce(real)).halts.length === 0, 'a genuinely closing loop is not halted');

  // --- H3 review debt ----------------------------------------------------
  const debt = [
    L(T(0), 10, [], { hours: 10 }),
    L(T(60), 10, ['A'], { hours: 20 }),
    L(T(120), 10, ['A', 'B'], { hours: 30 }),
    L(T(180), 10, ['A', 'B', 'C'], { hours: 40 }),
    L(T(240), 10, ['A', 'B', 'C', 'D'], { hours: 50 }),
    L(T(300), 10, ['A', 'B', 'C', 'D', 'E'], { hours: 60 }),
  ];
  ok(assess(coalesce(debt), { floor: 13 }).halts.some((h) => h.code === 'H3-REVIEW-DEBT'),
    'RULE 3: a loop closing agent items while founder hours climb past two months of floor capacity is halted');
  ok(!assess(coalesce(real), { floor: 13 }).halts.some((h) => h.code === 'H3-REVIEW-DEBT'),
    'closing items without growing founder debt is not review debt');

  // --- H4 eroded bar -----------------------------------------------------
  const erode = [L(T(0), 10, ['A'], { ready: 1 }), L(T(60), 6, ['A'], { ready: 4 })];
  ok(assess(coalesce(erode)).halts.some((h) => h.code === 'H4-ERODED-BAR'),
    'ANTI-EROSION: deleting tests while READY domains rise is a halt, not a win');

  // --- G3 flappers -------------------------------------------------------
  const flap = [L(T(0), 10, ['A']), L(T(60), 10, []), L(T(120), 10, ['A'])];
  ok(flappers(coalesce(flap)).some((f) => f.id === 'A'), 'pass → fail → pass is a FLAPPER and is named');
  ok(flappers(coalesce(real)).length === 0, 'monotonic closure produces no flappers');

  // --- G1/G2 verify grading ----------------------------------------------
  ok(classifyVerify('exit 0').grade === 'trivial', 'a no-op verify is trivial');
  ok(classifyVerify('node scripts/x.mjs || true').grade === 'trivial', '`|| true` cannot fail');
  ok(classifyVerify('node scripts/x.mjs; exit 0').grade === 'trivial', 'a trailing `; exit 0` cannot fail');
  ok(classifyVerify('echo done').grade === 'trivial', '`echo` asserts nothing');
  ok(classifyVerify('test -f docs/x.md').grade === 'weak', 'existence-only proof is weak, not trivial — an empty file satisfies it');
  ok(classifyVerify('node -e \'require("./x.json")\'').grade === 'weak', 'parsing a file without asserting a value is proof by existence');
  ok(classifyVerify('node -e \'const r=require("./x.json");if(!(r.n>0))throw new Error("n")\'').grade === 'ok',
    'a verify that throws on a value is a real proof');
  ok(classifyVerify('node scripts/check-queue.mjs --self-test').grade === 'ok', 'delegating to a gate script is a real proof');
  ok(classifyVerify('').grade === 'trivial', 'an empty verify closes by construction');
  ok(classifyVerify('test -f x.json && node -e \'const r=require("./x.json");if(r.n<1)throw new Error("n")\'').grade === 'ok',
    'an existence test GUARDING a real assertion is a real proof, not a weak one');

  // --- G5 broken verify (the mirror of trivial) ---------------------------
  ok(classifyVerify('node -e "const d=require("./x.json");process.exit(d.a?0:1)"').grade === 'broken',
    'G5: nested double quotes inside node -e "…" are caught STATICALLY — the exact defect that broke all ten checkpoint criteria, found live in Q-087');
  ok(classifyVerify('node -e "const d=require(\'./x.json\');if(!d.a)throw new Error(\'a\')"').grade === 'ok',
    'single quotes inside a double-quoted node -e are correct and must not be flagged');
  ok(classifyVerify('node -e \'const d=require("./x.json");if(!d.a)throw new Error("a")\'').grade === 'ok',
    'double quotes inside a SINGLE-quoted node -e are correct and must not be flagged');
  ok(assess([], { verifies: [{ id: 'X', cmd: 'node -e "a("b")"' }] }).halts.some((h) => h.code === 'G5-BROKEN-VERIFY'),
    'a verify that can never run HALTS the loop — an item that cannot close is not work, it is a perpetual-motion machine');
  ok(classifyVerify('node -e "if(!x)throw new Error(\'a\')" ; grep -q "needle" file.txt && node scripts/g.mjs').grade !== 'broken',
    'ANCHORING: double quotes belonging to a LATER command in the chain are not a quoting bug — the unanchored count mis-flagged Q-081');

  // --- G6 dead assertion --------------------------------------------------
  ok(deadAssertions('node -e "if(!x)throw new Error(\'a\')" ; grep -q needle f && node scripts/g.mjs') !== null,
    'G6: a throw before a top-level `;` is decorative — the shell reports only the last command (found live in Q-081)');
  ok(deadAssertions('node -e "if(!x)throw new Error(\'a\')" && grep -q needle f') === null,
    '`&&` propagates failure, so an assertion before it is live and must not be flagged');
  ok(deadAssertions("node -e 'const s=\"a;b\";if(!s)throw new Error(1)'") === null,
    'a `;` INSIDE a quoted JS program is not a shell separator — the quote-balance test is what keeps this from firing on ordinary code');
  ok(deadAssertions('node scripts/g.mjs') === null, 'a command with no `;` has no dead clause');

  // --- false positives the live corpus taught (2026-08-07) -----------------
  ok(classifyVerify('grep -rq deskMinutesPerClose apps/api/src').grade === 'ok', 'grep -rq is a real proof (Q-085)');
  ok(classifyVerify('grep -rqi "differentiator" docs/x.md').grade === 'ok', 'grep -rqi is a real proof (Q-086)');
  ok(classifyVerify("node -e \"require('child_process').execSync('node scripts/g.mjs',{stdio:'inherit'})\"").grade === 'ok',
    'delegating to a gate via execSync is a real proof (Q-015)');
  ok(classifyVerify('test -f docs/correctness/cold-start-reconcile.json').grade === 'weak',
    'TRUE POSITIVE, kept: a bare existence test is satisfied by an empty file (Q-084)');

  // --- verify field shape -------------------------------------------------
  ok(cmdOf('exit 0') === 'exit 0', 'a bare string verify is read as itself');
  ok(cmdOf({ cwd: 'product', cmd: 'exit 0' }) === 'exit 0', 'a {cwd,cmd} verify is unwrapped — the register changed to this shape mid-build');
  ok(cmdOf({ cwd: 'product' }) === null, 'a verify with no command is null, never the string "[object Object]"');
  ok(classifyVerify(cmdOf({ cwd: 'x', cmd: 'node -e \'if(1)throw new Error("x")\'' })).grade === 'ok',
    'REGRESSION GUARD: stringifying the object graded 88 sound commands as weak on the first live run');

  // --- trend labelling ---------------------------------------------------
  ok(assess([]).trend === 'INSUFFICIENT', 'no history is INSUFFICIENT, never CONVERGING');
  ok(assess(coalesce([L(T(0), 10, [])])).trend === 'INSUFFICIENT',
    'HONESTY: a one-run history cannot show a trend and must not claim one');
  ok(assess(coalesce([L(T(0), 10, []), L(T(60), 10, ['A'])])).trend === 'EARLY',
    'two observations is EARLY — not enough to trip or clear the stall threshold');

  // --- the live corpus ---------------------------------------------------
  const live = readHistory(path.join(REPO, HISTORY));
  ok(Array.isArray(live), 'the live history parses');
  ok(live.every((l) => Array.isArray(l.passing)), 'every history line carries the passing id set the deltas are computed from');
  ok(readHistory('/no/such/file.jsonl').length === 0, 'a missing history file is empty, not a crash');

  console.log(`convergence self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

// ---------------------------------------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

  // --history lets the guard be pointed at an archived or candidate history.
  // It exists so the halt path can be exercised against real-shaped data without
  // ever writing invented rows into the live append-only file.
  const hIdx = argv.indexOf('--history');
  const historyFile = hIdx >= 0 && argv[hIdx + 1] ? path.resolve(argv[hIdx + 1]) : path.join(REPO, HISTORY);
  const lines = readHistory(historyFile);
  const obs = coalesce(lines);
  let floor = null;
  try {
    floor = JSON.parse(readFileSync(path.join(REPO, QUEUE), 'utf8')).capacity.founderHoursPerMonth.floor;
  } catch {
    /* capacity is optional; H3 simply does not fire without it */
  }
  const verifies = collectVerifies();
  const a = assess(obs, { floor, verifies });
  const halt = a.halts.length > 0;

  if (argv.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          rawLines: lines.length,
          observations: obs.length,
          trend: a.trend,
          halt,
          halts: a.halts,
          notes: a.notes,
          deltas: a.ds.map((d) => ({
            ts: d.ts,
            closed: d.closed,
            reopened: d.reopened,
            discovered: d.discovered,
            retired: d.retired,
            net: d.net,
            blockingBefore: d.blockingBefore,
            blockingAfter: d.blockingAfter,
          })),
          flappers: a.flap,
          trivialVerifies: a.trivial.map((v) => ({ id: v.id, source: v.source, why: v.why })),
          weakVerifies: a.weak.map((v) => ({ id: v.id, source: v.source, why: v.why })),
        },
        null,
        2,
      ),
    );
    process.exit(halt ? 1 : 0);
  }

  if (argv.includes('--brief')) {
    const last = obs[obs.length - 1];
    const b = last ? blockingOf(last.line) : 0;
    console.log(
      `CONVERGENCE: ${a.trend} — ${obs.length} observation(s) from ${lines.length} run(s), ${b} blocking.` +
        (a.ds.length ? `  net last pass ${a.ds[a.ds.length - 1].net >= 0 ? '+' : ''}${a.ds[a.ds.length - 1].net}.` : '') +
        (halt ? `  ✗ HALT: ${a.halts.map((h) => h.code).join(', ')}` : ''),
    );
    if (a.trend === 'INSUFFICIENT') console.log('  one observation cannot show a trend. Run the loop and measure again.');
    process.exit(halt ? 1 : 0);
  }

  if (argv.includes('--audit-closures')) {
    console.log('AUDITING CLOSED QUEUE ITEMS — delegating to check-queue.mjs --verify --all (this WRITES to data/queue.json)\n');
    try {
      console.log(execSync('node scripts/check-queue.mjs --verify --all', { cwd: REPO, encoding: 'utf8', timeout: 600000 }));
    } catch (e) {
      const out = String(e.stdout || '') + String(e.stderr || '');
      console.log(out);
      // Two very different failures share an exit code, and calling them the same
      // thing is how a gate starts lying. On 2026-08-07 this path printed
      // "REOPENED at least one item" when the truth was that check-queue refused
      // to run at all against a malformed queue and wrote nothing.
      if (/malformed/i.test(out)) {
        console.error('\n✗ closure audit COULD NOT RUN — check-queue reports the queue is malformed and refuses to load it, so nothing was re-proved and nothing was written. An audit that cannot run is not a passing audit. Fix the queue schema first.');
      } else {
        console.error('\n✗ closure audit REOPENED at least one item. A closed item that no longer proves out means the metric was measuring something that did not hold.');
      }
      process.exit(1);
    }
  }

  // ---- the report --------------------------------------------------------
  console.log(`CONVERGENCE — is the readiness loop closing?   ${new Date().toISOString().slice(0, 10)}\n`);
  console.log(
    `HISTORY: ${lines.length} raw run(s) in ${historyFile.startsWith(REPO) ? path.relative(REPO, historyFile) : historyFile} → ${obs.length} distinct observation(s) after coalescing identical measurements taken inside ${COALESCE_MS / 60000} minutes.`,
  );

  if (obs.length < 2) {
    console.log(
      `\n  ${a.trend}. A ${obs.length}-observation history CANNOT show a trend, and this script will not invent one.\n` +
        `  What can be said today: ${obs.length ? `${blockingOf(obs[0].line)} blocking item(s) of ${obs[0].line.totals.verifiable} verifiable, ${obs[0].line.totals.decisions} decision(s) routed to the founder` : 'nothing — the history is empty'}.\n` +
        `  The first real reading needs ${STALL_RUNS + 1} observations, i.e. ${STALL_RUNS + 1 - obs.length} more loop pass(es).`,
    );
  } else {
    console.log(`\nPER-PASS LEDGER (net = closed − reopened − newly discovered):\n`);
    console.log(`  ${'when'.padEnd(17)} ${'closed'.padStart(6)} ${'reopen'.padStart(6)} ${'disc'.padStart(5)} ${'net'.padStart(4)}   blocking`);
    for (const d of a.ds) {
      const mark = d.net > 0 ? '✓' : d.net === 0 ? '·' : '✗';
      console.log(
        `  ${mark} ${d.ts.slice(0, 16).replace('T', ' ')} ${String(d.closed.length).padStart(6)} ${String(d.reopened.length).padStart(6)} ${String(d.discovered).padStart(5)} ${String(d.net >= 0 ? '+' + d.net : d.net).padStart(4)}   ${d.blockingBefore} → ${d.blockingAfter}`,
      );
    }
    const first = obs[0].line,
      last = obs[obs.length - 1].line;
    console.log(
      `\nOVERALL: blocking ${blockingOf(first)} → ${blockingOf(last)} across ${obs.length} observations. ` +
        `Trailing non-positive passes: ${a.stallRun}/${STALL_RUNS}.`,
    );
    if (a.div)
      console.log(
        `WINDOW (${a.div.window}): ${a.div.closed} closed, ${a.div.reopened} reopened, ${a.div.discovered} discovered → cumulative net ${a.div.net >= 0 ? '+' : ''}${a.div.net}.`,
      );
  }

  if (a.broken.length) {
    console.log(`\n✗ G5 — ${a.broken.length} verify command(s) CANNOT RUN. Their items regenerate forever:`);
    a.broken.forEach((v) => console.log(`    ${v.id} [${v.source}] — ${v.why}\n        ${v.cmd.slice(0, 160)}`));
  }
  if (a.trivial.length) {
    console.log(`\n✗ G1 — ${a.trivial.length} verify command(s) CANNOT FAIL. These close by construction:`);
    a.trivial.forEach((v) => console.log(`    ${v.id} [${v.source}] — ${v.why}\n        ${v.cmd.slice(0, 140)}`));
  }
  if (a.weak.length) {
    console.log(`\n⚠ G2 — ${a.weak.length} verify command(s) prove EXISTENCE, not content (reported, not halting):`);
    a.weak.slice(0, 12).forEach((v) => console.log(`    ${v.id} [${v.source}] — ${v.why}`));
    if (a.weak.length > 12) console.log(`    … and ${a.weak.length - 12} more (--json for all)`);
  }
  if (a.flap.length) {
    console.log(`\n✗ G3 — ${a.flap.length} FLAPPER(S). These are the items that keep regenerating:`);
    a.flap.forEach((f) => console.log(`    ${f.id} — passed then failed ${f.drops}×, recovered ${f.recoveries}×`));
  }
  if (a.fast.length) console.log(`\n⚠ G4 — ${a.fast.length} observation(s) closed ≥${VELOCITY_ITEMS} items in under ${VELOCITY_MS / 60000} minutes. Worth a human read.`);
  if (a.dead.length) {
    console.log(`\n⚠ G6 — ${a.dead.length} verify command(s) contain a DEAD assertion (reported, not halting):`);
    a.dead.forEach((v) => console.log(`    ${v.id} [${v.source}] — ${v.dead.why}`));
  }

  if (halt) {
    console.log(`\n${'='.repeat(72)}\n✗ HALT — STOP THE LOOP AND ESCALATE TO THE FOUNDER.\n`);
    a.halts.forEach((h) => console.log(`  ${h.code}\n      ${h.detail}`));
    console.log(
      `\n  Another pass has no evidence behind it. The escalation is a DECISION, not more work:\n` +
        `  which of these gaps is the company actually going to answer, and which is being carried\n` +
        `  because it was written down. Founder capacity is ${floor ?? '?'}–26 h/month and does not grow.`,
    );
    console.log(`${'='.repeat(72)}`);
    process.exit(1);
  }

  console.log(
    `\n✓ ${a.trend}. No halt condition fired.` +
      (a.trend === 'EARLY' || a.trend === 'INSUFFICIENT'
        ? '  That is the absence of evidence for divergence, NOT evidence of convergence.'
        : ''),
  );
  process.exit(0);
}
