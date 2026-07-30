export const meta = {
  name: 'iterate-menu-pricing-experts',
  description: 'Expert panel grounds the next round of menu-pricing improvements; build + adversarially verify what survives',
  phases: [
    { title: 'Panel' },
    { title: 'Synthesize' },
    { title: 'Build' },
    { title: 'Verify' },
  ],
}

const CTX = `Repo: muntin.digital static site (restaurant cost-intelligence). The piece under improvement:
- DISPATCH (byline Don Goldstein, operator-to-operator): blog/menu-pricing-grounded-100-ingredients-2026/index.html (EN) + es/blog/fijar-precios-con-datos-100-ingredientes-2026/index.html (ES). 6 sections: (0) "The meat order has a buying season" (protein troughs + freeze play), (1) postures 37 lock/19 cushion/7 float/37 withhold, names the 7 floats, a worked beef-tenderloin card, (2) trim tax on the edible pound + a cut-by-cut table + an illustrative $ example, (3) "The swap that mirrors doesn't hedge" (94% co-moved), (4) "Don't reprint on a spike — median 77 days" + a pooled-median caveat. Has a TL;DR, key-takeaways, 7 glossary autolinks/locale, a "check my math" dataset callout.
- STUDY / field report (byline The Muntin Desk): cost-index/menu-pricing/study/index.html (EN) + es/... ; SOURCE data/cost-research-study.json {en,es}. Has abstract, contribution, 7 cited sections, Methods (id=methods), a deepened Limitations (small n, chosen cutoffs, in-sample, survivorship), a "How sure we are" confidence block, Data availability, 36 references w/ DOIs.
- INSTRUMENT (the interactive tool the piece hands the reader): cost-index/menu-pricing/index.html, rendered by scripts/build-cost-index-pages.mjs; per-ingredient cards from the engine.
- ENGINE = source of truth for EVERY number: scripts/lib/cost-research.mjs -> pricingCards(repoRoot) => {cards:[{en,es,cat,bucket,bandPct,coverage,yieldPct,trimTax,cheapMonth,savePct,worthTiming,timingReason,swap:{en,k,n,sameCat}}], counts, total}; researchInputs(repoRoot). Co-movement/duration: scripts/lib/cost-events-analysis.mjs (loadEventsData, companyStat, durationSummary, flatEvents); events in data/cost-index-events.json.
- VERIFY any number by running the engine from repo root, e.g.: node --input-type=module -e "import {pricingCards} from './scripts/lib/cost-research.mjs'; const {cards,counts}=pricingCards(process.cwd()); console.log(counts); console.log(cards.find(c=>c.en==='Ribeye'))". Known: counts lock37/cushion19/float7/withhold37; companyStat 94% co-moved (407/432), 6% alone; durationSummary median77 p25:50 p75:105 n432; proteins 27 = lock9/cushion2/withhold16.`;

const HONESTY = `ABSOLUTE FACT GATE (CI rejects violations; inviolable):
- Every NUMBER must be VERIFIED against the engine (show command+output) OR labeled illustrative in the prose. Invent nothing (incl. spelled-out numbers).
- DESCRIPTIVE, never a FORECAST (and avoid the literal keyword tokens the gate scans: forecast/projected/expected to/predict(s/ed/ion)/"next year|month|season|quarter|week"/"will rise|fall|hold|..." — even in an anti-forecast sentence). CO-OCCURRENCE, never CAUSE. A wholesale REFERENCE, never the operator's delivered/invoice price ("the price you pay"). Never describe a method the code does not run (seasonal gate = within-month dispersion rule, NOT a decomposition; substitute test = directed top-companion k/n>=0.5 same-category, NOT an elasticity/demand system). Never peer-reviewed/controlled/statistically-significant. Bio: Don is FOH at ONE brand (Tacombi), two locations; never "two restaurants". No shop-floor scene-setting. Banned words: disrupt, leverage, utilize, unlock, seamless, robust, game-changer, revolutionary, empower, supercharge, elevate(v), curated(hype), delve, dive in, ever-evolving, cutting-edge, in today's world, at the end of the day.`;

