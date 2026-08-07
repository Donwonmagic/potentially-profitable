/**
 * contract.mjs — the contract, as a function of the paths a task will touch.
 *
 * ============================== WHY ==============================
 *
 * Measured 2026-08-07 across 108 agent transcripts in the largest engagement in
 * company history: **1 carried a CLAUDE.md.** 37 of them ran with cwd =
 * /home/user/potentially-profitable and still got none, because the workforce is
 * workflow subagents and workflow subagents do not load the project contract.
 *
 * Every rule that was actually obeyed was obeyed because a human hand-copied it
 * into the task prompt — board-read language in 41/56 prompts, root-list
 * discipline in 14/56, the fact gate in 16/56. That is progressive disclosure
 * implemented by copy-paste: lossy, unmeasured, and dependent on the orchestrator
 * remembering.
 *
 * So the file's *routing* is a bigger lever than its *content*. A rule's value is
 * P(the session sees it) x P(the session is in scope). P(sees it) is 1/108 =
 * 0.9% through CLAUDE.md and ~100% through `.claude/hooks/session-start.sh`,
 * which runs whether or not the contract loads. This module is what the hook and
 * any spawner call to render the right rules for the right task.
 *
 * ========================= WHAT IT DOES =========================
 *
 *   contractFor(paths[])  -> markdown string: the always-on CORE plus every rule
 *                            whose scope globs intersect `paths`.
 *   rulesFor(paths[])     -> the same selection as objects.
 *   loadRules()           -> the whole registry (docs/contracts/rules.json).
 *
 * Selection is *additive by scope and capped by budget*. Core rules (scope "**",
 * priority 0) always render; the registry builder caps them at CORE_MAX so the
 * always-on block cannot grow into the thing nobody reads. Scoped rules render
 * only when a path matches, which is what makes the 82% of the storefront
 * contract that is irrelevant to a given task actually absent rather than
 * skimmed.
 *
 * ====================== WHAT IT DELIBERATELY IS NOT ======================
 *
 * It is not a second copy of CLAUDE.md. `docs/contracts/rules.json` is the
 * source; CLAUDE.md's prose stays for humans, and each rule cites the CLAUDE.md
 * line it came from so the two cannot silently diverge (checked by
 * scripts/check-contract-injection.mjs).
 *
 * It has no dependencies. `package.json` is gitignored by convention
 * (CLAUDE.md), so nothing here may import from npm — the glob matcher below is
 * ~30 lines for that reason, not for fun.
 *
 * Usage:
 *   import { contractFor } from './lib/contract.mjs';
 *   prompt = contractFor(['library/foo/index.html']) + '\n\n' + task;
 *
 *   node scripts/lib/contract.mjs library/foo/index.html   # print it
 *   node scripts/lib/contract.mjs --core                   # core only
 *   node scripts/lib/contract.mjs --self-test              # prove the matcher
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..', '..');
const REGISTRY = path.join(REPO, 'docs', 'contracts', 'rules.json');

/** Hard cap on always-on rules. The builder gate fails above this. */
export const CORE_MAX = 8;

/** Rough token estimate. chars/4 — the same crude measure used elsewhere here. */
export const estimateTokens = (s) => Math.ceil(String(s).length / 4);

// ---------------------------------------------------------------------------
// Glob matching. Supports **, *, ? and {a,b}. No negation, deliberately: a
// negated scope is a rule about where a rule does NOT apply, which is the kind
// of thing that gets written once and never re-read.
// ---------------------------------------------------------------------------

function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // '**/' collapses so that 'a/**/b' also matches 'a/b'
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?';
          i += 2;
        } else {
          out += '.*';
          i += 1;
        }
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') {
      out += '[^/]';
    } else if (c === '{') {
      const close = glob.indexOf('}', i);
      if (close === -1) {
        out += '\\{';
      } else {
        const alts = glob.slice(i + 1, close).split(',');
        out += '(?:' + alts.map((a) => a.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
        i = close;
      }
    } else if ('.+^$()|[]\\'.includes(c)) {
      out += '\\' + c;
    } else {
      out += c;
    }
  }
  return new RegExp('^' + out + '$');
}

