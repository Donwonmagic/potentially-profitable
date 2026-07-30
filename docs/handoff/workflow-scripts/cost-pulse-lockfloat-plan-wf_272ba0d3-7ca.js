export const meta = {
  name: 'cost-pulse-lockfloat-plan',
  description: 'A full product-planning team for the reframed Cost Pulse — the "lock or float" price-predictability instrument for independent restaurant operators. ~13 expert lenses plan boldly + usefully on the honest conformal-band spine, then a chief architect synthesizes one coherent plan and adversarial critics pressure-test it for boldness, real operator usefulness, and honesty/feasibility.',
  phases: [
    { title: 'Plan', detail: 'one expert lens per planning dimension' },
    { title: 'Synthesize', detail: 'chief product architect reconciles into one bold plan' },
    { title: 'Critique', detail: 'adversarial usefulness / boldness / honesty-feasibility critics' },
    { title: 'Finalize', detail: 'revise the plan against the critiques' },
  ],
};

const REPO = '/home/user/potentially-profitable';

const CONTEXT = `
=== THE PRODUCT ===
Cost Pulse (tools/cost-pulse/index.html on muntin.digital) — a FREE tool for independent restaurant operators, the free top-of-funnel for the paid product Muntin Ledger (which reads an operator's invoices off a photo/PDF and flags hikes against their own history). muntin.digital is a one-person, product-only restaurant-intelligence company.

=== THE PIVOT (why we are planning) ===
Cost Pulse was framed as a "forward timing engine" that predicts where ingredient prices are headed. A dedicated statistical-rigor audit (9 statisticians) DEMOLISHED that thesis: on the real shipped data, direction is unpredictable (the 1-step edge dies at 2 steps and goes negative), the spike/"re-price"/"renegotiate" verbs fire on ~99.5% of items under pure noise, "X leads Y" is spurious level-correlation, "market stepped up" is a non-stationarity artifact, and range-position is a coin-flip for the next move. When we ran a proper per-item null gate + multiplicity correction, 0 of ~44 action reads beat their own noise. All of that has now been remediated (verbs demoted to descriptions, gates added, coverage de-circularized, withholding enforced) and shipped.
The NEW direction, chosen by the owner: reframe Cost Pulse as a LOCK-OR-FLOAT instrument. The one thing the audit CERTIFIED as honest and forward is the conformal band: not WHICH WAY a price goes, but HOW FAR its next print tends to move, with a backtested hit-rate + confidence interval. That is a VOLATILITY / PREDICTABILITY read, and predictability maps to a real operator decision: can I LOCK this (a standing order, a fixed-price contract, a menu price I set and forget) or must I FLOAT it (buy spot, keep a cushion, revisit often)? Lock-or-float needs NO direction call — it is honest by construction.

=== THE HONEST SPINE (what the tool CAN say — build only on this) ===
1. Measured wholesale LEVEL, sourced + cited (e.g. "butter ~$1.61/lb wholesale"). Wholesale != delivered; delivered runs higher.
2. The PREDICTABILITY BAND (the certified-honest forward element): the conformal interval around the next print, ASYMMETRIC (up/down differ), with a RAW walk-forward coverage rate + Wilson CI ("a band this wide caught the next weekly print 75% of the time, 64-84%, over 148 reads"). Tight band + good coverage = lockable; wide band = float.
3. The 3-YEAR TRAJECTORY (how it has moved — pure description) and WHERE-TODAY-SITS in its own recent range + its SEASONAL position (gated >=2yr).
4. The WITHHOLDING DISCIPLINE as a first-class feature: 42 of 81 ingredients get no band at all; monthly beef (n=27) is withheld; flat/stale series (spinach) withheld; too-volatile (tomato +/-51%, eggs +/-65%) withheld. "We won't call it" is the honesty moat.

=== WHAT THE TOOL MUST NEVER SAY (audit-forbidden) ===
Which way a price will move; "re-price / renegotiate / lock now before it rises" (opportunity-timing implies direction); "X leads Y"; "the market stepped up around {date}"; "near a 3-year low so buy"; any "you should pay $X" (Cost Index is a WHOLESALE reference; delivered runs higher; never assert overpayment from wholesale). Lock-or-float is RISK/PLANNING framing (predictable enough to commit vs too volatile to commit), NEVER opportunity/direction.

=== THE REAL DATA (ground your plan in this) ===
40 ingredients have deep history. Bucketed by band half-width: ~18 LOCKABLE (tight, well-covered: butter +/-4% held 75%, cheddar -3/+2% held 79%, whole chicken, pork shoulder/loin, whole turkey, onions, garlic, avocado, bananas, carrots...), ~6 CUSHION (8-20%: apples -10/+7, romaine, bell pepper), ~4 FLOAT (20-30%: russet potato +/-21%, broccoli, blueberries, cauliflower), ~12 WITHHELD (monthly-thin beef n=27; flat/stale spinach/mushroom/sweet-potato at +/-0%; too-wild tomato/eggs/watermelon/raspberries). 42/81 ingredients have no deep band at all.

=== TARGET USER (be legitimately useful to THIS person) ===
An independent restaurant operator: owner/chef/FOH-manager of a one-location or tiny shop, no purchasing department, time-poor, often on a PHONE in a kitchen or between shifts, skeptical of hype and "AI" claims, makes real decisions weekly about what to order, whether to sign a standing-order/contract, how much cushion to build into a menu price, when to switch a spec. Their real pain: an invoice jumps and they can't tell if it's the market or their vendor; they set a menu price and get squeezed; they don't have the institutional price memory a chain's buyer has.

=== BRAND + VOICE + CONSTRAINTS ===
Brand: financial-grade slate+blue palette (accent blue #2a50c8), editorial warmth via a serif display; honesty is the differentiator. Voice canon (/methods #voice-contract): second-person operator, no exclamation/emoji/hype, banned words include just/simply/easy; CTA is "See Muntin Ledger ->" at https://ledger.muntin.digital/. Bilingual EN/ES. Tech constraints: static HTML + pure shared JS modules in tools/_shared/ (cost-index-ui.js renders the tool; cost-conformal.js gives the band; cost-null-gate.js the significance gate); NO network fetch and NO localStorage.setItem (persistence only via MuntinContext); CI gates enforce no raw innerHTML, registered analytics events, SVG width+height, EN/ES locale parity, meta <=155 chars, a no-fetch invariant, deterministic builds. A working prototype ("lock-or-float v1": a predictability ladder + bucketed lock/cushion/float/withheld cards with real numbers) already exists.

=== YOUR JOB ===
Read the real code and data where useful (the modules above, data/cost-index.json, data/cost-index-history.json, tools/cost-pulse/index.html, tools/_shared/cost-index-ui.js). Plan for your assigned lens so the reframed Cost Pulse is BOTH (a) BOLD — a distinctive product with a strong point of view an operator remembers and tells a friend about — AND (b) LEGITIMATELY USEFUL — it changes a real decision the target operator makes, honestly, on the spine above. No vaporware, no forbidden claims. Concrete over generic. Return the structured plan only.`;

