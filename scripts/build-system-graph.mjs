#!/usr/bin/env node
/**
 * build-system-graph.mjs — the System Graph. What the build actually is, measured.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * This repo has 376 scripts, 130 of them gates, and the order in which they must run
 * exists in exactly one place: a 3,867-character `build.command` string inside
 * wrangler.jsonc, readable only by Cloudflare's build container. The 2026-08-07 company
 * audit measured the consequence — three consecutive local `check-all` passes landed on
 * 312 → 317 → 312 failures, because clearing reds in an ad-hoc order does not converge,
 * and no human can run the order that does.
 *
 * It is the third instrument in the same set. build-surface-inventory.mjs answers "what
 * pages exist"; build-link-graph.mjs answers "how does a reader move between them"; this
 * answers "what machine produces them, in what order, and what part of it is running at
 * all". All three are MANIFESTS, not documents, for the reason the audit gives: sixteen
 * planning documents (2,723 lines) describe this system in prose, prior audits close at
 * 26%, and no closure in company history came from anyone working a document's list.
 * manifest -> injector -> gate is the only architecture here that has ever held.
 *
 * ROOT LIST (CLAUDE.md, "A scanner is only as good as its root list"). The walk covers
 * `scripts/` RECURSIVELY — including scripts/lib/, scripts/sheets-fragments/ and
 * scripts/voice-refs/, which a `scripts/*.mjs` glob would miss — plus `data/`
 * recursively, plus wrangler.jsonc and every file in .github/workflows/. `_skippedRoots`
 * republishes what was deliberately not treated as a script node, each with a reason.
 * Non-JS scripts (.sh, .py) are NODES but are not parsed; `parsed: false` says so rather
 * than letting an unparsed file look like a script with no dependencies.
 *
 * HOW EDGES ARE MEASURED, AND WHAT THAT CANNOT SEE
 *
 * There is no JS parser in Node's standard library and this repo installs nothing, so
 * edges come from a purpose-built scanner:
 *
 *   1. Comments are stripped length-preservingly (so every offset stays true), with
 *      string, template and regex-literal awareness.
 *   2. `const`/`let`/`var` bindings whose right-hand side is a resolvable path
 *      expression become a symbol table.
 *   3. Every fs call site (`readFileSync`, `writeFileSync`, `readdirSync`, …) has its
 *      first argument extracted by balanced-paren scan and evaluated by a small path
 *      interpreter that understands string literals, `path.join` / `resolve` / `dirname`,
 *      `__dirname`, `fileURLToPath(import.meta.url)`, top-level ternaries (both branches
 *      are emitted), and `+` concatenation.
 *
 * An argument that does not resolve — a loop variable, a function parameter, a computed
 * slug — is emitted as a `*` pattern and COUNTED. `_honesty.unresolved*` is the headline
 * caveat of this file: an edge this scanner cannot see is invisible to every conclusion
 * below it. A resolvable prefix is kept (`cost-index/ * /index.html` becomes the tree
 * `cost-index/`), because "writes somewhere under cost-index/" is true and useful, while
 * "writes nothing" would be false.
 *
 * WHAT "RUN BY A WORKFLOW" MEANS HERE. check-idem-coverage.mjs:168 accepts a bare
 * substring match of the filename anywhere in a workflow's YAML — including inside a
 * comment — and the audit found a live case where that is exactly what happened
 * (cost-index-refresh.yml:98 mentions build-cost-index-picker in a comment; the git-add
 * allowlist 200 lines later throws its output away). So this scanner splits every
 * workflow hit into `runs` (the filename appears on a line that is not a YAML comment)
 * and `mentionedInComments` (it does not). Only `runs` counts as invocation.
 *
 * DETERMINISM. No wall clock. `asOf` is the newest commit date in the repo, so --check is
 * stable until a commit lands. Node 22 built-ins only; no dependencies; no network.
 *
 * Output: data/system-graph.json (plus the executable plan consumed by
 * scripts/rebuild-all.mjs)
 *
 *   node scripts/build-system-graph.mjs              # write the manifest
 *   node scripts/build-system-graph.mjs --check      # CI: rebuild & diff (exit 1 on drift)
 *   node scripts/build-system-graph.mjs --self-test  # unit-test the pure helpers
 *   node scripts/build-system-graph.mjs --report     # print the rollups to stdout
 *   node scripts/build-system-graph.mjs --report --dry-run   # rollups only, write nothing
 *
 * NOT WIRED into check-all.mjs, and deliberately so — same reason as its two sibling
 * instruments. Scripts change on most commits, so a --check here would red the deploy
 * until someone reran it. It is a measuring instrument, not a gate. The day anyone wires
 * it, it belongs in check-idem-coverage's MANUAL registry with who reruns it and when it
 * drifts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * A `data/` file that no script reads and no script writes is not automatically dead —
 * 92 of them are fetched by the BROWSER at runtime (the tool payloads, data/ci-history/,
 * three public feeds) and 12 more are CC0 downloads. prune-dist-data.mjs already owns
 * that judgement and exports it, so it is IMPORTED rather than re-encoded: the system
 * graph and the pruner cannot disagree about which files are reader-facing. Re-deriving
 * it here is exactly how the audit's `/data/*.jsonl` substring bug got shipped once.
 */
import { runtimeRefs, cataloguedPaths, headerRules, isPublic } from './prune-dist-data.mjs';

const __filename_ = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename_), '..');
const OUT = path.join(REPO, 'data', 'system-graph.json');

/* ------------------------------------------------------------------ root list */

/**
 * Trees under scripts/ and data/ that are NOT treated as script nodes. Every entry says
 * why. Nothing else is skipped: the walk is otherwise exhaustive.
 */
const SKIPPED_ROOTS = [
  { path: 'scripts/check-all-baseline.json', why: 'A committed baseline snapshot consumed by check-all.mjs, not a script. Modelled as an artifact.' },
  { path: 'scripts/expected-integrity.json', why: 'A committed expectation file read by an integrity gate, not a script. Modelled as an artifact.' },
  { path: 'scripts/sheets-fragments/', why: 'HTML fragments pasted into sheet pages by a builder. Data, not code — no fs calls to parse.' },
  { path: 'scripts/voice-refs/', why: 'Prose reference excerpts used by the voice tooling. Data, not code.' },
  { path: 'node_modules/', why: 'Never present in this container and never authored here.' },
  { path: '.git/', why: 'Source-control metadata.' },
];

/** Extensions under scripts/ that are script NODES but are not JS and so are not parsed. */
const UNPARSED_SCRIPT_EXT = new Set(['.sh', '.py']);

/**
 * Trees excluded from the runtime-reference sweep (the pass that decides whether a
 * `data/` file is fetched by a browser). prune-dist-data.mjs scans the BUILT dist/,
 * which does not exist in this container, so the sweep runs over the source tree with
 * the deploy tar's own exclude list — the same set, one stage earlier.
 */
const RUNTIME_SWEEP_SKIP = [
  { path: 'dist/', why: 'The staging target; a copy of everything else, and absent in this container.' },
  { path: '.git/', why: 'Source-control metadata, never served.' },
  { path: '.github/', why: 'Workflows, excluded from the deploy tar.' },
  { path: 'docs/', why: 'Editorial canons and handoffs, excluded from the deploy tar.' },
  { path: 'scripts/', why: 'Build-time code. A `/data/...` string here is a build read, already measured as an fs edge — counting it as a browser fetch would mark every internal source public.' },
  { path: 'src/', why: 'Worker source, excluded from the deploy tar (it is the Worker, not an asset).' },
  { path: 'tests/', why: 'Playwright specs and snapshot PNGs, excluded from the deploy tar since 2026-07-31.' },
  { path: 'node_modules/', why: 'Never authored here.' },
  { path: '_includes/', why: 'Partials; their content is stamped into pages, which ARE swept, so a reference is counted once rather than twice.' },
];

/* ---------------------------------------------------------- source-level scanning */

/**
 * Replace every comment with spaces, preserving length so downstream offsets stay valid.
 * String, template-literal and regex-literal aware — a `//` inside a URL string or a
 * `/*` inside a regex character class must not open a comment, or the paren scanner
 * below loses balance and every edge after it is wrong.
 */
export function stripComments(src) {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  let prevSignificant = '';
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { out[i] = ' '; i++; }
      continue;
    }
    if (c === '/' && d === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] !== '\n') out[i] = ' '; i++; }
      if (i < n) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++;
      prevSignificant = c;
      continue;
    }
    if (c === '`') {
      i++;
      let depth = 0;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { depth++; i += 2; continue; }
        if (src[i] === '}' && depth > 0) { depth--; i++; continue; }
        if (src[i] === '`' && depth === 0) break;
        i++;
      }
      i++;
      prevSignificant = '`';
      continue;
    }
    // A `/` is a regex start only where a value cannot legally precede it.
    if (c === '/' && /[(,=:[!&|?{};+\-*%~^\n]/.test(prevSignificant || '\n')) {
      let j = i + 1;
      let cls = false;
      let ok = false;
      while (j < n) {
        const e = src[j];
        if (e === '\\') { j += 2; continue; }
        if (e === '\n') break;
        if (e === '[') cls = true;
        else if (e === ']') cls = false;
        else if (e === '/' && !cls) { ok = true; break; }
        j++;
      }
      if (ok) { i = j + 1; prevSignificant = '/'; continue; }
    }
    if (!/\s/.test(c)) prevSignificant = c;
    i++;
  }
  return out.join('');
}

/**
 * Given the index of an opening `(`, return the top-level comma-separated argument
 * source strings. Assumes comments are already stripped. Returns `null` if the parens
 * never balance (a truncated or mis-scanned file), which is reported rather than guessed.
 */
