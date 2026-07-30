export const meta = {
  name: 'vb-make-it-exceptional',
  description: 'A dedicated 23-agent investigation to make the Vendor Benchmark tool more unique, powerful, cutting-edge and empowering across every dimension — grounded in the real codebase and its honesty constraints',
  phases: [
    { title: 'Investigate', detail: '16 specialists each own a dimension and propose concrete, feasible, empowering improvements' },
    { title: 'Verify', detail: '6 adversarial verifiers pressure-test every idea: honesty, feasibility, CI, voice, decision-value, differentiation' },
    { title: 'Synthesize', detail: 'consolidate into a ranked, implementation-ready roadmap' },
  ],
}

const ROOT = '/home/user/potentially-profitable'

// Shared grounding every agent receives — the tool, its current state, the HARD
// constraints, and the key files. This is what keeps the ideas real, not fantasy.
const CONTEXT = `
YOU ARE IMPROVING: the Vendor Benchmark tool at ${ROOT}/tools/vendor-benchmark/ (EN)
and ${ROOT}/es/tools/vendor-benchmark/ (ES) on muntin.digital — a free, on-device
tool for independent restaurant operators. It was just rebuilt.

WHAT IT DOES NOW (read the code before proposing): an operator enters an item + unit
+ a set of DATED invoice prices. The tool (a) flags a hike vs their OWN trailing
median (mirrors Muntin Ledger's rule), and (b) THE STAR FEATURE: reads the live Cost
Index wholesale series for the matched item and measures the MARKET's %-change over
the operator's EXACT date window, beside theirs — "your +18% vs the market +0.5% = a
17-point gap that's on your vendor." It shows a two-line indexed chart, a date-by-date
timeline, source attribution, and an honest funnel to Muntin Ledger. Runs entirely in
the browser; persists to localStorage via MuntinContext. EN + ES.

THE MISSION (single direction): make this tool MORE unique, MORE powerful, MORE
cutting-edge, MORE empowering, MORE genuinely useful to every everyday operator —
"bring the power to the people to understand, in a deep way, their relationship with
their costs," and funnel honestly to the Muntin Ledger sign-up. Not just data-viz —
ALL of it: the insight engine, input UX, empowerment, narrative, trust, mobile,
onboarding, differentiation, the funnel.

HARD CONSTRAINTS (an idea that violates these is dead — respect them or reframe):
1. HONESTY / FACT GATE. No invented data, cohorts, percentages, or peer stats. The
   Cost Index is a WHOLESALE reference; a delivered price legitimately runs higher, so
   NEVER assert "you should pay $X" or "you're overpaying" from wholesale alone — lead
   with rate-of-change. On thin/short market history, WITHHOLD the verdict. Any number
   in shipped prose must be sourced, cited, or labelled illustrative. Don is FOH manager
   at ONE brand (Tacombi, two locations) — never "two restaurants".
2. ON-DEVICE / NO-FETCH. The tool makes ZERO network calls (a CI gate enforces it: no
   fetch/XHR/sendBeacon; storage only via MuntinContext localStorage). This BLOCKS
   server-side AI, cloud OCR, live API pulls, accounts. Anything "smart" must run in
   the browser on data already shipped same-origin, or be reframed as a Ledger feature.
3. VOICE CANON. Second-person operator ("your invoices, your vendor"). Calm, exact,
   mid-formal. Banned words include just/simply/easy, no exclamation marks, no emoji,
   no rhetorical-question headlines. CTA to Ledger is "See Muntin Ledger →" at
   https://ledger.muntin.digital/ (Ledger is pre-launch; the "Invoice Decoder" is
   Ledger's invoice-reading engine, tease it, don't invent a separate signup URL).
4. CI GATES. Render via MuntinSafeHtml (no raw innerHTML), register analytics events
   before firing, inline SVG needs width+height, no fixed min-width>96px outside
   @media, EN/ES parity, colocated node:test for shared modules.

DATA + CODE ALREADY AVAILABLE (a goldmine — much is unused by this tool):
- ${ROOT}/data/cost-index.js (window.MUNTIN_COST_INDEX): 81 ingredients, each with
  assessment{ level:{medianCents,rangeCents,rangeBasis,provenance}, trend:{pct,dir},
  confidence, history:[{date,valueCents,source,basis}] }.
- ${ROOT}/data/cost-index-history.js (window.MUNTIN_COST_INDEX_HISTORY): ~3 years
  weekly wholesale history for 39 keys.
- ${ROOT}/tools/_shared/ has MANY pure, tested modules — most NOT surfaced in this
  tool. Skim the directory and their headers: market-window.js (this tool's engine),
  bench-lookup.js, cost-index-format.js (thenVsNow), fair-price-gap.js, cost-index-ui.js
  (slopeSvg/bandSvg/sparkSvg builders), sparkline.js, and especially the unused-here
  analytics: cost-cointegration, cost-leadlag, cost-conformal, basket-forecast,
  buy-or-ride, cost-anomaly, cost-basket, cost-pressure, blast-radius, composite-price,
  cost-confidence(-score), cost-history, portion-bridge, stem, sku-match, context-bus,
  safe-html, analytics. Read the headers of the ones relevant to your lens.
- The tool controller: ${ROOT}/tools/vendor-benchmark/vendor-benchmark.js
- Sibling tools for patterns: ${ROOT}/tools/{plate-cost,cost-pulse,margin-math}/

HOW TO PROPOSE: concrete, buildable, ranked. For each idea give the business DECISION
it enables and WHY it empowers the operator. Prefer ideas that use data/modules we
already have. Read code before you propose — cite files. No vague "add AI".`

