#!/usr/bin/env node
/**
 * check-queue.mjs — the work queue gate.
 *
 * ============================== WHY ==============================
 *
 * Measured on 2026-08-07 across 8 prior audit artifacts and 49 named findings:
 * auditing at Muntin has a **26% close rate**, and **zero closures in the
 * company's history came from anyone working an audit's list.** 14 findings were
 * fixed by the same session that found them (0 days); of the 38 that outlived
 * their session, 10 were ever closed — every one incidentally, by a later thread
 * that happened to touch the file.
 *
 * The bottleneck is not recording. `docs/handoff/strategic-council-board.md` is
 * 1,488 immaculate lines and `board-archive.md` is another 993. The bottleneck is
 * that only an agent session produces work, and **no session has ever been
 * pointed at the backlog.** Four nightly crons in the product repo already
 * diff-and-open-an-Issue; nothing consumes that queue either.
 *
 * A plan expressed as prose has a measured 26% chance of mattering. So this is
 * not a document. It is a gate.
 *
 * ============================ WHAT IT DOES ============================
 *
 *   1. A HIGH item nobody has claimed makes this script EXIT 1.
 *      A scheduled session runs it as its first act, so a session cannot report
 *      a clean run while urgent work sits untouched.
 *
 *   2. `--done` does not accept a claim. It RUNS the item's `verify` command and
 *      writes the closure only if that command exits 0. "Done" is proven here or
 *      it does not happen.
 *
 *   3. `--verify --all` re-runs every closed item's verify command and REOPENS
 *      any that no longer passes. A tidy board can be out of date; this is how it
 *      finds out.
 *
 *   4. Claims expire. A claim older than `policy.staleClaimDays` with no closure
 *      is released, and the release is written into the file. Bookkeeping does not
 *      live in agent memory, and a dead session cannot park a HIGH item forever.
 *
 * ====================== WHY IT IS NOT IN check-all ======================
 *
 * `check-all.mjs` runs inside the Cloudflare deploy command, so wiring a
 * currently-failing gate turns every deploy red — and THIS GATE IS SUPPOSED TO
 * FAIL while HIGH work is unclaimed. Wiring it would make a red deploy the normal
 * state and teach everyone to ignore it, which is precisely the disease. It is
 * registered in `check-gate-coverage.mjs`'s UNWIRED registry with that reason,
 * and it is invoked instead by:
 *
 *   • `.claude/hooks/session-start.sh` — every session, in both repos. This is
 *     the load-bearing one: 1 of 108 agent transcripts in the 2026-08 engagement
 *     carried a CLAUDE.md, so rules that live in CLAUDE.md are not rules. A hook
 *     runs whether or not the contract loads.
 *   • `.github/workflows/queue-consumer.yml` (product repo) — daily, after the
 *     four nightlies.
 *
 * Usage:
 *   node scripts/check-queue.mjs                     # the gate
 *   node scripts/check-queue.mjs --brief             # session-start view, never fails
 *   node scripts/check-queue.mjs --json
 *   node scripts/check-queue.mjs --self-test
 *   node scripts/check-queue.mjs --claim Q-003 --by "session:<id>" [--note "..."]
 *   node scripts/check-queue.mjs --release Q-003
 *   node scripts/check-queue.mjs --done Q-003 --by "session:<id>"
 *   node scripts/check-queue.mjs --verify --all
 *   node scripts/check-queue.mjs --render            # rewrite docs/handoff/QUEUE.md
 *   node scripts/check-queue.mjs --check             # QUEUE.md is in sync (idem)
 *   node scripts/check-queue.mjs --heartbeat         # the cron consumer is alive
 *   node scripts/check-queue.mjs --absorb            # pull the product repo's inbox
 *
 * Verify helpers, used as the `verify.cmd` of items whose done-condition is a
 * human act rather than a code state — so even a signature leaves a machine-
 * checkable trace:
 *   node scripts/check-queue.mjs --attest Q-009
 *   node scripts/check-queue.mjs --retirement Q-050
 *   node scripts/check-queue.mjs --grep-absent "2026-11-13"
 *
 * Exit codes:
 *   0 — no HIGH item is unclaimed (or the requested sub-command succeeded).
 *   1 — a HIGH item is unclaimed, or a sub-command failed.
 *   2 — self-test failure / malformed queue.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const QUEUE_PATH = path.join(REPO, 'data', 'queue.json');
const BOARD_PATH = path.join(REPO, 'docs', 'handoff', 'QUEUE.md');

const PRIORITIES = ['HIGH', 'MED', 'LOW'];
const PHASE_ORDER = ['P0', 'P1', 'P2', 'P3', 'RET'];
const STATUSES = ['ready', 'claimed', 'blocked', 'done'];

// ─────────────────────────────────────────────────────────────────────────────
// Pure logic. Everything below the fold is I/O; everything here is testable.
// ─────────────────────────────────────────────────────────────────────────────

/** An item is OPEN if it is not closed. `status: done` without a `closed` record is a lie. */
export function isOpen(item) {
  return !item.closed;
}

