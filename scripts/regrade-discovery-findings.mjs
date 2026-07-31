#!/usr/bin/env node
/**
 * regrade-discovery-findings.mjs — rebuild the hypothesis <-> kill-verdict join that
 * the discovery-run salvage lost, then grade the corpus by the finding engine's OWN rule.
 *
 * WHY THIS EXISTS
 * The FunSearch-style finding engine (docs/handoff/workflow-scripts/finding-engine-*.js)
 * grades a finding as a survivor only when:
 *
 *     kills.length >= LENS_COUNT && !kills.some(k => k.verdict === 'kill')
 *
 * The run was interrupted, and scripts/salvage-workflow-findings.mjs harvested agent
 * StructuredOutput objects BY SHAPE. KILL_SCHEMA objects carry only
 * {lensName, verdict, reasoning, fatalProblem, requiredCaveat} — no reference to the
 * hypothesis they judged. So the salvage arrived with 38 hypotheses and 21 free-floating
 * verdicts, and the survivor rule became uncomputable. Left unrepaired, the corpus reads
 * as "7 confirmed findings" — but `confirmed` is the VERIFIER's self-report on its own
 * execution, not a survivor grade. Those are different claims and must never be conflated:
 * seeding the engine's Deepen phase (`survivors.concat(weakened).slice(0, 8)`) off exec
 * outcomes would build a second discovery round on findings no adversary has ever seen.
 *
 * HOW THE JOIN WORKS
 * Kill reasoning quotes the finding's own computed statistics verbatim ("BAND 63 /
 * SEASON 84", "D=21", "p=0.566543"). Rare numeric tokens are therefore a far stronger
 * join key than prose similarity. Each verdict is scored against every hypothesis's
 * measuredResult + revisedClaim + code + provenance, weighting each shared token by
 * inverse document frequency so a token appearing in one hypothesis identifies it and a
 * token appearing in thirty identifies nothing. Exact-duplicate claims are merged FIRST —
 * without that, two identical hypotheses split their own evidence and every verdict
 * against them looks ambiguous.
 *
 * A match is only accepted above both an absolute score floor and a relative margin over
 * the runner-up. Anything below stays UNJOINED and is reported, never guessed. An
 * unjoined verdict is a known unknown; a wrongly joined one silently corrupts the grade.
 *
 * Usage:
 *   node scripts/regrade-discovery-findings.mjs              # grade + write graded JSON
 *   node scripts/regrade-discovery-findings.mjs --json       # machine output, no write
 *   node scripts/regrade-discovery-findings.mjs --self-test  # assertions only
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'docs/handoff/discovery-run/salvaged-findings.json')
const OUT = resolve(ROOT, 'docs/handoff/discovery-run/graded-findings.json')

/** Lenses the round-one kill panel runs. Matches LENS_COUNT in the engine harness. */
export const LENS_COUNT = 4
/** Minimum absolute score for a join to be considered at all. */
export const SCORE_FLOOR = 1
/** Minimum (best - runnerUp) / best for a join to be trusted. */
export const MARGIN_FLOOR = 0.25

// Numerics that appear everywhere and identify nothing.
const NOISE_NUM = new Set(['0', '1', '2', '3', '4', '5', '100', '12'])
const STOP = new Set(
  ('the a an and or of to in for is are be that this it as on with not but by from at we i he she they you ' +
    'which what when where how why all any each no nor so than then there these those finding hypothesis claim ' +
    'data file files repo record tracked number numbers value values run ran does did kill panel lens verdict ' +
    'reasoning problem caveat real code script node json').split(/\s+/)
)

/** Distinctive numeric tokens: decimals and multi-digit integers, minus years and noise. */
export function numTokens (s) {
  const out = new Set()
  for (const m of String(s ?? '').matchAll(/\d+(?:\.\d+)?/g)) {
    const t = m[0]
    if (NOISE_NUM.has(t)) continue
    if (/^\d{4}$/.test(t) && +t >= 1900 && +t <= 2100) continue
    out.add(t)
  }
  return out
}

