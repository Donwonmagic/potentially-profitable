#!/usr/bin/env node
/**
 * audit-panel-independence.mjs — measure the Cost Index panel's EFFECTIVE breadth, and catch
 * feeds that have gone silent while still looking alive.
 *
 * WHY THIS EXISTS
 * The panel reports 100 tracked ingredients. That is a count of SLUGS, not a count of independent
 * price observations. Several slugs are one publication: NOAA releases 14 seafood series on a
 * single schedule, so all 14 change value on exactly the same dates — different numbers, one
 * calendar. Any statistic that treats slugs as independent (co-movement, "N of 100 moved",
 * agreement scores) silently overweights whichever desk publishes the most slugs.
 *
 * It also catches the failure this repo hit FOUR separate ways on 2026-07-31, each found by a
 * different route and all the same shape — an instrument returning nothing, with no way to tell
 * "measured zero" from "instrument did not report":
 *   1. a recall keyword mangled by an accent strip ("Jalapeño" -> "jalape o") returned 0 forever;
 *   2. openFDA has no USDA/FSIS jurisdiction, so beef/pork/chicken are structurally 0;
 *   3. the seafood price refresh no-ops without AMS_KEY and holds last-good silently;
 *   4. 11 AMS-Atlanta items show zero change across 26 consecutive reads.
 * A flat market and a dead feed are indistinguishable from the value alone. The only honest
 * discriminator is the SHAPE of the record over time, which is what this script measures.
 *
 * WHAT IT REPORTS
 *   - clusters: slugs sharing (source, start, length, change-date fingerprint) — one publication
 *   - effectiveSeries: distinct series count after collapsing clusters
 *   - silent: slugs with zero value change across their whole record (dead-feed candidates)
 *
 * Usage:
 *   node scripts/audit-panel-independence.mjs              # human report
 *   node scripts/audit-panel-independence.mjs --json       # machine output
 *   node scripts/audit-panel-independence.mjs --check      # CI: fail on UNREGISTERED silent feeds
 *   node scripts/audit-panel-independence.mjs --self-test  # assertions
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'data/cost-index.json')

/** A record this long with zero change is a dead-feed candidate, not a flat market. */
export const SILENT_MIN_READS = 12

/**
 * Slugs KNOWN to be silent, each with a dated reason. A silent feed is not automatically a bug —
 * some quotes genuinely do not move — but it must be a written judgement, never a default.
 * Same discipline as the check-all baseline and the positioning-drift ALLOW list.
 */
export const SILENT_ALLOW = {
  // 2026-07-31: one USDA AMS Atlanta terminal desk. Zero change across 26 reads. AMS FV020 flags
  // "offerings light" on the herbs, so a sticky quote is plausible — but 11 slugs from ONE desk all
  // frozen together is a desk-level signal, not 11 independent flat markets. Registered so the
  // count is visible; revisit if the desk stays frozen past the next refresh cycle.
  kale: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  basil: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  leek: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  'butternut-squash': '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  rutabaga: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  mint: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  rosemary: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  thyme: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  oregano: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  tarragon: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
  banana: '2026-07-31: AMS Atlanta desk, zero change in 26 reads',
}

/** Longest history array across an ingredient's points. */
export function longestHistory (entry) {
  let best = []
  for (const p of entry?.points ?? []) {
    const h = p?.history ?? []
    if (h.length > best.length) best = h
  }
  return best
}

/** Fingerprint one series: source set, span, and the dates on which the value actually changed. */
export function fingerprint (slug, entry) {
  const h = longestHistory(entry)
  if (!h.length) return null
  const sources = [...new Set(h.map((x) => x.source))].sort().join('+')
  const changes = []
  for (let i = 1; i < h.length; i++) if (h[i].valueCents !== h[i - 1].valueCents) changes.push(h[i].date)
  return {
    slug,
    sources,
    reads: h.length,
    start: h[0].date,
    end: h[h.length - 1].date,
    changes: changes.length,
    // Same desk + same span + same change calendar = one publication, regardless of the values.
    key: `${sources}|${h[0].date}|${h.length}|${changes.join(',')}`,
  }
}

export function audit (costIndex) {
  const series = []
  for (const [slug, entry] of Object.entries(costIndex.ingredients ?? {})) {
    const fp = fingerprint(slug, entry)
    if (fp) series.push(fp)
  }

  const groups = new Map()
  for (const s of series) {
    if (!groups.has(s.key)) groups.set(s.key, [])
    groups.get(s.key).push(s)
  }
  const clusters = [...groups.values()]
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((g) => ({
      sources: g[0].sources,
      start: g[0].start,
      reads: g[0].reads,
      changes: g[0].changes,
      size: g.length,
      slugs: g.map((s) => s.slug),
    }))

  const redundant = clusters.reduce((n, c) => n + c.size - 1, 0)
  const silent = series
    .filter((s) => s.changes === 0 && s.reads >= SILENT_MIN_READS)
    .map((s) => ({ ...s, registered: Object.prototype.hasOwnProperty.call(SILENT_ALLOW, s.slug) }))

  return {
    tracked: series.length,
    effectiveSeries: series.length - redundant,
    redundant,
    clusters,
    silent,
    unregisteredSilent: silent.filter((s) => !s.registered).map((s) => s.slug),
    staleAllow: Object.keys(SILENT_ALLOW).filter((k) => !silent.some((s) => s.slug === k)),
  }
}