export function scanArgs(src, open) {
  if (src[open] !== '(') return null;
  const args = [];
  let depth = 0;
  let start = open + 1;
  let i = open;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (c === '`') {
      i++;
      let td = 0;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { td++; i += 2; continue; }
        if (src[i] === '}' && td > 0) { td--; i++; continue; }
        if (src[i] === '`' && td === 0) break;
        i++;
      }
      i++;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') { depth++; i++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      depth--;
      if (depth === 0) { args.push(src.slice(start, i)); return { args: args.map((a) => a.trim()).filter((a, k) => !(k === 0 && a === '')), end: i }; }
      i++;
      continue;
    }
    if (c === ',' && depth === 1) { args.push(src.slice(start, i)); start = i + 1; i++; continue; }
    i++;
  }
  return null;
}

/** Split on a top-level `?` … `:` ternary. Returns null when there isn't one. */
export function splitTernary(expr) {
  let depth = 0;
  let q = -1;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < expr.length && expr[i] !== quote) { if (expr[i] === '\\') i++; i++; }
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === '?' && depth === 0) {
      if (expr[i + 1] === '?' || expr[i + 1] === '.') { i++; continue; }
      q = i;
      break;
    }
  }
  if (q === -1) return null;
  depth = 0;
  for (let i = q + 1; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < expr.length && expr[i] !== quote) { if (expr[i] === '\\') i++; i++; }
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ':' && depth === 0) {
      return { cond: expr.slice(0, q), a: expr.slice(q + 1, i).trim(), b: expr.slice(i + 1).trim() };
    }
  }
  return null;
}

/** Collapse `a//b`, `./`, and `..` into a repo-relative path. `*` segments survive. */
export function normalizeRel(p) {
  const segs = [];
  for (const s of String(p).split('/')) {
    if (s === '' || s === '.') continue;
    if (s === '..') { if (segs.length && segs[segs.length - 1] !== '..') segs.pop(); else segs.push('..'); continue; }
    segs.push(s);
  }
  return segs.join('/');
}

const UNKNOWN = '*';
const MAX_CANDIDATES = 6;

/**
 * Evaluate a JS expression to the set of repo-relative paths it can denote. Unknowable
 * pieces become `*`. `selfRel` is the scanning script's own repo-relative path, used for
 * `fileURLToPath(import.meta.url)`.
 */
export function evalPath(expr, syms, selfRel, depth = 0) {
  const e = String(expr).trim();
  if (!e || depth > 6) return [UNKNOWN];

  const tern = splitTernary(e);
  if (tern) {
    return dedupe([...evalPath(tern.a, syms, selfRel, depth + 1), ...evalPath(tern.b, syms, selfRel, depth + 1)]).slice(0, MAX_CANDIDATES);
  }

  let m = e.match(/^'((?:[^'\\]|\\.)*)'$/) || e.match(/^"((?:[^"\\]|\\.)*)"$/);
  if (m) return [m[1].replace(/\\(.)/g, '$1')];

  if (e.startsWith('`') && e.endsWith('`') && e.length >= 2) {
    let body = e.slice(1, -1);
    let out = '';
    let i = 0;
    while (i < body.length) {
      if (body[i] === '$' && body[i + 1] === '{') {
        let d = 1;
        let j = i + 2;
        while (j < body.length && d > 0) { if (body[j] === '{') d++; else if (body[j] === '}') d--; if (d) j++; }
        const inner = body.slice(i + 2, j);
        const v = evalPath(inner, syms, selfRel, depth + 1);
        out += v.length === 1 && v[0] !== UNKNOWN ? v[0] : UNKNOWN;
        i = j + 1;
        continue;
      }
      out += body[i];
      i++;
    }
    return [out];
  }

  if (/^fileURLToPath\s*\(\s*import\.meta\.url\s*\)$/.test(e)) return [selfRel];
  if (/^import\.meta\.dirname$/.test(e)) return [path.dirname(selfRel)];
  if (/^__filename_?$/.test(e)) return [selfRel];
  if (/^__dirname$/.test(e)) return [path.dirname(selfRel)];
  if (/^process\.cwd\s*\(\s*\)$/.test(e)) return ['']; // scripts are run from the repo root

  const call = e.match(/^path\s*\.\s*(join|resolve|dirname|basename|normalize)\s*\(/);
  if (call) {
    const parsed = scanArgs(e, e.indexOf('(', call[0].length - 1));
    if (!parsed) return [UNKNOWN];
    const fn = call[1];
    if (fn === 'dirname') {
      return dedupe(evalPath(parsed.args[0] || '', syms, selfRel, depth + 1).map((p) => (p === UNKNOWN ? UNKNOWN : normalizeRel(path.dirname('/' + p)))));
    }
    if (fn === 'basename') return [UNKNOWN];
    if (fn === 'normalize') return dedupe(evalPath(parsed.args[0] || '', syms, selfRel, depth + 1).map((p) => (p === UNKNOWN ? UNKNOWN : normalizeRel(p))));
    let acc = [''];
    for (const a of parsed.args) {
      const vs = evalPath(a, syms, selfRel, depth + 1);
      const next = [];
      for (const base of acc) for (const v of vs) next.push(base + '/' + v);
      acc = dedupe(next).slice(0, MAX_CANDIDATES);
    }
    return dedupe(acc.map(normalizeRel));
  }

  // Top-level `+` concatenation of resolvable pieces.
  if (/[^+]\+[^+]/.test(e)) {
    const parts = splitTopLevel(e, '+');
    if (parts && parts.length > 1) {
      let acc = [''];
      for (const p of parts) {
        const vs = evalPath(p, syms, selfRel, depth + 1);
        const next = [];
        for (const base of acc) for (const v of vs) next.push(base + v);
        acc = dedupe(next).slice(0, MAX_CANDIDATES);
      }
      return dedupe(acc);
    }
  }

  if (/^[A-Za-z_$][\w$]*$/.test(e)) {
    if (Object.prototype.hasOwnProperty.call(syms, e)) {
      const seen = syms.__seen || (syms.__seen = new Set());
      if (seen.has(e)) return [UNKNOWN];
      seen.add(e);
      const r = evalPath(syms[e], syms, selfRel, depth + 1);
      seen.delete(e);
      return r;
    }
    // The repo root is spelled six different ways across 376 scripts. Only accept the
    // spelling when nothing shadows it in the symbol table above.
    if (/^(REPO|repoRoot|REPO_ROOT|ROOT|repo)$/.test(e)) return [''];
    return [UNKNOWN];
  }

  return [UNKNOWN];
}