/** Content words, 4+ chars, minus stopwords. */
export function wordTokens (s) {
  const out = new Set()
  for (const m of String(s ?? '').toLowerCase().matchAll(/[a-z][a-z-]{3,}/g)) {
    if (!STOP.has(m[0])) out.add(m[0])
  }
  return out
}

const flat = (x) => (Array.isArray(x) ? x.join(' ') : String(x ?? ''))
export const hypothesisHaystack = (h) =>
  [h.measuredResult, h.revisedClaim, h.claim, h.code, h.caveats, h.provenance].map(flat).join(' \n ')
export const killNeedle = (k) => [k.reasoning, k.fatalProblem, k.requiredCaveat].map(flat).join(' \n ')

const normClaim = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 160)

/** Group exact-duplicate claims; returns index -> canonical index. */
export function dedupeMap (hypotheses) {
  const groups = new Map()
  hypotheses.forEach((h, i) => {
    const k = normClaim(h.claim)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(i)
  })
  const canon = new Map()
  const dupes = []
  for (const g of groups.values()) {
    if (g.length < 2) continue
    dupes.push(g)
    for (const j of g.slice(1)) canon.set(j, g[0])
  }
  return { canon, dupes }
}

/**
 * Score one kill verdict against every hypothesis. Numerics are weighted 6x words
 * because they are quoted verbatim by the reviewer rather than paraphrased.
 */
export function scoreKill (kill, hNums, hWords) {
  const kn = numTokens(killNeedle(kill))
  const kw = wordTokens(killNeedle(kill))
  const df = (sets, t) => sets.reduce((n, s) => n + (s.has(t) ? 1 : 0), 0)
  return hNums.map((_, i) => {
    let s = 0
    for (const t of kn) if (hNums[i].has(t)) s += 6 / df(hNums, t)
    for (const t of kw) if (hWords[i].has(t)) s += 1 / df(hWords, t)
    return s
  })
}

/** Apply the engine's own survivor rule to one hypothesis' verdict set. */
export function gradeOf (kills) {
  const hasKill = kills.some((k) => k.verdict === 'kill')
  if (kills.length === 0) return 'NEVER-PANELED'
  if (kills.length < LENS_COUNT) return hasKill ? 'KILLED' : 'UNDER-COVERED'
  return hasKill ? 'KILLED' : 'SURVIVOR'
}

export function regrade (salvage) {
  const H = salvage.hypotheses || []
  const K = salvage.kills || []
  const { canon, dupes } = dedupeMap(H)
  const canonOf = (i) => (canon.has(i) ? canon.get(i) : i)

  const hNums = H.map((h) => numTokens(hypothesisHaystack(h)))
  const hWords = H.map((h) => wordTokens(hypothesisHaystack(h)))

  const assignments = K.map((k, ki) => {
    const raw = scoreKill(k, hNums, hWords)
    // Collapse duplicates onto their canonical index before ranking, or identical
    // hypotheses split their evidence and every verdict looks ambiguous.
    const merged = new Map()
    raw.forEach((v, i) => {
      const c = canonOf(i)
      merged.set(c, Math.max(merged.get(c) ?? 0, v))
    })
    const order = [...merged.entries()].sort((a, b) => b[1] - a[1])
    const [best, bestScore] = order[0] ?? [null, 0]
    const runnerUp = order[1]?.[1] ?? 0
    const margin = bestScore > 0 ? (bestScore - runnerUp) / bestScore : 0
    const joined = bestScore > SCORE_FLOOR && margin >= MARGIN_FLOOR
    return {
      killIndex: ki,
      lensName: k.lensName,
      verdict: k.verdict,
      hypothesis: joined ? best : null,
      bestScore: +bestScore.toFixed(3),
      runnerUp: +runnerUp.toFixed(3),
      margin: +margin.toFixed(3),
      joined
    }
  })

  const byHyp = new Map()
  for (const a of assignments) {
    if (!a.joined) continue
    if (!byHyp.has(a.hypothesis)) byHyp.set(a.hypothesis, [])
    byHyp.get(a.hypothesis).push(a)
  }

  const findings = H.map((h, i) => {
    const c = canonOf(i)
    const kills = c === i ? (byHyp.get(i) ?? []) : []
    return {
      index: i,
      duplicateOf: c === i ? null : c,
      execOutcome: h.outcome,
      grade: c === i ? gradeOf(kills) : 'DUPLICATE',
      claim: h.claim,
      claimHasUnfilledSlots: /\{[A-Za-z]\}/.test(String(h.claim ?? '')),
      revisedClaim: h.revisedClaim ?? null,
      hasCode: String(h.code ?? '').length >= 40,
      recomputable: String(h.code ?? '').length >= 40 && !!h.provenance,
      kills: kills.map((k) => ({ lensName: k.lensName, verdict: k.verdict, margin: k.margin }))
    }
  })

  const tally = {}
  for (const f of findings) tally[f.grade] = (tally[f.grade] ?? 0) + 1

  return {
    findings,
    assignments,
    dupes,
    tally,
    unjoined: assignments.filter((a) => !a.joined).length,
    fullyPaneled: findings.filter((f) => f.kills.length >= LENS_COUNT).length,
    survivors: findings.filter((f) => f.grade === 'SURVIVOR').map((f) => f.index),
    unfilledSlots: findings.filter((f) => f.claimHasUnfilledSlots).length,
    notRecomputable: findings.filter((f) => f.grade !== 'DUPLICATE' && !f.recomputable).map((f) => f.index)
  }
}