// ---------------------------------------------------------------------------
phase('Investigate')

const IDEA_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    ideas: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          what: { type: 'string', description: 'concrete, buildable description; cite files/modules/data it uses' },
          decisionEnabled: { type: 'string', description: 'the specific business decision an operator makes better' },
          empowerment: { type: 'string', description: 'why it puts real understanding/power in the operator’s hands' },
          dataNeeded: { type: 'string', description: 'data/modules we ALREADY have vs. anything new (flag no-fetch blockers)' },
          effort: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
          impact: { type: 'integer', minimum: 1, maximum: 5 },
          uniqueness: { type: 'integer', minimum: 1, maximum: 5, description: 'how differentiating vs any competitor' },
          risks: { type: 'string', description: 'honesty / CI / voice / UX risks' },
        },
        required: ['title', 'what', 'decisionEnabled', 'empowerment', 'effort', 'impact', 'uniqueness'],
      },
    },
  },
  required: ['dimension', 'ideas'],
}

const INVESTIGATORS = [
  { key: 'dataviz', lens: 'RESULT DATA-VIZ & PRESENTATION. Deepen the charts and the reading of the result. Consider: shading the divergence wedge, a hover crosshair+tooltip, endpoint direct labels, a market-range band with a your-price pin (bandSvg exists), a 3-year context sparkline, small multiples for many items, a "lead with the gap" hero hierarchy, print/export-ready figures. Apply real dataviz discipline (emphasis form, one axis, CVD-safe, table-twin). Read cost-index-ui.js (slopeSvg/bandSvg/sparkSvg) and sparkline.js.' },
  { key: 'engine', lens: 'THE INSIGHT / ANALYTICS ENGINE. This is the biggest opportunity. Which of the many UNUSED shared modules can we honestly surface here to make the tool deeper? Read the headers of cost-cointegration, cost-leadlag, cost-conformal, basket-forecast, buy-or-ride, cost-anomaly, cost-pressure, cost-confidence(-score), composite-price, blast-radius, cost-history. Propose concrete insights: e.g. "the market usually leads your vendor by N weeks", a conformal prediction band for your NEXT delivery, a buy-now-or-ride signal, anomaly flags, seasonality. Each must be honest (direction/uncertainty, not fabricated precision) and computable on-device.' },
  { key: 'entry', lens: 'DATA ENTRY & INPUT UX. Entering dated prices by hand is the friction. Make it effortless: paste a spreadsheet/CSV block that parses into rows (plate-cost has parseTabularText), item-name autocomplete from the 81 Cost Index items, unit inference, smart date defaults/steppers, duplicate/typo guards, a saved-items picker so returning users pick an item they already track, keyboard-first flow. All on-device.' },
  { key: 'empower', lens: 'OPERATOR EMPOWERMENT / "POWER TO THE PEOPLE". What turns a reading into ACTION at the vendor. Consider: a printable/exportable one-page "bring-to-your-rep" brief (the item, your window, the market move, the gap, the ask) generated on-device; a suggested negotiation target ("the market supports ~$X"); a plain-language script of what to say; a dollars-per-month impact with an optional volume input; a shareable result. Keep every number honest (wholesale caveat).' },
  { key: 'differentiate', lens: 'DIFFERENTIATION & CUTTING-EDGE. What makes this genuinely unique and defensible vs any competitor or a distributor’s own dashboard? The matched-window market comparison IS novel. What else? A "conflict-free market truth" positioning, forecasting the next delivery honestly, a "fair-to-negotiate-to" band, the on-device privacy as a feature, the same-rule-as-Ledger trust bridge. Propose 4-6 moonshots + why each is hard to copy.' },
  { key: 'onboarding', lens: 'ONBOARDING / FIRST-RUN / WORKED EXAMPLES. Make a first-timer get an "aha" in seconds. Consider: multiple one-click examples across categories (a produce hedge case, a protein over-market case) that teach the honest behavior, a 20-second guided walkthrough, an empty-state that sells the payoff, contextual hints, a "why do I see this?" explainer drawer. Read the current controller’s loadExample.' },
  { key: 'narrative', lens: 'VERDICT COPY & NARRATIVE. The words are the product. Make the verdict sharper, more decision-driving, and more human within the voice canon (read ${ROOT}/methods/ #voice-contract and docs/voice-canon-*). Consider: the one-sentence headline, the "so what / do this next" line, framing the gap as the vendor’s not the weather’s, honest hedge language for thin data, the negotiation ask. Give rewritten example strings (EN + ES).' },
  { key: 'funnel', lens: 'LEDGER / DECODER FUNNEL. Deepen the honest free→paid path. Read ${ROOT}/ledger/index.html and the current funnelBlock. When does the strong CTA fire? What is the single most honest, compelling bridge from "you just did this by hand for one item" to "Ledger reads every invoice line and watches every item"? Consider a "multiply this across your whole invoice" tease, the decoder framing, a founding-list nudge. Stay honest (Ledger pre-launch).' },
  { key: 'a11y', lens: 'ACCESSIBILITY & INCLUSIVITY. Serve EVERY operator: screen-reader users, keyboard-only, colorblind, low-literacy, ESL, older devices, one-handed phone use in a loud kitchen. Audit the current DOM/ARIA and propose: table-twin for the chart, keyboard tooltip parity, focus order, plain-language mode, larger tap targets, reduced-motion, high-contrast, number-reading for screen readers. Concrete WCAG-level fixes.' },
  { key: 'trust', lens: 'TRUST / METHODOLOGY / TRANSPARENCY. The tool’s honesty is its moat. Propose ways to SHOW the work and earn trust: a "how we read the market" methodology drawer, per-reading source + freshness + confidence made visible, the "the Network tab stays empty" proof, a "why we won’t call this overpayment" honesty note, links to the dated public sources. Make transparency a feature, not fine print.' },
  { key: 'basket', lens: 'MULTI-ITEM / WHOLE-INVOICE / BASKET. Today it checks one item. An operator has a whole invoice. Propose a multi-item mode: track several items, a category rollup, "which lines drifted most", a basket-level "your invoice vs the market" (cost-basket.js / basket-forecast.js exist). What is the honest, on-device version, and where does it hand off to Ledger for the real thing?' },
  { key: 'journal', lens: 'PERSONAL DATA MACHINE / LONGITUDINAL. The on-device history is a growing asset. Propose making it a "price journal": your saved items over months, per-item trend cards, "you last checked this N weeks ago", a returning-user dashboard, the growing value of coming back — all via MuntinContext (read context-bus.js: benchHistory, dishCostHistory patterns). Honest, on-device, private.' },
  { key: 'siblings', lens: 'SIBLING-TOOL INTEGRATION & THE LADDER. Cross-wire with Plate Cost (what does this move do to my dish margin?), the Cost Index (the full market reading), Margin Math (price-raise). Read tools/_shared/context-bus.js handoff helpers and the sibling tools. Propose deep, honest links that make the whole suite feel like one instrument and route the operator to the right next decision.' },
  { key: 'mobile', lens: 'MOBILE / FIELD USE. An operator at the walk-in with a phone, invoice in hand. Propose the phone-first experience: quick single-check flow, big tap targets, a "snap-lite" (on-device only) or fast manual entry, sticky result, add-to-home-screen, works offline (it already needs no network). What makes it feel native and fast in a kitchen?' },
  { key: 'perf', lens: 'PERFORMANCE / RESILIENCE / GRACEFUL DEGRADATION. The Cost Index seeds are large (~900KB + history). Audit load cost and propose: lazy-loading the history seed, no-JS fallback, error/empty states, fast first paint, resilience if a module fails, caching. Keep the no-fetch promise. Concrete perf wins.' },
  { key: 'distribution', lens: 'DISCOVERABILITY / SHAREABILITY / DISTRIBUTION. How more operators find and share it. Propose: a shareable result (on-device, e.g. a generated image or a copyable summary), stronger schema/OG, a "vendor benchmark for {item}" content angle, embeddability, the story that makes it spread. Honest and privacy-safe (never leak the operator’s numbers).' },
]