/**
 * A claim older than staleClaimDays with no closure is dead. We do not trust a
 * session to release its own claim — sessions end without warning.
 */
export function isClaimStale(item, staleClaimDays, now) {
  if (!item.claim || !item.claim.at) return false;
  if (item.closed) return false;
  const ageDays = (now - Date.parse(item.claim.at)) / 86400000;
  return Number.isFinite(ageDays) && ageDays > staleClaimDays;
}

/**
 * The effective status, recomputed from evidence rather than read from the
 * `status` field. The `status` field is a cache; this is the truth.
 *
 *   done    — has a closure record
 *   blocked — every blocker that is still open
 *   claimed — a live, non-stale claim
 *   ready   — anything else
 */
export function effectiveStatus(item, all, staleClaimDays, now) {
  if (item.closed) return 'done';
  const byId = new Map(all.map((i) => [i.id, i]));
  const openBlockers = (item.blockedBy || []).filter((b) => {
    const dep = byId.get(b);
    return dep ? isOpen(dep) : true; // an unknown blocker blocks; silence is not clearance
  });
  if (openBlockers.length) return 'blocked';
  if (item.claim && !isClaimStale(item, staleClaimDays, now)) return 'claimed';
  return 'ready';
}

/** Items a session could pick up right now: ready, unblocked, unclaimed. */
export function actionable(items, staleClaimDays, now) {
  return items.filter((i) => effectiveStatus(i, items, staleClaimDays, now) === 'ready');
}

export function rank(item) {
  const p = PRIORITIES.indexOf(item.priority);
  const ph = PHASE_ORDER.indexOf(item.phase);
  return [p < 0 ? 99 : p, ph < 0 ? 99 : ph, item.id];
}

/** The single item a session should do next. Deterministic — same tree, same answer. */
export function topItem(items, staleClaimDays, now) {
  const ready = actionable(items, staleClaimDays, now);
  if (!ready.length) return null;
  return ready.slice().sort((a, b) => {
    const [ap, aph, aid] = rank(a);
    const [bp, bph, bid] = rank(b);
    return ap - bp || aph - bph || (aid < bid ? -1 : aid > bid ? 1 : 0);
  })[0];
}

/** The gate's verdict: any HIGH item with nobody's name on it. */
export function unclaimedHigh(items, staleClaimDays, now) {
  return actionable(items, staleClaimDays, now).filter((i) => i.priority === 'HIGH');
}

/**
 * Structural validation. A malformed queue is worse than no queue: it is a
 * tracking surface that silently drops work.
 */
export function validate(queue) {
  const errs = [];
  const items = queue.items || [];
  const ids = new Set();
  for (const it of items) {
    const at = (m) => errs.push(`${it.id || '<no id>'}: ${m}`);
    if (!it.id || !/^Q-\d{3}$/.test(it.id)) at('id must match Q-NNN');
    if (ids.has(it.id)) at('duplicate id');
    ids.add(it.id);
    if (!it.title) at('missing title');
    if (!PRIORITIES.includes(it.priority)) at(`priority must be one of ${PRIORITIES.join('|')}`);
    if (!STATUSES.includes(it.status)) at(`status must be one of ${STATUSES.join('|')}`);
    if (!['agent', 'founder', 'both'].includes(it.owner)) at('owner must be agent|founder|both');
    if (!it.doneWhen || it.doneWhen.length < 30) at('doneWhen must be an objective condition, not a mood');
    if (!it.verify || !it.verify.cmd) at('every item needs a verify.cmd — done is proven, not claimed');
    if (it.verify && !['storefront', 'product'].includes(it.verify.cwd)) at('verify.cwd must be storefront|product');
    if (!Array.isArray(it.blockedBy)) at('blockedBy must be an array (empty is fine)');
    if (!Array.isArray(it.evidence) || !it.evidence.length) at('every item cites evidence — file:line, a command, or a source');
    if (it.owner !== 'agent' && !it.founderOnly && it.kind !== 'retire' && it.kind !== 'mechanism') {
      at('a founder-owned item must say what only the founder can do (founderOnly)');
    }
    // One in, one out. A new mechanism in a company 2-4x over capacity must name
    // what it retires, or the plan is addition wearing a plan's clothes.
    if (it.kind === 'mechanism' && (!Array.isArray(it.retires) || !it.retires.length)) {
      at('kind:mechanism requires a non-empty `retires` — every new mechanism is a new obligation');
    }
    if (it.closed && !it.closed.verifiedBy) at('a closure must record the command that proved it');
  }
  for (const it of items) {
    for (const b of it.blockedBy || []) {
      if (!ids.has(b)) errs.push(`${it.id}: blockedBy references unknown item ${b}`);
    }
  }
  return errs;
}