// ---------------------------------------------------------------------------
function selfTest () {
  let n = 0
  const ok = (c, m) => { n++; if (!c) { console.error(`  FAIL: ${m}`); process.exitCode = 1 } }
  const mk = (hist) => ({ points: [{ history: hist }] })
  const h = (dates, vals, source = 's') => dates.map((d, i) => ({ date: d, valueCents: vals[i], source }))

  ok(longestHistory({ points: [{ history: [1] }, { history: [1, 2, 3] }] }).length === 3, 'picks the longest history')
  ok(longestHistory({}) .length === 0, 'no points -> empty history')
  ok(fingerprint('x', {}) === null, 'no history -> null fingerprint')

  const flat = fingerprint('a', mk(h(['d1', 'd2', 'd3'], [10, 10, 10])))
  ok(flat.changes === 0, 'no value change -> zero changes')
  const moves = fingerprint('b', mk(h(['d1', 'd2', 'd3'], [10, 11, 11])))
  ok(moves.changes === 1, 'one value change counted once')

  // Same calendar, DIFFERENT values, still one publication.
  const p = audit({ ingredients: {
    a: mk(h(['d1', 'd2'], [10, 20])),
    b: mk(h(['d1', 'd2'], [99, 77])),
    c: mk(h(['d1', 'd2'], [5, 5])),
  } })
  ok(p.clusters.length === 1, 'same source+span+change-calendar clusters together')
  ok(p.clusters[0].size === 2, 'cluster holds both synchronized series')
  ok(p.clusters[0].slugs.join(',') === 'a,b', 'differing VALUES do not break a shared calendar')
  ok(p.tracked === 3 && p.effectiveSeries === 2, 'effective breadth collapses the cluster')

  // Different source => never clustered, even on an identical calendar.
  const q = audit({ ingredients: {
    a: mk(h(['d1', 'd2'], [10, 20], 'noaa')),
    b: mk(h(['d1', 'd2'], [10, 20], 'ams')),
  } })
  ok(q.clusters.length === 0, 'different sources are independent even when synchronized')

  // Silence needs LENGTH — a short flat run is not evidence of a dead feed.
  const short = audit({ ingredients: { a: mk(h(['d1', 'd2', 'd3'], [7, 7, 7])) } })
  ok(short.silent.length === 0, `flat but under ${SILENT_MIN_READS} reads is not called silent`)
  const dates = Array.from({ length: SILENT_MIN_READS }, (_, i) => `d${i}`)
  const long = audit({ ingredients: { zzz: mk(h(dates, dates.map(() => 7))) } })
  ok(long.silent.length === 1, 'flat at or past the read floor IS called silent')
  ok(long.unregisteredSilent[0] === 'zzz', 'an unregistered silent feed is reported')
  const known = audit({ ingredients: { kale: mk(h(dates, dates.map(() => 7))) } })
  ok(known.unregisteredSilent.length === 0, 'a registered silent feed is not a new failure')
  ok(known.silent[0].registered === true, 'registration is surfaced on the row')

  console.log(`self-test: ${n} assertions${process.exitCode ? ' — FAILURES ABOVE' : ' passed'}`)
}

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) {
  selfTest()
} else {
  const r = audit(JSON.parse(readFileSync(SRC, 'utf8')))
  if (argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2))
  } else if (argv.includes('--check')) {
    let bad = false
    if (r.unregisteredSilent.length) {
      bad = true
      console.error(`panel-independence: ${r.unregisteredSilent.length} feed(s) silent for >=${SILENT_MIN_READS} reads and NOT registered:`)
      for (const s of r.unregisteredSilent) console.error(`  - ${s}`)
      console.error('  A flat market and a dead feed look identical from the value alone. Confirm which')
      console.error('  this is, then add it to SILENT_ALLOW with a dated reason, or fix the feed.')
    }
    if (r.staleAllow.length) {
      console.warn(`panel-independence: ${r.staleAllow.length} SILENT_ALLOW entr(ies) no longer silent — prune: ${r.staleAllow.join(', ')}`)
    }
    if (!bad) console.log(`panel-independence: OK — ${r.tracked} slugs, ${r.effectiveSeries} independent series, ${r.silent.length} silent (all registered).`)
    process.exit(bad ? 1 : 0)
  } else {
    console.log('=== COST INDEX PANEL INDEPENDENCE ===')
    console.log(`tracked slugs:       ${r.tracked}`)
    console.log(`independent series:  ${r.effectiveSeries}   (${r.redundant} collapse into a shared publication)`)
    console.log('\n=== ONE-PUBLICATION CLUSTERS (same desk, same span, same change calendar) ===')
    for (const c of r.clusters) {
      console.log(`\n  ${c.size} slugs — ${c.sources}, from ${c.start}, ${c.reads} reads, ${c.changes} change(s)`)
      console.log(`    ${c.slugs.join(', ')}`)
    }
    console.log(`\n=== SILENT FEEDS (zero change across >=${SILENT_MIN_READS} reads) ===`)
    for (const s of r.silent) console.log(`  ${s.slug.padEnd(20)} ${s.reads} reads, ${s.sources}${s.registered ? '' : '   <- UNREGISTERED'}`)
    if (!r.silent.length) console.log('  none')
    console.log('\nA slug count is not an observation count. Any statistic that treats these as')
    console.log('independent overweights whichever desk publishes the most slugs.')
  }
}
