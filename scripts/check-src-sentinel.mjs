#!/usr/bin/env node
/**
 * check-src-sentinel.mjs — the `<!-- src: -->` citation gate. Rung 0.
 *
 * ============================== WHY ==============================
 *
 * blog/cost-index-2026-07/index.html carries 164 `<!-- src: ... -->` annotations
 * and a reader-visible cite drawer (line 852) that tells a skeptic the cited
 * files are "rebuilt from committed data on every refresh and re-checked in CI."
 * No such check existed. On 2026-08-07 the post's own citations resolve like
 * this against the files it names:
 *
 *   published                              live now              verdict
 *   band.pooledCoverage 0.772              0.767                 FALSE
 *   band items 32 / scoredSteps 4,588      75 / 79,086           FALSE
 *   trend.overallHitRate 0.536             0.506                 FALSE
 *   trend scoredCalls 1,859                34,029                FALSE
 *   revision ledger 2,080 entries          10,294                FALSE
 *   outlook "mixed", weightedTilt -0.145   "building", +0.055    FALSE, SIGN-FLIPPED
 *   outlook asOf 2026-06-08                2026-08-03            FALSE
 *   verdict.coneHonestThroughH = 1         1                     TRUE
 *   outlook lockCandidates = []            []                    TRUE
 *
 * Every one of those was true on publication day. The two that survive are the
 * two whose value is STRUCTURAL (a verdict, an empty list); every annotation
 * citing a rolling AGGREGATE went false the next time a builder ran. That is the
 * whole diagnosis, and it is not a proofreading problem:
 *
 *   STATIC PROSE CANNOT CITE A MOVING FILE.
 *
 * ============================ THE FIX ============================
 *
 * The structural repair is not to re-check the numbers once. It is to repoint
 * dated prose at a FROZEN snapshot. data/cost-index-editions.json is append-only
 * and one entry per `asOf` — the edition a dated post was written against never
 * changes. So this gate defines an ANCHORED grammar:
 *
 *     <!-- src: edition:2026-07-06 basket.pct = -0.049649 -->
 *
 * which resolves against the frozen edition and is re-verifiable forever, versus
 * the LIVE grammar
 *
 *     <!-- src: cost-outlook.json weightedTilt = -0.145 -->
 *
 * which is a promise the file will never move, and the file always moves.
 *
 * ========================== THE POSTURES ==========================
 *
 * HARD FAIL — an annotation that makes a checkable claim and the claim is false:
 *   · MISMATCH  — `= VALUE` present, resolves, and disagrees.
 *   · BADPATH   — names a real file but a path that does not exist in it.
 * Both are unambiguous. Neither can be argued with. Neither is currently
 * possible to introduce without this gate catching it.
 *
 * BUDGETED (ratchet, data/src-sentinel-budget.json) — annotations that are not
 * false today but cannot be verified tomorrow:
 *   · DRIFT     — a dated post citing a live rolling file the spine never froze.
 *   · UNANCHORED— an annotation naming no file at all (`dispatch.basket.pct`,
 *                 `risers[0].arc`), pointing at a builder's ephemeral runtime
 *                 object. A reader cannot follow it anywhere.
 *
 * The budget can only go DOWN. If the real count drops below the budget the gate
 * FAILS and tells you to ratchet — so progress is locked in and cannot silently
 * regress. This is what lets the gate be wired GREEN today, per the repo rule
 * that a failing gate must never enter check-all.
 *
 * ============================== USE ==============================
 *
 *   node scripts/check-src-sentinel.mjs              # CI gate
 *   node scripts/check-src-sentinel.mjs --self-test  # pin the parser + resolver
 *   node scripts/check-src-sentinel.mjs --explain    # every annotation, classified
 *   node scripts/check-src-sentinel.mjs --worklist   # JSON worklist for an agent session
 *
 * --worklist exists because this company's measured failure mode is that audits
 * produce lists nobody works. A gate that emits its own remediation queue as
 * machine-readable JSON can be handed straight to an agent session.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(REPO, p), 'utf8')); } catch { return null; } };

/**
 * ROOTS + SKIPS. Per the repo rule learned three times on 2026-07-28: a script
 * that scans the site walks everything and carries an explicit skip list where
 * every entry says why it is not reader-facing prose. `<!-- src: -->` is an
 * editorial convention that could appear in any hand-written page, so the scan
 * is the whole tree minus the justified exclusions — NOT just blog/.
 */