const investigations = await parallel(INVESTIGATORS.map((inv) => () =>
  agent(`${CONTEXT}\n\nYOUR LENS: ${inv.lens}\n\nProduce 4-7 concrete, ranked improvement ideas for THIS lens only. Read the relevant code first. Every idea must be buildable under the hard constraints and must state the decision it enables and why it empowers the operator. Return the structured object.`,
    { label: `investigate:${inv.key}`, phase: 'Investigate', schema: IDEA_SCHEMA })
))

const allIdeas = []
INVESTIGATORS.forEach((inv, i) => {
  const r = investigations[i]
  if (r && Array.isArray(r.ideas)) r.ideas.forEach((idea) => allIdeas.push({ dimension: inv.key, ...idea }))
})
log(`Collected ${allIdeas.length} ideas across ${INVESTIGATORS.length} dimensions.`)

// A compact serialization of every idea for the verifiers to review.
const ideaDigest = allIdeas.map((x, i) =>
  `#${i} [${x.dimension}] ${x.title} — ${x.what} | decision: ${x.decisionEnabled} | effort ${x.effort} impact ${x.impact} unique ${x.uniqueness}`
).join('\n')

// ---------------------------------------------------------------------------
phase('Verify')

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    lens: { type: 'string' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          idea: { type: 'string', description: 'the idea title (or #index) being judged' },
          call: { type: 'string', enum: ['keep', 'refine', 'kill'] },
          reason: { type: 'string' },
          refinement: { type: 'string', description: 'if refine: the honest/buildable version' },
        },
        required: ['idea', 'call', 'reason'],
      },
    },
    topPicks: { type: 'array', items: { type: 'string' }, description: 'the 3-6 idea titles this lens most endorses' },
    themeSummary: { type: 'string', description: 'what this lens concludes overall, 3-5 sentences' },
  },
  required: ['lens', 'verdicts', 'topPicks', 'themeSummary'],
}

