#!/usr/bin/env node
/**
 * Prune internal sources out of dist/data/ before the site is published.
 *
 * WHY THIS EXISTS (2026-07-29)
 *
 * `data/` was never in the deploy tar's exclude list, so all 95M of it shipped —
 * including `data/cost-index.json` (9.4M) and `data/cost-index-history.json`
 * (12.2M), the internal measured sources. The curated public export of the same
 * data is `/cost-index/index.json`, at 34KB. So the front door was a considered
 * subset while the whole warehouse stood open beside it.
 *
 * Most of `data/` genuinely SHOULD be public — that is not the problem. Two
 * groups are deliberate:
 *
 *   • the 12 catalogued CC0 open datasets (60.2M), which carry CORS + license
 *     headers and a public catalog at /cost-index/open-data-catalog.json;
 *   • the 92 files the browser actually fetches at runtime (4.4M) — the
 *     `data/*.js` payloads behind the tools, `data/ci-history/`, and three
 *     `.json` feeds the recall/labor/demand surfaces read.
 *
 * What is left is 127 build-time sources nothing asks for. Those are pruned.
 *
 * WHY PRUNE dist/ RATHER THAN EXTEND THE TAR EXCLUDE
 *
 * The exclude list would need 127 entries and would rot the moment a new source
 * file landed — the failure this repo keeps writing gates about. This derives
 * the keep-set from the three rules instead, so a NEW internal file is pruned by
 * default, and a new file a tool starts fetching is kept automatically because
 * the grep finds the reference.
 *
 * Runs after the tar extract and before pagefind, so the search index does not
 * ingest build sources either.
 *
 * Usage:
 *   node scripts/prune-dist-data.mjs            # prune dist/data
 *   node scripts/prune-dist-data.mjs --dry-run  # report only
 *   node scripts/prune-dist-data.mjs --self-test
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

/** Every `/data/...` path referenced from shipped HTML or JS. */
export function runtimeRefs(files, read) {
  const refs = new Set();
  const re = /["'(]\/data\/([A-Za-z0-9._/-]+)/g;
  for (const f of files) {
    let src;
    try { src = read(f); } catch { continue; }
    for (const m of src.matchAll(re)) refs.add(`data/${m[1]}`);
  }
  return refs;
}

/** Download paths the open-data catalog publishes. */
export function cataloguedPaths(catalogJson) {
  const out = new Set();
  let parsed;
  try { parsed = JSON.parse(catalogJson); } catch { return out; }
  for (const d of parsed.datasets || []) {
    for (const dl of d.downloads || []) if (dl?.path) out.add(dl.path);
  }
  return out;
}

/**
 * The path patterns `_headers` declares rules for, as anchored RegExps.
 *
 * Matched as globs, NOT substrings. A substring test is what the first version
 * did, and `'/data/*.jsonl'.includes('/data/*')` is true — so every file under
 * data/ looked like it had an explicit public rule and the prune kept 197 files
 * instead of 104. `*` never spans a `/`, matching Cloudflare's own semantics.
 */
export function headerRules(source) {
  return String(source)
    .split('\n')
    .filter((l) => /^\//.test(l))
    .map((l) => l.trim())
    .map((glob) => {
      const body = glob
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*');
      return new RegExp(`^${body}$`);
    });
}

/**
 * A file is public if the browser fetches it, the catalog publishes it, or
 * _headers declares a rule whose glob matches it.
 */
export function isPublic(rel, { refs, catalogued, rules }) {
  if (catalogued.has(rel)) return 'CC0 catalogue';
  for (const r of refs) {
    if (r === rel) return 'runtime';
    if (r.endsWith('/') && rel.startsWith(r)) return 'runtime';
  }
  if (rules.some((re) => re.test(`/${rel}`))) return '_headers rule';
  return null;
}

function listFiles(root, base = root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else out.push(path.relative(base, p));
  }
  return out;
}

function selfTest() {
  const refs = runtimeRefs(['a.html'], () => `<script src="/data/cost-index.js"></script> fetch("/data/ci-history/")`);
  const catalogued = cataloguedPaths('{"datasets":[{"downloads":[{"path":"data/census-imports.jsonl"}]}]}');
  const rules = headerRules('/data/cpc-oni.txt\n  Access-Control-Allow-Origin: *\n/data/ci-history/*\n/data/*.jsonl\n');
  const ctx = { refs, catalogued, rules };
  const cases = [
    [refs.has('data/cost-index.js'), true, 'a script src is a runtime reference'],
    [refs.has('data/ci-history/'), true, 'a fetch of a directory is a runtime reference'],
    [isPublic('data/cost-index.js', ctx), 'runtime', 'runtime files are public'],
    [isPublic('data/ci-history/2026-07.json', ctx), 'runtime', 'a file under a referenced directory is public'],
    [isPublic('data/census-imports.jsonl', ctx), 'CC0 catalogue', 'catalogued datasets are public'],
    [isPublic('data/cpc-oni.txt', ctx), '_headers rule', 'a file named in _headers is public'],
    [isPublic('data/cost-index.json', ctx), null, 'an unreferenced internal source is NOT public'],
    [isPublic('data/census-imports.jsonl', { ...ctx, catalogued: new Set() }), '_headers rule', 'a .jsonl matches the /data/*.jsonl rule'],
    [isPublic('data/anything.json', ctx), null, 'the /data/*.jsonl rule must NOT match a .json (the substring bug)'],
    [headerRules('/a/*\n  X: 1\n/b/c\n').length, 2, 'only rule lines are collected'],
    [isPublic('data/cost-index-history.json', ctx), null, 'the history source is NOT public'],
    [cataloguedPaths('not json').size, 0, 'an unreadable catalog yields nothing'],
    [runtimeRefs(['x'], () => { throw new Error('nope'); }).size, 0, 'an unreadable file is skipped'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`prune-dist-data --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  if (argv.includes('--self-test')) selfTest();
  const dryRun = argv.includes('--dry-run');

  const dist = path.join(REPO, 'dist');
  const dataDir = path.join(dist, 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('prune-dist-data: no dist/data — nothing to do.');
    process.exit(0);
  }

  // Scan the BUILT site, so a reference added by an injector still counts.
  const shipped = listFiles(dist)
    .filter((f) => f.endsWith('.html') || f.endsWith('.js'))
    .map((f) => path.join(dist, f));
  const refs = runtimeRefs(shipped, (f) => fs.readFileSync(f, 'utf8'));
  const catalogPath = path.join(dist, 'cost-index', 'open-data-catalog.json');
  const catalogued = cataloguedPaths(fs.existsSync(catalogPath) ? fs.readFileSync(catalogPath, 'utf8') : '');
  const headersPath = path.join(REPO, '_headers');
  const rules = headerRules(fs.existsSync(headersPath) ? fs.readFileSync(headersPath, 'utf8') : '');
  const ctx = { refs, catalogued, rules };

  let kept = 0;
  let pruned = 0;
  let keptBytes = 0;
  let prunedBytes = 0;
  const biggest = [];

  for (const rel of listFiles(dataDir, dist)) {
    const abs = path.join(dist, rel);
    const size = fs.statSync(abs).size;
    if (isPublic(rel, ctx)) { kept++; keptBytes += size; continue; }
    pruned++;
    prunedBytes += size;
    biggest.push({ rel, size });
    if (!dryRun) fs.rmSync(abs);
  }

  const mb = (b) => `${(b / 1048576).toFixed(1)}M`;
  biggest.sort((a, b) => b.size - a.size);
  for (const b of biggest.slice(0, 5)) console.log(`  ${dryRun ? 'would prune' : 'pruned'} ${mb(b.size).padStart(7)}  ${b.rel}`);
  console.log(
    `prune-dist-data: kept ${kept} public file(s) (${mb(keptBytes)}), ${dryRun ? 'would prune' : 'pruned'} ${pruned} internal source(s) (${mb(prunedBytes)}).`,
  );
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