const _globCache = new Map();
export function matchGlob(glob, p) {
  let re = _globCache.get(glob);
  if (!re) {
    re = globToRegExp(glob);
    _globCache.set(glob, re);
  }
  return re.test(p);
}

/** Normalise a caller-supplied path to a repo-relative posix path. */
export function normalisePath(p) {
  let s = String(p).replace(/\\/g, '/').trim();
  if (s.startsWith('./')) s = s.slice(2);
  if (s.startsWith('/')) {
    // Absolute paths inside either repo become repo-relative.
    const m = s.match(/\/(potentially-profitable|Muntin-Invoice-Decoder)\/(.*)$/);
    s = m ? m[2] : s.replace(/^\/+/, '');
  }
  return s;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

let _cache = null;
export function loadRules({ file = REGISTRY, fresh = false } = {}) {
  if (_cache && !fresh) return _cache;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  _cache = raw;
  return raw;
}

export function activeRules(registry = loadRules()) {
  return registry.rules.filter((r) => r.status !== 'retired');
}

export function isCore(rule) {
  return rule.priority === 0 || (rule.scope.length === 1 && rule.scope[0] === '**');
}

/**
 * The rules that apply to a set of paths.
 *
 * @param {string[]} paths  repo-relative (or absolute) paths the task will touch.
 *                          Pass directories with a trailing '/**' if you mean a tree.
 * @param {object}  [opts]
 * @param {boolean} [opts.includeCore=true]
 * @param {object}  [opts.registry]
 */
export function rulesFor(paths = [], opts = {}) {
  const { includeCore = true, registry = loadRules() } = opts;
  const norm = (Array.isArray(paths) ? paths : [paths]).map(normalisePath).filter(Boolean);
  const picked = [];
  for (const rule of activeRules(registry)) {
    const core = isCore(rule);
    if (core) {
      if (includeCore) picked.push(rule);
      continue;
    }
    if (rule.scope.some((g) => norm.some((p) => matchGlob(g, p)))) picked.push(rule);
  }
  picked.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  return picked;
}

/**
 * Render the contract for a task.
 *
 * Returns a markdown block ready to prepend to a subagent prompt. Empty-safe:
 * with no paths it returns the core, which is the honest default for a task
 * whose file surface is not yet known.
 *
 * @param {string[]} paths
 * @param {object}  [opts]
 * @param {number}  [opts.budgetTokens=1800]  soft cap; lowest-priority scoped
 *                  rules are dropped first and the drop is STATED in the output,
 *                  never silent.
 */
export function contractFor(paths = [], opts = {}) {
  const { budgetTokens = 1800, registry = loadRules(), header = true } = opts;
  const picked = rulesFor(paths, { registry });

  const lines = [];
  if (header) {
    lines.push('## The contract (compiled — do not paraphrase, do not skip)');
    lines.push('');
    lines.push(
      `Source of record: \`docs/contracts/rules.json\` (v${registry.version}, ${registry.generated}). ` +
        `These are the rules whose scope intersects the paths this task touches. ` +
        `Rules you do not see here do not apply to this task.`,
    );
    lines.push('');
  }

  const kept = [];
  let spend = estimateTokens(lines.join('\n'));
  const dropped = [];
  for (const r of picked) {
    const block = renderRule(r);
    const cost = estimateTokens(block);
    if (!isCore(r) && spend + cost > budgetTokens) {
      dropped.push(r);
      continue;
    }
    spend += cost;
    kept.push(block);
  }

  lines.push(...kept);

  if (dropped.length) {
    lines.push('');
    lines.push(
      `> ${dropped.length} in-scope rule(s) were dropped to stay inside a ${budgetTokens}-token budget: ` +
        dropped.map((r) => r.id).join(', ') +
        '. Read them in `docs/contracts/rules.json` before touching their scope.',
    );
  }

  return lines.join('\n');
}

function renderRule(r) {
  const enforce =
    r.enforcedBy === 'none'
      ? 'NO DETECTOR — this rule is obeyed only if you obey it'
      : r.enforcedBy.startsWith('gate:')
        ? `enforced by \`${r.enforcedBy.slice(5)}\``
        : r.enforcedBy;
  const tag = r.priority === 0 ? 'CORE' : r.priority === 1 ? 'MUST' : 'SHOULD';
  const out = [`- **[${tag}] ${r.id}** — ${r.text}`, `  _${enforce}; from ${r.source}._`];
  if (r.why) out.push(`  _Why: ${r.why}_`);
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function selfTest() {
  const cases = [
    ['library/**', 'library/foo/index.html', true],
    ['library/**', 'blog/foo/index.html', false],
    ['**/*.html', 'es/library/a/index.html', true],
    ['**/*.html', 'data/x.json', false],
    ['scripts/check-*.mjs', 'scripts/check-all.mjs', true],
    ['scripts/check-*.mjs', 'scripts/lib/check-x.mjs', false],
    ['blog/cost-index-week-*/**', 'blog/cost-index-week-2026-08-01/index.html', true],
    ['data/cost-index*.json', 'data/cost-index-drivers.json', true],
    ['**/audio.{en,es}.json', 'library/a/audio.es.json', true],
    ['**/audio.{en,es}.json', 'library/a/audio.fr.json', false],
    ['**', 'anything/at/all.txt', true],
    ['apps/api/**', 'apps/web/x.ts', false],
  ];
  let bad = 0;
  for (const [g, p, want] of cases) {
    const got = matchGlob(g, p);
    if (got !== want) {
      console.error(`  FAIL  matchGlob(${JSON.stringify(g)}, ${JSON.stringify(p)}) = ${got}, want ${want}`);
      bad++;
    }
  }
  // normalisePath
  const nCases = [
    ['/home/user/potentially-profitable/library/a/index.html', 'library/a/index.html'],
    ['./blog/b/index.html', 'blog/b/index.html'],
    ['/home/user/Muntin-Invoice-Decoder/apps/api/src/x.ts', 'apps/api/src/x.ts'],
  ];
  for (const [inp, want] of nCases) {
    const got = normalisePath(inp);
    if (got !== want) {
      console.error(`  FAIL  normalisePath(${inp}) = ${got}, want ${want}`);
      bad++;
    }
  }
  // Selection: a data-only task must not receive the article-figure rules.
  const reg = loadRules();
  const ids = rulesFor(['data/cost-index-drivers.json'], { registry: reg }).map((r) => r.id);
  if (ids.includes('SF-ARTICLE-FIGURES')) {
    console.error('  FAIL  a data/ task received SF-ARTICLE-FIGURES');
    bad++;
  }
  const coreIds = rulesFor([], { registry: reg }).map((r) => r.id);
  if (coreIds.length === 0) {
    console.error('  FAIL  empty path list returned no core rules');
    bad++;
  }
  if (coreIds.length > CORE_MAX) {
    console.error(`  FAIL  ${coreIds.length} core rules > CORE_MAX ${CORE_MAX}`);
    bad++;
  }
  console.log(bad === 0 ? `contract.mjs self-test: OK (${cases.length + nCases.length + 3} assertions)` : `contract.mjs self-test: ${bad} FAILURES`);
  return bad;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) {
    process.exit(selfTest() === 0 ? 0 : 1);
  } else if (argv.includes('--json')) {
    const paths = argv.filter((a) => !a.startsWith('--'));
    console.log(JSON.stringify(rulesFor(paths), null, 2));
  } else if (argv.includes('--core')) {
    console.log(contractFor([]));
  } else {
    console.log(contractFor(argv.filter((a) => !a.startsWith('--'))));
  }
}
