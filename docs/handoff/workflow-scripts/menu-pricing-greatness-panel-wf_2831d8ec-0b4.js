export const meta = {
  name: 'menu-pricing-greatness-panel',
  description: 'Doctorate-bar multi-lens evaluation of the menu-pricing dispatch: propose, engine-verify, and rank improvements toward greatness',
  phases: [
    { title: 'Ground', detail: 'inventory the dispatch + untapped engine data' },
    { title: 'Evaluate', detail: 'seven lenses propose concrete improvements' },
    { title: 'Verify', detail: 'adversarially check each proposal vs engine + honesty contract' },
    { title: 'Synthesize', detail: 'dedupe and rank survivors into a greatness slate' },
  ],
}

const REPO = '/home/user/potentially-profitable'
const DISPATCH = REPO + '/blog/menu-pricing-grounded-100-ingredients-2026/index.html'
const DISPATCH_ES = REPO + '/es/blog/fijar-precios-con-datos-100-ingredientes-2026/index.html'
const STUDY = REPO + '/cost-index/menu-pricing/study/index.html'

const HONESTY = [
  'INVIOLABLE HONESTY CONTRACT (muntin.digital fact gate) — any proposal that violates these is disqualified:',
  '- Every number must be verifiable against the engine or labeled illustrative in the prose. NEVER invent a number (including spelled-out numbers).',
  '- Descriptive, NEVER forecast (no "will", "expect", "next quarter", predicting a future price).',
  '- Co-occurrence is NEVER cause (co-movement/cohort = "moved together", never "caused").',
  '- Public wholesale is a REFERENCE, never the delivered/invoice price. Never claim the invoice moves less/more than wholesale unless measured.',
  '- Never claim peer-reviewed, controlled experiment, or statistical significance. This is a practitioner FIELD REPORT, not an academic paper — "doctorate-level" means rigor, originality, transparent method, and honest uncertainty, NOT false academic credentials.',
  '- Operator bio: Don Goldstein is a full-time Front-of-House Manager at ONE brand, Tacombi, with TWO locations (Bethesda MD + Arlington VA). NEVER frame him as running two/multiple restaurants.',
  '- No invented shop-floor/kitchen scenes. Banned words: disrupt, leverage, utilize, unlock, seamless, robust, game-changer, revolutionary, empower(verb), supercharge, elevate(verb), curated(hype), delve, dive in, ever-evolving, cutting-edge, "in today\'s world", "at the end of the day".',
  '- Any new content figure needs data-audio-alt >=80 chars AND a <figcaption>. Tables must sit inside <div class="table-scroll">.',
  '- EN and ES must stay in parity (every change mirrored). ES dispatch: ' + DISPATCH_ES + '.',
].join('\n')

const CONTEXT = [
  'The artifact is a published menu-pricing dispatch (blog post) for INDEPENDENT restaurant operators on muntin.digital, plus its companion field-report study. Target reader: a small one-or-two-location independent operator, not a chain analyst. The ambition for this pass: make it genuinely great — the kind of rigor, originality, and clarity a doctoral committee would respect — while staying a practitioner field report that is USEFUL on a Monday.',
  '- Dispatch (EN): ' + DISPATCH,
  '- Field-report study (EN): ' + STUDY,
  '- The engine is the source of truth for every number. Run from the repo root, e.g.:',
  '    cd ' + REPO + ' && node --input-type=module -e "import {pricingCards} from \'./scripts/lib/cost-research.mjs\'; const r=pricingCards(process.cwd()); console.log(r.total, JSON.stringify(r.counts)); console.log(Object.keys(r.cards[0]).join(\',\'));"',
  '    cd ' + REPO + ' && node --input-type=module -e "import {loadEventsData, companyStat, durationSummary, coMovement} from \'./scripts/lib/cost-events-analysis.mjs\'; const d=loadEventsData(process.cwd()); console.log(JSON.stringify(companyStat(d)), JSON.stringify(durationSummary(d)));"',
  '  pricingCards row fields: slug,en,es,cat,bucket,bandPct,coverage,yieldPct,trimTax,cheapMonth,savePct,worthTiming,timingReason,swap{en,k,n,sameCat}. Events (data/cost-index-events.json via flatEvents): slug,rank,date,direction,pctFromNormal,valueCents,normalCents,durationDays,month,inHighSeason,basis,cohort[]. Ingredient depth (data/ingredient-depth.json, 134 rows; 100 scored into cards): edibleYield,cookedYield,juiceYield,freezeMonths,cutSpec,shelfLifeDays,storageMethod,peakSeason,inSeasonMonths,substitutes,trimToValue.',
  'The dispatch ALREADY covers: meat buying-season lead + freeze-play $ callout; posture split (37 lock / 19 cushion / 7 float / 37 withhold) with named floats, a worked beef-tenderloin card, a two-clocks paragraph, a band-cost callout; the trim tax (knife, 1.14x-2.16x) with a cut-by-cut table, the served-pound (cooking) layer with an edible-x-cooked table, a posture-hazard caution; the swap-that-mirrors (94% co-movement, cohort depth median 4, nearly half with 5+); don\'t-reprint (77-day median clearing) with the 10:1 rockets-and-feathers asymmetry (393 up vs 39 down). It has a TL;DR, key-takeaways, ~7 glossary autolinks, a CC-BY dataset download, and cited literature (Parsa, Mankiw, Bils-Klenow, Peltzman, Andreyeva, Pindyck-Rotemberg, Roseland, USDA FBG, Champions 12.3, Kasavana-Smith). Do NOT re-propose what is already there unless you are proposing to CUT or sharpen it.',
].join('\n')