const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'thesis', 'operatorValue', 'recommendations', 'honestyGuardrails'],
  properties: {
    lens: { type: 'string' },
    thesis: { type: 'string', description: 'the bold point of view this lens brings, 1-3 sentences' },
    operatorValue: { type: 'string', description: 'the specific decision this changes for the target operator, and why they care' },
    recommendations: {
      type: 'array', minItems: 3, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'what', 'why', 'boldness', 'usefulness', 'effort'],
        properties: {
          title: { type: 'string' },
          what: { type: 'string', description: 'concrete: what gets built/said/shown, grounded in the real spine + data' },
          why: { type: 'string', description: 'the operator payoff' },
          boldness: { type: 'integer', minimum: 1, maximum: 5 },
          usefulness: { type: 'integer', minimum: 1, maximum: 5 },
          effort: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
        },
      },
    },
    honestyGuardrails: { type: 'string', description: 'what must stay true to the audit for this lens — the forbidden claims to avoid' },
    dependencies: { type: 'string' },
  },
};

const DIMENSIONS = [
  { key: 'positioning', prompt: `LENS: PRODUCT STRATEGY & POSITIONING. Define the bold thesis and category. What IS lock-or-float Cost Pulse in one sentence an operator repeats? What is the wedge that makes "the tool that tells you which prices you can plan around" a category of one? How does "we withhold what we can't stand behind" become the moat, not an apology? Name it, position it against every over-claiming price tool, and state the single most important thing it must nail.` },
  { key: 'jobs-to-be-done', prompt: `LENS: OPERATOR JOBS-TO-BE-DONE. Map the real decision moments of an independent operator where lock-or-float earns its keep: signing a standing order / fixed-price contract; setting or holding a menu price; deciding how much cushion to build into a plate cost; choosing which items to buy spot vs commit; switching a spec when an item goes wild. For each moment: what does the operator ask, what does the tool show, what do they DO differently. Be concrete to restaurant reality, not abstract.` },
  { key: 'ia-ux', prompt: `LENS: INFORMATION ARCHITECTURE & UX FLOW. Design the operator's path: landing (the predictability spectrum as the thesis-at-a-glance) -> their own ingredients -> a per-item decision view -> the handoff. What are the primary screens/states, what is above the fold on a phone, how does a time-poor operator get to a decision in under a minute? Where does the withholding show up so it reads as rigor, not gaps? Keep it buildable as static HTML + cost-index-ui.js.` },
  { key: 'dataviz', prompt: `LENS: DATA VISUALIZATION — the predictability instrument. Design the hero viz (the "predictability spectrum" ladder) and the per-item viz deeply: how to encode an ASYMMETRIC band, its coverage + CI, the 3-yr trajectory, where-today-sits, and seasonal position so a layperson reads volatility instantly. Status ramp (lock=green, cushion=amber, float=red, withheld=slate) with redundant non-color encoding. What single view makes "this one is tight, that one is wild" land in two seconds? CSP-safe inline SVG, width+height, table twins, reduced-motion.` },
  { key: 'decision-engine', prompt: `LENS: THE DECISION ENGINE (honest logic). Specify EXACTLY how conformal outputs become lock / cushion / float / withheld: the thresholds (band half-width cutoffs, coverage floor, effective-n floor, degeneracy, cadence/horizon), the tie-breaks, and the precise per-bucket COPY that states a volatility/planning read WITHOUT a direction or opportunity claim. Enumerate the withhold reasons (monthly-thin, flat/stale, too-volatile, no-deep-series) and how each is phrased as rigor. Name every place the audit's forbidden claims could sneak back in and how the rules prevent them.` },
  { key: 'personalization', prompt: `LENS: PERSONALIZATION — the operator's own book. How does the tool become about THEIR ingredients and THEIR stakes without fetch or PII? A basket/watchlist via URL params + MuntinContext (localStorage through the context bus only); their weekly volume -> the $ / year a lockable vs floaty item is worth; a saved "lock list" they build over visits. What compounds so they come back weekly? Respect the no-fetch / no-localStorage.setItem invariant (MuntinContext only).` },
  { key: 'funnel', prompt: `LENS: THE FUNNEL TO MUNTIN LEDGER. Lock-or-float tells an operator an item is lockable; whether their VENDOR actually tracked the market is a different question only their invoices answer. Design the honest handoff: the CTA moments, how the "lock list" or a wild item becomes a reason to watch invoices, the bridge to the Vendor Benchmark tool ("add your own price"), and the Ledger pitch (deterministic invoice reading, flags hikes vs your own history). CTA canon: "See Muntin Ledger ->". No dark patterns.` },
  { key: 'trust-education', prompt: `LENS: TRUST, EDUCATION & THE HONESTY MOAT. How to teach "predictability is not prediction" so the operator trusts a tool that refuses to forecast? Design the methodology transparency (open the backtest, show the coverage, explain why we withhold), the "why 0 moves cleared the bar this week" honesty banner as a feature, and the AEO/SEO story ("which food prices are stable / volatile right now"). Make honesty legibly the reason to trust it over hype tools.` },
  { key: 'voice-copy', prompt: `LENS: VOICE & COPY. Write the bold-but-honest voice: the hero headline + subhead, the lock/cushion/float/withheld bucket names + verbs + one-line reads, the band caption pattern, the withhold phrasings, and the Ledger CTA lead. Second-person operator, no hype/exclamation, banned words just/simply/easy, financial-grade calm. Give 2-3 real alternative headlines. It must sound like a sharp, honest colleague, not a dashboard.` },
  { key: 'engineering', prompt: `LENS: ENGINEERING & FEASIBILITY. Plan the build on the static site: what to reuse (cost-index-ui.js renderer, cost-conformal.js, cost-null-gate.js, the seed data), what new shared module(s) to add (e.g. a predictability classifier), the render path (server-built pages vs client tool), the phased delivery, and every CI gate it must pass (no raw innerHTML -> MuntinSafeHtml, registered analytics events, SVG width+height, EN/ES locale parity, meta <=155, no-fetch invariant, deterministic). Flag the hard parts and the 80/20.` },
  { key: 'a11y-mobile', prompt: `LENS: ACCESSIBILITY & MOBILE. The operator is on a phone in a kitchen. Plan mobile-first layout for the ladder + cards, touch targets, the band viz shrunk-legible with an accessible table twin, screen-reader narration of a band ("caught the next print 75% of the time, band minus 4 to plus 4 percent"), color-independent bucket encoding, reduced-motion, and offline-friendliness (no fetch anyway). What breaks on a 360px screen and how to fix it.` },
  { key: 'moonshots', prompt: `LENS: BOLD BETS / MOONSHOTS. Propose the risky, differentiating ideas that make this legitimately special and worth telling a friend about — but that stay inside the honest spine and the no-fetch/static constraints. Examples to beat: a printable "lock list" an operator hands their rep; a seasonal lock-window read ("this item is usually cheapest + calmest in month X"); a "what a 5% cushion costs you per year" calculator; a shareable "state of the walk-in" snapshot; a spec-swap suggester (when your item goes float, here's a calmer sibling). Push further. Rank by boldness x usefulness; kill anything that needs a forecast.` },
  { key: 'ux-ui', prompt: `LENS: UX/UI & INTERACTION DESIGN (the craft layer). Distinct from IA/flow and from dataviz: design the VISUAL SYSTEM and INTERACTION craft that makes lock-or-float feel premium, trustworthy, and unmistakably Muntin. Cover: the design language on the financial-grade slate+blue palette + serif display (type scale, spacing, elevation, the neutral bias); the component system (hero, the predictability ladder, per-item cards, pills/badges, the asymmetric-band component, the withheld state); interaction + micro-interaction patterns (hover/tap/focus states, a crosshair or tap-to-inspect on a band, expand-for-detail, empty/withheld/loading states, a restrained first-load reveal) that respect prefers-reduced-motion and keyboard focus; responsive behavior; and the "feel" that separates a memorable instrument from a competent dashboard. What ONE signature visual or interaction moment does an operator remember and screenshot? Keep everything buildable as CSP-safe static HTML/CSS/inline-SVG with NO external assets or webfonts, and honor the voice/brand.` },
  { key: 'api-integration', prompt: `LENS: API & DATA INTEGRATION (manual now, automatic later). The free Cost Pulse tool is strictly no-fetch/static and must stay that way. But the owner's roadmap is "manual now, automatic later via the Muntin Invoice Decoder / Ledger." Plan the INTEGRATION architecture bridging the free market tool to the operator's own data WITHOUT breaking the free tool's invariant: (1) UPSTREAM — the data pipeline that vendors the honest spine: how USDA/BLS/FRED public price feeds flow into the DETERMINISTIC build of the cost-index seed + conformal bands (a build-time pipeline that must never leak a client fetch), how new reads refresh predictability, and how provenance/citation is preserved end to end; (2) DOWNSTREAM — the product bridge: how an AUTHENTICATED Muntin Ledger surface (where fetch/auth IS allowed, unlike the free tool) pulls the operator's OWN invoiced prices and overlays them on the market lock-or-float read — turning "this item is lockable" into "and here is whether YOUR vendor actually tracked it" (the "is it you or the market" payoff), reusing the shared cost-alerts/conformal TS port that already exists in the Ledger repo; (3) THE HANDOFF CONTRACT — what data/shape crosses the free<->paid boundary, how the free tool hands a "lock list"/watchlist to the product via URL params + MuntinContext (never a fetch, never PII in the free surface), the API contract for the authenticated overlay, and the sequencing (what ships static-first vs behind auth). Flag concrete integration points, data contracts, failure modes, and the exact line between the public static tool and the authenticated integrated experience.` },
  { key: 'kill-list', prompt: `LENS: WHAT TO CUT (anti-scope). Name the seductive features we must NOT build because they violate the honest spine, the operator's real needs, or the constraints — and what to build instead. E.g. forecasts/price targets, "buy now" opportunity timing, cross-ingredient "leads" viz, alerts implying direction, anything needing a live fetch. For each: why it is tempting, why it fails, the honest substitute. A crisp kill-list keeps the plan disciplined.` },
];

