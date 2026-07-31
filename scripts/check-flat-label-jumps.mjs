#!/usr/bin/env node
/**
 * check-flat-label-jumps.mjs — catch an ingredient told to the operator as "flat — nothing to
 * call" that actually jumped hard inside the window used to make that call.
 *
 * WHY THIS EXISTS
 * Cost Pulse buckets each ingredient with a conformal band (tools/_shared/cost-conformal.js).
 * The band is the (1-alpha) quantile of one-step residuals over a trailing window — by default
 * the 80th percentile over 26 steps. A quantile describes the TYPICAL step. When >=80% of steps
 * are exactly zero, the 80th-percentile residual is ZERO, the band collapses to +/-0%,
 * `degenerate` goes true (cost-conformal.js:158), and the classifier withholds with
 * reason='flat' (cost-lockfloat.js:63). The UI renders that as "flat and stale — nothing to call".
 *
 * That inference is sound for a genuinely sticky quote. It is BACKWARDS for a sparse-but-violent
 * series — one that sits at one price for weeks and then moves 20-44% in a single step. Its
 * median day is flat, so the band reads flat; its tail is enormous, which is precisely the risk
 * an operator needs told. Measured 2026-07-31: `carrot` carries a 44.1% single-step jump inside
 * its own 26-step window while being published as "nothing to call".
 *
 * This is ADR-022's rule ("a published average must carry the regime that breaks it") reappearing
 * in a different instrument, and ADR-023's silent-zero class in its subtlest form: the zero here
 * is a real measurement of the median day that reads as a statement about the market.
 *
 * WHAT THIS GATE DOES **NOT** DO
 * It does not change a bucket, widen a band, or restate a verdict. Which of those to do is a
 * founder call with published-surface consequences. This gate only guarantees the case cannot go
 * unnoticed: a 'flat' label whose window contains a jump above JUMP_PCT must be acknowledged in
 * ACKNOWLEDGED with a dated reason, or CI reds.
 *
 * Usage:
 *   node scripts/check-flat-label-jumps.mjs            # CI
 *   node scripts/check-flat-label-jumps.mjs --json
 *   node scripts/check-flat-label-jumps.mjs --self-test
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Mirrors cost-conformal.js defaults. If those change, this must change with them. */
export const WINDOW = 26
/** A single-step move at or above this is a jump the "flat" label cannot represent. */
export const JUMP_PCT = 10

/**
 * Known 'flat'-labelled slugs whose window contains a material jump, each with a dated reason.
 * Presence here means SEEN AND JUDGED, never "fine". Removing the jump requires a founder call on
 * the instrument, not an edit to this list.
 */
export const ACKNOWLEDGED = {
  carrot: '2026-07-31: 44.1% single-step jump in-window, 85% zero-steps. Worst instance; the band is blind to it. Pending founder call on jump disclosure.',
  kale: '2026-07-31: 13.3% single-step jump in-window, 85% zero-steps. Same mechanism as carrot.',
  'sweet-potato': '2026-07-31: 11.8% single-step jump in-window, 96% zero-steps. Single move, above the floor.',
}

/** Percent moves of each non-zero one-step change in the trailing `window` steps. */
export function jumpsInWindow (values, window = WINDOW) {
  const v = (values ?? []).filter((x) => typeof x === 'number' && isFinite(x))
  if (v.length < 2) return []
  const steps = []
  for (let i = 1; i < v.length; i++) steps.push({ delta: v[i] - v[i - 1], base: v[i - 1] })
  return steps
    .slice(-window)
    .filter((s) => s.delta !== 0 && s.base > 0)
    .map((s) => Math.abs(s.delta) / s.base * 100)
    .sort((a, b) => b - a)
}

export function analyze (lockfloat, history, { window = WINDOW, jumpPct = JUMP_PCT } = {}) {
  const items = lockfloat.items ?? lockfloat
  const hist = history.ingredients ?? history
  const findings = []
  for (const [slug, rec] of Object.entries(items)) {
    if (rec?.reason !== 'flat') continue
    const vals = (hist[slug] ?? []).map((p) => p.valueCents)
    const jumps = jumpsInWindow(vals, window)
    const max = jumps[0] ?? 0
    if (max >= jumpPct) {
      findings.push({
        slug,
        maxJumpPct: +max.toFixed(1),
        movesInWindow: jumps.length,
        acknowledged: Object.prototype.hasOwnProperty.call(ACKNOWLEDGED, slug),
      })
    }
  }
  findings.sort((a, b) => b.maxJumpPct - a.maxJumpPct)
  return {
    findings,
    unacknowledged: findings.filter((f) => !f.acknowledged).map((f) => f.slug),
    staleAck: Object.keys(ACKNOWLEDGED).filter((k) => !findings.some((f) => f.slug === k)),
  }
}