const GROUND_SCHEMA = {
  type: 'object', required: ['untappedData', 'sectionInventory', 'weakestSpots'],
  properties: {
    untappedData: { type: 'array', items: { type: 'object', required: ['item', 'whereItLives', 'couldSupport'],
      properties: { item: { type: 'string' }, whereItLives: { type: 'string' }, couldSupport: { type: 'string' } } } },
    sectionInventory: { type: 'array', items: { type: 'string' } },
    weakestSpots: { type: 'array', items: { type: 'string' } },
  },
}

const EVAL_SCHEMA = {
  type: 'object', required: ['lens', 'proposals'],
  properties: {
    lens: { type: 'string' },
    proposals: { type: 'array', items: { type: 'object', required: ['title', 'dimension', 'change', 'grounding', 'whyItHelps', 'effort'],
      properties: {
        title: { type: 'string' },
        dimension: { type: 'string' },
        change: { type: 'string', description: 'Exactly what to change and where (section/anchor). If adding a number, state the number.' },
        grounding: { type: 'string', description: 'Engine field/function + the exact command to verify the number, or "illustrative" or "no-number".' },
        whyItHelps: { type: 'string' },
        effort: { type: 'string', enum: ['S', 'M', 'L'] },
      } } },
  },
}

const VERIFY_SCHEMA = {
  type: 'object', required: ['verdict', 'groundingResult', 'honestyResult', 'redundancyResult', 'note'],
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'needs-fix', 'rejected'] },
    groundingResult: { type: 'string', description: 'What the engine actually returned when you ran it; the confirmed number, or why it failed.' },
    honestyResult: { type: 'string' },
    redundancyResult: { type: 'string' },
    note: { type: 'string' },
    revised: { type: 'string', description: 'If needs-fix, the corrected version; else empty.' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object', required: ['verdict', 'slate', 'cut'],
  properties: {
    verdict: { type: 'string', description: 'Honest read: how far is the piece from great, and where is the real headroom?' },
    slate: { type: 'array', items: { type: 'object', required: ['rank', 'title', 'dimension', 'whatToDo', 'groundedNumbers', 'effort', 'lift'],
      properties: { rank: { type: 'integer' }, title: { type: 'string' }, dimension: { type: 'string' }, whatToDo: { type: 'string' }, groundedNumbers: { type: 'string' }, effort: { type: 'string' }, lift: { type: 'string' } } } },
    cut: { type: 'array', items: { type: 'object', required: ['title', 'why'], properties: { title: { type: 'string' }, why: { type: 'string' } } } },
  },
}

const LENSES = [
  { key: 'useful', prompt: 'the PRACTITIONER lens (a working independent-restaurant operator). Judge USEFULNESS: does each section change what I do this week? Propose concrete additions/changes that give a decision rule, a worked number, or a "do this Monday" grounded in the engine.' },
  { key: 'informative', prompt: 'the DATA-ANALYST lens. Judge INFORMATIVENESS: what verified signal in the engine (a field or analysis) is NOT yet surfaced and would genuinely inform the reader? Each proposal must be tied to an exact engine number you name and can verify.' },
  { key: 'interesting', prompt: 'the EDITOR / narrative lens. Judge INTEREST and pacing: where does it drag, what is the most underexploited finding, what hook or reframe would make it more memorable and impressive without adding filler or hype.' },
  { key: 'empowering', prompt: 'the INDEPENDENT-OPERATOR-ADVOCATE lens. Judge EMPOWERMENT (in substance, not the banned word): does the piece give the small operator leverage, agency, and confidence against suppliers and uncertainty, or merely inform? Turn a finding into a lever the reader can actually pull.' },
  { key: 'accessible', prompt: 'the ACCESSIBILITY & PLAIN-LANGUAGE lens. Judge ACCESSIBILITY: reading level, undefined jargon, scannability, figure clarity, the quality of data-audio-alt narration for screen-reader/audio users, and EN<->ES parity. Make it clearer to a non-analyst and to assistive tech.' },
  { key: 'skeptic', prompt: 'the SKEPTIC / adversary lens. Improvement is not only addition. Find what is overclaimed, redundant, generic, or filler and propose CUTS or tightenings. Flag anything a sharp operator would call obvious or padded.' },
  { key: 'doctoral', prompt: 'the DOCTORAL REFEREE lens (a rigorous dissertation-committee reader). Judge whether this reaches the bar of a great practitioner field report: is the ORIGINAL contribution stated sharply and is it genuinely novel; is the METHOD transparent and reproducible from the public data; is UNCERTAINTY quantified and honestly bounded; does it ENGAGE the cited literature (situating each finding against it, not just name-dropping it); is the exposition elegant and precise? Propose changes that raise scholarly rigor, originality, and defensibility WITHOUT ever claiming peer review, a controlled experiment, or statistical significance. Concrete, grounded proposals only.' },
]