phase('Plan');
const plans = (await parallel(DIMENSIONS.map((d) => () =>
  agent(`${CONTEXT}\n\n=== YOUR LENS ===\n${d.prompt}`, { label: `plan:${d.key}`, phase: 'Plan', schema: PLAN_SCHEMA })
    .then((p) => (p ? { ...p, _key: d.key } : null))
))).filter(Boolean);

const PRODUCT_PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['name', 'oneLiner', 'thesis', 'targetMoments', 'pillars', 'heroExperience', 'phases', 'boldBets', 'honestyCharter', 'funnelToLedger', 'killed'],
  properties: {
    name: { type: 'string', description: 'the bold product name / frame for the reframed Cost Pulse' },
    oneLiner: { type: 'string', description: 'the sentence an operator repeats to a friend' },
    thesis: { type: 'string' },
    targetMoments: { type: 'array', items: { type: 'string' }, description: 'the operator decision moments it serves' },
    pillars: {
      type: 'array', minItems: 3, maxItems: 6,
      items: { type: 'object', additionalProperties: false, required: ['name', 'what', 'operatorPayoff'],
        properties: { name: { type: 'string' }, what: { type: 'string' }, operatorPayoff: { type: 'string' } } },
    },
    heroExperience: { type: 'string', description: 'what the operator sees + does in the first 30 seconds' },
    phases: {
      type: 'array', minItems: 3, maxItems: 6,
      items: { type: 'object', additionalProperties: false, required: ['phase', 'goal', 'deliverables'],
        properties: { phase: { type: 'string' }, goal: { type: 'string' }, deliverables: { type: 'array', items: { type: 'string' } }, buildsOn: { type: 'string' } } },
    },
    boldBets: { type: 'array', items: { type: 'string' }, description: 'the differentiating moonshots worth taking, honest + feasible' },
    honestyCharter: { type: 'array', items: { type: 'string' }, description: 'the guardrails carried from the audit — what it must never claim' },
    funnelToLedger: { type: 'string' },
    killed: { type: 'array', items: { type: 'string' }, description: 'seductive things deliberately NOT built' },
  },
};