/** Reconcile the cached `status` field with the computed one. */
export function reconcileStatuses(queue, now) {
  const d = queue.policy.staleClaimDays;
  let changed = 0;
  const released = [];
  for (const it of queue.items) {
    if (isClaimStale(it, d, now)) {
      released.push({ id: it.id, by: it.claim.by, at: it.claim.at });
      it.claim = null;
    }
    const eff = effectiveStatus(it, queue.items, d, now);
    if (it.status !== eff) {
      it.status = eff;
      changed++;
    }
  }
  return { changed, released };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering — QUEUE.md is a VIEW. data/queue.json is the source of truth.
// ─────────────────────────────────────────────────────────────────────────────

function fence(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function render(queue, now) {
  const d = queue.policy.staleClaimDays;
  const items = queue.items;
  const top = topItem(items, d, now);
  const highs = unclaimedHigh(items, d, now);
  const by = (s) => items.filter((i) => effectiveStatus(i, items, d, now) === s);
  const L = [];

  L.push('<!-- GENERATED FILE — do not hand-edit.');
  L.push('     Source of truth: data/queue.json. Regenerate: node scripts/check-queue.mjs --render');
  L.push('     Drift is caught by: node scripts/check-queue.mjs --check -->');
  L.push('');
  L.push('# The Queue');
  L.push('');
  L.push('**The only place work is tracked.** `docs/handoff/strategic-council-board.md` keeps the');
  L.push('narrative history and loses the tracking job — see Q-050. Prior audits closed at **26%**,');
  L.push('and zero closures in company history came from anyone working an audit list, because only');
  L.push('an agent session produces work and none had ever been pointed at a backlog.');
  L.push('');
  L.push('**Claiming and closing happen through the machine, not through this file:**');
  L.push('');
  L.push('```sh');
  L.push('node scripts/check-queue.mjs                       # the gate — exits 1 on unclaimed HIGH work');
  L.push('node scripts/check-queue.mjs --claim Q-003 --by "session:$ID"');
  L.push('node scripts/check-queue.mjs --done  Q-003 --by "session:$ID"   # runs verify; refuses to close on failure');
  L.push('node scripts/check-queue.mjs --verify --all        # re-proves every closed item; reopens what regressed');
  L.push('```');
  L.push('');
  L.push(`**Strategy of record:** ${queue.strategy.ofRecord}`);
  L.push('');
  L.push(`> ${queue.strategy.verdict}`);
  L.push('');
  L.push(`> **Doctrine.** ${queue.strategy.doctrine}`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('## Right now');
  L.push('');
  if (top) {
    L.push(`**Next:** \`${top.id}\` — ${top.title}  _(${top.priority}, ${top.owner}, ${top.effort}, ${top.repo})_`);
  } else {
    L.push('**Next:** nothing is actionable — every open item is blocked or claimed.');
  }
  L.push('');
  L.push(
    `**Gate:** ${highs.length} HIGH item(s) unclaimed → \`check-queue\` exits **${highs.length ? 1 : 0}**.`,
  );
  L.push('');
  const counts = STATUSES.map((s) => `${by(s).length} ${s}`).join(' · ');
  L.push(`**Board:** ${items.length} items — ${counts}.`);
  L.push('');
  const founderItems = items.filter((i) => i.owner !== 'agent' && isOpen(i));
  if (founderItems.length) {
    L.push(`**Needs Don (${founderItems.length}):** ` + founderItems.map((i) => `\`${i.id}\``).join(', ') + '.');
    L.push('These do not move without a signature, a conversation, a credential or a judgment.');
    L.push('');
  }
  L.push('---');
  L.push('');

  const section = (heading, list, note) => {
    L.push(`## ${heading} (${list.length})`);
    L.push('');
    if (note) {
      L.push(note);
      L.push('');
    }
    if (!list.length) {
      L.push('_Nothing here._');
      L.push('');
      return;
    }
    L.push('| ID | Item | Pri | Phase | Owner | Effort | Blocked by |');
    L.push('|---|---|---|---|---|---|---|');
    for (const i of list.slice().sort((a, b) => {
      const [ap, aph, aid] = rank(a);
      const [bp, bph, bid] = rank(b);
      return ap - bp || aph - bph || (aid < bid ? -1 : aid > bid ? 1 : 0);
    })) {
      L.push(
        `| \`${i.id}\` | ${fence(i.title)} | ${i.priority} | ${i.phase} | ${i.owner} | ${i.effort} | ${(i.blockedBy || []).join(', ') || '—'} |`,
      );
    }
    L.push('');
  };

  section('Ready', by('ready'), 'Highest first. A HIGH row here is why the gate is red.');
  section('In progress', by('claimed'), `Claims expire after ${d} days and are released by the machine.`);
  section('Blocked', by('blocked'), 'Blocked by an item that is still open. Unblocking is done by closing the blocker.');
  section('Done', by('done'), 'Closed only by a `verify` command that exited 0. Re-proved by `--verify --all`.');

  L.push('---');
  L.push('');
  L.push('## Detail');
  L.push('');
  for (const i of items.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const eff = effectiveStatus(i, items, d, now);
    L.push(`### \`${i.id}\` — ${i.title}`);
    L.push('');
    L.push(
      `**${i.priority}** · ${eff} · ${i.phase} · owner **${i.owner}** · ${i.repo} · ${i.effort} · kind \`${i.kind}\``,
    );
    L.push('');
    L.push(i.why);
    L.push('');
    L.push('**Evidence**');
    L.push('');
    for (const e of i.evidence) L.push(`- ${e}`);
    L.push('');
    if (i.founderOnly) {
      L.push(`**Only Don can do this:** ${i.founderOnly}`);
      L.push('');
    }
    if (i.retires && i.retires.length) {
      L.push('**Retires**');
      L.push('');
      for (const r of i.retires) L.push(`- ${r}`);
      L.push('');
    }
    L.push(`**Done when:** ${i.doneWhen}`);
    L.push('');
    L.push('```sh');
    L.push(`# cwd: ${i.verify.cwd}`);
    L.push(i.verify.cmd);
    L.push('```');
    L.push('');
    if (i.claim) L.push(`_Claimed by ${i.claim.by} at ${i.claim.at}._${i.claim.note ? ' ' + i.claim.note : ''}`);
    if (i.closed)
      L.push(`_Closed ${i.closed.at} by ${i.closed.by}, proved by \`${i.closed.verifiedBy}\`._`);
    if (i.claim || i.closed) L.push('');
  }
  return L.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// I/O
// ─────────────────────────────────────────────────────────────────────────────

function readQueue() {
  let raw;
  try {
    raw = fs.readFileSync(QUEUE_PATH, 'utf8');
  } catch {
    console.error(`check-queue: ${path.relative(REPO, QUEUE_PATH)} not found. The queue is the source of truth; it cannot be absent.`);
    process.exit(2);
  }
  let q;
  try {
    q = JSON.parse(raw);
  } catch (e) {
    console.error(`check-queue: ${path.relative(REPO, QUEUE_PATH)} is not valid JSON — ${e.message}`);
    process.exit(2);
  }
  const errs = validate(q);
  if (errs.length) {
    console.error(`check-queue: the queue is malformed (${errs.length}):\n`);
    for (const e of errs) console.error(`  ✗ ${e}`);
    process.exit(2);
  }
  return q;
}

function writeQueue(q) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + '\n');
}

function repoRootFor(cwd) {
  if (cwd === 'product') return path.resolve(REPO, '..', 'Muntin-Invoice-Decoder');
  return REPO;
}

/** Run an item's verify command. Returns {ok, out, unverifiable}. */
function runVerify(item) {
  const dir = repoRootFor(item.verify.cwd);
  if (!fs.existsSync(dir)) {
    return {
      ok: false,
      unverifiable: true,
      out: `the ${item.verify.cwd} repo is not checked out at ${dir} — this item cannot be proved from here`,
    };
  }
  const r = spawnSync('bash', ['-lc', item.verify.cmd], { cwd: dir, encoding: 'utf8', timeout: 15 * 60 * 1000 });
  const out = [r.stdout, r.stderr].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0, unverifiable: false, out };
}

function arg(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

function itemOrDie(q, id) {
  const it = q.items.find((i) => i.id === id);
  if (!it) {
    console.error(`check-queue: no item ${id}.`);
    process.exit(1);
  }
  return it;
}

function persist(q, now) {
  const { released } = reconcileStatuses(q, now);
  writeQueue(q);
  fs.writeFileSync(BOARD_PATH, render(q, now));
  return released;
}

// ── sub-commands ─────────────────────────────────────────────────────────────

function cmdClaim(q, argv, now) {
  const id = arg(argv, '--claim');
  const who = arg(argv, '--by');
  if (!who) {
    console.error('check-queue --claim needs --by "<who>" — an unnamed claim is not a claim.');
    process.exit(1);
  }
  const it = itemOrDie(q, id);
  if (it.closed) {
    console.error(`${id} is already closed.`);
    process.exit(1);
  }
  const eff = effectiveStatus(it, q.items, q.policy.staleClaimDays, now);
  if (eff === 'claimed') {
    console.error(`${id} is already claimed by ${it.claim.by} (${it.claim.at}). Use --release first if that claim is dead.`);
    process.exit(1);
  }
  if (eff === 'blocked') {
    console.error(`${id} is blocked by ${(it.blockedBy || []).join(', ')}. Close the blocker first.`);
    process.exit(1);
  }
  it.claim = { by: who, at: new Date(now).toISOString(), note: arg(argv, '--note') || null };
  persist(q, now);
  console.log(`claimed ${id} for ${who}. Done-condition:\n\n  ${it.doneWhen}\n\nProve it with:\n  (cwd: ${it.verify.cwd}) ${it.verify.cmd}`);
  process.exit(0);
}

function cmdRelease(q, argv, now) {
  const it = itemOrDie(q, arg(argv, '--release'));
  it.claim = null;
  persist(q, now);
  console.log(`released ${it.id}.`);
  process.exit(0);
}

function cmdDone(q, argv, now) {
  const it = itemOrDie(q, arg(argv, '--done'));
  const who = arg(argv, '--by') || (it.claim && it.claim.by) || 'unknown';
  console.log(`check-queue: proving ${it.id} — running its verify command in the ${it.verify.cwd} repo.\n`);
  const r = runVerify(it);
  if (!r.ok) {
    console.error(r.out || '(no output)');
    console.error(
      `\n✗ ${it.id} is NOT done. The verify command exited non-zero${r.unverifiable ? ' (unverifiable from here)' : ''}.\n` +
        `  "Done" is a claim until proven. Nothing was written.\n` +
        `  Done-condition: ${it.doneWhen}`,
    );
    process.exit(1);
  }
  console.log(r.out || '(no output)');
  it.closed = {
    at: new Date(now).toISOString(),
    by: who,
    verifiedBy: it.verify.cmd,
    verifiedIn: it.verify.cwd,
  };
  it.claim = null;
  if (it.retires && it.retires.length) {
    q.retirementLedger.push({ id: it.id, at: it.closed.at, retired: it.retires });
  }
  persist(q, now);
  console.log(`\n✓ ${it.id} closed, proved by its own verify command.`);
  process.exit(0);
}

function cmdVerify(q, argv, now) {
  const one = arg(argv, '--verify');
  const all = argv.includes('--all') || !one || one.startsWith('--');
  const targets = all ? q.items.filter((i) => i.closed) : [itemOrDie(q, one)];
  if (!targets.length) {
    console.log('check-queue --verify: nothing is closed yet, so nothing to re-prove.');
    process.exit(0);
  }
  let reopened = 0;
  let unverifiable = 0;
  for (const it of targets) {
    const r = runVerify(it);
    if (r.ok) {
      console.log(`  ✓ ${it.id} still proves out`);
      continue;
    }
    if (r.unverifiable) {
      unverifiable++;
      console.log(`  ? ${it.id} unverifiable here — ${r.out}`);
      continue;
    }
    reopened++;
    console.error(`  ✗ ${it.id} REGRESSED — reopening. ${r.out.split('\n').slice(-3).join(' ')}`);
    it.closed = null;
    it.claim = null;
  }
  persist(q, now);
  console.log(
    `\ncheck-queue --verify: ${targets.length} checked, ${reopened} reopened, ${unverifiable} unverifiable from this checkout.`,
  );
  process.exit(reopened ? 1 : 0);
}

function cmdHeartbeat(q, now) {
  const hb = path.join(REPO, q.policy.heartbeatFile);
  const max = q.policy.heartbeatMaxAgeDays;
  if (!fs.existsSync(hb)) {
    console.error(
      `check-queue --heartbeat: ${q.policy.heartbeatFile} does not exist. The cron consumer has never run.\n` +
        `  GitHub disables scheduled workflows in PUBLIC repos after 60 days of inactivity, which is why the\n` +
        `  consumer lives in the PRIVATE product repo — and why this heartbeat exists: a scheduler that is\n` +
        `  silently switched off is indistinguishable from one where nothing is wrong.`,
    );
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(hb, 'utf8'));
  const age = (now - Date.parse(j.lastRun)) / 86400000;
  if (!(age <= max)) {
    console.error(`check-queue --heartbeat: last consumer run was ${age.toFixed(1)} days ago (limit ${max}). The queue is not being fed.`);
    process.exit(1);
  }
  console.log(`check-queue --heartbeat: consumer ran ${age.toFixed(1)}d ago (limit ${max}); ${j.ingested ?? 0} item(s) ingested.`);
  process.exit(0);
}

function cmdAbsorb(q, now) {
  const inbox = path.resolve(REPO, q.policy.productInboxPath);
  if (!fs.existsSync(inbox)) {
    console.log(`check-queue --absorb: no product inbox at ${inbox}. Nothing to absorb (the product repo is not checked out here).`);
    process.exit(0);
  }
  const j = JSON.parse(fs.readFileSync(inbox, 'utf8'));
  const untriaged = (j.entries || []).filter((e) => !e.absorbedAs);
  if (!untriaged.length) {
    console.log('check-queue --absorb: product inbox is fully triaged.');
    process.exit(0);
  }
  console.log(`check-queue --absorb: ${untriaged.length} untriaged inbox entr(ies) from the four nightly crons.\n`);
  for (const e of untriaged) {
    console.log(`  ${e.source} #${e.ref} — ${e.title}`);
  }
  console.log(
    `\nThese are NOT auto-promoted. A cron finding is a signal, not a decision — promoting it to a queue item\n` +
      `means writing a doneWhen and a verify command, which is a judgement. Add them to data/queue.json and\n` +
      `set "absorbedAs" on each inbox entry so it stops being reported.`,
  );
  process.exit(1);
}

/** For items whose done-condition is a human act: the attestation IS the machine trace. */
function cmdAttest(q, argv, now) {
  const id = arg(argv, '--attest');
  itemOrDie(q, id);
  const a = q.attestations[id];
  if (!a) {
    console.error(
      `check-queue --attest ${id}: no attestation recorded.\n` +
        `  Record one by adding to data/queue.json:\n` +
        `    "attestations": { "${id}": { "by": "Don Goldstein", "at": "YYYY-MM-DD", "statement": "<what was done or declined>" } }\n` +
        `  An agent may not write this. It is the machine-checkable trace of a human act.`,
    );
    process.exit(1);
  }
  for (const k of ['by', 'at', 'statement']) {
    if (!a[k]) {
      console.error(`check-queue --attest ${id}: attestation missing "${k}".`);
      process.exit(1);
    }
  }
  if (a.statement.length < 40) {
    console.error(`check-queue --attest ${id}: the statement must say what was actually done or declined.`);
    process.exit(1);
  }
  console.log(`check-queue --attest ${id}: attested by ${a.by} on ${a.at}.`);
  process.exit(0);
}

/** A retirement is only real when the ledger names what stopped being an obligation. */
function cmdRetirement(q, argv) {
  const id = arg(argv, '--retirement');
  const it = itemOrDie(q, id);
  const e = q.retirementLedger.find((x) => x.id === id);
  if (!e || !Array.isArray(e.retired) || !e.retired.length) {
    console.error(
      `check-queue --retirement ${id}: nothing in the retirement ledger.\n` +
        `  ${it.id} claims to retire:\n` +
        (it.retires || []).map((r) => `    - ${r}`).join('\n') +
        `\n  Closing it must append that list to data/queue.json#retirementLedger. --done does this automatically.`,
    );
    process.exit(1);
  }
  console.log(`check-queue --retirement ${id}: ${e.retired.length} obligation(s) retired on ${e.at}.`);
  process.exit(0);
}

function cmdGrepAbsent(argv) {
  const needles = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--grep-absent') needles.push(argv[i + 1]);
  const bad = [];
  for (const n of needles) {
    const r = spawnSync(
      'bash',
      ['-lc', `grep -rIl --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=docs -F -- ${JSON.stringify(n)} . || true`],
      { cwd: REPO, encoding: 'utf8' },
    );
    const hits = (r.stdout || '').trim().split('\n').filter(Boolean);
    if (hits.length) bad.push({ n, hits });
  }
  if (bad.length) {
    for (const b of bad) {
      console.error(`check-queue --grep-absent: "${b.n}" still appears in ${b.hits.length} shipped file(s):`);
      for (const h of b.hits.slice(0, 20)) console.error(`  ${h}`);
    }
    process.exit(1);
  }
  console.log(`check-queue --grep-absent: ${needles.length} string(s) absent from every shipped file.`);
  process.exit(0);
}

function cmdBrief(q, now) {
  // Session-start view. NEVER exits non-zero: a hook that breaks the session
  // gets deleted, and a deleted hook points nobody at anything.
  const d = q.policy.staleClaimDays;
  const top = topItem(q.items, d, now);
  const highs = unclaimedHigh(q.items, d, now);
  const openFounder = q.items.filter((i) => i.owner !== 'agent' && isOpen(i)).length;
  const lines = [];
  lines.push('── MUNTIN QUEUE ──────────────────────────────────────────────');
  lines.push(`Strategy of record: ${q.strategy.ofRecord}`);
  lines.push(q.strategy.doctrine);
  lines.push('');
  if (highs.length) {
    lines.push(`${highs.length} HIGH item(s) are UNCLAIMED. \`node scripts/check-queue.mjs\` exits 1 right now.`);
  } else {
    lines.push('No HIGH item is unclaimed.');
  }
  if (top) {
    lines.push('');
    lines.push(`NEXT: ${top.id} — ${top.title}`);
    lines.push(`      ${top.priority} · ${top.owner} · ${top.effort} · ${top.repo} repo`);
    lines.push(`      done when: ${top.doneWhen}`);
    lines.push('');
    lines.push(`      claim it:  node scripts/check-queue.mjs --claim ${top.id} --by "session:$SESSION"`);
    lines.push(`      close it:  node scripts/check-queue.mjs --done  ${top.id} --by "session:$SESSION"`);
  }
  lines.push('');
  lines.push(
    `Board: ${q.items.length} items · ${highs.length} unclaimed HIGH · ${openFounder} need Don (signature, call, credential, judgement).`,
  );
  lines.push('Full board: docs/handoff/QUEUE.md · Source of truth: data/queue.json');
  lines.push('Do not open new work before checking this. Prior audits closed at 26% because nobody read the backlog.');
  lines.push('──────────────────────────────────────────────────────────────');
  console.log(lines.join('\n'));
  process.exit(0);
}

// ── self-test ────────────────────────────────────────────────────────────────

function selfTest() {
  const NOW = Date.parse('2026-08-07T00:00:00Z');
  const mk = (o) => ({
    id: 'Q-001',
    title: 't',
    phase: 'P0',
    priority: 'HIGH',
    status: 'ready',
    owner: 'agent',
    repo: 'storefront',
    effort: '1h',
    kind: 'fix',
    why: 'w',
    evidence: ['x'],
    doneWhen: 'a thing that is at least thirty characters long happens',
    verify: { cwd: 'storefront', cmd: 'true' },
    blockedBy: [],
    claim: null,
    closed: null,
    ...o,
  });

  const cases = [];
  const eq = (got, want, why) => cases.push([JSON.stringify(got), JSON.stringify(want), why]);

  // status is computed from evidence, not read from the field
  const a = mk({ id: 'Q-001', status: 'done' });
  eq(effectiveStatus(a, [a], 7, NOW), 'ready', 'a `done` status with no closure record is not done');

  const closed = mk({ id: 'Q-002', closed: { at: '2026-01-01', by: 'x', verifiedBy: 'true' } });
  eq(effectiveStatus(closed, [closed], 7, NOW), 'done', 'a closure record makes it done');

  const blocker = mk({ id: 'Q-002' });
  const blocked = mk({ id: 'Q-003', blockedBy: ['Q-002'] });
  eq(effectiveStatus(blocked, [blocker, blocked], 7, NOW), 'blocked', 'an open blocker blocks');
  eq(
    effectiveStatus(blocked, [closed, blocked], 7, NOW),
    'ready',
    'closing the blocker unblocks',
  );
  const ghost = mk({ id: 'Q-004', blockedBy: ['Q-999'] });
  eq(effectiveStatus(ghost, [ghost], 7, NOW), 'blocked', 'an unknown blocker blocks — silence is not clearance');

  // claims expire
  const fresh = mk({ claim: { by: 's', at: '2026-08-05T00:00:00Z' } });
  const stale = mk({ claim: { by: 's', at: '2026-07-01T00:00:00Z' } });
  eq(effectiveStatus(fresh, [fresh], 7, NOW), 'claimed', 'a fresh claim holds the item');
  eq(effectiveStatus(stale, [stale], 7, NOW), 'ready', 'a claim older than staleClaimDays is released');
  eq(isClaimStale(stale, 7, NOW), true, 'stale claim detected');
  eq(
    isClaimStale({ ...stale, closed: { at: 'x', by: 'y', verifiedBy: 'true' } }, 7, NOW),
    false,
    'a closed item has no live claim to expire',
  );

  // the gate
  const set = [mk({ id: 'Q-001', priority: 'HIGH' }), mk({ id: 'Q-002', priority: 'LOW' })];
  eq(unclaimedHigh(set, 7, NOW).map((i) => i.id), ['Q-001'], 'the gate sees only unclaimed HIGH');
  eq(topItem(set, 7, NOW).id, 'Q-001', 'HIGH sorts above LOW');
  const claimedHigh = [mk({ id: 'Q-001', priority: 'HIGH', claim: { by: 's', at: '2026-08-06T00:00:00Z' } }), mk({ id: 'Q-002', priority: 'LOW' })];
  eq(unclaimedHigh(claimedHigh, 7, NOW).length, 0, 'claiming a HIGH item clears the gate');
  eq(topItem(claimedHigh, 7, NOW).id, 'Q-002', 'the next item is the next unclaimed one');
  eq(topItem([], 7, NOW), null, 'an empty queue has no top item');
  eq(
    topItem([mk({ id: 'Q-009', priority: 'MED', phase: 'P0' }), mk({ id: 'Q-002', priority: 'MED', phase: 'RET' })], 7, NOW).id,
    'Q-009',
    'phase breaks a priority tie',
  );

  // validation refuses the shapes that make a tracker rot
  const v = (items) => validate({ items, policy: { staleClaimDays: 7 } });
  eq(v([mk({})]).length, 0, 'a well-formed item validates');
  eq(v([mk({ doneWhen: 'looks good' })]).length > 0, true, 'a subjective doneWhen is rejected');
  eq(v([mk({ verify: undefined })]).length > 0, true, 'an item with no verify command is rejected');
  eq(v([mk({ evidence: [] })]).length > 0, true, 'an item with no evidence is rejected');
  eq(v([mk({ kind: 'mechanism' })]).length > 0, true, 'a new mechanism that retires nothing is rejected');
  eq(v([mk({ kind: 'mechanism', retires: ['something'] })]).length, 0, 'a mechanism that names a retirement is accepted');
  eq(v([mk({ owner: 'founder' })]).length > 0, true, 'a founder item must say what only the founder can do');
  eq(v([mk({ owner: 'founder', founderOnly: 'a signature' })]).length, 0, 'with founderOnly it validates');
  eq(v([mk({}), mk({})]).length > 0, true, 'duplicate ids are rejected');
  eq(v([mk({ closed: { at: 'x', by: 'y' } })]).length > 0, true, 'a closure with no proof command is rejected');
  eq(v([mk({ blockedBy: ['Q-404'] })]).length > 0, true, 'a dangling blocker reference is rejected');

  // reconcile writes the truth back
  const q = { policy: { staleClaimDays: 7 }, items: [mk({ claim: { by: 's', at: '2026-06-01T00:00:00Z' }, status: 'claimed' })] };
  const rec = reconcileStatuses(q, NOW);
  eq(rec.released.length, 1, 'a stale claim is released by the machine, not by the session that made it');
  eq(q.items[0].status, 'ready', 'and the cached status is corrected on disk');

  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${want}, got ${got}`);
      process.exit(2);
    }
    pass++;
  }

  // The real queue on disk must itself be well-formed and renderable.
  const real = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  const realErrs = validate(real);
  if (realErrs.length) {
    console.error(`✗ self-test: data/queue.json is malformed:\n  ${realErrs.join('\n  ')}`);
    process.exit(2);
  }
  pass++;
  const md = render(real, NOW);
  if (!md.includes('# The Queue') || md.length < 2000) {
    console.error('✗ self-test: render() produced an implausible board');
    process.exit(2);
  }
  pass++;
  // Rendering is deterministic — otherwise --check would flap and get ignored.
  if (render(real, NOW) !== md) {
    console.error('✗ self-test: render() is not deterministic');
    process.exit(2);
  }
  pass++;

  console.log(`check-queue --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

// ── main ─────────────────────────────────────────────────────────────────────

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();

  const now = Date.now();
  const q = readQueue();

  if (argv.includes('--grep-absent')) return cmdGrepAbsent(argv);
  if (argv.includes('--attest')) return cmdAttest(q, argv, now);
  if (argv.includes('--retirement')) return cmdRetirement(q, argv);
  if (argv.includes('--heartbeat')) return cmdHeartbeat(q, now);
  if (argv.includes('--absorb')) return cmdAbsorb(q, now);
  if (argv.includes('--claim')) return cmdClaim(q, argv, now);
  if (argv.includes('--release')) return cmdRelease(q, argv, now);
  if (argv.includes('--done')) return cmdDone(q, argv, now);
  if (argv.includes('--verify')) return cmdVerify(q, argv, now);

  if (argv.includes('--render')) {
    const released = persist(q, now);
    for (const r of released) console.log(`released stale claim on ${r.id} (held by ${r.by} since ${r.at})`);
    console.log(`check-queue --render: wrote ${path.relative(REPO, BOARD_PATH)} from ${path.relative(REPO, QUEUE_PATH)}.`);
    process.exit(0);
  }

  if (argv.includes('--check')) {
    const want = render(q, now);
    const got = fs.existsSync(BOARD_PATH) ? fs.readFileSync(BOARD_PATH, 'utf8') : '';
    if (want !== got) {
      console.error(
        'check-queue --check: docs/handoff/QUEUE.md is out of sync with data/queue.json.\n' +
          '  Run: node scripts/check-queue.mjs --render',
      );
      process.exit(1);
    }
    console.log('check-queue --check: QUEUE.md matches data/queue.json.');
    process.exit(0);
  }

  if (argv.includes('--brief')) return cmdBrief(q, now);

  const d = q.policy.staleClaimDays;
  const { released } = reconcileStatuses(q, now);
  for (const r of released) console.log(`ℹ released stale claim on ${r.id} (held by ${r.by} since ${r.at})`);

  const highs = unclaimedHigh(q.items, d, now);
  const top = topItem(q.items, d, now);
  const openCount = q.items.filter(isOpen).length;

  if (argv.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          items: q.items.length,
          open: openCount,
          unclaimedHigh: highs.map((i) => i.id),
          top: top ? { id: top.id, title: top.title, owner: top.owner, doneWhen: top.doneWhen } : null,
        },
        null,
        2,
      ),
    );
    process.exit(highs.length ? 1 : 0);
  }

  if (!highs.length) {
    console.log(
      `check-queue: ${q.items.length} item(s), ${openCount} open — 0 unclaimed HIGH.` +
        (top ? ` Next up: ${top.id} — ${top.title} (${top.priority}).` : ' Nothing actionable.'),
    );
    process.exit(0);
  }

  console.error(`check-queue: ${highs.length} HIGH item(s) with nobody's name on them.\n`);
  for (const i of highs) {
    console.error(`  ✗ ${i.id}  ${i.title}`);
    console.error(`      ${i.priority} · ${i.owner} · ${i.effort} · ${i.repo}`);
  }
  console.error(`\n  TOP: ${top.id} — ${top.title}`);
  console.error(`  Done when: ${top.doneWhen}`);
  console.error(`\n  Claim it:  node scripts/check-queue.mjs --claim ${top.id} --by "session:$SESSION"`);
  console.error(`  Prove it:  node scripts/check-queue.mjs --done  ${top.id} --by "session:$SESSION"`);
  console.error(
    `\n  This gate is red on purpose. Prior audits at Muntin closed at 26%, and zero closures\n` +
      `  ever came from someone working a list — because no session was ever pointed at one.\n` +
      `  Board: docs/handoff/QUEUE.md`,
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
