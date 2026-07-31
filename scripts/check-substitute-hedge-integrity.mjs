#!/usr/bin/env node
/**
 * check-substitute-hedge-integrity.mjs — the "hedge vs mirror" verdict on a substitute is operator
 * ADVICE (swap this when that spikes). This gate stops two ways it can be published wrong.
 *
 * R1 — SELF-COMPARISON (fail). Many real substitutes have no tracked price series of their own:
 * broccolini, savoy cabbage, canned tomatoes, garlic powder, ground dried ginger. Their `subSlug`
 * falls back to the PARENT slug, so the co-movement lookup asks "how often did broccoli co-move
 * with broccoli?" and answers 0 of 6 — impossible, since a series always moves with itself. The
 * classifier then reads that broken zero as `verdict: "hedge"` and the site publishes "canned
 * tomatoes hedge fresh tomatoes" on the strength of a series compared to itself.
 * The bug is proven by the file's own inconsistency: clams and scallops hit the identical
 * condition and correctly carry `hedge: null`, because seafood is excluded from the co-movement
 * corpus so the lookup never ran. When it DOES run against itself it returns a meaningless zero.
 * A self-referential pair must carry `hedge: null` — the substitution stays, the price claim goes.
 *
 * R2 — STRUCTURAL MIRROR (registry). Every verdict in this file is computed from n <= 6 moves, and
 * at that width "hedge" is the DEFAULT: earning "mirror" needs co-movement across most of <=6
 * observations. That is dangerous for two cultivars of ONE species, which share fields, weather and
 * harvest window whatever six observations happened to show — kale/collard greens (both Brassica
 * oleracea, published hedge at 2/6), ribeye/striploin (same animal, same primal region, hedge at
 * 2/6). If beef moves, both move. Each same-species pair published as a hedge must be acknowledged
 * with a dated reason, so the thin-data call is made deliberately and not by default.
 *
 * This gate does not rewrite a verdict — that changes published operator advice and is a founder
 * call. It makes both cases impossible to ship unnoticed. See ADR-023.
 *
 *   node scripts/check-substitute-hedge-integrity.mjs            # CI
 *   node scripts/check-substitute-hedge-integrity.mjs --json
 *   node scripts/check-substitute-hedge-integrity.mjs --self-test
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Same SPECIES or same ANIMAL only — deliberately conservative. Culinary siblings that are
 * genuinely different crops (broccoli vs cauliflower are both B. oleracea and ARE included;
 * tomato vs tomatillo are different genera and are NOT) belong to the measured verdict, not here.
 */
export const SAME_ORGANISM = {
  'Brassica oleracea': ['kale', 'collard-greens', 'cabbage', 'broccoli', 'cauliflower', 'brussels-sprouts', 'kohlrabi'],
  'Lactuca sativa': ['iceberg-lettuce', 'romaine-lettuce', 'green-leaf-lettuce', 'red-leaf-lettuce', 'butter-lettuce'],
  'Solanum lycopersicum': ['tomato', 'cherry-tomato'],
  'Capsicum annuum': ['bell-pepper', 'jalapeno', 'poblano-pepper', 'serrano-pepper'],
  'Solanum tuberosum': ['russet-potato', 'red-potato', 'yukon-potato'],
  'Allium cepa': ['onion', 'red-onion', 'shallot'],
  'Cucurbita pepo': ['zucchini', 'yellow-squash', 'acorn-squash'],
  chicken: ['chicken-breast', 'chicken-thigh', 'whole-chicken'],
  beef: ['ribeye', 'striploin', 'short-rib', 'beef-tenderloin', 'flank-steak', 'skirt-steak', 'ground-beef'],
  pork: ['pork-belly', 'pork-loin', 'pork-shoulder', 'ground-pork'],
  salmon: ['salmon-fillet', 'salmon-skin-on', 'salmon-skin-on-fillet', 'whole-salmon'],
  shrimp: ['shrimp', 'shrimp-head-on', 'shrimp-pd'],
  turkey: ['ground-turkey', 'whole-turkey'],
}