const VERIFIERS = [
  { key: 'honesty', lens: 'HONESTY & FACT-GATE. Kill or reframe any idea that would invent data, assert overpayment from wholesale, fabricate peer stats, extrapolate a $/month from one window without honest caveats, or otherwise mislead. The tool’s integrity is its moat — protect it. For borderline ideas, give the honest version.' },
  { key: 'feasible', lens: 'FEASIBILITY vs DATA + NO-FETCH. Judge each idea against what is actually buildable on-device from the shipped seeds + existing modules. Kill anything that secretly needs a network call, a server, an account, cloud OCR/AI, or data we do not have. For "smart" ideas, say exactly which shared module/data makes it real, or reframe as a Ledger feature.' },
  { key: 'ci-risk', lens: 'CI-GATES & IMPLEMENTATION RISK. Flag ideas that fight the gates (raw innerHTML, unregistered analytics, network, SVG dims, EN/ES parity, fixed min-width) and note the compliant path. Estimate real effort honestly and catch scope traps.' },
  { key: 'voice', lens: 'VOICE-CANON & BRAND FIT. Flag ideas whose copy or framing breaks the canon (banned words, exclamation/emoji, wrong POV, non-canon CTA, over-selling, hype). Keep it calm, exact, operator-second-person. Refine copy-heavy ideas.' },
  { key: 'decision-value', lens: 'DECISION-VALUE (the north star). Score how much each idea genuinely helps an everyday operator make a WELL-INFORMED business decision — not how clever it is. Ruthlessly separate decision-drivers from decoration. Name the 6-8 highest decision-value ideas.' },
  { key: 'differentiation', lens: 'DIFFERENTIATION & MOAT. Judge which ideas make the tool genuinely unique/defensible vs table-stakes any competitor has. Name the few that are cutting-edge and hard to copy, and the one or two moonshots worth betting on.' },
]

