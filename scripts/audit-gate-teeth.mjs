#!/usr/bin/env node
/**
 * audit-gate-teeth.mjs — which gates can actually be shown to fail?
 *
 * ============================== WHY ==============================
 *
 * On 2026-08-07 check-cost-index-basis-leak.mjs was green in CI, carried 22
 * passing self-test assertions, and was named in its own header as covering
 * cost-index/feed.json — while feed.json published ground beef at $393.06/lb
 * from a BLS index value, 71x the price the same repo published elsewhere.
 * Every assertion was true. None was about the thing that was wrong.
 *
 * The lesson generalizes past that one gate. check-all runs 326 entries. The
 * audit's claim that ~56 of them are tautologies has never been TESTED — it was
 * inferred from reading. Reading is how the basis-leak gate got its reputation.
 *
 * So this script does not read gates. It BREAKS their inputs and watches.
 *
 * ============================ THE METHOD ============================
 *
 * For each gate that reads a JSON file under data/:
 *   1. snapshot the file
 *   2. apply a generic, destructive mutation (perturb every number by 3x,
 *      invert every boolean, blank every string) — a mutation no honest data
 *      could survive
 *   3. run the gate
 *   4. restore the file, always, including on crash
 *
 * A gate that stays GREEN while its own declared input is garbage has no teeth
 * on that input. That is not proof it is worthless — it may guard a different
 * file, or a structural property the mutation preserves — but it IS the
 * shortlist worth a human's attention, produced by measurement rather than
 * by reading 163 script headers.
 *
 * DELIBERATELY NOT WIRED into check-all: it mutates working-tree files, and a
 * gate that edits the repo has no business inside a deploy. It is a periodic
 * instrument, run by hand, and it is listed in check-gate-coverage's UNWIRED
 * registry with exactly that reason.
 *
 *   node scripts/audit-gate-teeth.mjs                # every gate (slow)
 *   node scripts/audit-gate-teeth.mjs --gate check-x.mjs
 *   node scripts/audit-gate-teeth.mjs --limit 20
 *   node scripts/audit-gate-teeth.mjs --json         # machine-readable queue
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Files no mutation may touch: mutating them breaks unrelated gates or is huge. */
export const NEVER_MUTATE = new Set([
  'data/sourced-claims.json',      // the fact gate's registry — breaking it fails ~everything
  'data/cost-index.json',          // 35k observations; mutation is slow and blast-radius is total
  'data/cost-index-editions.json', // append-only spine; the seal is the point
]);

/** The mutation. Destructive enough that no honest gate should shrug. */
export function mutate(v) {
  if (typeof v === 'number') return v * 3 + 7;
  if (typeof v === 'boolean') return !v;
  if (typeof v === 'string') return /^\d{4}-\d{2}-\d{2}/.test(v) ? '1999-01-01' : v;
  if (Array.isArray(v)) return v.map(mutate);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = k.startsWith('_') ? x : mutate(x);
    return o;
  }
  return v;
}

/** The data files a gate names in its own source. */
export function inputsOf(script) {
  const src = readFileSync(path.join(REPO, 'scripts', script), 'utf8');
  const files = new Set();
  for (const m of src.matchAll(/['"`](data\/[A-Za-z0-9._-]+\.json)['"`]/g)) files.add(m[1]);
  return [...files].filter((f) => !NEVER_MUTATE.has(f) && existsSync(path.join(REPO, f)));
}

const runGate = (script) => {
  try { execSync(`node scripts/${script}`, { cwd: REPO, stdio: 'pipe', timeout: 120000 }); return 0; }
  catch (e) { return e.status == null ? -1 : e.status; }
};

const argv = process.argv.slice(2);
const only = argv.includes('--gate') ? argv[argv.indexOf('--gate') + 1] : null;
const limit = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : Infinity;

const gates = (only ? [only] : readdirSync(path.join(REPO, 'scripts'))
  .filter((f) => /^check-.*\.mjs$/.test(f))
  .filter((f) => !['check-all.mjs', 'check-gate-coverage.mjs', 'check-idem-coverage.mjs', 'check-honesty-debt.mjs'].includes(f)))
  .slice(0, limit);

const results = [];
for (const g of gates) {
  const inputs = inputsOf(g);
  if (!inputs.length) { results.push({ gate: g, verdict: 'NO-JSON-INPUT', note: 'reads no mutable data/*.json — this instrument cannot judge it' }); continue; }

  const baseline = runGate(g);
  if (baseline !== 0) { results.push({ gate: g, verdict: 'ALREADY-RED', note: `exits ${baseline} on clean data; teeth unmeasurable until it is green` }); continue; }

  const bit = [];
  for (const f of inputs) {
    const full = path.join(REPO, f);
    const original = readFileSync(full, 'utf8');
    try {
      writeFileSync(full, JSON.stringify(mutate(JSON.parse(original)), null, 2) + '\n');
      const after = runGate(g);
      bit.push({ file: f, caught: after !== 0 });
    } catch {
      bit.push({ file: f, caught: null });
    } finally {
      writeFileSync(full, original);   // ALWAYS restore, including on crash
    }
  }
  const caughtAny = bit.some((b) => b.caught === true);
  results.push({
    gate: g,
    verdict: caughtAny ? 'HAS-TEETH' : 'NO-TEETH',
    inputs: bit,
    note: caughtAny
      ? `goes red when ${bit.filter((b) => b.caught).map((b) => b.file).join(', ')} is corrupted`
      : `stays GREEN with every one of its declared inputs corrupted: ${bit.map((b) => b.file).join(', ')}`,
  });
  process.stderr.write('.');
}
process.stderr.write('\n');

if (argv.includes('--json')) {
  writeFileSync(path.join(REPO, 'data/gate-teeth-audit.json'), JSON.stringify({
    _doc: 'Measured, not inferred: which gates go red when their own declared JSON inputs are corrupted. Produced by scripts/audit-gate-teeth.mjs. NO-TEETH is a shortlist for human review, not a verdict — a gate may legitimately guard HTML or a structural property the mutation preserves.',
    generatedAt: new Date().toISOString().slice(0, 10),
    results,
  }, null, 2) + '\n');
  console.log('Wrote data/gate-teeth-audit.json');
}

const by = (v) => results.filter((r) => r.verdict === v);
for (const v of ['NO-TEETH', 'ALREADY-RED', 'HAS-TEETH', 'NO-JSON-INPUT']) {
  const rs = by(v);
  if (!rs.length) continue;
  console.log(`\n${v} — ${rs.length}`);
  if (v === 'HAS-TEETH' || v === 'NO-JSON-INPUT') { console.log('  ' + rs.map((r) => r.gate).join(', ')); continue; }
  rs.forEach((r) => console.log(`  · ${r.gate}\n      ${r.note}`));
}
console.log(`\n${results.length} gate(s) measured. NO-TEETH is the review queue: a gate that shrugs at corrupted input is protecting nothing it declares.`);