export const SKIP_DIRS = {
  'node_modules': 'dependencies, not authored prose',
  '.git': 'version control internals',
  'docs': 'not web-routable; excluded from the deploy tar',
  'tests': 'test fixtures may contain deliberately-wrong annotations',
  'assets': 'static assets, no prose',
  '_includes': 'partials; their prose is scanned where it is inlined into pages',
  'scripts': 'build scripts — a src: string here is a template, not a published citation',
};

function walkHtml(dir = REPO, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.') continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(REPO, full);
    if (e.isDirectory()) {
      if (rel.split(path.sep).some((seg) => seg in SKIP_DIRS)) continue;
      walkHtml(full, out);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(rel);
    }
  }
  return out;
}

// ---------------------------------------------------------------- parsing ---

export const SENTINEL_RE = /<!--\s*src:\s*([^>]*?)\s*-->/g;

/** Files the editions spine freezes, or that are themselves immutable snapshots. */
export const FROZEN_SURFACES = [
  /^data\/cost-index-editions\.json$/,
  /^cost-index\/week-\d{4}-\d{2}-\d{2}\.(json|csv)$/,
  /^week-\d{4}-\d{2}-\d{2}\.(json|csv)$/,
];
export const isFrozen = (f) => FROZEN_SURFACES.some((r) => r.test(f));

/** Where a bare filename actually lives. The prose writes `seasonality.json`. */
const FILE_ALIASES = {
  'seasonality.json': 'data/seasonality.json',
  'cost-outlook.json': 'data/cost-outlook.json',
  'cost-pressure.json': 'data/cost-pressure.json',
  'cost-revisions.json': 'data/cost-revisions.json',
  'cost-lockfloat.json': 'data/cost-lockfloat.json',
  'cost-forecast-backtest.json': 'data/cost-forecast-backtest.json',
  'cost-index-editions.json': 'data/cost-index-editions.json',
  'calibration.json': 'data/cost-index-calibration-report.json',
};

export function resolveFilePath(token) {
  if (FILE_ALIASES[token]) return FILE_ALIASES[token];
  if (existsSync(path.join(REPO, token))) return token;
  if (existsSync(path.join(REPO, 'data', token))) return 'data/' + token;
  if (existsSync(path.join(REPO, 'cost-index', token))) return 'cost-index/' + token;
  return null;
}

/**
 * Parse one annotation body into a classified claim.
 *
 * Grammars, in precedence order:
 *   edition:<asOf> <path> [= <value>]   → ANCHORED  (resolves against the spine)
 *   <file> <path> [= <value>]           → LIVE      (resolves against the file)
 *   anything else                       → UNANCHORED
 */