const SHIPPED = `ALREADY SHIPPED — do NOT re-propose these; find something genuinely NEW and higher-value:
- Corrected the inverted 94% co-movement stat; decomposition->dispersion; protein both-sides framing; "elevated-price"->"large-move".
- Lead section on the backward meat-buying season + freeze play; a worked beef-tenderloin card; fixed the CTA to point at the instrument; "61 studies"->research base w/ 36 cited.
- Named the 7 floats; a cut-by-cut trim-tax table; one illustrative $ example.
- Per-ingredient duration: NOT publishable (n<=6, biased) -> added a pooled-median caveat instead; fixed "median ingredient"->"median move".
- Glossary autolinks (7/locale); "check my math" CC-BY dataset callout; study Data-availability + #methods anchors.
- Study Limitations deepened (small n, chosen cutoffs, in-sample, survivorship) + a "How sure we are" confidence block.
- DESIGNED (not built) the invoice-personalization instrument feature (one delivered-price override per card, computed in-browser, never shows a Muntin wholesale dollar). Do not re-propose this design; you MAY propose complementary or entirely different improvements.
- Round-2 (just shipped, do NOT re-propose): split the 37-withhold column into 27 "no public series exists" vs 10 "series too wide (30.1-62.4%)"; compressed section 1's textbook opening to one paragraph and moved the food-dollar point to section 5; added the "two independent clocks" paragraph (posture prices the menu / cheapest month times the buy; 22 of 37 locks carry both); added a "what a band costs the plate" callout translating the posture band to cents on an illustrative plate.
- STILL PENDING (proposed, not yet shipped; you MAY propose a CORRECTED version only if it is genuinely the top remaining actionable gap): a "reprice-first" Monday list crossing LOCK posture x high TRIM TAX (steady + under-costed = one-time permanent margin). Its prior draft mis-ranked. Any version MUST rank locks strictly by engine trimTax (heaviest lock tier is x2.00: grapefruit, leek, pineapple, whole turkey; then whole chicken x1.67) and must NEVER place a non-lock item on a lock list (lime is withhold, not lock).`;

const EXPERTS = [
  { key: 'controller', who: 'a restaurant controller / CFO who owns the P&L for a small independent group', ask: 'What here actually changes a dollar decision you make, and what is still too abstract to act on? Where do you reach for a number the piece does not give you? Operators think in dollars and in menu-price points, not multipliers and percentages — where would translating a finding into a concrete margin/plate-price consequence (illustrative is allowed, real dataset numbers preferred) change behavior? Propose the single highest-value addition.' },
  { key: 'menu-consultant', who: 'a working menu-engineering / food-cost consultant who re-prices menus for a living', ask: 'What is the highest-leverage operational move this piece could hand an operator that it does not yet? Is any operational advice incomplete, mis-ordered, or missing a step between "understand" and "did it on my menu"? Is there a decision (which items to reprice first, by how much, when) that the data can support and the piece stops short of?' },
  { key: 'statistician', who: 'a statistician / data scientist reviewing the methodology', ask: 'RUN THE ENGINE. Is anything STILL overclaimed, under-disclosed, or presented with emphasis out of proportion to its evidence? Is there a genuinely useful, honest quantitative view the piece is missing (e.g. a distribution instead of a point estimate, an uncertainty band shown, a cross-check that would raise trust)? Propose the single most valuable rigor/insight improvement that is honest and buildable.' },
  { key: 'economist', who: 'an agricultural / commodity economist', ask: 'Is the wholesale-vs-delivered, seasonality, and co-movement framing economically sound and complete? Is there a real market insight — pass-through, storability, substitution economics, the shape of a season — that would deepen the operator understanding without overclaiming or forecasting? What is the single most valuable economically-grounded addition?' },
  { key: 'chef', who: 'an executive chef / kitchen operator', ask: 'Do the yields, cuts, substitutions, and seasonal claims match kitchen reality? Where does the culinary detail ring thin, generic, or subtly wrong? What concrete kitchen-side value (a spec, a swap that actually works on the plate, a yield nuance) would make this more useful at the pass — grounded in the ingredient-depth data (data/ingredient-depth.json) and the engine?' },
  { key: 'editor', who: 'a demanding plain-language editor for busy operators', ask: 'Read it as a time-poor operator would. What is the ONE structural or cutting change that would make it land harder? Is there surviving filler, repetition (the same numbers restated across TL;DR / body / figures / takeaways), or a section whose payload is textbook and could be compressed? What is the single highest-value editorial change — be specific about what to cut or move, with quotes.' },
];

