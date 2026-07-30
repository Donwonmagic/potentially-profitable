export const meta = {
  name: 'vb-whole-product-audit',
  description: 'Adversarial whole-product audit of Vendor Benchmark — find + verify the highest-leverage improvements',
  phases: [
    { title: 'Audit', detail: '7 specialist lenses review the shipped product for high-leverage improvements' },
    { title: 'Verify', detail: 'each finding adversarially verified against the real code' },
    { title: 'Synthesize', detail: 'rank the confirmed levers into an improvement roadmap' },
  ],
}

const CTX = `
You are auditing the SHIPPED Vendor Benchmark tool on muntin.digital — a restaurant-operator tool
that reads the wholesale market's move over an operator's exact invoice window and answers "was that
the market, or your vendor?". It just went through a 15-item world-class elevation. Your job is to find
the HIGHEST-LEVERAGE IMPROVEMENTS — real defects AND the biggest next moves — not nitpicks. Prioritize
impact. A finding must be PROVABLE from the actual code (file:line + concrete scenario); default to no
finding if you can't prove it. Read the real files.

FILES:
- tools/vendor-benchmark/index.html (EN) + es/tools/vendor-benchmark/index.html (ES): markup + a large
  inline <style> (the --vb-* "market instrument" material system + every surface). The two must stay
  EN/ES parity (the <style> blocks are byte-identical; a gate enforces surface parity).
- tools/vendor-benchmark/vendor-benchmark.js: the shared logic. Key pieces (grep for them): initItemCombo
  (ARIA combobox), the journal ring (ringOf/priorCheck/saveToJournal), maybeLoadHistoryShard (per-item
  deep-history loading), the share codec (encodeState/hydrateFromHash, base64url), parsePastedRows
  (paste-a-table), the motion gate (lastSig/animateThis) + animateHero (count-up) + the chart stroke-draw,
  the privacy monitor (installPrivacyMonitor/vbScan — observe-only fetch/XHR/beacon wrap), initProvenance,
  the first-run onboarding (setFirstRun/clearFirstRun + ghost), SCENARIOS/loadScenario, gapSpark/
  gapDistribution (Your Book), contextBlock (ADR-012 market context), the a11y helpers (revealResult).
- tools/_shared/market-window.js (MW.compute — the verdict engine), cost-index-lookup.js (match),
  safe-html.js (the h/sh/setHTML escapers).
- data/cost-index-picker.js (81-item manifest), cost-index-context.js, data/ci-history/*.js (shards).
- scripts/check-{cost-index-picker,vb-scenarios,tool-no-fetch}.mjs (the gates).

THE PRODUCT'S MOAT — improvements must live inside it (it's the differentiator, not a limitation):
- On-device + PRIVATE: the operator's typed prices never leave the browser; no account, no upload; a live
  monitor proves outbound requests carrying a price stay at 0. Any analytics is anonymized enums.
- No caching service worker (would violate the documented no-fetch-interception posture in
  security-claims.json). Static HTML + vanilla JS, no backend/framework, one-person maintainer.
- HONESTY (absolute): the Cost Index is a WHOLESALE reference; delivered price legitimately runs higher;
  NEVER claim overpayment from wholesale alone; every number sourced/cited/illustrative; no fake data.
  --vb-signal is reserved chrome (never a verdict tone); verdict tones (--rust/--teal/--status-*) are the
  reserved verdict palette.

Return your findings for YOUR lens only. For each: severity, leverage, the exact evidence, a concrete fix,
and rough effort. Be specific and opinionated about what would most move this from "great" to
"category-defining". Do not edit files.
`

const FINDINGS = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'severity', 'leverage', 'evidence', 'fix', 'effort'],
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          leverage: { type: 'string', enum: ['high', 'medium', 'low'] },
          evidence: { type: 'string', description: 'file:line + concrete scenario proving it' },
          fix: { type: 'string' },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object', additionalProperties: false, required: ['real', 'reason', 'leverage_confirmed'],
  properties: {
    real: { type: 'boolean', description: 'true only if reproducible/provable from the code' },
    reason: { type: 'string', description: 'why real or refuted — cite the code you checked' },
    leverage_confirmed: { type: 'string', enum: ['high', 'medium', 'low', 'overstated'] },
  },
}

