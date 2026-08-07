#!/usr/bin/env node
/**
 * build-prior-decisions.mjs — the prior-decision ledger, status MEASURED not asserted.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * There are 2,723 lines across 16 planning documents in this repo and the site still
 * looks the same. The 2026-08-07 company audit measured why: prior audits close at 26%,
 * and ZERO closures in company history came from anyone working an audit's list. Prose
 * plans go stale because nothing can consume them. This repo's working architecture is
 * manifest -> injector -> gate; artifacts written as DATA get built on, documents die.
 *
 * So this is not another document. It is a REGISTRY plus a PROBE ENGINE:
 *
 *   docs/handoff/bones/prior-decisions-registry.json   the harvested decisions + probes
 *   scripts/build-prior-decisions.mjs                  runs the probes against the repos
 *   docs/handoff/bones/prior-decisions.json            the emitted ledger (status computed)
 *   docs/handoff/bones/prior-decisions-summary.json    the roll-up
 *
 * The registry records WHAT was decided, WHERE (file:line) and WHEN. It never records
 * whether the decision shipped. Status is derived every run by executing that decision's
 * probes against the live working tree of both repos. A decision that quietly ships next
 * month flips from `never` to `shipped` on the next run with no human edit; a decision
 * that regresses flips back. That is the property a prose plan cannot have.
 *
 * ROOT-LIST DISCIPLINE. `files` probes walk a declared root and carry the explicit SKIP
 * list below, where every entry says why it is not reader-facing. Narrow scope is fine
 * when it is the subject; silent scope is not. (Learned three times on 2026-07-28.)
 *
 * DETERMINISM. No clock, no network, no npm. Keys are sorted, directory reads are sorted,
 * `git log -S` probes are pathspec-bounded (unbounded ones take minutes on this history).
 * Two runs against the same tree produce byte-identical output, which is what makes
 * `--check` meaningful.
 *
 * DO NOT WIRE THIS INTO check-all.mjs. `--check` here does not assert that the site is
 * correct; it asserts that the emitted ledger matches what the probes currently observe.
 * The ledger is SUPPOSED to move when the repo moves — wiring it into the deploy would
 * turn "someone finally shipped BP-DARK" into a red deploy. Re-run it by hand at the top
 * of a planning session and commit the diff; the diff is the report.
 *
 * Usage:
 *   node scripts/build-prior-decisions.mjs            # write the ledger + summary
 *   node scripts/build-prior-decisions.mjs --check    # exit 1 if the output would change
 *   node scripts/build-prior-decisions.mjs --report   # print the matrix to stdout
 *   node scripts/build-prior-decisions.mjs --self-test # exercise the probe engine
 *
 * Exit codes:
 *   0 — output written / up to date / self-test passed
 *   1 — --check found drift, or a probe was malformed, or the self-test failed
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

/** The two repos a probe may address. `product` is optional — absent means its probes report `unmeasurable`. */
const REPOS = {
  storefront: REPO,
  product: path.resolve(REPO, '..', 'Muntin-Invoice-Decoder'),
};

const REGISTRY = 'docs/handoff/bones/prior-decisions-registry.json';
const OUT_LEDGER = 'docs/handoff/bones/prior-decisions.json';
const OUT_SUMMARY = 'docs/handoff/bones/prior-decisions-summary.json';

/**
 * Directories a `files` probe never walks. Every entry states why it is not
 * reader-facing prose or authored source. This list is the honest denominator:
 * anything not here IS walked.
 */
