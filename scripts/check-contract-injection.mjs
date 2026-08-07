#!/usr/bin/env node
/**
 * check-contract-injection.mjs — does the contract actually reach the workforce?
 *
 * ============================== WHY ==============================
 *
 * Measured 2026-08-07 across the 108 agent transcripts of this engagement:
 * **1 carried a CLAUDE.md.** 37 of those sessions ran with cwd =
 * /home/user/potentially-profitable and still received none. The premise every
 * CLAUDE.md discipline rests on — "the file loads into every session, so every
 * line must earn universal applicability" — is empirically false here, because
 * the workforce is workflow subagents and workflow subagents do not load the
 * project contract.
 *
 * Every rule that WAS obeyed was obeyed because a human hand-copied it into the
 * task prompt. Board-read language appeared in 41 of 56 first-user-messages,
 * root-list discipline in 14, the fact gate in 16. The mechanism is proven; the
 * hand-copying is the defect.
 *
 * So the question this gate asks is not "is the contract well written". It is
 * **"is there a code path by which the contract reaches a session"** — and it
 * refuses to let that path be deleted or bypassed once built.
 *
 * ============================ WHAT IT ASSERTS ============================
 *
 *   A. REGISTRY COHERENCE — docs/contracts/rules.json is well-formed: unique
 *      ids, core count within coreMax, every `gate:` detector present on disk,
 *      and every rule's `source` line still contains its `anchor`. That last one
 *      is what stops prose and registry drifting apart: if someone rewrites
 *      CLAUDE.md:44, the rule that cites it fails with the line the anchor moved
 *      to, so the fix is mechanical rather than archaeological.
 *
 *   B. THE LOAD PATH — .claude/hooks/session-start.sh must invoke
 *      scripts/lib/contract.mjs. The hook is the only channel measured to run in
 *      every session regardless of what loads. If the hook stops printing the
 *      contract, this reds.
 *
 *   C. SPAWNER INJECTION — any file under the declared roots that spawns a
 *      subagent must build its prompt through `contractFor(...)`. A spawner that
 *      writes a task prompt by hand is exactly the 1-in-108 failure, reproduced.
 *
 *   D. SELF-TEST — scripts/lib/contract.mjs --self-test must pass, so the glob
 *      matcher that decides which rules a task sees is itself pinned.
 *
 *   E. CROSS-REPO PARITY — when the sibling product repo is checked out beside
 *      this one, its scripts/lib/contract.mjs must be byte-identical. Two
 *      diverging copies of the selector is two contracts.
 *
 * ====================== AN HONEST NOTE ABOUT (C) ======================
 *
 * As of 2026-08-07 there are ZERO subagent spawners committed to either repo:
 * the orchestration that produced this engagement lives in the harness, outside
 * both trees. So assertion C currently proves nothing, and this script SAYS SO
 * on every run rather than reporting a green that means "we looked and found no
 * spawners" as though it meant "every spawner injects". A gate whose green is
 * vacuous and does not admit it is one of the 56 tautologies this repo already
 * has too many of. Assertions A, B, D and E bite today; C bites the day a
 * spawner is committed, which is the day it needs to.
 *
 * Usage:
 *   node scripts/check-contract-injection.mjs
 *   node scripts/check-contract-injection.mjs --verbose
 *
 * Exit codes:
 *   0 — the contract is well-formed and has a live path to a session.
 *   1 — the registry is incoherent, the load path is broken, or a spawner
 *       builds a prompt without the contract.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadRules, CORE_MAX } from './lib/contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const SIBLING = path.resolve(REPO, '..', 'Muntin-Invoice-Decoder');
const verbose = process.argv.includes('--verbose');
/**
 * --fix-anchors repositions `source` line numbers when a rule's `anchor` has
 * simply MOVED inside the same file. It never changes an anchor, never touches a
 * rule whose anchor has vanished, and refuses when the anchor appears more than
 * once (that is ambiguity, and ambiguity is a judgement).
 *
 * It exists because the alternative is 21 hand edits every time CLAUDE.md gains
 * a line — friction that turns a working gate into an ignored red. The red must
 * be one command from green or it is a chore, and chores lose (ADR-028).
 */
const fixAnchors = process.argv.includes('--fix-anchors');
const anchorFixes = [];