// ---------------------------------------------------------------------------
function selfTest () {
  let n = 0
  const ok = (c, m) => { n++; if (!c) { console.error(`  FAIL: ${m}`); process.exitCode = 1 } }

  ok(jumpsInWindow([]).length === 0, 'empty series -> no jumps')
  ok(jumpsInWindow([100]).length === 0, 'single value -> no jumps')
  ok(jumpsInWindow([100, 100, 100]).length === 0, 'zero steps are not jumps')
  ok(jumpsInWindow([100, 150])[0] === 50, 'computes percent against the PRIOR value')
  ok(jumpsInWindow([100, 50])[0] === 50, 'a down move is a jump of the same size')
  ok(jumpsInWindow([0, 50]).length === 0, 'a zero base is skipped, never Infinity')
  ok(jumpsInWindow([1, 2, 3])[0] >= jumpsInWindow([1, 2, 3])[1], 'jumps are sorted descending')
  // window truncation: an old jump outside the window must not count
  const long = [100, 200, ...Array.from({ length: 30 }, () => 200)]
  ok(jumpsInWindow(long, 5).length === 0, 'a jump older than the window is excluded')
  ok(jumpsInWindow(long, 40)[0] === 100, 'the same jump counts when the window reaches it')

  const lf = { items: { a: { reason: 'flat' }, b: { reason: 'flat' }, c: { reason: 'volatile' } } }
  const h = { ingredients: {
    a: [{ valueCents: 100 }, { valueCents: 100 }, { valueCents: 144 }],   // 44% jump
    b: [{ valueCents: 100 }, { valueCents: 100 }, { valueCents: 101 }],   // 1% — below floor
    c: [{ valueCents: 100 }, { valueCents: 300 }],                        // not 'flat'-labelled
  } }
  const r = analyze(lf, h)
  ok(r.findings.length === 1 && r.findings[0].slug === 'a', 'only flat-labelled slugs above the floor are flagged')
  ok(r.findings[0].maxJumpPct === 44, 'reports the max jump percent')
  ok(r.unacknowledged[0] === 'a', 'an unacknowledged jump is reported')
  ok(!r.findings.some((f) => f.slug === 'c'), 'a volatile-labelled slug is never flagged')
  const r2 = analyze({ items: { carrot: { reason: 'flat' } } }, { ingredients: { carrot: h.ingredients.a } })
  ok(r2.unacknowledged.length === 0 && r2.findings[0].acknowledged, 'a registered slug is acknowledged, not a failure')
  ok(analyze({ items: { carrot: { reason: 'flat' } } }, { ingredients: { carrot: [] } }).staleAck.includes('carrot'),
    'an ACKNOWLEDGED entry with no jump is reported stale')

  console.log(`self-test: ${n} assertions${process.exitCode ? ' — FAILURES ABOVE' : ' passed'}`)
}

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) {
  selfTest()
} else {
  const lf = JSON.parse(readFileSync(resolve(ROOT, 'data/cost-lockfloat.json'), 'utf8'))
  const hist = JSON.parse(readFileSync(resolve(ROOT, 'data/cost-index-history.json'), 'utf8'))
  const r = analyze(lf, hist)

  if (argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2))
    process.exit(0)
  }
  for (const f of r.findings) {
    console.log(`  ${f.slug.padEnd(18)} max in-window jump ${String(f.maxJumpPct + '%').padStart(6)} over ${f.movesInWindow} move(s)` +
      `${f.acknowledged ? '' : '   <- UNACKNOWLEDGED'}`)
  }
  if (r.staleAck.length) console.warn(`flat-label-jumps: ${r.staleAck.length} ACKNOWLEDGED entr(ies) no longer jumping — prune: ${r.staleAck.join(', ')}`)
  if (r.unacknowledged.length) {
    console.error(`\ncheck-flat-label-jumps: ${r.unacknowledged.length} slug(s) published as "flat — nothing to call" with a >=${JUMP_PCT}% single-step jump inside the same ${WINDOW}-step window.`)
    console.error('  The band is the 80th-percentile step; it describes the median day, not the tail.')
    console.error('  Judge each one and add it to ACKNOWLEDGED with a dated reason, or change the instrument.')
    process.exit(1)
  }
  console.log(`check-flat-label-jumps: OK — ${r.findings.length} flat-labelled slug(s) carry a material in-window jump, all acknowledged.`)
}