const verifications = await parallel(VERIFIERS.map((v) => () =>
  agent(`${CONTEXT}\n\nHere are ALL ${allIdeas.length} proposed ideas from the investigation team:\n\n${ideaDigest}\n\nYOUR VERIFICATION LENS: ${v.lens}\n\nReview EVERY idea through this lens. Return a verdict (keep/refine/kill) with a reason for the ones this lens has an opinion on (you need not judge all ${allIdeas.length} — focus where your lens bites, but be thorough), your top picks, and a theme summary. Reference ideas by their title. Read code to check claims where needed.`,
    { label: `verify:${v.key}`, phase: 'Verify', schema: VERIFY_SCHEMA })
))

// ---------------------------------------------------------------------------
phase('Synthesize')

const verifyDigest = VERIFIERS.map((v, i) => {
  const r = verifications[i]
  if (!r) return `## ${v.key}: (no result)`
  const kills = (r.verdicts || []).filter((x) => x.call === 'kill').map((x) => `KILL ${x.idea}: ${x.reason}`)
  const refines = (r.verdicts || []).filter((x) => x.call === 'refine').map((x) => `REFINE ${x.idea}: ${x.refinement || x.reason}`)
  return `## Verifier ${v.key}\nTHEME: ${r.themeSummary}\nTOP PICKS: ${(r.topPicks || []).join('; ')}\nKILLS: ${kills.join(' || ')}\nREFINES: ${refines.join(' || ')}`
}).join('\n\n')

const fullIdeas = JSON.stringify(allIdeas, null, 1)

const roadmap = await agent(
  `${CONTEXT}\n\nYou are the lead synthesist. The team produced ${allIdeas.length} ideas and 6 adversarial verification passes. Consolidate everything into a single, decisive, implementation-ready ROADMAP that serves the mission: make Vendor Benchmark more unique, powerful, cutting-edge and empowering — honestly.\n\nFULL IDEAS (JSON):\n${fullIdeas}\n\nVERIFIER FINDINGS:\n${verifyDigest}\n\nProduce a Markdown roadmap with:\n1. A one-paragraph thesis: the sharpest way this tool becomes exceptional.\n2. "Ship now — quick wins" (S/M effort, high decision-value, low risk): 5-8 items, each with what / the decision it enables / files touched / honesty note.\n3. "High-impact bets" (M/L): 4-6 items, same structure, with why they matter.\n4. "Moonshots / cutting-edge" (L/XL, genuinely differentiating): 2-4 items, with the moat and the honest version.\n5. "Killed / do-not-build" — ideas the verifiers rejected and the one-line reason (so we don’t revisit them).\n6. A recommended first PHASE-1 build set (what to implement first) and why that ordering.\nDedupe overlapping ideas across dimensions. Every kept item must respect the honesty/no-fetch/voice/CI constraints. Be concrete and ranked — this is a build plan, not a brainstorm.`,
  { label: 'synthesize:roadmap', phase: 'Synthesize', effort: 'high' }
)

return {
  ideaCount: allIdeas.length,
  investigatorDimensions: INVESTIGATORS.map((i) => i.key),
  ideas: allIdeas,
  verifications: verifications,
  roadmap: roadmap,
}