// ---------------------------------------------------------------------------
// self-test
// ---------------------------------------------------------------------------
function selfTest () {
  let n = 0
  const ok = (cond, msg) => {
    n++
    if (!cond) {
      console.error(`  FAIL: ${msg}`)
      process.exitCode = 1
    }
  }

  // tokenizers
  ok(numTokens('D=21 p=0.566543 in 2025').has('21'), 'keeps multi-digit int')
  ok(numTokens('D=21 p=0.566543 in 2025').has('0.566543'), 'keeps decimal')
  ok(!numTokens('in 2025 and 1998').has('2025'), 'drops years')
  ok(!numTokens('exactly 1 of 100').has('100'), 'drops noise numerics')
  ok(!numTokens('exactly 1 of 3').has('1'), 'drops single-digit noise')
  ok(wordTokens('The BAND coverage').has('band'), 'lowercases content words')
  ok(!wordTokens('the data of files').has('data'), 'drops domain stopwords')
  ok(!wordTokens('a in of to').size, 'drops short/stopwords entirely')

  // dedupe
  const dm = dedupeMap([{ claim: 'x y' }, { claim: 'q' }, { claim: 'X  Y ' }])
  ok(dm.canon.get(2) === 0, 'maps duplicate to canonical first index')
  ok(!dm.canon.has(1), 'unique claim is not remapped')
  ok(dm.dupes.length === 1 && dm.dupes[0].length === 2, 'reports one duplicate group of 2')

  // grade rule mirrors the engine
  ok(gradeOf([]) === 'NEVER-PANELED', 'no verdicts -> NEVER-PANELED')
  ok(gradeOf([{ verdict: 'survives-weakened' }]) === 'UNDER-COVERED', 'partial panel, no kill -> UNDER-COVERED')
  ok(gradeOf([{ verdict: 'kill' }]) === 'KILLED', 'a single kill is fatal even below lens count')
  ok(
    gradeOf(Array.from({ length: LENS_COUNT }, () => ({ verdict: 'survives-weakened' }))) === 'SURVIVOR',
    'full panel with no kill -> SURVIVOR'
  )
  ok(
    gradeOf([...Array.from({ length: LENS_COUNT - 1 }, () => ({ verdict: 'survives-weakened' })), { verdict: 'kill' }]) === 'KILLED',
    'full panel containing one kill -> KILLED'
  )

  // scoring prefers the hypothesis quoting the same rare number
  const hyps = [
    { claim: 'alpha', measuredResult: 'value 887654 observed' },
    { claim: 'beta', measuredResult: 'value 222 observed' }
  ]
  const hn = hyps.map((h) => numTokens(hypothesisHaystack(h)))
  const hw = hyps.map((h) => wordTokens(hypothesisHaystack(h)))
  const sc = scoreKill({ reasoning: 'I reproduced 887654 exactly' }, hn, hw)
  ok(sc[0] > sc[1], 'rare numeric drives the join to the right hypothesis')

  // a verdict quoting nothing distinctive must NOT be force-joined
  const flat2 = regrade({ hypotheses: hyps, kills: [{ lensName: 'x', verdict: 'kill', reasoning: 'observed value' }] })
  ok(flat2.assignments[0].joined === false, 'non-distinctive verdict stays unjoined rather than guessed')
  ok(flat2.tally['NEVER-PANELED'] === 2, 'unjoined verdict leaves both hypotheses unpaneled')

  // duplicates never absorb their own grade twice
  const dupRun = regrade({
    hypotheses: [{ claim: 'same', measuredResult: '99887' }, { claim: 'same', measuredResult: '99887' }],
    kills: []
  })
  ok(dupRun.findings[1].grade === 'DUPLICATE', 'second copy of a claim is graded DUPLICATE')
  ok(dupRun.findings[1].duplicateOf === 0, 'duplicate points at its canonical index')

  console.log(`self-test: ${n} assertions${process.exitCode ? ' — FAILURES ABOVE' : ' passed'}`)
}

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) {
  selfTest()
} else {
  const salvage = JSON.parse(readFileSync(SRC, 'utf8'))
  const r = regrade(salvage)

  if (argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2))
  } else {
    console.log('=== DISCOVERY CORPUS REGRADE (engine rule: >=%d lenses AND no "kill") ===', LENS_COUNT)
    console.log('hyp  exec-outcome  lenses  grade                  verdicts')
    for (const f of r.findings) {
      if (f.grade === 'DUPLICATE') continue
      if (!f.kills.length && f.execOutcome !== 'confirmed') continue
      console.log(
        String(f.index).padStart(3),
        String(f.execOutcome).padEnd(13),
        String(f.kills.length).padStart(6),
        f.grade.padEnd(22),
        f.kills.map((k) => `${k.lensName}:${k.verdict}`).join(' ')
      )
    }
    console.log('\ntally:', JSON.stringify(r.tally))
    console.log('fully paneled:', r.fullyPaneled, '| survivors:', r.survivors.length ? r.survivors.join(',') : 'NONE')
    console.log('unjoined verdicts:', r.unjoined, '/', salvage.kills.length)
    console.log('duplicate groups:', JSON.stringify(r.dupes))
    console.log('claims with unfilled {N} slots:', r.unfilledSlots, '/', r.findings.length, '— publish revisedClaim, never claim')
    console.log('not recomputable (no code/provenance):', JSON.stringify(r.notRecomputable))

    writeFileSync(
      OUT,
      JSON.stringify(
        {
          _doc:
            'Regrade of docs/handoff/discovery-run/salvaged-findings.json by scripts/regrade-discovery-findings.mjs. ' +
            'Rebuilds the hypothesis<->kill join the salvage lost and applies the finding engine\'s own survivor rule. ' +
            'IMPORTANT: `execOutcome` is the VERIFIER\'s self-report on its own execution; `grade` is the ADVERSARIAL ' +
            'result. A hypothesis can be execOutcome=confirmed and grade=NEVER-PANELED — that is not a finding, it is ' +
            'an unreviewed claim. Only grade=SURVIVOR clears the engine\'s bar.',
          _generated: `regenerate with: node scripts/regrade-discovery-findings.mjs`,
          rule: { LENS_COUNT, SCORE_FLOOR, MARGIN_FLOOR },
          ...r
        },
        null,
        2
      ) + '\n'
    )
    console.log('\nwrote', OUT.replace(ROOT + '/', ''))
  }
}