const SKIP = {
  '.git': 'VCS internals — not authored content',
  docs: 'internal editorial/handoff/strategy prose — excluded from the deploy tar, never served, and it contains the very plan text these probes are testing the SITE against (a probe scanning it would find its own registry). Probes that mean to read a doc declare docs/<path> as their explicit root, which starts the walk below this guard.',
  '.wrangler': 'local Cloudflare build cache — regenerated, never edited',
  node_modules: 'vendored third-party dependencies — not ours, not reader-facing',
  dist: 'deploy tar staging — a copy of pages already walked at their source path',
  '.venv': 'python virtualenv — tooling, never served',
  __pycache__: 'python bytecode — not authored',
  '.pnpm-store': 'package cache — not authored',
  '.next': 'Next.js build output (product repo) — regenerated from source already walked',
  '.open-next': 'OpenNext build output (product repo) — regenerated',
  'test-results': 'Playwright run artifacts — ephemeral',
  'playwright-report': 'Playwright HTML report — ephemeral',
  coverage: 'test coverage output — ephemeral',
};

const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const reportMode = args.includes('--report');
const selfTest = args.includes('--self-test');

/* ------------------------------------------------------------------ helpers */

const readText = (repo, rel) => fs.readFileSync(path.join(REPOS[repo], rel), 'utf8');
const exists = (repo, rel) => fs.existsSync(path.join(REPOS[repo], rel));
const repoPresent = (repo) => Boolean(REPOS[repo]) && fs.existsSync(REPOS[repo]);

/** Count regex occurrences (not matching lines) in a string. */
function countMatches(text, pattern, flags) {
  const re = new RegExp(pattern, (flags || '') + (String(flags || '').includes('g') ? '' : 'g'));
  let n = 0;
  // eslint-disable-next-line no-unused-vars
  for (const _m of text.matchAll(re)) n += 1;
  return n;
}