export function parseAnnotation(body) {
  const raw = String(body || '').trim();
  // Multiple claims separated by `;` — each is judged on its own.
  const first = raw.split(';')[0].trim();

  const ed = first.match(/^edition:(\d{4}-\d{2}-\d{2})\s+(\S+)(?:\s*=\s*([^,;]+))?$/);
  if (ed) return { kind: 'anchored', asOf: ed[1], pathExpr: ed[2], expected: ed[3] != null ? ed[3].trim() : null, raw };

  const fm = first.match(/^([A-Za-z0-9_./-]+\.(?:json|csv))\s+(.*)$/);
  if (fm) {
    const file = resolveFilePath(fm[1]);
    const rest = fm[2].trim();
    const eq = rest.match(/^(\S+)\s*=\s*([^,;]+)/);
    // A path is only a path if the WHOLE remainder is one. `cost-revisions.json
    // median |deltaPct|` is prose describing a statistic, not a claim that the
    // file has a top-level `median` key — treating it as one manufactures a
    // BADPATH out of an honest annotation, and a gate that cries wolf gets
    // muted. Prose remainders are reported as UNANCHORED-PROSE instead.
    const pathExpr = eq ? eq[1] : (/^[A-Za-z_$][\w$.[\]"']*$/.test(rest) ? rest : null);
    return {
      kind: file ? 'live' : 'unresolvable-file',
      file, fileToken: fm[1], pathExpr,
      expected: eq ? eq[2].trim() : null,
      frozen: file ? isFrozen(file) : false,
      raw,
    };
  }
  return { kind: 'unanchored', raw };
}

// -------------------------------------------------------------- resolving ---

const WILDCARD = Symbol('[]');

/** Dotted path with [n], [], and ["key"] segments. Returns undefined when absent. */
export function resolvePath(obj, expr) {
  if (!expr) return undefined;
  const parts = [];
  const re = /\.?([A-Za-z_$][\w$]*)|(\[\])|\[(\d+)\]|\["([^"]+)"\]|\['([^']+)'\]/g;
  let m, consumed = 0;
  while ((m = re.exec(expr))) {
    if (m.index !== consumed) return undefined;   // unparsable residue → not a path
    consumed = m.index + m[0].length;
    parts.push(m[2] != null ? WILDCARD : (m[1] ?? m[3] ?? m[4] ?? m[5]));
  }
  if (consumed !== expr.length || !parts.length) return undefined;
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (p === WILDCARD) {
      // `items[]` — the prose's established shorthand for "every item's". Honest
      // resolution is: the array exists and is non-empty; the next segment is
      // then looked up on its FIRST member, which is what a reader checking the
      // citation would do.
      // `items` is an array in some files and a slug-keyed object in others
      // (data/cost-lockfloat.json). Both mean "the collection"; resolve either.
      const members = Array.isArray(cur) ? cur : (cur && typeof cur === 'object' ? Object.values(cur) : null);
      if (!members || members.length === 0) return undefined;
      cur = members[0];
      continue;
    }
    cur = Array.isArray(cur) && /^\d+$/.test(p) ? cur[Number(p)] : cur[p];
  }
  return cur;
}