/** Same-organism pairs knowingly published as "hedge", each with a dated reason. */
export const ACKNOWLEDGED_HEDGES = {
  'bell-pepper>poblano-pepper': '2026-07-31: both Capsicum annuum. Published hedge at 0/6. Pending founder call.',
  'poblano-pepper>bell-pepper': '2026-07-31: both Capsicum annuum. Published hedge at 0/6. Pending founder call.',
  'brussels-sprouts>cabbage': '2026-07-31: both Brassica oleracea. Published hedge at 0/6. Pending founder call.',
  'brussels-sprouts>broccoli': '2026-07-31: both Brassica oleracea. Published hedge at 0/6. Pending founder call.',
  'collard-greens>kale': '2026-07-31: both Brassica oleracea. Published hedge at 2/6. Pending founder call.',
  'kale>collard-greens': '2026-07-31: both Brassica oleracea. Published hedge at 2/6. Pending founder call.',
  'chicken-thigh>whole-chicken': '2026-07-31: same animal. Published hedge at 0/5. Pending founder call.',
  'jalapeno>serrano-pepper': '2026-07-31: both Capsicum annuum. Published hedge at 1/6. Pending founder call.',
  'serrano-pepper>jalapeno': '2026-07-31: both Capsicum annuum. Published hedge at 1/6. Pending founder call.',
  'onion>shallot': '2026-07-31: both Allium cepa. Published hedge at 0/6. Pending founder call.',
  'red-onion>shallot': '2026-07-31: both Allium cepa. Published hedge at 0/6. Pending founder call.',
  'red-onion>onion': '2026-07-31: both Allium cepa. Published hedge at 1/6. Pending founder call.',
  'red-potato>yukon-potato': '2026-07-31: both Solanum tuberosum. Published hedge at 0/6. Pending founder call.',
  'russet-potato>yukon-potato': '2026-07-31: both Solanum tuberosum. Published hedge at 0/6. Pending founder call.',
  'ribeye>striploin': '2026-07-31: same animal, adjacent primals, one cattle market. Published hedge at 2/6. Worst instance — pending founder call.',
  'striploin>ribeye': '2026-07-31: same animal, adjacent primals, one cattle market. Published hedge at 2/6. Pending founder call.',
  'yellow-squash>zucchini': '2026-07-31: both Cucurbita pepo. Published hedge at 2/6. Pending founder call.',
  'pork-belly>pork-shoulder': '2026-07-31: same animal. Published hedge at 0/1 and already flagged thin:true — the single weakest verdict in the file. Pending founder call.',
}

const organismOf = (() => {
  const m = {}
  for (const [g, slugs] of Object.entries(SAME_ORGANISM)) for (const s of slugs) m[s] = g
  return m
})()

export function analyze (depth) {
  const ing = depth.ingredients ?? depth
  const selfCompared = []
  const structuralMirrors = []
  for (const [slug, rec] of Object.entries(ing)) {
    for (const sub of rec?.substitutes ?? []) {
      if (!sub?.subSlug) continue
      const h = sub.hedge
      if (sub.subSlug === slug) {
        // R1: a price verdict derived from comparing a series to itself.
        if (h && h.verdict) selfCompared.push({ slug, name: sub.name, verdict: h.verdict, k: h.k, n: h.n })
        continue
      }
      if (!h || h.verdict !== 'hedge') continue
      const g = organismOf[slug]
      if (g && g === organismOf[sub.subSlug]) {
        const key = `${slug}>${sub.subSlug}`
        structuralMirrors.push({
          key, organism: g, k: h.k, n: h.n,
          acknowledged: Object.prototype.hasOwnProperty.call(ACKNOWLEDGED_HEDGES, key),
        })
      }
    }
  }
  return {
    selfCompared,
    structuralMirrors,
    unacknowledged: structuralMirrors.filter((m) => !m.acknowledged).map((m) => m.key),
    staleAck: Object.keys(ACKNOWLEDGED_HEDGES).filter((k) => !structuralMirrors.some((m) => m.key === k)),
  }
}