phase('Synthesize');
const planDigest = plans.map((p) => `### ${p.lens} (${p._key})\nTHESIS: ${p.thesis}\nOPERATOR VALUE: ${p.operatorValue}\nRECS:\n${(p.recommendations || []).map((r) => `- [${r.boldness}B/${r.usefulness}U/${r.effort}] ${r.title}: ${r.what} -> ${r.why}`).join('\n')}\nGUARDRAILS: ${p.honestyGuardrails}`).join('\n\n');
const synthesis = await agent(
  `${CONTEXT}\n\nYou are the CHIEF PRODUCT ARCHITECT. Below are ${plans.length} expert planning contributions for the reframed lock-or-float Cost Pulse. Reconcile them into ONE bold, coherent, phased product plan that is genuinely useful to the target operator and 100% honest on the spine. Resolve conflicts, cut redundancy, make hard choices, and PUSH FOR BOLDNESS — a memorable product, not a safe dashboard. Every pillar/bet must survive the honesty charter (no direction, no opportunity-timing, no forbidden claims). Prefer the highest boldness x usefulness ideas; fold the kill-list in. Ground every claim in the real data + modules.\n\n=== EXPERT CONTRIBUTIONS ===\n${planDigest}`,
  { label: 'synthesize:chief-architect', phase: 'Synthesize', schema: PRODUCT_PLAN_SCHEMA, effort: 'high' }
);