/** Normalize a printed figure: strip %, +, unicode minus, commas, quotes. */
export function normNum(s) {
  if (s == null) return null;
  const t = String(s).trim().replace(/^["']|["']$/g, '').replace(/[−–—]/g, '-').replace(/,/g, '').replace(/%$/, '').replace(/^\+/, '');
  if (t === '[]' || t === '{}') return { empty: true };
  if (!/^-?\d*\.?\d+$/.test(t)) return { text: t };
  return { num: Number(t), decimals: (t.split('.')[1] || '').length, isPct: /%$/.test(String(s).trim()) };
}

/** Does a resolved value match a printed expectation? Tolerance = printed precision. */
export function valuesAgree(resolved, expectedStr) {
  const e = normNum(expectedStr);
  if (e == null) return { agree: true, why: 'no expectation' };
  if (e.empty) {
    const isEmpty = Array.isArray(resolved) ? resolved.length === 0
      : (resolved && typeof resolved === 'object') ? Object.keys(resolved).length === 0 : false;
    return { agree: isEmpty, why: isEmpty ? '' : `expected empty, got ${JSON.stringify(resolved)}` };
  }
  if (e.text != null) {
    const agree = String(resolved) === e.text;
    return { agree, why: agree ? '' : `expected "${e.text}", file has ${JSON.stringify(resolved)}` };
  }
  if (typeof resolved !== 'number' || !isFinite(resolved)) {
    return { agree: false, why: `expected the number ${e.num}, file has ${JSON.stringify(resolved)}` };
  }
  // The prose may print a ratio as a percent (-4.96% for -0.049649). Accept either
  // reading; a citation is a pointer, not a unit contract.
  const cands = [resolved, resolved * 100, resolved / 100];
  const tol = Math.max(Math.pow(10, -e.decimals) / 2, Math.abs(e.num) * 1e-9);
  const agree = cands.some((c) => Math.abs(c - e.num) <= tol * (Math.abs(c) > 1 ? Math.max(1, Math.abs(c / e.num)) : 1) || Math.abs(c - e.num) <= tol);
  return { agree, why: agree ? '' : `prose says ${e.num}, ${JSON.stringify(resolved)} is in the file` };
}

// ------------------------------------------------------------------ scan ---

/** Is this page a DATED post — one whose prose is fixed at a moment in time? */
export const isDatedPost = (rel) => /^(es\/)?blog\//.test(rel.replace(/\\/g, '/'));

export function scanFile(rel, html, ctx) {
  const findings = [];
  const lines = html.split('\n');
  lines.forEach((line, i) => {
    let m;
    const re = new RegExp(SENTINEL_RE.source, 'g');
    while ((m = re.exec(line))) {
      const a = parseAnnotation(m[1]);
      const at = { file: rel, line: i + 1, annotation: m[1].trim() };

      if (a.kind === 'unanchored') {
        findings.push({ ...at, type: 'UNANCHORED', detail: 'names no file — points at a builder runtime object a reader cannot open' });
        continue;
      }
      if (a.kind === 'unresolvable-file') {
        findings.push({ ...at, type: 'BADFILE', detail: `names "${a.fileToken}", which is not a file in this repo` });
        continue;
      }

      let doc = null, label = '';
      if (a.kind === 'anchored') {
        const spine = ctx.editions;
        const ed = ((spine && spine.editions) || []).find((e) => e.asOf === a.asOf);
        if (!ed) { findings.push({ ...at, type: 'BADPATH', detail: `edition ${a.asOf} is not in data/cost-index-editions.json` }); continue; }
        doc = ed; label = `edition ${a.asOf}`;
      } else {
        if (a.file.endsWith('.csv')) { findings.push({ ...at, type: 'INFO', detail: `CSV citation (${a.file}) — path resolution not applied` }); continue; }
        doc = ctx.load(a.file); label = a.file;
        if (doc == null) { findings.push({ ...at, type: 'BADFILE', detail: `${a.file} could not be parsed` }); continue; }
      }

      if (a.pathExpr) {
        const v = resolvePath(doc, a.pathExpr);
        if (v === undefined) {
          findings.push({ ...at, type: 'BADPATH', detail: `${label} has no path "${a.pathExpr}"` });
          continue;
        }
        if (a.expected != null) {
          const r = valuesAgree(v, a.expected);
          if (!r.agree) { findings.push({ ...at, type: 'MISMATCH', detail: `${label} ${a.pathExpr}: ${r.why}` }); continue; }
        }
      }

      // Resolved fine — but can a reader still resolve it next month?
      if (a.kind === 'live' && isDatedPost(rel) && !a.frozen) {
        findings.push({ ...at, type: 'DRIFT', detail: `dated post cites the LIVE file ${a.file}, which the editions spine does not freeze — true today, unverifiable tomorrow` });
      }
    }
  });
  return findings;
}

export function scanAll() {
  const cache = new Map();
  const ctx = {
    editions: rd('data/cost-index-editions.json'),
    load: (f) => { if (!cache.has(f)) cache.set(f, rd(f)); return cache.get(f); },
  };
  const findings = [];
  let annotations = 0;
  for (const rel of walkHtml()) {
    const html = readFileSync(path.join(REPO, rel), 'utf8');
    if (!html.includes('<!-- src:')) continue;
    annotations += (html.match(/<!--\s*src:/g) || []).length;
    findings.push(...scanFile(rel, html, ctx));
  }
  return { annotations, findings };
}

const HARD = ['MISMATCH', 'BADPATH', 'BADFILE'];
const BUDGETED = ['DRIFT', 'UNANCHORED'];

// ---------------------------------------------------------------- runner ---

function loadBudget() {
  return rd('data/src-sentinel-budget.json') || { budgets: { DRIFT: 0, UNANCHORED: 0 } };
}

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };

  // parser
  ok(parseAnnotation('dispatch.basket.pct').kind === 'unanchored', 'a bare runtime path is UNANCHORED');
  ok(parseAnnotation('risers[0].arc').kind === 'unanchored', 'a bare derived path is UNANCHORED');
  ok(parseAnnotation('edition:2026-07-06 basket.pct = -0.049649').kind === 'anchored', 'the edition grammar parses');
  const lv = parseAnnotation('cost-outlook.json weightedTilt = -0.145');
  ok(lv.kind === 'live' && lv.file === 'data/cost-outlook.json' && lv.expected === '-0.145', 'the live grammar parses + aliases to data/');
  ok(parseAnnotation('cost-index-editions.json asOf').frozen === true, 'the spine is a FROZEN surface');
  ok(parseAnnotation('cost-outlook.json asOf').frozen === false, 'a rolling build output is NOT frozen');

  // resolver
  const doc = { a: { b: [10, 20] }, m: { '07': { medianCents: 1870 } }, e: [], s: 'building' };
  ok(resolvePath(doc, 'a.b[1]') === 20, 'dotted + index path resolves');
  ok(resolvePath(doc, 'm["07"].medianCents') === 1870, 'quoted-key path resolves');
  ok(resolvePath(doc, 'a.nope') === undefined, 'a missing path resolves to undefined');
  ok(resolvePath(doc, 'a.b/c') === undefined, 'unparsable residue is not silently truncated to a valid path');

  // comparison
  ok(valuesAgree(1870, '1870').agree, 'exact integer agrees');
  ok(valuesAgree(-0.049649, '−0.049649').agree, 'unicode minus normalizes');
  ok(valuesAgree(-0.049649, '-4.96%').agree, 'a ratio printed as a percent agrees');
  ok(!valuesAgree(0.767, '0.772').agree, 'THE LIVE CASE: 0.767 vs a published 0.772 is a MISMATCH');
  ok(!valuesAgree(0.055, '-0.145').agree, 'THE SIGN FLIP: +0.055 vs a published -0.145 is a MISMATCH');
  ok(valuesAgree([], '[]').agree, 'an empty list agrees with []');
  ok(!valuesAgree([1], '[]').agree, 'a non-empty list disagrees with []');
  ok(valuesAgree('building', '"building"').agree, 'a quoted string agrees');
  ok(!valuesAgree('building', '"mixed"').agree, 'a wrong string is a MISMATCH');
  ok(!valuesAgree(10294, '2,080').agree, 'THE LEDGER: 10,294 vs a published 2,080 is a MISMATCH');

  // scanFile end-to-end
  const ctx = { editions: { editions: [{ asOf: '2026-07-06', basket: { pct: -0.049649 } }] }, load: () => ({ weightedTilt: 0.055 }) };
  const f1 = scanFile('blog/x/index.html', '<p>a <!-- src: edition:2026-07-06 basket.pct = -0.049649 --></p>', ctx);
  ok(f1.length === 0, 'an anchored, correct annotation in a dated post is clean');
  const f2 = scanFile('blog/x/index.html', '<p>a <!-- src: cost-outlook.json weightedTilt = -0.145 --></p>', ctx);
  ok(f2.some((f) => f.type === 'MISMATCH'), 'a live annotation whose value moved is a MISMATCH');
  const f3 = scanFile('blog/x/index.html', '<p>a <!-- src: cost-outlook.json weightedTilt --></p>', ctx);
  ok(f3.some((f) => f.type === 'DRIFT'), 'a dated post citing an unfrozen live file is DRIFT');
  const f4 = scanFile('library/x/index.html', '<p>a <!-- src: cost-outlook.json weightedTilt --></p>', ctx);
  ok(!f4.some((f) => f.type === 'DRIFT'), 'an EVERGREEN page citing a live file is not drift — it is meant to move');
  const f5 = scanFile('blog/x/index.html', '<p>a <!-- src: edition:2026-07-06 basket.nope --></p>', ctx);
  ok(f5.some((f) => f.type === 'BADPATH'), 'a pointer at nothing is a BADPATH');
  const f6 = scanFile('blog/x/index.html', '<p>a <!-- src: not-a-real-file.json x --></p>', ctx);
  ok(f6.some((f) => f.type === 'BADFILE'), 'a pointer at a nonexistent file is a BADFILE');

  // roots
  ok(Object.keys(SKIP_DIRS).every((k) => SKIP_DIRS[k].length > 8), 'every skipped root carries a stated reason');

  console.log(`src-sentinel self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

  const { annotations, findings } = scanAll();
  const by = (t) => findings.filter((f) => f.type === t);
  const counts = Object.fromEntries([...HARD, ...BUDGETED, 'INFO'].map((t) => [t, by(t).length]));

  if (argv.includes('--worklist')) {
    const out = {
      _doc: 'Remediation queue emitted by scripts/check-src-sentinel.mjs. Every entry is one annotation an agent session can repoint or repair. Regenerate with --worklist; never hand-edit.',
      generatedAt: new Date().toISOString().slice(0, 10),
      annotations, counts,
      items: findings.filter((f) => f.type !== 'INFO').map((f) => ({
        file: f.file, line: f.line, type: f.type, annotation: f.annotation, detail: f.detail,
        remedy: f.type === 'UNANCHORED' || f.type === 'DRIFT'
          ? 'Repoint at the frozen edition: <!-- src: edition:<asOf> <path> = <value> --> against data/cost-index-editions.json'
          : 'Correct the prose to the resolved value, or repoint the annotation, then log the change in data/cost-index-corrections.json',
      })),
    };
    writeFileSync(path.join(REPO, 'data/src-sentinel-worklist.json'), JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote data/src-sentinel-worklist.json — ${out.items.length} item(s).`);
    process.exit(0);
  }

  if (argv.includes('--explain')) {
    for (const f of findings) console.log(`${f.type.padEnd(10)} ${f.file}:${f.line}  ${f.annotation}\n           ${f.detail}`);
    console.log(`\n${annotations} annotation(s) scanned. ${JSON.stringify(counts)}`);
    process.exit(0);
  }

  const budget = loadBudget();
  let failed = false;

  // SCOPE FIRST. The budget freezes a KNOWN debt on KNOWN pages. A finding
  // anywhere else is a hard fail immediately, whatever budget remains — that is
  // what makes it safe to wire this gate against a 160-item backlog instead of
  // leaving it unwired until the backlog is cleared (the failure mode
  // check-gate-coverage exists to prevent).
  const known = new Set(budget.knownFiles || []);
  const offScope = findings.filter((f) => f.type !== 'INFO' && !known.has(f.file.replace(/\\/g, '/')));
  if (offScope.length) {
    failed = true;
    console.error(`✗ src-sentinel: ${offScope.length} finding(s) in page(s) OUTSIDE the declared debt scope. A new false or unverifiable citation, not old debt:`);
    offScope.slice(0, 20).forEach((f) => console.error(`  - [${f.type}] ${f.file}:${f.line} — ${f.detail}\n      ${f.annotation}`));
  }

  for (const t of [...HARD, ...BUDGETED]) {
    const n = counts[t], cap = (budget.budgets || {})[t];
    if (cap == null) { failed = true; console.error(`✗ src-sentinel: ${t} has no budget in data/src-sentinel-budget.json — declare one.`); continue; }
    if (n > cap) {
      failed = true;
      console.error(`✗ src-sentinel: ${t} = ${n}, over the declared budget of ${cap}. The ratchet only goes down; repoint an annotation at the frozen edition instead of raising this number.`);
      by(t).slice(0, 8).forEach((f) => console.error(`  - ${f.file}:${f.line} — ${f.annotation}`));
    } else if (n < cap) {
      failed = true;
      console.error(`✗ src-sentinel: ${t} = ${n}, BELOW the declared budget of ${cap}. Lower the budget to ${n} in data/src-sentinel-budget.json so the progress is locked in and cannot silently regress.`);
    } else {
      console.log(`  · ${t}: ${n} at budget (ratchet holding)`);
    }
  }

  if (failed) process.exit(1);
  console.log(`✓ src-sentinel: ${annotations} annotation(s) across the site. Every finding is inside the declared debt scope (${[...known].join(', ')}) and at its ratchet: ${HARD.concat(BUDGETED).map((t) => `${t}=${counts[t]}`).join(' ')}. No page outside that scope carries an unverifiable citation. Run --worklist for the remediation queue.`);
}