/** Sorted recursive walk honouring SKIP. Returns repo-relative paths. */
function walk(rootAbs, exts, acc = [], base = rootAbs) {
  let entries;
  try {
    entries = fs.readdirSync(rootAbs, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (Object.prototype.hasOwnProperty.call(SKIP, e.name)) continue;
    const abs = path.join(rootAbs, e.name);
    if (e.isDirectory()) walk(abs, exts, acc, base);
    else if (!exts || exts.some((x) => e.name.endsWith(x))) acc.push(abs);
  }
  return acc;
}

/** Resolve a dotted pointer against a parsed JSON value. Supports `a.b.0.c`. */
function pointer(obj, ptr) {
  if (!ptr) return obj;
  let cur = obj;
  for (const seg of String(ptr).split('.')) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
}

/** Evaluate an `expect` clause against an observed value. Returns {ok, why}. */
function evaluate(observed, expect) {
  if (!expect || typeof expect !== 'object') return { ok: false, why: 'no expect clause' };
  const keys = Object.keys(expect).sort();
  for (const k of keys) {
    const want = expect[k];
    switch (k) {
      case 'eq':
        if (observed !== want) return { ok: false, why: `${JSON.stringify(observed)} != ${JSON.stringify(want)}` };
        break;
      case 'neq':
        if (observed === want) return { ok: false, why: `${JSON.stringify(observed)} == ${JSON.stringify(want)}` };
        break;
      case 'min':
        if (!(Number(observed) >= want)) return { ok: false, why: `${observed} < min ${want}` };
        break;
      case 'max':
        if (!(Number(observed) <= want)) return { ok: false, why: `${observed} > max ${want}` };
        break;
      case 'isNull':
        if ((observed === null) !== Boolean(want)) return { ok: false, why: `isNull expected ${want}, got ${JSON.stringify(observed)}` };
        break;
      case 'matches':
        if (!new RegExp(want).test(String(observed))) return { ok: false, why: `${JSON.stringify(observed)} !~ /${want}/` };
        break;
      default:
        return { ok: false, why: `unknown expect operator "${k}"` };
    }
  }
  return { ok: true, why: '' };
}

/* -------------------------------------------------------------- probe types */

/**
 * Every probe returns { ok, observed, note }. `ok === null` means UNMEASURABLE
 * (the repo or file the probe addresses is not present in this container) — an
 * unmeasurable probe never counts as a pass and never counts as a fail; it is
 * reported so the gap is visible rather than silently scored as `never`.
 */
const PROBES = {
  /** { repo, path, expect: 'present' | 'absent' } */
  path(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    const there = exists(p.repo, p.path);
    const observed = there ? 'present' : 'absent';
    return { ok: observed === p.expect, observed, note: `${p.repo}:${p.path}` };
  },

  /** { repo, path, pattern, flags?, expect } — regex occurrence count in ONE file */
  count(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    if (!exists(p.repo, p.path)) return { ok: null, observed: 'file-absent', note: `${p.repo}:${p.path} missing` };
    const n = countMatches(readText(p.repo, p.path), p.pattern, p.flags);
    const r = evaluate(n, p.expect);
    return { ok: r.ok, observed: n, note: `${n} match(es) of /${p.pattern}/ in ${p.path}${r.ok ? '' : ' — ' + r.why}` };
  },

  /** { repo, root, ext?, pattern, flags?, expect } — number of FILES under root that match */
  files(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    const rootAbs = path.join(REPOS[p.repo], p.root);
    if (!fs.existsSync(rootAbs)) return { ok: null, observed: 'root-absent', note: `${p.repo}:${p.root} missing` };
    const re = new RegExp(p.pattern, p.flags || '');
    let n = 0;
    for (const abs of walk(rootAbs, p.ext)) {
      let t;
      try {
        t = fs.readFileSync(abs, 'utf8');
      } catch {
        continue;
      }
      if (re.test(t)) n += 1;
    }
    const r = evaluate(n, p.expect);
    return { ok: r.ok, observed: n, note: `${n} file(s) under ${p.root} match /${p.pattern}/${r.ok ? '' : ' — ' + r.why}` };
  },

  /** { repo, root, requireFile?, expect } — count of immediate subdirectories */
  dirs(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    const rootAbs = path.join(REPOS[p.repo], p.root);
    if (!fs.existsSync(rootAbs)) return { ok: null, observed: 'root-absent', note: `${p.repo}:${p.root} missing` };
    let n = 0;
    for (const e of fs.readdirSync(rootAbs, { withFileTypes: true }).slice().sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (!e.isDirectory() || Object.prototype.hasOwnProperty.call(SKIP, e.name)) continue;
      if (p.requireFile && !fs.existsSync(path.join(rootAbs, e.name, p.requireFile))) continue;
      n += 1;
    }
    const r = evaluate(n, p.expect);
    return { ok: r.ok, observed: n, note: `${n} dir(s) under ${p.root}${r.ok ? '' : ' — ' + r.why}` };
  },

  /** { repo, path, pointer, mode?: 'value'|'len'|'keys', expect } */
  json(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    if (!exists(p.repo, p.path)) return { ok: null, observed: 'file-absent', note: `${p.repo}:${p.path} missing` };
    let parsed;
    try {
      parsed = JSON.parse(readText(p.repo, p.path));
    } catch (err) {
      return { ok: false, observed: 'parse-error', note: `${p.path}: ${err.message}` };
    }
    const raw = pointer(parsed, p.pointer);
    let observed = raw;
    if (p.mode === 'len') observed = raw == null ? 0 : Array.isArray(raw) ? raw.length : Object.keys(raw).length;
    if (p.mode === 'keys') observed = raw == null ? 0 : Object.keys(raw).length;
    const r = evaluate(observed, p.expect);
    return { ok: r.ok, observed, note: `${p.path}#${p.pointer || '/'} = ${JSON.stringify(observed)}${r.ok ? '' : ' — ' + r.why}` };
  },

  /**
   * { repo, term, paths: [...], expect } — commits whose diff added/removed `term`.
   * `paths` is REQUIRED and non-empty: an unbounded `git log -S` on this history
   * takes minutes and would make the generator unrunnable.
   */
  git(p) {
    if (!repoPresent(p.repo)) return { ok: null, observed: 'repo-absent', note: `${p.repo} repo not in this container` };
    if (!Array.isArray(p.paths) || p.paths.length === 0) {
      return { ok: false, observed: 'malformed', note: 'git probe requires a non-empty `paths` pathspec' };
    }
    let out;
    try {
      out = execFileSync('git', ['log', '-S', p.term, '--oneline', '--', ...p.paths], {
        cwd: REPOS[p.repo],
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch (err) {
      return { ok: null, observed: 'git-unavailable', note: String(err.message).slice(0, 120) };
    }
    const n = out.split('\n').filter(Boolean).length;
    const r = evaluate(n, p.expect);
    return { ok: r.ok, observed: n, note: `${n} commit(s) touched "${p.term}" under ${p.paths.join(' ')}${r.ok ? '' : ' — ' + r.why}` };
  },
};

/* ------------------------------------------------------------ status derivation */

function runDecision(d, byId) {
  const probeResults = (d.probes || []).map((probe) => {
    const fn = PROBES[probe.type];
    const base = { id: probe.id, type: probe.type, role: probe.role || 'ship' };
    if (!fn) return { ...base, ok: false, observed: 'unknown-probe-type', note: `no probe type "${probe.type}"` };
    let r;
    try {
      r = fn({ repo: 'storefront', ...probe });
    } catch (err) {
      r = { ok: false, observed: 'error', note: String(err.message).slice(0, 160) };
    }
    return { ...base, ...r };
  });

  const ship = probeResults.filter((r) => r.role === 'ship');
  const contra = probeResults.filter((r) => r.role === 'contradiction');
  const measurable = ship.filter((r) => r.ok !== null);
  const passed = measurable.filter((r) => r.ok === true);

  let status;
  let how;
  const supersededBy = d.supersededBy || null;
  const supersessionResolves = supersededBy ? Boolean(byId[supersededBy]) : false;

  if (supersededBy && supersessionResolves) {
    status = 'superseded';
    how = `registry records supersession by ${supersededBy}; ${passed.length}/${measurable.length} ship-probes still pass`;
  } else if (contra.some((r) => r.ok === true)) {
    status = 'contradicted';
    how = contra
      .filter((r) => r.ok === true)
      .map((r) => r.note)
      .join(' · ');
  } else if (measurable.length === 0) {
    status = 'never';
    how = 'no measurable probe in this container: ' + probeResults.map((r) => r.note).join(' · ');
  } else if (passed.length === measurable.length) {
    status = 'shipped';
    how = passed.map((r) => r.note).join(' · ');
  } else if (passed.length === 0) {
    status = 'never';
    how = measurable.map((r) => r.note).join(' · ');
  } else {
    status = 'partial';
    how = measurable.map((r) => `${r.ok ? 'PASS' : 'FAIL'} ${r.note}`).join(' · ');
  }

  return {
    id: d.id,
    source: d.source,
    decision: d.decision,
    date: d.date,
    status,
    evidence: how,
    supersededBy,
    // Extras beyond the requested shape — additive, and each one earns its bytes.
    theme: d.theme,
    principle: d.principle || false,
    encodedIn: d.encodedIn || null,
    conflictsWith: d.conflictsWith || [],
    probes: probeResults.map((r) => ({ id: r.id, type: r.type, role: r.role, ok: r.ok, observed: r.observed, note: r.note })),
  };
}

/* ---------------------------------------------------------------- self-test */

function runSelfTest() {
  const fails = [];
  const t = (name, cond, detail) => {
    if (!cond) fails.push(`${name}${detail ? ' — ' + detail : ''}`);
  };

  t('countMatches counts occurrences not lines', countMatches('a a a\na', 'a') === 4);
  t('evaluate eq', evaluate(3, { eq: 3 }).ok && !evaluate(3, { eq: 4 }).ok);
  t('evaluate min/max', evaluate(5, { min: 1, max: 9 }).ok && !evaluate(5, { min: 6 }).ok);
  t('evaluate isNull', evaluate(null, { isNull: true }).ok && !evaluate(0, { isNull: true }).ok);
  t('evaluate rejects unknown operator', !evaluate(1, { wat: 1 }).ok);
  t('pointer walks dots', pointer({ a: { b: [{ c: 7 }] } }, 'a.b.0.c') === 7);
  t('pointer tolerates missing', pointer({}, 'a.b.c') === undefined);

  // The probe engine against this repo's own known-true facts.
  const selfPresent = PROBES.path({ repo: 'storefront', path: 'scripts/build-prior-decisions.mjs', expect: 'present' });
  t('path probe finds itself', selfPresent.ok === true, selfPresent.note);
  const nope = PROBES.path({ repo: 'storefront', path: 'scripts/definitely-not-a-real-script.mjs', expect: 'absent' });
  t('path probe absent works', nope.ok === true, nope.note);
  const badRepo = PROBES.path({ repo: 'nowhere', path: 'x', expect: 'present' });
  t('unknown repo is unmeasurable not false', badRepo.ok === null, badRepo.note);
  const gitBad = PROBES.git({ repo: 'storefront', term: 'x', paths: [], expect: { min: 0 } });
  t('git probe refuses an unbounded pathspec', gitBad.ok === false, gitBad.note);

  // Status derivation.
  const byId = { 'X-1': true };
  const mk = (probes, supersededBy) => runDecision({ id: 't', source: 's', decision: 'd', date: '2026-01-01', probes, supersededBy }, byId);
  t(
    'all-pass -> shipped',
    mk([{ id: 'p', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' }]).status === 'shipped'
  );
  t(
    'none-pass -> never',
    mk([{ id: 'p', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'absent' }]).status === 'never'
  );
  t(
    'mixed -> partial',
    mk([
      { id: 'a', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' },
      { id: 'b', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'absent' },
    ]).status === 'partial'
  );
  t(
    'contradiction probe wins',
    mk([
      { id: 'a', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' },
      { id: 'c', role: 'contradiction', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' },
    ]).status === 'contradicted'
  );
  t(
    'supersession wins over probes',
    mk([{ id: 'a', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' }], 'X-1').status === 'superseded'
  );
  t(
    'dangling supersededBy does NOT silence the probes',
    mk([{ id: 'a', type: 'path', path: 'scripts/build-prior-decisions.mjs', expect: 'present' }], 'NOPE').status === 'shipped'
  );

  // SKIP list discipline: every entry must carry a stated reason.
  for (const [k, v] of Object.entries(SKIP)) t(`SKIP["${k}"] states a reason`, typeof v === 'string' && v.length > 12);

  if (fails.length) {
    console.error('SELF-TEST FAILED:');
    for (const f of fails) console.error('  ✗ ' + f);
    process.exit(1);
  }
  console.log(`Self-test OK — ${16 + Object.keys(SKIP).length} assertions.`);
  process.exit(0);
}

if (selfTest) runSelfTest();

/* -------------------------------------------------------------------- main */

if (!exists('storefront', REGISTRY)) {
  console.error(`Missing registry: ${REGISTRY}`);
  process.exit(1);
}
const registry = JSON.parse(readText('storefront', REGISTRY));
const decisions = registry.decisions || [];

// Duplicate-id guard: a registry that can hold two rows under one id cannot be joined on.
const seen = new Set();
for (const d of decisions) {
  if (seen.has(d.id)) {
    console.error(`Duplicate decision id in registry: ${d.id}`);
    process.exit(1);
  }
  seen.add(d.id);
}

const byId = Object.fromEntries(decisions.map((d) => [d.id, d]));
const ledger = decisions
  .slice()
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  .map((d) => runDecision(d, byId));

// Dangling references are a registry defect, not a finding — surface them loudly.
const danglers = [];
for (const d of decisions) {
  if (d.supersededBy && !byId[d.supersededBy]) danglers.push(`${d.id} -> supersededBy ${d.supersededBy}`);
  for (const c of d.conflictsWith || []) if (!byId[c]) danglers.push(`${d.id} -> conflictsWith ${c}`);
}

const byStatus = {};
for (const r of ledger) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
const byTheme = {};
for (const r of ledger) {
  const t = (byTheme[r.theme || 'unfiled'] ||= { total: 0 });
  t.total += 1;
  t[r.status] = (t[r.status] || 0) + 1;
}
const unmeasurableProbes = ledger.flatMap((r) => r.probes.filter((p) => p.ok === null).map((p) => `${r.id}/${p.id}: ${p.note}`));

const conflicts = [];
for (const d of decisions) {
  for (const c of d.conflictsWith || []) {
    if (!byId[c]) continue;
    // Dedup on the sorted key, but PRINT in a/b order so the statuses line up
    // with the ids beside them — a sorted label next to unsorted statuses is
    // exactly the kind of quiet mismatch this ledger exists to stop shipping.
    const key = [d.id, c].sort().join('|');
    if (!conflicts.some((x) => x.key === key)) {
      conflicts.push({
        key,
        pair: `${d.id} ↔ ${c}`,
        a: d.id,
        aStatus: ledger.find((r) => r.id === d.id).status,
        b: c,
        bStatus: ledger.find((r) => r.id === c).status,
        note: d.conflictNote || byId[c].conflictNote || '',
      });
    }
  }
}

const principles = ledger
  .filter((r) => r.principle)
  .map((r) => ({
    id: r.id,
    decision: r.decision,
    encodedIn: r.encodedIn,
    enforcement: r.encodedIn ? 'gate' : 'prose-only',
    status: r.status,
  }));

const summary = {
  _doc:
    'Roll-up of docs/handoff/bones/prior-decisions.json. Regenerate both with ' +
    '`node scripts/build-prior-decisions.mjs`. Status is MEASURED from the working tree ' +
    'every run — never edit these files by hand; edit the registry and re-run.',
  registryVersion: registry.version || null,
  sourceDocuments: registry.sources || [],
  totals: { decisions: ledger.length, byStatus, shipRate: ledger.length ? Number((( byStatus.shipped || 0) / ledger.length).toFixed(4)) : 0 },
  byTheme,
  conflicts,
  principles,
  registryDefects: { danglingReferences: danglers },
  unmeasurableProbes,
};

const ledgerText = JSON.stringify(ledger, null, 2) + '\n';
const summaryText = JSON.stringify(summary, null, 2) + '\n';

if (reportMode) {
  const w = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(`\nPrior decisions — ${ledger.length} rows\n`);
  for (const r of ledger) console.log(`${w(r.id, 12)} ${w(r.status, 13)} ${w(r.theme || '', 22)} ${r.decision.slice(0, 78)}`);
  console.log('\nBy status: ' + JSON.stringify(byStatus));
  console.log('Conflicts: ' + conflicts.length + ' · Principles: ' + principles.length);
  if (danglers.length) console.log('Registry defects: ' + danglers.join(', '));
}

const cur = (rel) => (exists('storefront', rel) ? readText('storefront', rel) : null);

if (checkMode) {
  const drift = [];
  if (cur(OUT_LEDGER) !== ledgerText) drift.push(OUT_LEDGER);
  if (cur(OUT_SUMMARY) !== summaryText) drift.push(OUT_SUMMARY);
  if (drift.length) {
    console.error(`✗ prior-decisions: would update ${drift.length} file(s): ${drift.join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ prior-decisions: ${ledger.length} decisions, up to date.`);
  process.exit(0);
}

fs.mkdirSync(path.join(REPO, path.dirname(OUT_LEDGER)), { recursive: true });
fs.writeFileSync(path.join(REPO, OUT_LEDGER), ledgerText);
fs.writeFileSync(path.join(REPO, OUT_SUMMARY), summaryText);
console.log(
  `Wrote ${OUT_LEDGER} (${ledger.length} decisions) and ${OUT_SUMMARY}. ` +
    `Status: ${Object.entries(byStatus).sort().map(([k, v]) => `${k} ${v}`).join(', ')}.`
);
if (danglers.length) console.log(`Registry defects: ${danglers.join(', ')}`);