phase('Critique');
const CRIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'verdict', 'boldnessScore', 'usefulnessScore', 'strengths', 'gaps', 'mustFix'],
  properties: {
    lens: { type: 'string' },
    verdict: { type: 'string', enum: ['ship', 'revise', 'rethink'] },
    boldnessScore: { type: 'integer', minimum: 1, maximum: 10 },
    usefulnessScore: { type: 'integer', minimum: 1, maximum: 10 },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
    mustFix: { type: 'array', items: { type: 'string' }, description: 'concrete changes required before this plan is bold + useful + honest enough to build' },
  },
};
const CRITICS = [
  { key: 'usefulness', lens: 'Legitimate operator usefulness — a skeptical independent restaurateur', prompt: `You are a skeptical independent restaurant owner-operator (one location, no buyer, on your phone between shifts). Read this plan as if someone is asking you to use it weekly. Where is it genuinely useful vs. clever-but-pointless? Would it change a real order/contract/menu-price decision you make? What is missing that you actually need? Score usefulness hard. Be specific to restaurant reality.` },
  { key: 'boldness', lens: 'Boldness & distinctiveness — a product design lead', prompt: `You are a product design lead who hates safe, templated tools. Is this bold — a product with a point of view an operator remembers and tells a friend about — or a competent dashboard? Where does it play it too safe? What one move would make it unmistakably distinctive while staying honest? Score boldness hard.` },
  { key: 'honesty-feasibility', lens: 'Honesty + feasibility — the chief statistician + staff engineer', prompt: `You are the chief statistician from the audit AND the staff engineer. Does every pillar/bet stay inside the certified-honest spine (no direction, no opportunity-timing, no "X leads Y", no "you should pay $X", withholding preserved)? Flag any claim that reintroduces a forbidden read. Then: is it buildable on the static, no-fetch, CI-gated site with the existing modules? Flag anything that needs a fetch, breaks a gate, or is not deterministic. Score neither dimension — list the must-fix honesty + feasibility violations.` },
];
const critiques = (await parallel(CRITICS.map((c) => () =>
  agent(`${CONTEXT}\n\n=== THE SYNTHESIZED PLAN ===\n${JSON.stringify(synthesis, null, 2)}\n\n=== YOUR CRITIC ROLE ===\n${c.prompt}`,
    { label: `critique:${c.key}`, phase: 'Critique', schema: CRIT_SCHEMA, effort: 'high' })
    .then((v) => (v ? { ...v, _key: c.key } : null))
))).filter(Boolean);