/** Split an expression on a top-level operator. Returns null if the operator is nested. */
export function splitTopLevel(expr, op) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < expr.length && expr[i] !== q) { if (expr[i] === '\\') i++; i++; }
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === op && depth === 0) {
      if (expr[i + 1] === op || expr[i - 1] === op) return null;
      parts.push(expr.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (!parts.length) return null;
  parts.push(expr.slice(start).trim());
  return parts.every(Boolean) ? parts : null;
}

function dedupe(a) { return [...new Set(a)]; }

/** Harvest `const NAME = <expr>` bindings whose value looks like a path expression. */
export function symbolTable(stripped, selfRel) {
  const syms = {};
  const re = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  let m;
  while ((m = re.exec(stripped))) {
    const rhs = readExpr(stripped, m.index + m[0].length);
    if (!rhs) continue;
    if (!/['"`]|path\s*\.|__dirname|import\.meta/.test(rhs)) continue;
    if (rhs.length > 400) continue;
    if (Object.prototype.hasOwnProperty.call(syms, m[1])) continue; // first binding wins
    syms[m[1]] = rhs;
  }
  // Keep only bindings that actually resolve; an unresolvable one is noise that would
  // shadow the repo-root spellings above.
  for (const k of Object.keys(syms)) {
    const v = evalPath(syms[k], syms, selfRel);
    if (v.length === 1 && v[0] === UNKNOWN) delete syms[k];
  }
  return syms;
}

/** Read one expression starting at `i`, stopping at a top-level `;` or line end. */
function readExpr(src, i) {
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      continue;
    }
    if ('([{'.includes(c)) { depth++; continue; }
    if (')]}'.includes(c)) { depth--; if (depth < 0) break; continue; }
    if (c === ';' && depth === 0) break;
    if (c === '\n' && depth === 0) {
      const tail = src.slice(start, i).trim();
      if (!/[+,?:&|=([{]$/.test(tail)) break;
    }
  }
  return src.slice(start, i).trim();
}

/* ------------------------------------------------------------------ fs call sites */

const FS_READ = new Set(['readFileSync', 'readFile', 'createReadStream']);
const FS_WALK = new Set(['readdirSync', 'readdir', 'globSync']);
const FS_WRITE = new Set(['writeFileSync', 'writeFile', 'appendFileSync', 'createWriteStream', 'renameSync', 'cpSync']);
const FS_PROBE = new Set(['existsSync', 'statSync', 'lstatSync', 'mkdirSync', 'rmSync', 'unlinkSync', 'accessSync']);
const FS_ALL = new Set([...FS_READ, ...FS_WALK, ...FS_WRITE, ...FS_PROBE]);

/**
 * Every fs call site with its first argument evaluated. Returns
 * `{ reads, walks, writes, probes, unresolved: {read, walk, write} }` where each list
 * holds repo-relative path patterns (possibly containing `*`).
 */
/**
 * Blank out the INTERIOR of every string and template literal, keeping length and the
 * quote characters. Used only to locate call sites: without it, a script that shows
 * example code inside a string — this file's own self-test does exactly that — reports
 * the example's `writeFileSync` as a real write. The arguments are still read from the
 * unmasked source, so path literals survive; only the function-name search is masked.
 */
export function maskStrings(stripped) {
  const out = stripped.split('');
  let i = 0;
  const n = stripped.length;
  let prevSignificant = '';
  while (i < n) {
    const c = stripped[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < n && stripped[i] !== c) {
        if (stripped[i] === '\\') { out[i] = ' '; i++; }
        if (i < n && stripped[i] !== '\n') out[i] = ' ';
        i++;
      }
      i++;
      prevSignificant = c;
      continue;
    }
    if (c === '`') {
      i++;
      let td = 0;
      while (i < n) {
        if (stripped[i] === '\\') { out[i] = ' '; i++; if (i < n) out[i] = ' '; i++; continue; }
        if (stripped[i] === '$' && stripped[i + 1] === '{') { td++; i += 2; continue; }
        if (stripped[i] === '}' && td > 0) { td--; i++; continue; }
        if (stripped[i] === '`' && td === 0) break;
        if (td === 0 && stripped[i] !== '\n') out[i] = ' ';
        i++;
      }
      i++;
      prevSignificant = '`';
      continue;
    }
    // REGEX LITERALS, and why this branch is not optional. Without it a pattern such as
    // /don't/ or /['"]/ opens a phantom string and every character after it in the file
    // is masked — which silently cost build-cost-index-pages.mjs ten of its sixteen read
    // edges when this function was first written without the check. Same heuristic as
    // stripComments, deliberately: the two must agree about what a string is.
    if (c === '/' && /[(,=:[!&|?{};+\-*%~^\n]/.test(prevSignificant || '\n')) {
      let j = i + 1;
      let cls = false;
      let ok = false;
      while (j < n) {
        const e = stripped[j];
        if (e === '\\') { j += 2; continue; }
        if (e === '\n') break;
        if (e === '[') cls = true;
        else if (e === ']') cls = false;
        else if (e === '/' && !cls) { ok = true; break; }
        j++;
      }
      if (ok) { i = j + 1; prevSignificant = '/'; continue; }
    }
    if (!/\s/.test(c)) prevSignificant = c;
    i++;
  }
  return out.join('');
}

export function ioEdges(stripped, syms, selfRel) {
  const out = { reads: [], walks: [], writes: [], probes: [], unresolved: { read: 0, walk: 0, write: 0 }, unbalanced: 0 };
  // `require(...)` and dynamic `import(...)` load a file just as surely as readFileSync;
  // 29 data/glossary-explainers/*.mjs and the tools/_shared/*.js modules are reached ONLY
  // that way, and would otherwise be reported as read by nothing.
  const re = /\b(?:fsp?\s*\.\s*|promises\s*\.\s*)?(readFileSync|readFile|createReadStream|readdirSync|readdir|globSync|writeFileSync|writeFile|appendFileSync|createWriteStream|renameSync|cpSync|existsSync|statSync|lstatSync|mkdirSync|rmSync|unlinkSync|accessSync|require|import)\s*\(/g;
  const masked = maskStrings(stripped);
  let m;
  while ((m = re.exec(masked))) {
    const fn = m[1] === 'require' || m[1] === 'import' ? 'readFileSync' : m[1];
    if (!FS_ALL.has(fn)) continue;
    const open = m.index + m[0].length - 1;
    const parsed = scanArgs(stripped, open);
    if (!parsed) { out.unbalanced++; continue; }
    const vals = evalPath(parsed.args[0] || '', syms, selfRel);
    const bucket = FS_READ.has(fn) ? 'reads' : FS_WALK.has(fn) ? 'walks' : FS_WRITE.has(fn) ? 'writes' : 'probes';
    const kind = bucket === 'reads' ? 'read' : bucket === 'walks' ? 'walk' : bucket === 'writes' ? 'write' : null;
    for (const v of vals) {
      if (v === UNKNOWN || v === '') { if (kind) out.unresolved[kind]++; continue; }
      // A readdirSync target is a DIRECTORY by definition. Recording it as a file leaves
      // every entry inside it looking read-by-nobody — which is how 29 explainer modules
      // that inject-glossary-explainers.mjs imports one-by-one came out "frozen".
      out[bucket].push(normalizeRel(v) + (bucket === 'walks' ? '/' : ''));
    }
  }
  for (const k of ['reads', 'walks', 'writes', 'probes']) out[k] = dedupe(out[k]).sort();
  return out;
}

/**
 * A pattern containing `*` still carries real information: its resolvable prefix.
 * `cost-index/ * /index.html` becomes the tree `cost-index/`. A pattern whose very first
 * segment is unknown carries none and is dropped (counted as unresolved instead).
 */
export function toArtifact(pattern) {
  if (pattern.endsWith('/')) return { id: pattern, tree: true };
  if (!pattern.includes(UNKNOWN)) return { id: pattern, tree: false };
  const segs = pattern.split('/');
  const known = [];
  for (const s of segs) { if (s.includes(UNKNOWN)) break; known.push(s); }
  if (!known.length) return null;
  return { id: known.join('/') + '/', tree: true };
}

/* -------------------------------------------------------------------- classifying */

const BUILDER_PREFIXES = ['build', 'seed', 'calibrate', 'backtest', 'render', 'generate', 'scaffold', 'new', 'publish', 'fetch'];
const INJECTOR_PREFIXES = ['inject', 'wire', 'stamp', 'sync', 'migrate', 'fix', 'add', 'rewire', 'normalize', 'dedupe', 'promote', 'tone', 'update', 'enrich', 'minify', 'prune', 'vendor', 'reconcile', 'voice'];
const CHECK_PREFIXES = ['check', 'verify', 'probe', 'expected', 'test', 'run'];

export function classifyScript(rel) {
  if (rel.startsWith('scripts/lib/')) return 'lib';
  const base = path.basename(rel);
  const prefix = base.split('-')[0].replace(/\..*$/, '');
  if (CHECK_PREFIXES.includes(prefix)) return 'check';
  if (BUILDER_PREFIXES.includes(prefix)) return 'builder';
  if (INJECTOR_PREFIXES.includes(prefix)) return 'injector';
  return 'other';
}

/* ------------------------------------------------------------------ runner parsing */

/** The deploy chain: every `node scripts/X.mjs [args]` step of build.command, in order. */
export function deploySteps(wrangler) {
  const noComments = wrangler.replace(/^\s*\/\/.*$/gm, '');
  let cfg;
  try { cfg = JSON.parse(noComments); } catch { return { steps: [], raw: '', parseError: true }; }
  const raw = cfg?.build?.command || '';
  const steps = [];
  raw.split('&&').map((s) => s.trim()).forEach((cmd, i) => {
    const m = cmd.match(/^node\s+(scripts\/[\w.-]+\.mjs)\s*(.*)$/);
    steps.push({
      index: i + 1,
      cmd,
      script: m ? m[1] : null,
      args: m && m[2] ? m[2].trim().split(/\s+/) : [],
    });
  });
  return { steps, raw, parseError: false };
}

/**
 * Workflow references, split by whether the line is a YAML comment. The split is the
 * whole point: check-idem-coverage.mjs accepts a comment as proof a builder is run.
 */
export function workflowRefs(yaml) {
  const runs = new Set();
  const comments = new Set();
  const withCheck = new Set();
  yaml.split('\n').forEach((line) => {
    const isComment = /^\s*#/.test(line);
    const hits = new Set();
    for (const m of line.matchAll(/(scripts\/[\w.-]+\.(?:mjs|sh|py))/g)) hits.add(m[1]);
    for (const m of line.matchAll(/\b((?:check|build|inject|wire|stamp|sync|fetch)-[\w.-]+\.mjs)\b/g)) hits.add('scripts/' + m[1]);
    for (const h of hits) {
      (isComment ? comments : runs).add(h);
      // `--check` must be on the SAME line as the invocation. Testing the whole YAML
      // (as an earlier draft of this file did) marks every script in a workflow that
      // --checks anything as check-mode-covered, which is how build-cost-index-pages —
      // the audit's headline instance of an unrun --check — went missing from the list.
      if (!isComment && /--check\b/.test(line)) withCheck.add(h);
    }
  });
  for (const c of comments) if (runs.has(c)) comments.delete(c);
  return {
    runs: [...runs].sort(),
    runsWithCheckFlag: [...withCheck].sort(),
    mentionedInComments: [...comments].filter((c) => !runs.has(c)).sort(),
  };
}

/**
 * A workflow's staging contract: which paths it `git add`s, and whether it then runs
 * `git checkout -- .` (which DISCARDS everything not staged).
 *
 * This exists because of a specific, thrice-shipped bug. cost-index-refresh.yml rebuilds
 * a file, omits it from the `git add` allowlist, and then discards it — so the builder
 * "runs" and its output never survives the job. The comment block above that allowlist
 * documents two prior instances, each closed by appending one filename. Measuring the
 * pattern instead of the instance is the only way it stops recurring.
 *
 * A pathspec containing `$` or a glob is reported as `dynamicPathspecs` and suppresses
 * the unstaged verdict for that workflow — a loop over a variable list may well stage the
 * file, and this scanner cannot tell. Silence beats a false accusation.
 */
export function gitStaging(yaml) {
  const lines = yaml.split('\n');
  const specs = [];
  let dynamic = false;
  let discards = false;
  let sawGitAdd = false;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('#')) continue;
    if (/^git\s+checkout\s+--\s+\./.test(t)) discards = true;
    const m = t.match(/^git\s+add\s+(.*)$/);
    if (!m) continue;
    sawGitAdd = true;
    let rest = m[1];
    let j = i;
    while (rest.trimEnd().endsWith('\\') && j + 1 < lines.length) {
      rest = rest.trimEnd().slice(0, -1) + ' ' + lines[++j].trim();
    }
    for (const tok of rest.split(/\s+/)) {
      if (!tok || tok.startsWith('-')) continue;
      const clean = tok.replace(/^["']|["']$/g, '');
      if (!clean) continue;
      if (/[$*?]/.test(clean)) { dynamic = true; continue; }
      specs.push(clean);
    }
  }
  return { commits: sawGitAdd, pathspecs: dedupe(specs).sort(), dynamicPathspecs: dynamic, discardsUnstaged: discards };
}

/** True when `p` falls under one of the workflow's staged pathspecs. */
export function isStaged(p, pathspecs) {
  return pathspecs.some((s) => {
    const spec = s.replace(/\/$/, '');
    return p === spec || p.startsWith(spec + '/');
  });
}

/** Every `[label, script.mjs, ...args]` row of check-all's CHECKS array, in order. */
export function checkAllEntries(src) {
  const re = /\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([\w.-]+\.mjs)'((?:\s*,\s*'[^']*')*)\s*\]/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const args = [...m[3].matchAll(/'([^']*)'/g)].map((a) => a[1]);
    out.push({ label: m[1].replace(/\\(.)/g, '$1'), script: 'scripts/' + m[2], args, idem: /\(idem\)/.test(m[1]) });
  }
  return out;
}

/* ---------------------------------------------------------------------- toposort */

/**
 * Kahn's algorithm with a deterministic tie-break, returning both the order and any
 * nodes left in cycles. A cycle is reported, never silently linearized — this repo's
 * build.command deliberately re-runs five scripts twice to settle exactly such knots,
 * and pretending they are acyclic would erase the only evidence of why.
 */
export function toposort(nodes, edges) {
  const indeg = new Map(nodes.map((n) => [n, 0]));
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [a, b] of edges) {
    if (!adj.has(a) || !indeg.has(b)) continue;
    adj.get(a).push(b);
    indeg.set(b, indeg.get(b) + 1);
  }
  const ready = nodes.filter((n) => indeg.get(n) === 0).sort();
  const order = [];
  while (ready.length) {
    ready.sort();
    const n = ready.shift();
    order.push(n);
    for (const m of adj.get(n).sort()) {
      indeg.set(m, indeg.get(m) - 1);
      if (indeg.get(m) === 0) ready.push(m);
    }
  }
  const cyclic = nodes.filter((n) => !order.includes(n)).sort();
  return { order, cyclic };
}

/* ------------------------------------------------------------------------- walk */

function walkFiles(dir, out = [], base = REPO, skip = SKIPPED_ROOTS) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(base, abs).split(path.sep).join('/');
    if (skip.some((s) => (s.path.endsWith('/') ? rel === s.path.slice(0, -1) || rel.startsWith(s.path) : rel === s.path))) continue;
    if (e.isDirectory()) walkFiles(abs, out, base, skip);
    else out.push(rel);
  }
  return out;
}