function evalStage(L) {
  const body = 'You are ' + L.prompt + '\n\n' + CONTEXT + '\n\nA grounding pass already inventoried the piece and the untapped engine data:\n' + groundDigest + '\n\nTask: Read the dispatch (' + DISPATCH + ') yourself, then propose 2-4 CONCRETE, specific improvements from your lens. Each names exactly what changes and where, and (if it involves a number) the engine field/command that grounds it — run the engine to check when you can. Prefer a few high-value proposals over many weak ones. Do NOT edit files; return structured proposals only.\n' + HONESTY
  return agent(body, { label: 'eval:' + L.key, phase: 'Evaluate', schema: EVAL_SCHEMA })
}

function verifyStage(L, p) {
  const body = 'You are an ADVERSARIAL verifier for a proposed improvement to a menu-pricing dispatch. Try to DISQUALIFY it; confirm only if it survives all three checks.\n\n' + CONTEXT + '\n\nPROPOSAL (from the ' + L.key + ' lens):\n' + JSON.stringify(p) + '\n\nRun all three checks, actually executing the engine where a number is involved:\n1) grounding: if the proposal asserts or implies any number, RUN the engine (Bash from ' + REPO + ') and confirm the exact value. If you cannot confirm it, that is rejected or needs-fix. Quote what the engine returned.\n2) honesty: check every line of the contract below. A forecast / causation / wholesale-as-price / fabrication / bio-drift / banned-word violation is rejected (or needs-fix if a trivial reword saves it).\n3) redundancy: read the dispatch (' + DISPATCH + '); if the point is already made there, mark rejected as redundant.\nDefault to rejected or needs-fix when uncertain. If needs-fix, put the corrected version in revised.\n' + HONESTY
  return agent(body, { label: 'verify:' + L.key, phase: 'Verify', schema: VERIFY_SCHEMA }).then(function (v) {
    return { lens: L.key, proposal: p, verdict: v }
  })
}

phase('Ground')
const groundBody = 'You are the grounding analyst for a greatness review of a menu-pricing dispatch.\n\n' + CONTEXT + '\n\nTask: Read the dispatch (' + DISPATCH + ') end to end, skim the study (' + STUDY + '), and PROBE THE ENGINE (run the commands). Produce three things:\n1) untappedData: verified data the engine/datasets expose that is NOT yet used in the dispatch and could support a new, honest, useful point. Actually RUN the engine to confirm each item and note its real value. Sweep every pricingCards field, every cost-events-analysis output (companyStat, durationSummary, coMovement, flatEvents incl inHighSeason/month/valueCents), and every ingredient-depth layer (freezeMonths, shelfLifeDays, storageMethod, juiceYield, trimToValue, peakSeason, substitutes). For each: what it is, where it lives, what point it could support.\n2) sectionInventory: a terse ordered list of the sections/blocks the dispatch currently contains.\n3) weakestSpots: the 3-6 places the piece is weakest — thinnest, most generic, hardest to follow, or least grounded.\nDo NOT edit any file. Return structured data only.\n' + HONESTY
const ground = await agent(groundBody, { label: 'ground:inventory+untapped', phase: 'Ground', schema: GROUND_SCHEMA })
const groundDigest = JSON.stringify(ground)

phase('Evaluate')
const evaluated = await pipeline(
  LENSES,
  function (L) { return evalStage(L) },
  function (evalResult, L) {
    const props = (evalResult && evalResult.proposals) || []
    const thunks = props.map(function (p) { return function () { return verifyStage(L, p) } })
    return parallel(thunks)
  }
)

const survivors = evaluated.flat().filter(Boolean).filter(function (r) {
  return r.verdict && r.verdict.verdict !== 'rejected'
})

phase('Synthesize')
const synthBody = 'You are the synthesis lead for a greatness review of a menu-pricing dispatch aimed at independent operators. The founder wants it made genuinely great — rigor and originality a doctoral committee would respect, and still useful on a Monday.\n\n' + CONTEXT + '\n\nProposals that SURVIVED adversarial verification (each with its verdict; for needs-fix prefer the revised text):\n' + JSON.stringify(survivors, null, 1) + '\n\nTask: Dedupe overlapping proposals, drop anything marginal, and produce a PRIORITIZED slate ranked by (value toward greatness for the independent-operator reader) x (feasibility), best first. For each slate item give: whatToDo (exact + where), groundedNumbers (value + engine source), effort (S/M/L), and lift (which of useful/interesting/informative/empowering/accessible/rigor it raises, and how much). List what you cut and why. In verdict, be honest about how far the piece is from great and where the real headroom is — do not manufacture work.\n' + HONESTY
const synth = await agent(synthBody, { label: 'synthesize:greatness-slate', phase: 'Synthesize', schema: SYNTH_SCHEMA })

return { survivorsCount: survivors.length, verdict: synth.verdict, slate: synth.slate, cut: synth.cut }