const PROPOSAL = { type: 'object', additionalProperties: false, required: ['expert', 'title', 'rationale', 'evidence', 'placement', 'honestySafe', 'effort', 'dontTouch'], properties: {
  expert: { type: 'string' },
  title: { type: 'string', description: 'short, unique title for this proposed improvement' },
  rationale: { type: 'string', description: 'why this is genuinely high-value and NOT already shipped' },
  evidence: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['claim', 'command', 'output'], properties: { claim: { type: 'string' }, command: { type: 'string' }, output: { type: 'string' } } }, description: 'any number/fact the change relies on, proven by a command+output' },
  placement: { type: 'string', description: 'which surface + where (quote a unique existing anchor phrase)' },
  honestySafe: { type: 'boolean', description: 'can it be done within the fact gate?' },
  effort: { type: 'string', enum: ['content', 'engine', 'big'], description: 'content = prose/HTML edit I can apply; engine = small code/data change; big = a real feature' },
  dontTouch: { type: 'string', description: 'what is already good and should be preserved' },
} };

const SYNTH = { type: 'object', additionalProperties: false, required: ['ranking', 'buildIndices', 'specIndices'], properties: {
  ranking: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['index', 'title', 'expert', 'valueScore', 'effort', 'decision', 'why'], properties: {
    index: { type: 'integer', description: '0-based index into the proposals array' }, title: { type: 'string' }, expert: { type: 'string' }, valueScore: { type: 'integer', description: '1-10 operator value x feasibility x honesty-safety' }, effort: { type: 'string' }, decision: { type: 'string', enum: ['build', 'spec-only', 'skip'] }, why: { type: 'string' },
  } } },
  buildIndices: { type: 'array', items: { type: 'integer' }, description: 'indices of content-effort proposals to build now (dedupe overlaps; pick the strongest 3-5)' },
  specIndices: { type: 'array', items: { type: 'integer' }, description: 'indices of engine/big proposals worth a spec for the founder' },
} };

const BUILD = { type: 'object', additionalProperties: false, required: ['title', 'summary', 'content', 'numbersUsed'], properties: {
  title: { type: 'string' }, summary: { type: 'string' },
  content: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['surface', 'locale', 'purpose', 'placement', 'text'], properties: {
    surface: { type: 'string', enum: ['dispatch', 'study'] }, locale: { type: 'string', enum: ['en', 'es'] }, purpose: { type: 'string' }, placement: { type: 'string', description: 'quote a unique existing anchor phrase from the real file' }, text: { type: 'string', description: 'exact prose/HTML ready to apply' },
  } } },
  numbersUsed: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['number', 'meaning', 'command', 'output'], properties: { number: { type: 'string' }, meaning: { type: 'string' }, command: { type: 'string' }, output: { type: 'string' } } } },
} };

const VERDICT = { type: 'object', additionalProperties: false, required: ['pass', 'numberChecks', 'violations', 'requiredFixes'], properties: {
  pass: { type: 'boolean' },
  numberChecks: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['number', 'engineConfirms', 'note'], properties: { number: { type: 'string' }, engineConfirms: { type: 'boolean' }, note: { type: 'string' } } } },
  violations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kind', 'quote', 'why'], properties: { kind: { type: 'string' }, quote: { type: 'string' }, why: { type: 'string' } } } },
  requiredFixes: { type: 'array', items: { type: 'string' } },
} };