// ---------------------------------------------------------------------------
function selfTest () {
  let n = 0
  const ok = (c, m) => { n++; if (!c) { console.error(`  FAIL: ${m}`); process.exitCode = 1 } }
  const mk = (ingredients) => ({ ingredients })

  // R1
  const r1 = analyze(mk({ tomato: { substitutes: [{ name: 'canned tomatoes', subSlug: 'tomato', hedge: { verdict: 'hedge', k: 0, n: 6 } }] } }))
  ok(r1.selfCompared.length === 1, 'a self-referential pair with a verdict is caught')
  ok(r1.selfCompared[0].name === 'canned tomatoes', 'reports the substitute display name, not just the slug')
  const r1b = analyze(mk({ clams: { substitutes: [{ name: 'canned clams', subSlug: 'clams', hedge: null }] } }))
  ok(r1b.selfCompared.length === 0, 'a self-referential pair with hedge:null is CORRECT and not flagged')
  const r1c = analyze(mk({ clams: { substitutes: [{ name: 'x', subSlug: 'clams' }] } }))
  ok(r1c.selfCompared.length === 0, 'a self-referential pair with no hedge key at all is not flagged')

  // R2
  const r2 = analyze(mk({ kale: { substitutes: [{ subSlug: 'collard-greens', hedge: { verdict: 'hedge', k: 2, n: 6 } }] } }))
  ok(r2.structuralMirrors.length === 1, 'same-organism hedge is caught')
  ok(r2.structuralMirrors[0].organism === 'Brassica oleracea', 'names the shared organism')
  ok(r2.structuralMirrors[0].acknowledged === true, 'a registered pair is acknowledged')
  ok(r2.unacknowledged.length === 0, 'a registered pair is not a failure')
  const r2b = analyze(mk({ kale: { substitutes: [{ subSlug: 'cauliflower', hedge: { verdict: 'hedge', k: 1, n: 6 } }] } }))
  ok(r2b.unacknowledged[0] === 'kale>cauliflower', 'an UNregistered same-organism hedge fails')
  const r2c = analyze(mk({ kale: { substitutes: [{ subSlug: 'collard-greens', hedge: { verdict: 'mirror', k: 5, n: 6 } }] } }))
  ok(r2c.structuralMirrors.length === 0, 'a same-organism pair already called MIRROR is correct, not flagged')
  const r2d = analyze(mk({ kale: { substitutes: [{ subSlug: 'spinach', hedge: { verdict: 'hedge', k: 1, n: 6 } }] } }))
  ok(r2d.structuralMirrors.length === 0, 'a different-organism hedge is left to the measured verdict')
  ok(analyze(mk({})).staleAck.length === Object.keys(ACKNOWLEDGED_HEDGES).length, 'all registry entries report stale against an empty corpus')

  console.log(`self-test: ${n} assertions${process.exitCode ? ' — FAILURES ABOVE' : ' passed'}`)
}

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) {
  selfTest()
} else {
  const r = analyze(JSON.parse(readFileSync(resolve(ROOT, 'data/ingredient-depth.json'), 'utf8')))
  if (argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0) }

  let bad = false
  if (r.selfCompared.length) {
    bad = true
    console.error(`R1 FAIL — ${r.selfCompared.length} substitute(s) carry a price verdict derived from a series compared to ITSELF:`)
    for (const s of r.selfCompared) console.error(`  ${s.slug} -> "${s.name}" (subSlug=${s.slug})  verdict=${s.verdict} ${s.k}/${s.n}`)
    console.error('  A series always co-moves with itself, so k=0 here is a degenerate lookup, not a measurement.')
    console.error('  Set hedge:null for these (as clams/scallops already do). Keep the substitution; drop the price claim.')
  }
  if (r.unacknowledged.length) {
    bad = true
    console.error(`\nR2 FAIL — ${r.unacknowledged.length} same-organism pair(s) published as "hedge" without a dated reason:`)
    for (const k of r.unacknowledged) console.error(`  ${k}`)
    console.error(`  Every verdict here is computed from n<=6, where "hedge" is the default outcome.`)
  }
  if (r.staleAck.length) console.warn(`\nnote: ${r.staleAck.length} ACKNOWLEDGED_HEDGES entr(ies) no longer match — prune: ${r.staleAck.join(', ')}`)
  if (!bad) console.log(`check-substitute-hedge-integrity: OK — 0 self-compared, ${r.structuralMirrors.length} same-organism hedge(s), all acknowledged.`)
  process.exit(bad ? 1 : 0)
}