const LENSES = [
  { key: 'correctness', brief: `LENS: Correctness & robustness. Hunt real runtime bugs / edge cases across ALL the shipped JS — the combobox (keyboard/aria/filter/select), the journal ring (coalescing, priorCheck timing, back-compat, storage-quota), the shard loader (re-run, race, missing item), the share codec (encode/decode/hydrate, malformed hash, huge payload), the paste parser (odd formats, false positives), the motion (rAF cleanup, detached nodes, gate edge cases), the privacy monitor (any way it breaks a request or false-counts), contextBlock, gapSpark, first-run lifecycle. What breaks?` },
  { key: 'honesty', brief: `LENS: Honesty, fact-gate & moat integrity. Does ANY surface over-claim, mislead, or erode the on-device/private/no-fetch moat? Is every displayed number sourced/computed/illustrative (no invention)? Does the shareable link's price-in-fragment stay honest? Does the privacy counter's claim hold under all paths? Is --vb-signal ever a verdict tone (or a verdict tone used as chrome)? Any wholesale-vs-delivered slippage, any "overpayment" implication? The highest-leverage honesty risk?` },
  { key: 'ux', brief: `LENS: UX & product coherence. Does the WHOLE surface hang together — first-run → entry → verdict → Your Book → share → funnel? Find redundancy, confusion, dead ends, competing CTAs, the weakest step in the journey, and the ONE highest-leverage UX change that would most improve comprehension or activation. Is the information hierarchy right? Is anything shipped-but-invisible or rarely-reached?` },
  { key: 'a11y', brief: `LENS: Accessibility (WCAG 2.2 AA+). Audit the WHOLE tool's non-visual + keyboard experience end-to-end: the combobox, the result/verdict flow, the chart's spoken conclusion, the journal, the demos, the share, forms/errors, focus order across the new surfaces, reduced-motion, contrast of every new token pairing, target sizes. Where does a screen-reader or keyboard-only operator get lost or under-served? Highest-leverage a11y lever?` },
  { key: 'performance', brief: `LENS: Performance (Core Web Vitals + felt speed on a cheap kitchen phone). The tool still lazy-loads ~887KB cost-index.js (market seed, all items) for matching. Audit the load path, LCP/CLS/INP, the motion cost, the eager vs lazy split, the combobox building 81 options, the re-run-on-shard-load double compute. What's the single biggest perf lever left (given the no-fetch/no-backend constraints)?` },
  { key: 'craft', brief: `LENS: Visual & interaction craft — does it LOOK and FEEL best-in-class (Linear/Stripe/Vercel bar)? Audit the coherence of the --vb-* material system across ALL the new surfaces (combobox, provenance strip, privacy counter, ghost, demos, Your Book sparkline/strip, context line, share), typography, spacing rhythm, dark mode, mobile layout, motion polish, and the overall "is this a 2026 flagship" feel. Where does craft fall short of the ambition, and what's the highest-leverage craft upgrade?` },
  { key: 'competitive', brief: `LENS: Competitive / category-defining. Step back: what is the ONE highest-leverage move (or 2-3) that takes this from "an excellent honest free tool" to "the category-defining reference operators tell each other about" — WITHIN the moat (on-device, private, no-backend, honest)? Think about the deepest honest use of the data already present, the network/word-of-mouth loop, the wedge into Muntin Ledger, and what a world-class team would build next. Name concrete, buildable moves.` },
]

phase('Audit')

// Find → adversarially verify each finding, pipelined so each lens's findings verify as soon as ready.
const perLens = await pipeline(
  LENSES,
  (lens) => agent(CTX + '\n\n' + lens.brief, { label: 'find:' + lens.key, phase: 'Audit', schema: FINDINGS })
    .then((r) => ({ lens: lens.key, findings: (r && r.findings) || [] })),
  (found) => {
    if (!found || !found.findings.length) return { lens: found ? found.lens : '?', verified: [] };
    return parallel(found.findings.map((f) => () =>
      agent(`Adversarially verify this audit finding on the Vendor Benchmark tool. Read the cited code and either REPRODUCE/PROVE it or REFUTE it. Be skeptical — many audit findings are plausible but wrong or overstated. Also judge whether the LEVERAGE claim holds (is it really high-impact?).\n\nFINDING (lens: ${found.lens}):\n- title: ${f.title}\n- severity: ${f.severity} · leverage: ${f.leverage} · effort: ${f.effort}\n- evidence: ${f.evidence}\n- proposed fix: ${f.fix}\n\n${CTX}`,
        { label: 'verify:' + found.lens, phase: 'Verify', schema: VERDICT })
        .then((v) => ({ ...f, lens: found.lens, verdict: v }))
        .catch(() => null)
    )).then((vs) => ({ lens: found.lens, verified: vs.filter(Boolean).filter((x) => x.verdict && x.verdict.real) }));
  }
)

const confirmed = perLens.filter(Boolean).flatMap((x) => x.verified);

phase('Synthesize')

const SYNTH = {
  type: 'object', additionalProperties: false,
  required: ['biggest_lever', 'quick_wins', 'roadmap', 'overall_read'],
  properties: {
    overall_read: { type: 'string', description: 'One paragraph: how strong is the product, and where the real headroom is.' },
    biggest_lever: { type: 'string', description: 'The single highest-leverage improvement and why.' },
    quick_wins: { type: 'array', items: { type: 'string' }, description: 'S-effort high-value fixes to do first.' },
    roadmap: {
      type: 'array', description: 'Ranked improvements, highest-leverage first.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['rank', 'title', 'lens', 'why_high_leverage', 'severity', 'effort'],
        properties: {
          rank: { type: 'integer' },
          title: { type: 'string' },
          lens: { type: 'string' },
          why_high_leverage: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
        },
      },
    },
  },
}

const synthesis = await agent(
  `You are the audit synthesizer. Below are the ADVERSARIALLY-CONFIRMED findings (refuted/overstated ones already dropped) from a 7-lens whole-product audit of the Vendor Benchmark tool. De-duplicate across lenses, then rank by LEVERAGE (impact × how much it advances "great → category-defining") × feasibility within the moat (on-device, private, no-backend, honest, one-person maintainer). Separate the S-effort quick wins from the bigger bets. Name the single biggest lever. Be honest if the product is already near-optimal on some axis. This feeds a recurring improvement loop, so the ranking must be actionable.\n\nCONFIRMED FINDINGS (JSON):\n` +
    JSON.stringify(confirmed, null, 1),
  { label: 'synthesis', phase: 'Synthesize', schema: SYNTH, effort: 'high' }
)

return { synthesis, confirmedCount: confirmed.length, byLens: perLens.filter(Boolean).map((x) => ({ lens: x.lens, confirmed: x.verified.length })) }