const LENSES = [
  { key: 'numbers', instr: 'RE-RUN THE ENGINE for every number. Default: a number is WRONG until the engine confirms it.' },
  { key: 'honesty', instr: 'Apply the fact gate line by line, including the literal forecast/causation/price keyword tokens the automated gate scans. Default to finding a violation.' },
  { key: 'consistency', instr: 'Read the ACTUAL files. Does it contradict anything already there (the corrected 94% co-moved, protein both-sides, 100-ingredient universe, category-vs-ingredient trim numbers)? Right voice? Non-redundant and genuinely useful to a busy independent operator?' },
];

phase('Panel');
const panelRaw = await parallel(EXPERTS.map((e) => () => agent(
  `${CTX}\n\n${HONESTY}\n\n${SHIPPED}\n\nYou are ${e.who}. Read the actual dispatch + study (and the instrument/engine as needed) and verify any number you cite by running the engine. ${e.ask}\n\nReturn ONE proposal — your single highest-value, genuinely-new improvement — grounded in evidence you proved, with a concrete placement, an honest effort tag, and a note on what is already good and must be preserved. Do not propose anything on the SHIPPED list.`,
  { label: `panel:${e.key}`, phase: 'Panel', schema: PROPOSAL, effort: 'high' },
)));
const proposals = panelRaw.filter(Boolean);

phase('Synthesize');
const synth = await agent(
  `${CTX}\n\nYou are the editorial + product lead. Here are ${proposals.length} expert proposals for improving the menu-pricing piece (0-based indices as given). Dedupe overlaps, rank by (operator value x feasibility x honesty-safety), and decide which to BUILD NOW (content-effort, honest, high value — pick the strongest 3-5 by index) versus SPEC-ONLY (engine/big features worth teeing up for the founder) versus SKIP. Be discerning: reject anything that repeats shipped work, overclaims, or is filler.\n\nPROPOSALS:\n${JSON.stringify(proposals.map((p, i) => ({ index: i, expert: p.expert, title: p.title, effort: p.effort, honestySafe: p.honestySafe, rationale: p.rationale })), null, 1)}`,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH, effort: 'high' },
);

phase('Build');
const toBuild = (synth.buildIndices || []).map((i) => proposals[i]).filter(Boolean);
const built = await pipeline(
  toBuild,
  (p) => agent(
    `${CTX}\n\n${HONESTY}\n\nBUILD the ready-to-apply content for this expert-recommended improvement:\nTITLE: ${p.title}\nRATIONALE: ${p.rationale}\nEVIDENCE (verified): ${JSON.stringify(p.evidence, null, 1)}\nPLACEMENT: ${p.placement}\n\nWrite the exact prose/HTML to insert, EN and ES, quoting a unique existing anchor phrase for placement. Voice: Don Goldstein (dispatch) / The Muntin Desk (study). Tight, no filler, no repetition of what the piece already says. Every number engine-verified (show command+output in numbersUsed). Respect every fact-gate keyword rule.`,
    { label: `build:${(p.title || 'x').slice(0, 24)}`, phase: 'Build', schema: BUILD, effort: 'high' },
  ).then((b) => ({ p, b })),
  ({ p, b }) => parallel(
    LENSES.map((lens) => () => agent(
      `${CTX}\n\n${HONESTY}\n\nADVERSARIALLY VERIFY this proposed change through the ${lens.key.toUpperCase()} lens. ${lens.instr}\n\nCONTENT:\n${JSON.stringify(b.content, null, 1)}\n\nNUMBERS CLAIMED VERIFIED:\n${JSON.stringify(b.numbersUsed, null, 1)}\n\npass=true only if this lens finds nothing disqualifying. Quote every problem + a concrete required fix.`,
      { label: `verify:${lens.key}:${(p.title || 'x').slice(0, 16)}`, phase: 'Verify', schema: VERDICT, effort: 'high' },
    )),
  ).then((verdicts) => ({ title: p.title, proposal: p, build: b, verdicts })),
);

return { proposals, synth, built, specOnly: (synth.specIndices || []).map((i) => proposals[i]).filter(Boolean) };