phase('Finalize');
const critDigest = critiques.map((c) => `### ${c.lens} — verdict ${c.verdict} (bold ${c.boldnessScore}/10, useful ${c.usefulnessScore}/10)\nSTRENGTHS: ${(c.strengths || []).join('; ')}\nGAPS: ${(c.gaps || []).join('; ')}\nMUST-FIX: ${(c.mustFix || []).join('; ')}`).join('\n\n');
const final = await agent(
  `${CONTEXT}\n\nYou are the CHIEF PRODUCT ARCHITECT finalizing the plan. Here is your synthesized plan and three adversarial critiques (a skeptical operator, a boldness-obsessed design lead, and the chief statistician + engineer). Revise the plan to address every must-fix WITHOUT losing boldness or violating the honesty spine. Return the FINAL plan in the same structure — tighter, bolder, verifiably useful, and buildable.\n\n=== YOUR DRAFT PLAN ===\n${JSON.stringify(synthesis, null, 2)}\n\n=== CRITIQUES ===\n${critDigest}`,
  { label: 'finalize:chief-architect', phase: 'Finalize', schema: PRODUCT_PLAN_SCHEMA, effort: 'high' }
);

return {
  final,
  synthesis,
  critiques: critiques.map((c) => ({ lens: c.lens, verdict: c.verdict, boldness: c.boldnessScore, usefulness: c.usefulnessScore, mustFix: c.mustFix })),
  planCount: plans.length,
  lenses: plans.map((p) => p._key),
};