function readIf(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function newestCommitDate() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cd', '--date=short'], { cwd: REPO, encoding: 'utf8' }).trim() || null;
  } catch { return null; }
}

/* ------------------------------------------------------------------------- build */

function build() {
  const asOf = newestCommitDate();

  /* --- script nodes ------------------------------------------------------- */
  const scriptFiles = walkFiles(path.join(REPO, 'scripts'))
    .filter((r) => /\.(mjs|js|sh|py)$/.test(r));

  const scripts = [];
  const byId = new Map();
  for (const rel of scriptFiles) {
    const ext = path.extname(rel);
    const src = readIf(path.join(REPO, rel));
    const node = {
      id: rel,
      kind: classifyScript(rel),
      lang: ext === '.py' ? 'python' : ext === '.sh' ? 'shell' : 'js',
      parsed: !UNPARSED_SCRIPT_EXT.has(ext),
      bytes: Buffer.byteLength(src),
      lines: src ? src.split('\n').length : 0,
      hasCheckMode: false,
      hasSelfTest: false,
      usesNetwork: false,
      secretsUsed: [],
      imports: [],
      invokes: [],
      reads: [],
      walks: [],
      writes: [],
      unresolved: { read: 0, walk: 0, write: 0, unbalanced: 0 },
    };
    scripts.push(node);
    byId.set(rel, node);
  }

  /* --- parse ------------------------------------------------------------- */
  for (const node of scripts) {
    const src = readIf(path.join(REPO, node.id));
    if (!node.parsed) {
      // A shell script still names the scripts it runs; that is invocation evidence.
      for (const m of src.matchAll(/(scripts\/[\w.-]+\.(?:mjs|sh|py))/g)) if (m[1] !== node.id) node.invokes.push(m[1]);
      node.invokes = dedupe(node.invokes).sort();
      continue;
    }
    const stripped = stripComments(src);
    const syms = symbolTable(stripped, node.id);
    const io = ioEdges(stripped, syms, node.id);
    node.reads = io.reads;
    node.walks = io.walks;
    node.writes = io.writes;
    node.unresolved = { read: io.unresolved.read, walk: io.unresolved.walk, write: io.unresolved.write, unbalanced: io.unbalanced };

    // A QUOTED `'--check'` is an argv test. An unquoted mention inside a console string
    // ("run `node x --check`") is advice, not a mode, and must not be counted as one.
    node.hasCheckMode = /(['"])--check\1/.test(stripped);
    node.hasSelfTest = /(['"])--self-test\1/.test(stripped);
    // Masked, not raw: prune-dist-data.mjs contains `fetch("/data/…")` inside a self-test
    // STRING, and reading it as a network call would make rebuild-all skip a step that
    // needs no network at all.
    const maskedSrc = maskStrings(stripped);
    node.usesNetwork = /\bfetch\s*\(|node:https|\bhttps\.get\b/.test(maskedSrc);
    node.secretsUsed = dedupe([...maskedSrc.matchAll(/process\.env\.([A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*)/g)].map((m) => m[1])).sort();

    for (const m of stripped.matchAll(/\bfrom\s+'(\.[^']+)'/g)) {
      const target = normalizeRel(path.posix.join(path.posix.dirname(node.id), m[1]));
      if (byId.has(target)) node.imports.push(target);
    }
    for (const m of stripped.matchAll(/['"`](?:\.\/)?(?:scripts\/)?([\w.-]+\.(?:mjs|sh|py))['"`]/g)) {
      const cand = 'scripts/' + m[1];
      if (cand !== node.id && byId.has(cand)) node.invokes.push(cand);
    }
    node.imports = dedupe(node.imports).sort();
    node.invokes = dedupe(node.invokes.filter((x) => !node.imports.includes(x))).sort();
  }

  /* --- runners ------------------------------------------------------------ */
  const wrangler = readIf(path.join(REPO, 'wrangler.jsonc'));
  const deploy = deploySteps(wrangler);

  const wfDir = path.join(REPO, '.github', 'workflows');
  const workflows = {};
  for (const f of (fs.existsSync(wfDir) ? fs.readdirSync(wfDir).sort() : [])) {
    if (!/\.ya?ml$/.test(f)) continue;
    const y = readIf(path.join(wfDir, f));
    const refs = workflowRefs(y);
    workflows[f] = {
      ...refs,
      staging: gitStaging(y),
      triggers: dedupe([...y.matchAll(/^on:|^\s{2}(schedule|workflow_dispatch|push|pull_request|workflow_call):/gm)].map((m) => m[1]).filter(Boolean)).sort(),
      cron: [...y.matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
    };
  }

  const checkAllSrc = readIf(path.join(REPO, 'scripts', 'check-all.mjs'));
  const checkAll = checkAllEntries(checkAllSrc);
  const checkAllScripts = new Set(checkAll.map((e) => e.script));
  const checkAllWithCheckArg = new Set(checkAll.filter((e) => e.args.includes('--check')).map((e) => e.script));

  /* --- invocation classification ------------------------------------------ */
  const deployScripts = new Map();
  deploy.steps.forEach((s) => {
    if (!s.script) return;
    if (!deployScripts.has(s.script)) deployScripts.set(s.script, []);
    deployScripts.get(s.script).push(s.index);
  });

  const invokedByScript = new Map();
  for (const n of scripts) for (const t of [...n.invokes, ...n.imports]) {
    if (!invokedByScript.has(t)) invokedByScript.set(t, []);
    invokedByScript.get(t).push(n.id);
  }

  for (const n of scripts) {
    const wf = Object.entries(workflows).filter(([, v]) => v.runs.includes(n.id)).map(([k]) => k);
    const wfComment = Object.entries(workflows).filter(([, v]) => v.mentionedInComments.includes(n.id)).map(([k]) => k);
    n.invokedBy = {
      deployStepIndexes: deployScripts.get(n.id) || [],
      workflows: wf,
      workflowCommentOnly: wfComment,
      checkAll: checkAllScripts.has(n.id),
      scripts: dedupe(invokedByScript.get(n.id) || []).sort(),
    };
    n.invocation =
      n.invokedBy.deployStepIndexes.length ? 'deploy'
        : n.invokedBy.checkAll ? 'check-all'
          : wf.length ? 'workflow'
            : n.invokedBy.scripts.length ? 'script'
              : 'orphan';
  }

  // check-all itself is reached from the deploy chain; propagate that one level so a
  // gate is never called an orphan because only the orchestrator names it.
  for (const n of scripts) {
    if (n.invocation !== 'script') continue;
    const viaRunner = n.invokedBy.scripts.some((s) => {
      const p = byId.get(s);
      return p && (p.invocation === 'deploy' || p.invocation === 'workflow' || p.invocation === 'check-all');
    });
    if (viaRunner) n.invocation = 'script-of-runner';
  }

  /* --- artifacts ---------------------------------------------------------- */
  const artifacts = new Map();
  const touch = (id, tree) => {
    // This file's own output counts as present: it is written at the end of this run, so
    // reporting it missing would make --check flip between two states forever.
    if (!artifacts.has(id)) artifacts.set(id, { id, tree, kind: artifactKind(id), writtenBy: [], readBy: [], walkedBy: [], onDisk: fs.existsSync(path.join(REPO, id)) || id === 'data/system-graph.json' });
    return artifacts.get(id);
  };
  for (const n of scripts) {
    for (const [list, field] of [[n.writes, 'writtenBy'], [n.reads, 'readBy'], [n.walks, 'walkedBy']]) {
      for (const p of list) {
        const a = toArtifact(p);
        if (!a) continue;
        touch(a.id, a.tree)[field].push(n.id);
      }
    }
  }
  // Every file that lives under data/ is a node even when no script touches it — a
  // manifest nothing reads and nothing writes is the finding, and it only appears if
  // the walk seeds it.
  for (const rel of walkFiles(path.join(REPO, 'data'))) touch(rel, false);

  // Runtime (browser) references, via prune-dist-data.mjs's own rules.
  const shipped = walkFiles(REPO, [], REPO, RUNTIME_SWEEP_SKIP).filter((f) => f.endsWith('.html') || f.endsWith('.js'));
  const refs = runtimeRefs(shipped.map((f) => path.join(REPO, f)), (f) => fs.readFileSync(f, 'utf8'));
  const catalogued = cataloguedPaths(readIf(path.join(REPO, 'cost-index', 'open-data-catalog.json')));
  const rules = headerRules(readIf(path.join(REPO, '_headers')));
  const publicCtx = { refs, catalogued, rules };

  for (const a of artifacts.values()) {
    a.writtenBy = dedupe(a.writtenBy).sort();
    a.readBy = dedupe(a.readBy).sort();
    a.walkedBy = dedupe(a.walkedBy).sort();
  }

  // TREE COVERAGE. A script that does `readdirSync('data/glossary-explainers')` and then
  // imports every file it finds reads all 29 of them, but no single path literal names
  // one. Without this pass those files report as read by nothing — a manufactured
  // "frozen" finding, and precisely the shape of false positive CLAUDE.md warns about
  // when a scan's scope and its conclusions disagree.
  // Two kinds of tree, two coverage rules. A tree from `readdirSync('data/x')` covers the
  // files DIRECTLY inside it — readdirSync is not recursive, and treating it as recursive
  // made a single `readdirSync('data')` in one catalog gate report all 237 data files as
  // consumed, erasing the frozen-manifest finding entirely. A tree from an unresolvable
  // write pattern (`cost-index/ * /index.html`) does cover its subtree.
  const trees = [...artifacts.values()].filter((a) => a.tree);
  const walkTrees = trees.filter((t) => t.walkedBy.length);
  const patternTrees = trees.filter((t) => t.readBy.length || t.writtenBy.length);
  for (const a of artifacts.values()) {
    if (a.tree) continue;
    const dir = a.id.includes('/') ? a.id.slice(0, a.id.lastIndexOf('/') + 1) : '';
    const covering = dedupe([
      ...patternTrees.filter((t) => a.id.startsWith(t.id)),
      ...walkTrees.filter((t) => t.id === dir),
    ]);
    a.coveredByTree = covering.map((t) => t.id).sort();
    // A script that READS a file's contents is its consumer. A script that merely
    // ENUMERATES the directory it sits in is not — and conflating the two is the
    // difference between "every data file has a purpose" and the truth.
    a.contentReadBy = dedupe([...a.readBy, ...covering.flatMap((t) => t.readBy)]).sort();
    a.enumeratedBy = dedupe([...a.walkedBy, ...covering.flatMap((t) => t.walkedBy)]).sort();
    a.derivedWriters = dedupe([...a.writtenBy, ...covering.flatMap((t) => t.writtenBy)]).sort();
  }

  for (const a of artifacts.values()) {
    if (a.tree) { a.status = 'tree'; a.publicReason = null; continue; }
    a.publicReason = a.id.startsWith('data/') ? isPublic(a.id, publicCtx) : null;
    a.status = a.derivedWriters.length ? 'derived'
      : a.contentReadBy.length ? 'hand-maintained'
        : a.publicReason ? 'browser-only'
          : a.enumeratedBy.length ? 'enumerated-only'
            : 'frozen';
  }

  /* --- workflow outputs that never survive the job ------------------------ */
  const unstagedWorkflowOutputs = [];
  for (const [file, w] of Object.entries(workflows)) {
    if (!w.staging.commits || w.staging.dynamicPathspecs) continue;
    for (const sid of w.runs) {
      const n = byId.get(sid);
      if (!n) continue;
      const lost = [...n.writes].filter((p) => !p.includes(UNKNOWN)).filter((p) => !isStaged(p, w.staging.pathspecs));
      if (!lost.length) continue;
      unstagedWorkflowOutputs.push({
        workflow: file,
        script: sid,
        unstagedWrites: lost.sort(),
        discardedByGitCheckout: w.staging.discardsUnstaged,
      });
    }
  }
  unstagedWorkflowOutputs.sort((a, b) => (a.workflow + a.script < b.workflow + b.script ? -1 : 1));

  /* --- the derived-artifact chain ---------------------------------------- */
  // An edge A -> B means A writes an artifact B reads. Only real files count: a tree
  // prefix like `library/` is written by dozens of injectors and read by dozens more,
  // so admitting trees would make the graph a hairball that says nothing.
  const chainEdges = [];
  for (const a of artifacts.values()) {
    if (a.tree) continue;
    for (const w of a.writtenBy) for (const r of a.readBy) {
      if (w !== r) chainEdges.push([w, r, a.id]);
    }
  }
  const chainNodes = dedupe(chainEdges.flatMap(([a, b]) => [a, b])).sort();
  const { order: topoOrder, cyclic } = toposort(chainNodes, chainEdges.map(([a, b]) => [a, b]));

  // Cycles, reported as the concrete two-script knots that cause them rather than as an
  // undifferentiated blob.
  const edgeSet = new Set(chainEdges.map(([a, b]) => a + ' ' + b));
  const mutualPairs = [];
  for (const [a, b] of chainEdges.map(([x, y]) => [x, y])) {
    if (a < b && edgeSet.has(b + ' ' + a)) mutualPairs.push([a, b]);
  }

  /* --- deploy-order analysis ---------------------------------------------- */
  const lastIdx = new Map();
  const firstIdx = new Map();
  deploy.steps.forEach((s) => {
    if (!s.script) return;
    if (!firstIdx.has(s.script)) firstIdx.set(s.script, s.index);
    lastIdx.set(s.script, s.index);
  });

  const deviations = [];
  const outOfChain = new Map();
  for (const [a, b, art] of chainEdges) {
    const inA = lastIdx.has(a);
    const inB = lastIdx.has(b);
    if (inA && inB) {
      if (lastIdx.get(a) > lastIdx.get(b)) {
        deviations.push({
          writer: a, reader: b, artifact: art,
          writerLastStep: lastIdx.get(a), readerLastStep: lastIdx.get(b),
          writerFirstStep: firstIdx.get(a), readerFirstStep: firstIdx.get(b),
          healedByEarlierRun: firstIdx.get(a) < lastIdx.get(b),
        });
      }
    } else if (!inA && inB) {
      const rec = outOfChain.get(a) || { script: a, kind: byId.get(a)?.kind, invocation: byId.get(a)?.invocation, feeds: [] };
      rec.feeds.push({ reader: b, artifact: art, readerStep: lastIdx.get(b) });
      outOfChain.set(a, rec);
    }
  }
  deviations.sort((x, y) => (x.writer === y.writer ? (x.reader < y.reader ? -1 : 1) : x.writer < y.writer ? -1 : 1));

  /* --- the --check class nobody runs -------------------------------------- */
  // Neither meta-gate can see this class. check-gate-coverage enumerates check-*.mjs;
  // check-idem-coverage enumerates builders ALREADY inside check-all. A builder on disk
  // that ships a --check mode nobody passes is invisible to both — and that is how
  // build-cost-index-pages.mjs, whose own header says it was written to be wired "into
  // check-all in --check mode", ended up wired nowhere while /about/ published a
  // three-week-stale price.
  const unrunCheckMode = scripts
    .filter((n) => n.parsed && n.kind !== 'check' && n.hasCheckMode)
    .filter((n) => !checkAllWithCheckArg.has(n.id))
    .filter((n) => !Object.values(workflows).some((w) => w.runsWithCheckFlag.includes(n.id)))
    .map((n) => ({
      script: n.id, kind: n.kind, invocation: n.invocation,
      writes: n.writes.slice(0, 6),
      inCheckAllWithoutCheckArg: checkAllScripts.has(n.id),
      runByAWorkflowWithoutCheck: Object.entries(workflows).filter(([, w]) => w.runs.includes(n.id)).map(([k]) => k),
    }));

  /* --- (idem) entries with no automated healer ---------------------------- */
  // check-all runs at the END of build.command, so an (idem) builder it --checks but
  // nothing re-runs turns any drift into a red deploy no automation can clear. This is
  // check-idem-coverage's own question, asked without its substring-in-a-comment bug:
  // only a NON-COMMENT workflow line counts as a healer.
  const idemUnhealed = checkAll.filter((e) => e.idem).map((e) => {
    const healers = { deploy: deployScripts.has(e.script), workflows: Object.entries(workflows).filter(([, w]) => w.runs.includes(e.script)).map(([k]) => k) };
    const commentOnly = Object.entries(workflows).filter(([, w]) => w.mentionedInComments.includes(e.script)).map(([k]) => k);
    return { script: e.script, label: e.label, ...healers, commentOnlyIn: commentOnly, healed: healers.deploy || healers.workflows.length > 0 };
  }).filter((e) => !e.healed);

  /* --- builders whose only healer throws the result away ------------------ */
  // The sharpest class of all, and invisible to every existing gate: a workflow RUNS the
  // builder (so check-idem-coverage calls it healed), the git-add allowlist omits the
  // output, `git checkout -- .` deletes it, and a check-all gate then reads the stale
  // committed copy and reds the deploy. check-cost-index-picker fails today for exactly
  // this reason. These belong at the very front of the plan: they produce data other
  // steps read, and nothing else will ever produce it.
  const discardedFeeders = [];
  for (const u of unstagedWorkflowOutputs) {
    if (!u.discardedByGitCheckout) continue;
    const consumers = [];
    for (const w of u.unstagedWrites) {
      const a = artifacts.get(w);
      if (!a) continue;
      for (const r of a.readBy) {
        if (checkAllScripts.has(r) || deployScripts.has(r)) consumers.push({ artifact: w, reader: r, gate: checkAllScripts.has(r) });
      }
    }
    if (consumers.length) discardedFeeders.push({ ...u, consumers });
  }

  /* --- the executable plan ------------------------------------------------ */
  const plan = buildPlan({ deploy, scripts: byId, outOfChain, idemUnhealed, discardedFeeders });

  /* --- rollups ------------------------------------------------------------ */
  const byKind = {};
  for (const n of scripts) {
    byKind[n.kind] ||= { total: 0, deploy: 0, workflow: 0, 'check-all': 0, script: 0, 'script-of-runner': 0, orphan: 0 };
    byKind[n.kind].total++;
    byKind[n.kind][n.invocation]++;
  }
  const orphans = scripts.filter((n) => n.invocation === 'orphan').map((n) => ({ id: n.id, kind: n.kind, lines: n.lines, writes: n.writes.length, lang: n.lang }));

  const dataArtifacts = [...artifacts.values()].filter((a) => a.id.startsWith('data/') && !a.tree);
  const manifestRollup = {
    total: dataArtifacts.length,
    derived: dataArtifacts.filter((a) => a.status === 'derived').length,
    handMaintained: dataArtifacts.filter((a) => a.status === 'hand-maintained').length,
    enumeratedOnly: dataArtifacts.filter((a) => a.status === 'enumerated-only').length,
    browserOnly: dataArtifacts.filter((a) => a.status === 'browser-only').length,
    frozen: dataArtifacts.filter((a) => a.status === 'frozen').length,
    onDiskMissing: dataArtifacts.filter((a) => !a.onDisk).length,
  };
  // A manifest a script WRITES that no script reads is a different thing from a frozen
  // one: it is a real output whose only consumer is a browser, a human, or nobody.
  const writeOnly = dataArtifacts
    .filter((a) => a.derivedWriters.length && !a.contentReadBy.length)
    .map((a) => ({ id: a.id, writtenBy: a.derivedWriters, viaTree: !a.writtenBy.length, publicReason: a.publicReason }));

  const unresolvedTotals = scripts.reduce((acc, n) => {
    acc.read += n.unresolved.read; acc.walk += n.unresolved.walk; acc.write += n.unresolved.write; acc.unbalanced += n.unresolved.unbalanced || 0;
    return acc;
  }, { read: 0, walk: 0, write: 0, unbalanced: 0 });
  const resolvedTotals = scripts.reduce((acc, n) => {
    acc.read += n.reads.length; acc.walk += n.walks.length; acc.write += n.writes.length; return acc;
  }, { read: 0, walk: 0, write: 0 });

  return {
    _generator: 'scripts/build-system-graph.mjs',
    _what: 'The build/gate system as a measured dependency graph: script nodes, artifact nodes, '
      + 'read/write edges parsed from fs call sites, the four runners that invoke scripts, a '
      + 'topological order for the derived-artifact chain, and an executable plan for reaching a '
      + 'green tree locally.',
    _honesty: {
      method: 'Static scan. Comments stripped, const bindings resolved, fs call arguments evaluated by a small path interpreter.',
      resolvedIoArgs: resolvedTotals,
      unresolvedIoArgs: unresolvedTotals,
      unresolvedShare: +(unresolvedTotals.read + unresolvedTotals.write + unresolvedTotals.walk === 0 ? 0
        : (unresolvedTotals.read + unresolvedTotals.write + unresolvedTotals.walk)
          / (unresolvedTotals.read + unresolvedTotals.write + unresolvedTotals.walk + resolvedTotals.read + resolvedTotals.write + resolvedTotals.walk)).toFixed(4),
      cannotSee: [
        'A path built from a loop variable, function parameter or computed slug resolves to `*`. Its resolvable prefix becomes a tree edge; a pattern with no resolvable prefix is dropped and counted in unresolvedIoArgs.',
        'Dynamic dispatch: a script invoked through a variable command name is not detected.',
        'Whether a workflow keeps a builder\'s output. A `runs` hit proves the command is in the YAML, not that the result is committed — the audit found cost-index-refresh.yml running a builder and then discarding the file with `git checkout -- .`.',
        'Runtime behaviour of any kind. Nothing here is executed.',
      ],
      symbolShadowing: 'The first `const NAME =` binding in a file wins; a same-named binding in an inner scope is not modelled.',
    },
    asOf,
    _skippedRoots: SKIPPED_ROOTS,
    summary: {
      scripts: scripts.length,
      byKind,
      invocation: {
        deploy: scripts.filter((n) => n.invocation === 'deploy').length,
        checkAll: scripts.filter((n) => n.invocation === 'check-all').length,
        workflow: scripts.filter((n) => n.invocation === 'workflow').length,
        scriptOfRunner: scripts.filter((n) => n.invocation === 'script-of-runner').length,
        script: scripts.filter((n) => n.invocation === 'script').length,
        orphan: orphans.length,
      },
      deployStepCount: deploy.steps.length,
      deployScriptSteps: deploy.steps.filter((s) => s.script).length,
      deployDistinctScripts: deployScripts.size,
      checkAllEntries: checkAll.length,
      checkAllIdemEntries: checkAll.filter((e) => e.idem).length,
      workflows: Object.keys(workflows).length,
      artifacts: artifacts.size,
      manifests: manifestRollup,
      chain: {
        nodes: chainNodes.length,
        edges: chainEdges.length,
        topologicallyOrdered: topoOrder.length,
        inCycles: cyclic.length,
        mutualPairs: mutualPairs.length,
        deployOrderDeviations: deviations.length,
        deployOrderDeviationsHealedByEarlierRun: deviations.filter((d) => d.healedByEarlierRun).length,
        outOfChainWriters: outOfChain.size,
      },
      unstagedWorkflowOutputs: unstagedWorkflowOutputs.length,
      unrunCheckMode: unrunCheckMode.length,
      unrunCheckModeBuilders: unrunCheckMode.filter((u) => u.kind === 'builder').length,
      idemEntriesUnhealed: idemUnhealed.length,
      writeOnlyManifests: writeOnly.length,
      planSteps: plan.steps.length,
      planPreSteps: plan.steps.filter((s) => s.phase === 'pre').length,
      planStepsNeedingNetworkOrSecrets: plan.steps.filter((s) => s.requires.length).length,
    },
    runners: {
      deploy: {
        source: 'wrangler.jsonc build.command',
        note: 'The only place the build order exists. Not runnable outside Cloudflare\'s build container; scripts/rebuild-all.mjs is derived from it.',
        steps: deploy.steps,
      },
      workflows,
      checkAll: { source: 'scripts/check-all.mjs CHECKS', entries: checkAll },
    },
    scripts: scripts.map((n) => ({ ...n })),
    artifacts: [...artifacts.values()].sort((a, b) => (a.id < b.id ? -1 : 1)),
    chain: {
      edges: chainEdges.map(([a, b, art]) => ({ writer: a, reader: b, artifact: art })),
      topoOrder,
      inCycles: cyclic,
      mutualPairs: mutualPairs.map(([a, b]) => ({ a, b })),
      deployDeviations: deviations,
      outOfChainWriters: [...outOfChain.values()].sort((a, b) => (a.script < b.script ? -1 : 1)),
    },
    unrunCheckMode,
    idemUnhealed,
    unstagedWorkflowOutputs,
    writeOnlyManifests: writeOnly,
    orphans,
    plan,
  };
}

function artifactKind(id) {
  if (id.startsWith('data/')) return 'data';
  if (id.endsWith('.html')) return 'page';
  if (id.startsWith('assets/')) return 'asset';
  if (id.startsWith('_includes/')) return 'partial';
  if (id.startsWith('cost-index/')) return 'dataset';
  if (id.startsWith('scripts/')) return 'script-data';
  return 'other';
}

/* ---------------------------------------------------------------- the plan */

/**
 * The one thing a human cannot do today: reach a green tree locally. The deploy order is
 * the only proven-convergent sequence in the repo, so the plan IS that order — lifted out
 * of the JSON string it is trapped in — with the out-of-chain writers the audit identified
 * placed around it, and every step annotated with what it needs.
 *
 * Placement rule for an out-of-chain writer: it goes in the PRE phase (before the deploy
 * spine) when the spine reads what it writes, which is the definition of being out of
 * chain. If it also reads something the spine writes, it is listed in `contested` instead
 * of being guessed at — running it in either position is defensible and the graph should
 * say so rather than pick silently.
 */
function buildPlan({ deploy, scripts, outOfChain, idemUnhealed, discardedFeeders }) {
  const steps = [];
  const notes = [];
  const contested = [];
  const seenPre = new Set();

  const spine = deploy.steps.filter((s) => s.script);
  const spineScripts = new Set(spine.map((s) => s.script));

  const requirementsFor = (id) => {
    const n = scripts.get(id);
    if (!n) return [];
    const req = [];
    if (n.usesNetwork) req.push('network');
    for (const s of n.secretsUsed) req.push('secret:' + s);
    return req;
  };

  // PRE-0: builders whose only automated healer discards their output. First, because
  // they produce inputs the rest of the plan reads.
  for (const f of discardedFeeders) {
    if (spineScripts.has(f.script) || seenPre.has(f.script)) continue;
    seenPre.add(f.script);
    steps.push({
      phase: 'pre',
      script: f.script,
      args: [],
      why: `${f.workflow} runs it, omits ${f.unstagedWrites.join(' + ')} from its git-add allowlist, then discards it with \`git checkout -- .\`. `
        + `${f.consumers.length} step(s) read the stale committed copy — e.g. ${f.consumers[0].reader}.`,
      requires: requirementsFor(f.script),
    });
  }

  // PRE-1: the builders check-all --checks that no runner re-runs. These are the true
  // deploy blockers — the deploy heals its own chain, so a red can only survive here.
  for (const e of idemUnhealed) {
    if (spineScripts.has(e.script) || seenPre.has(e.script)) continue;
    seenPre.add(e.script);
    steps.push({
      phase: 'pre',
      script: e.script,
      args: [],
      why: `check-all --checks it ("${e.label}") but no deploy step and no workflow line re-runs it. Drift here reds the deploy with nothing able to clear it.`
        + (e.commentOnlyIn.length ? ` Named only in a COMMENT in ${e.commentOnlyIn.join(', ')}.` : ''),
      requires: requirementsFor(e.script),
    });
  }

  // PRE-2: writers whose output a deploy step reads, that the deploy never runs.
  for (const rec of [...outOfChain.values()].sort((a, b) => (a.script < b.script ? -1 : 1))) {
    if (seenPre.has(rec.script)) continue;
    const n = scripts.get(rec.script);
    const readsSpineOutput = n && n.reads.some((r) => {
      for (const s of spineScripts) { const w = scripts.get(s); if (w && w.writes.includes(r)) return true; }
      return false;
    });
    if (readsSpineOutput) { contested.push({ script: rec.script, why: 'Writes something the deploy chain reads AND reads something the deploy chain writes. Position is a judgement call, not a derivation.' }); continue; }
    seenPre.add(rec.script);
    steps.push({
      phase: 'pre',
      script: rec.script,
      args: [],
      why: `Out of the deploy chain, but ${rec.feeds.length} deploy step(s) read what it writes (e.g. ${rec.feeds[0].artifact}).`,
      requires: requirementsFor(rec.script),
    });
  }

  for (const s of spine) {
    steps.push({
      phase: 'deploy',
      script: s.script,
      args: s.args,
      why: `wrangler.jsonc build.command step ${s.index}`,
      requires: requirementsFor(s.script),
    });
  }

  const nonNodeTail = deploy.steps.filter((s) => !s.script).map((s) => s.cmd);
  if (nonNodeTail.length) {
    notes.push(`${nonNodeTail.length} non-node deploy step(s) are NOT in the plan — they stage dist/, install lightningcss from npm, and run pagefind. They need network and produce nothing the working tree keeps: ${nonNodeTail.map((c) => c.split(' ').slice(0, 3).join(' ')).join(' | ')}`);
  }
  if (contested.length) notes.push(`${contested.length} out-of-chain writer(s) could run before or after the spine; see plan.contested.`);
  notes.push('The deploy chain already ends with check-all.mjs, so the plan does too. Nothing is added after it.');
  notes.push(`${steps.filter((s) => s.requires.length).length} step(s) need network or a secret and are skipped by default in scripts/rebuild-all.mjs (--with-network / --with-secrets to include them).`);

  return { steps, contested, notes, checkAllIsFinalStep: steps.length > 0 && steps[steps.length - 1].script === 'scripts/check-all.mjs' };
}

/* ------------------------------------------------------------------- printing */

/** Compact primitive arrays onto one line; keep object arrays expanded. Matches siblings. */
export function pretty(v, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every((x) => x === null || typeof x !== 'object')) return '[' + v.map((x) => JSON.stringify(x)).join(',') + ']';
    return '[\n' + v.map((x) => pad + '  ' + pretty(x, indent + 2)).join(',\n') + '\n' + pad + ']';
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (!keys.length) return '{}';
    return '{\n' + keys.map((k) => pad + '  ' + JSON.stringify(k) + ': ' + pretty(v[k], indent + 2)).join(',\n') + '\n' + pad + '}';
  }
  return JSON.stringify(v);
}

function report(d) {
  const L = console.log;
  const s = d.summary;
  L('');
  L(`SYSTEM GRAPH — ${s.scripts} scripts, ${s.artifacts} artifacts, ${s.chain.edges} write->read edges (asOf ${d.asOf})`);
  L('');
  L('WHO RUNS WHAT');
  L(`  deploy (build.command)   ${String(s.invocation.deploy).padStart(4)} scripts across ${s.deployScriptSteps} of ${s.deployStepCount} steps`);
  L(`  check-all.mjs            ${String(s.invocation.checkAll).padStart(4)}  (${s.checkAllEntries} entries, ${s.checkAllIdemEntries} marked "(idem)")`);
  L(`  a GitHub workflow        ${String(s.invocation.workflow).padStart(4)}  across ${s.workflows} workflows`);
  L(`  another running script   ${String(s.invocation.scriptOfRunner).padStart(4)}`);
  L(`  another script only      ${String(s.invocation.script).padStart(4)}`);
  L(`  NOTHING (orphans)        ${String(s.invocation.orphan).padStart(4)}`);
  L('');
  L('BY KIND');
  for (const [k, v] of Object.entries(s.byKind).sort()) {
    L(`  ${k.padEnd(10)} total:${String(v.total).padStart(4)}  deploy:${String(v.deploy).padStart(3)}  check-all:${String(v['check-all']).padStart(3)}`
      + `  workflow:${String(v.workflow).padStart(3)}  via-script:${String(v.script + v['script-of-runner']).padStart(3)}  ORPHAN:${String(v.orphan).padStart(3)}`);
  }
  L('');
  L('ORPHANS — invoked by no runner and no script');
  for (const o of d.orphans.slice(0, 40)) L(`  ${o.kind.padEnd(9)} ${String(o.lines).padStart(5)}L  writes:${String(o.writes).padStart(2)}  ${o.id}`);
  if (d.orphans.length > 40) L(`  … and ${d.orphans.length - 40} more`);
  L('');
  L(`data/ MANIFESTS — ${s.manifests.total} files: ${s.manifests.derived} derived, ${s.manifests.handMaintained} hand-maintained, `
    + `${s.manifests.browserOnly} browser-only, ${s.manifests.enumeratedOnly} enumerated-only (a directory walk finds it; no script names it), `
    + `${s.manifests.frozen} FROZEN (nothing reads it, nothing writes it, no browser fetches it)`);
  const frozen = d.artifacts.filter((a) => a.id.startsWith('data/') && a.status === 'frozen');
  for (const a of frozen.slice(0, 30)) L(`  frozen  ${a.id}`);
  if (frozen.length > 30) L(`  … and ${frozen.length - 30} more`);
  const enumOnly = d.artifacts.filter((a) => a.id.startsWith('data/') && a.status === 'enumerated-only');
  for (const a of enumOnly.slice(0, 12)) L(`  enum-only  ${a.id}  <- walked by ${a.enumeratedBy.join(', ')}`);
  if (enumOnly.length > 12) L(`  … and ${enumOnly.length - 12} more enumerated-only`);
  L('');
  const woPublic = d.writeOnlyManifests.filter((w) => w.publicReason).length;
  L(`WRITE-ONLY MANIFESTS — ${d.writeOnlyManifests.length} files a builder writes that no script reads `
    + `(${woPublic} are reader-facing: a browser fetches them or the CC0 catalogue publishes them; ${d.writeOnlyManifests.length - woPublic} have NO public route)`);
  for (const w of d.writeOnlyManifests.filter((x) => !x.publicReason).slice(0, 20)) L(`  NO PUBLIC ROUTE  ${w.id}  <- ${w.writtenBy.join(', ') || '(via a directory-pattern write)'}`);

  L('');
  L(`UNHEALED (idem) ENTRIES — ${d.idemUnhealed.length} builders check-all --checks that no runner re-runs`);
  for (const e of d.idemUnhealed) L(`  ${e.script}${e.commentOnlyIn.length ? `   [named only in a COMMENT in ${e.commentOnlyIn.join(', ')}]` : ''}`);
  L('');
  L(`WORKFLOW OUTPUT NEVER COMMITTED — ${d.unstagedWorkflowOutputs.length} (script, workflow) pairs write a file the job's git-add allowlist omits`);
  for (const u of d.unstagedWorkflowOutputs) {
    L(`  ${u.workflow} runs ${u.script} -> ${u.unstagedWrites.join(', ')}${u.discardedByGitCheckout ? '   [then `git checkout -- .` DISCARDS it]' : ''}`);
  }
  L('');
  L(`--check MODE NOBODY RUNS — ${d.unrunCheckMode.length} non-gate scripts (${s.unrunCheckModeBuilders} of them builders) ship a --check no runner passes`);
  for (const u of d.unrunCheckMode.slice(0, 40)) L(`  ${u.kind.padEnd(9)} ${u.invocation.padEnd(16)} ${u.script}`);
  if (d.unrunCheckMode.length > 40) L(`  … and ${d.unrunCheckMode.length - 40} more`);
  L('');
  L(`CHAIN — ${s.chain.nodes} scripts in the derived-artifact DAG, ${s.chain.edges} edges`);
  L(`  topologically ordered: ${s.chain.topologicallyOrdered}   in cycles: ${s.chain.inCycles}   mutual pairs: ${s.chain.mutualPairs}`);
  L(`  deploy-order deviations: ${s.chain.deployOrderDeviations} (${s.chain.deployOrderDeviationsHealedByEarlierRun} healed by an earlier run of the writer)`);
  for (const dv of d.chain.deployDeviations.filter((x) => !x.healedByEarlierRun).slice(0, 20)) {
    L(`  step ${String(dv.writerLastStep).padStart(2)} writes ${dv.artifact} which step ${String(dv.readerLastStep).padStart(2)} already read — ${dv.writer} -> ${dv.reader}`);
  }
  L('');
  L(`OUT-OF-CHAIN WRITERS — ${s.chain.outOfChainWriters} scripts feed the deploy chain but are not in it`);
  for (const o of d.chain.outOfChainWriters.slice(0, 25)) {
    L(`  ${o.invocation.padEnd(16)} ${o.script} -> ${o.feeds.length} reader(s), e.g. ${o.feeds[0].artifact}`);
  }
  L('');
  L(`PLAN — ${s.planSteps} steps (${s.planPreSteps} pre + ${s.planSteps - s.planPreSteps} from build.command); scripts/rebuild-all.mjs consumes this`);
  for (const p of d.plan.steps.filter((x) => x.phase === 'pre')) L(`  pre   ${p.script}${p.requires.length ? '  [needs ' + p.requires.join(', ') + ']' : ''}`);
  for (const c of d.plan.contested) L(`  ?     ${c.script} — ${c.why}`);
  for (const n of d.plan.notes) L(`  note: ${n}`);
  L('');
}

/* ------------------------------------------------------------------ self-test */

function selfTest() {
  const cases = [
    [stripComments('a // b\nc'), 'a     \nc', 'line comments become spaces, length preserved'],
    [stripComments('a // b\nc').length, 8, 'stripping does not shift a single offset'],
    [stripComments('a /* b */ c').replace(/\s+/g, ' '), 'a c', 'block comments become spaces'],
    [stripComments("const u = 'http://x//y'; // hi").includes('http://x//y'), true, 'a // inside a string does not open a comment'],
    [stripComments('const r = /a\\/b/; x').includes('x'), true, 'a regex literal containing a slash does not break the scan'],
    [scanArgs('f(a, b)', 1).args.join('|'), 'a|b', 'top-level args split on commas'],
    [scanArgs('f(g(a, b), c)', 1).args.join('|'), 'g(a, b)|c', 'nested calls do not split'],
    [scanArgs("f('a,b', c)", 1).args.join('|'), "'a,b'|c", 'commas inside strings do not split'],
    [scanArgs('f(', 1), null, 'unbalanced parens report null rather than guessing'],
    [normalizeRel('scripts/../data//x.json'), 'data/x.json', 'normalizeRel resolves .. and collapses //'],
    [evalPath("'data/x.json'", {}, 'scripts/a.mjs').join(), 'data/x.json', 'a bare string literal resolves'],
    [evalPath("path.join(REPO, 'data', 'x.json')", {}, 'scripts/a.mjs').join(), 'data/x.json', 'path.join off the repo root resolves'],
    [evalPath("path.join(repoRoot, 'data/x.json')", {}, 'scripts/a.mjs').join(), 'data/x.json', 'a slashed segment resolves the same way'],
    [evalPath('OUT', { OUT: "path.join(REPO, 'data', 'y.json')" }, 'scripts/a.mjs').join(), 'data/y.json', 'a const binding is followed'],
    [evalPath("path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')", {}, 'scripts/a.mjs').join(), '', 'the standard repo-root idiom resolves to the root'],
    [evalPath("path.join(REPO, locale === 'es' ? 'es/feed.xml' : 'feed.xml')", {}, 'scripts/a.mjs').sort().join(), 'es/feed.xml,feed.xml', 'both ternary branches are emitted'],
    [evalPath('path.join(REPO, dir, slug)', {}, 'scripts/a.mjs').join(), '*/*', 'unresolvable segments become *'],
    [evalPath('`${REPO}/data/z.json`', {}, 'scripts/a.mjs').join(), '/data/z.json', 'template literals interpolate resolvable holes'],
    [evalPath('SELF', { SELF: 'SELF' }, 'scripts/a.mjs').join(), '*', 'a self-referential binding terminates instead of looping'],
    [JSON.stringify(toArtifact('cost-index/*/index.html')), '{"id":"cost-index/","tree":true}', 'an unresolvable tail keeps its resolvable prefix'],
    [toArtifact('*/index.html'), null, 'a pattern with no resolvable prefix carries no information'],
    [JSON.stringify(toArtifact('data/x.json')), '{"id":"data/x.json","tree":false}', 'a fully resolved path is a file, not a tree'],
    [JSON.stringify(toArtifact('data/explainers/')), '{"id":"data/explainers/","tree":true}', 'a readdir target is a directory even when fully resolved'],
    [maskStrings("f('data/a.json')"), "f('" + ' '.repeat('data/a.json'.length) + "')", 'string interiors are blanked, quotes and length kept'],
    [ioEdges("const s = \"fs.writeFileSync(x)\"; fs.writeFileSync(path.join(REPO,'data/real.json'), y)", {}, 'scripts/a.mjs').writes.join(), 'data/real.json', 'an fs call quoted inside a string is not a real write'],
    [ioEdges("fs.readdirSync(path.join(REPO,'data','sub'))", {}, 'scripts/a.mjs').walks.join(), 'data/sub/', 'a walked directory keeps its trailing slash'],
    [ioEdges("const re = /don't/; fs.readFileSync(path.join(REPO,'data/after.json'))", {}, 'scripts/a.mjs').reads.join(), 'data/after.json',
      'a regex containing an apostrophe does not mask the rest of the file (this bug cost 10 of 16 edges once)'],
    [maskStrings("x = /['\"]/; y('data/z.json')").endsWith("y('           ')"), true, 'masking resumes correctly after a regex full of quote characters'],
    [classifyScript('scripts/build-rss.mjs'), 'builder', 'build-* is a builder'],
    [classifyScript('scripts/inject-site-counts.mjs'), 'injector', 'inject-* is an injector'],
    [classifyScript('scripts/check-all.mjs'), 'check', 'check-* is a check'],
    [classifyScript('scripts/lib/translate.py'), 'lib', 'anything under lib/ is a lib regardless of its name'],
    [classifyScript('scripts/audio-post-process.mjs'), 'other', 'an unrecognised prefix is other, never silently a builder'],
    [JSON.stringify(ioEdges("fs.writeFileSync(path.join(REPO,'data/a.json'), x); const s = fs.readFileSync(path.join(REPO,'data/b.json'),'utf8');", {}, 'scripts/a.mjs').writes), '["data/a.json"]', 'writes are separated from reads'],
    [ioEdges("fs.readFileSync(someVar,'utf8')", {}, 'scripts/a.mjs').unresolved.read, 1, 'an unresolvable read is counted, not dropped silently'],
    [workflowRefs('  # run: node scripts/build-x.mjs\n  - run: node scripts/build-y.mjs').runs.join(), 'scripts/build-y.mjs', 'only non-comment lines count as runs'],
    [workflowRefs('  # run: node scripts/build-x.mjs\n  - run: node scripts/build-y.mjs').mentionedInComments.join(), 'scripts/build-x.mjs', 'a comment-only mention is reported separately'],
    [workflowRefs('# node scripts/build-z.mjs\n- run: node scripts/build-z.mjs').mentionedInComments.length, 0, 'a script both mentioned and run counts only as run'],
    [workflowRefs('- run: node scripts/build-a.mjs --check\n- run: node scripts/build-b.mjs').runsWithCheckFlag.join(), 'scripts/build-a.mjs', '--check must be on the same line as the invocation'],
    [workflowRefs('- run: node scripts/check-x.mjs --check\n- run: node scripts/build-b.mjs').runsWithCheckFlag.includes('scripts/build-b.mjs'), false, 'a --check elsewhere in the YAML does not cover another script'],
    [checkAllEntries("['A (idem)','build-a.mjs','--check'],\n['B','check-b.mjs'],").map((e) => e.script + ':' + e.idem).join('|'), 'scripts/build-a.mjs:true|scripts/check-b.mjs:false', 'check-all rows parse with their (idem) marker'],
    [deploySteps('{"build":{"command":"node scripts/a.mjs && node scripts/b.mjs --es && tar -cf -"}}').steps.map((s) => s.script || s.cmd.split(' ')[0]).join(), 'scripts/a.mjs,scripts/b.mjs,tar', 'deploy steps split on && and keep non-node steps'],
    [deploySteps('{"build":{"command":"node scripts/b.mjs --es"}}').steps[0].args.join(), '--es', 'deploy step args survive'],
    [JSON.stringify(toposort(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']])), '{"order":["a","b","c"],"cyclic":[]}', 'a chain topologically sorts'],
    [JSON.stringify(toposort(['a', 'b'], [['a', 'b'], ['b', 'a']])), '{"order":[],"cyclic":["a","b"]}', 'a cycle is reported, never linearized'],
    [pretty({ a: [1, 2, 3] }), '{\n  "a": [1,2,3]\n}', 'primitive arrays print on one line'],
    [pretty({ a: [{ b: 1 }] }), '{\n  "a": [\n    {\n      "b": 1\n    }\n  ]\n}', 'object arrays stay expanded'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`x self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // The plan is only trustworthy if the deploy command it lifts is actually parseable.
  const d = deploySteps(readIf(path.join(REPO, 'wrangler.jsonc')));
  if (d.parseError || !d.steps.length) {
    console.error('x self-test: wrangler.jsonc build.command did not parse — the plan would be empty and silently wrong.');
    process.exit(2);
  }
  pass++;
  console.log(`build-system-graph --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

/* ---------------------------------------------------------------------- runner */

function main(argv) {
  if (argv.includes('--self-test')) selfTest();
  const doc = build();
  const built = pretty(doc) + '\n';
  const s = doc.summary;
  const tag = `${s.scripts} scripts (${s.invocation.orphan} orphaned), ${s.artifacts} artifacts, `
    + `${s.chain.edges} write->read edges, ${s.chain.outOfChainWriters} out-of-chain writer(s), `
    + `${s.unrunCheckMode} unrun --check mode(s), ${s.planSteps} plan steps`;

  if (argv.includes('--check')) {
    let current = '';
    try { current = fs.readFileSync(OUT, 'utf8'); } catch { /* missing -> stale */ }
    if (current !== built) {
      console.error('system graph: data/system-graph.json is stale — run `node scripts/build-system-graph.mjs` and commit.');
      process.exit(1);
    }
    console.log(`system graph: in sync — ${tag}.`);
    if (argv.includes('--report')) report(doc);
    process.exit(0);
  }

  if (argv.includes('--report') && argv.includes('--dry-run')) { report(doc); process.exit(0); }
  fs.writeFileSync(OUT, built);
  console.log(`system graph: wrote data/system-graph.json — ${tag}.`);
  if (argv.includes('--report')) report(doc);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