/**
 * ROOTS the spawner scan walks. Per SF-ROOT-LIST, every skipped tree below says
 * why it cannot contain a subagent spawner.
 */
const SPAWN_ROOTS = ['.claude', 'scripts', 'workflows', '.github/workflows', 'src'];
const SPAWN_SKIP = {
  'scripts/lib': 'Pure helper modules. contract.mjs itself lives here; a spawner that lived here would be found by the walk of scripts/ anyway.',
  'scripts/voice-refs': 'Reference text fixtures for the voice gates. Data, not code.',
  'scripts/sheets-fragments': 'HTML fragments inlined into /sheets/ pages by build-sheet-pages.mjs. Not executable.',
  node_modules: 'Installed dependencies; gitignored, never authored here.',
  assets: 'Browser CSS/JS/img. Cannot spawn an agent.',
  data: 'JSON manifests.',
  audio: 'Rendered MP3s.',
};

/** Call-site shapes that mean "this file starts an agent with a prompt". */
const SPAWN_PATTERNS = [
  [/\bsubagent_type\s*[:=]/, 'subagent_type'],
  [/\bTask\s*\(\s*\{/, 'Task({'],
  [/\bcreate_session\b/, 'create_session'],
  [/claude\s+(?:-p|--print)\b/, 'claude -p'],
  [/\bspawnAgent\b|\blaunchAgent\b|\brunAgent\b/, 'spawnAgent'],
  [/anthropic\.messages\.create/, 'anthropic.messages.create'],
];

const problems = [];
const notes = [];
const fail = (s) => problems.push(s);

// ---------------------------------------------------------------------------
// A. Registry coherence
// ---------------------------------------------------------------------------

/**
 * Both registries are validated here, by one gate, from this repo.
 *
 * The product repo keeps its OWN rules.json (this repo is public; that one is
 * not), but it gets no gate of its own — a second gate is a second obligation,
 * and the product repo's own `check-gate-coverage` would then demand it be
 * wired into a workflow this container cannot run. Registry coherence is
 * repo-agnostic, so it is cheaper and more honest to check both from the side
 * that has a runner.
 */
const REGISTRIES = [{ root: REPO, label: 'rules.json', registry: loadRules({ fresh: true }) }];
const siblingRules = path.join(SIBLING, 'docs', 'contracts', 'rules.json');
if (fs.existsSync(siblingRules)) {
  REGISTRIES.push({
    root: SIBLING,
    label: '../Muntin-Invoice-Decoder/docs/contracts/rules.json',
    registry: JSON.parse(fs.readFileSync(siblingRules, 'utf8')),
  });
}

let coreCount = 0;
let totalActive = 0;
for (const { root, label, registry } of REGISTRIES) {
  const isHome = root === REPO;
  const res = checkRegistry(root, label, registry);
  if (isHome) coreCount = res.core;
  totalActive += res.active;
}

function checkRegistry(root, label, registry) {
  const seen = new Set();
  let core = 0;
  let active = 0;

for (const r of registry.rules) {
  const at = `${label}#${r.id || '(no id)'}`;
  for (const f of ['id', 'text', 'scope', 'priority', 'source', 'anchor', 'enforcedBy', 'status']) {
    if (r[f] === undefined || r[f] === null || r[f] === '') fail(`${at}: missing required field '${f}'`);
  }
  if (!r.id) continue;
  if (seen.has(r.id)) fail(`${at}: duplicate rule id`);
  seen.add(r.id);
  if (!Array.isArray(r.scope) || r.scope.length === 0) fail(`${at}: scope must be a non-empty array of globs`);
  if (![0, 1, 2].includes(r.priority)) fail(`${at}: priority must be 0, 1 or 2 (got ${r.priority})`);
  if (!['active', 'retired'].includes(r.status)) fail(`${at}: status must be 'active' or 'retired'`);
  if (r.status === 'retired') continue;
  active++;
  if (r.priority === 0) core++;

  // Detector must exist.
  if (r.enforcedBy.startsWith('gate:')) {
    const g = r.enforcedBy.slice(5);
    if (!fs.existsSync(path.join(root, g))) {
      fail(`${at}: enforcedBy names '${g}', which is not on disk. Either the gate was deleted or the rule is claiming protection it does not have.`);
    }
  } else if (r.enforcedBy.startsWith('test:')) {
    const t = r.enforcedBy.slice(5);
    if (!fs.existsSync(path.join(root, t))) {
      fail(`${at}: enforcedBy names test '${t}', which is not on disk. A rule may not claim a test that does not exist — use 'none'.`);
    }
  } else if (!['none', 'hook', 'prompt'].includes(r.enforcedBy)) {
    fail(`${at}: enforcedBy must be 'gate:<script>', 'test:<path>', 'hook', 'prompt' or 'none' (got '${r.enforcedBy}')`);
  }

  // Source must still say what the rule claims.
  const m = /^([^:]+):(\d+)$/.exec(r.source);
  if (m) {
    const [, file, lineNo] = m;
    const abs = path.join(root, file);
    if (!fs.existsSync(abs)) {
      fail(`${at}: source file '${file}' does not exist.`);
    } else {
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      const idx = Number(lineNo) - 1;
      const hit = (lines[idx] || '').includes(r.anchor);
      if (!hit) {
        const moved = lines.findIndex((l) => l.includes(r.anchor));
        if (moved === -1) {
          fail(
            `${at}: anchor ${JSON.stringify(r.anchor)} is nowhere in ${file}. The prose this rule quotes has been rewritten or removed — re-anchor the rule or retire it.`,
          );
        } else {
          const occurrences = lines.filter((l) => l.includes(r.anchor)).length;
          if (occurrences > 1) {
            fail(
              `${at}: anchor ${JSON.stringify(r.anchor)} now appears ${occurrences} times in ${file}. Ambiguous — make the anchor unique; --fix-anchors will not guess.`,
            );
          } else if (fixAnchors) {
            anchorFixes.push({ root, id: r.id, from: r.source, to: `${file}:${moved + 1}` });
          } else {
            fail(`${at}: anchor moved — set source to '${file}:${moved + 1}' (was ${r.source}). Run --fix-anchors.`);
          }
        }
      }
    }
  } else if (!fs.existsSync(path.join(root, r.source.split('#')[0]))) {
    fail(`${at}: source '${r.source}' is neither a file:line nor an existing path.`);
  }
}

  if (core > (registry.coreMax ?? CORE_MAX)) {
    fail(
      `${label}: ${core} always-on CORE rules against a cap of ${registry.coreMax ?? CORE_MAX}. ` +
        `The always-on block is the only part every session pays for; growing it is how a contract becomes wallpaper. Scope a rule or retire one.`,
    );
  }

  const undetected = registry.rules.filter((r) => r.status !== 'retired' && r.enforcedBy === 'none');
  notes.push(
    `${label}: ${active} active rules, ${core} core (cap ${registry.coreMax ?? CORE_MAX}), ` +
      `${undetected.length} with NO detector: ${undetected.map((r) => r.id).join(', ') || 'none'}.`,
  );

  return { core, active };
}

// ---------------------------------------------------------------------------
// B. The load path
// ---------------------------------------------------------------------------

const HOOK = '.claude/hooks/session-start.sh';
const hookAbs = path.join(REPO, HOOK);
if (!fs.existsSync(hookAbs)) {
  fail(
    `${HOOK} is missing. It is the ONLY channel measured to run in every session — 1 of 108 transcripts carried a CLAUDE.md, and the hook does not depend on it. Without it the contract reaches nobody.`,
  );
} else {
  const hook = fs.readFileSync(hookAbs, 'utf8');
  if (!/lib\/contract\.mjs/.test(hook)) {
    fail(`${HOOK} does not invoke scripts/lib/contract.mjs. The registry exists and nothing renders it into a session.`);
  }
}

// ---------------------------------------------------------------------------
// C. Spawner injection
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO, abs);
    if (SPAWN_SKIP[rel] || SPAWN_SKIP[e.name]) continue;
    if (e.isDirectory()) walk(abs, out);
    else if (/\.(mjs|js|ts|sh|py|yml|yaml)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const candidates = [];
for (const r of SPAWN_ROOTS) {
  const abs = path.join(REPO, r);
  if (fs.existsSync(abs)) candidates.push(...walk(abs));
}

const spawners = [];
for (const rel of candidates) {
  if (rel === 'scripts/check-contract-injection.mjs') continue; // this file names the patterns
  const txt = fs.readFileSync(path.join(REPO, rel), 'utf8');
  const hits = SPAWN_PATTERNS.filter(([re]) => re.test(txt)).map(([, name]) => name);
  if (hits.length) spawners.push({ rel, hits, injects: /contractFor\s*\(/.test(txt) || /lib\/contract\.mjs/.test(txt) });
}

for (const s of spawners) {
  if (!s.injects) {
    fail(
      `${s.rel} spawns a subagent (${s.hits.join(', ')}) without calling contractFor(). ` +
        `A hand-written task prompt is how 55 of 56 sessions in the 2026-08 engagement ran with no contract at all. ` +
        `Prepend: import { contractFor } from './lib/contract.mjs'  ->  contractFor(pathsTheTaskWillTouch).`,
    );
  }
}

if (spawners.length === 0) {
  notes.push(
    `VACUOUS: assertion C found 0 subagent spawners across ${candidates.length} scanned files under ${SPAWN_ROOTS.join(', ')}. ` +
      `The orchestration that produced this engagement lives in the harness, outside both repos, so this gate cannot see it. ` +
      `Its green here means "nothing to check", not "everything checks". It bites the day a spawner is committed.`,
  );
} else {
  notes.push(`${spawners.length} spawner(s) found; ${spawners.filter((s) => s.injects).length} inject the contract.`);
}

// ---------------------------------------------------------------------------
// D. Self-test
// ---------------------------------------------------------------------------

try {
  execFileSync(process.execPath, [path.join(REPO, 'scripts', 'lib', 'contract.mjs'), '--self-test'], { stdio: 'pipe' });
} catch (e) {
  fail(`scripts/lib/contract.mjs --self-test FAILED:\n${String(e.stdout || '')}${String(e.stderr || '')}`);
}

// ---------------------------------------------------------------------------
// E. Cross-repo parity
// ---------------------------------------------------------------------------

const siblingLib = path.join(SIBLING, 'scripts', 'lib', 'contract.mjs');
if (fs.existsSync(SIBLING)) {
  if (!fs.existsSync(siblingLib)) {
    notes.push(
      `The product repo is checked out beside this one but has no scripts/lib/contract.mjs. Its sessions run with no compiled contract. Copy it and add docs/contracts/rules.json there.`,
    );
  } else {
    const a = fs.readFileSync(path.join(REPO, 'scripts', 'lib', 'contract.mjs'));
    const b = fs.readFileSync(siblingLib);
    if (!a.equals(b)) {
      fail(
        `scripts/lib/contract.mjs differs between the two repos. Two selectors is two contracts; the rule registries are per-repo (the storefront is PUBLIC), the selector must not be.`,
      );
    }
  }
} else {
  notes.push('Product repo not checked out beside this one; cross-repo parity (E) not checked.');
}

// ---------------------------------------------------------------------------

if (fixAnchors && anchorFixes.length) {
  for (const { root, label } of [{ root: REPO, label: 'rules.json' }, { root: SIBLING, label: 'sibling' }]) {
    const file = path.join(root, 'docs', 'contracts', 'rules.json');
    if (!fs.existsSync(file)) continue;
    const mine = anchorFixes.filter((f) => f.root === root);
    if (!mine.length) continue;
    const reg = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const f of mine) {
      const rule = reg.rules.find((r) => r.id === f.id);
      if (rule) rule.source = f.to;
    }
    fs.writeFileSync(file, JSON.stringify(reg, null, 2) + '\n');
  }
  console.log(`check-contract-injection --fix-anchors: repositioned ${anchorFixes.length} source line(s).`);
  for (const f of anchorFixes) console.log(`  ${f.id}: ${f.from} -> ${f.to}`);
  console.log('  Re-run without --fix-anchors to verify.');
}

if (verbose || problems.length) {
  for (const n of notes) console.log('  note: ' + n);
}

if (problems.length) {
  console.error(`check-contract-injection: ${problems.length} problem(s).`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}

console.log(
  `check-contract-injection: OK — ${totalActive} active rules across ${REGISTRIES.length} registry/registries, ` +
    `${coreCount} core here, load path live via ${HOOK}, ${spawners.length} spawner(s) checked.`,
);
if (!verbose) console.log('  ' + notes[notes.length - 1]);
process.exit(0);
