export const meta = {
  name: 'iterate-menu-pricing',
  description: 'Ground, draft, and adversarially verify the next round of genuine improvements to the menu-pricing dispatch + study',
  phases: [
    { title: 'Ground' },
    { title: 'Build' },
    { title: 'Verify' },
    { title: 'Design' },
  ],
}

const CTX = `Repo: muntin.digital static site (restaurant cost-intelligence). Surfaces:
- DISPATCH (byline Don Goldstein, operator-to-operator blog): blog/menu-pricing-grounded-100-ingredients-2026/index.html (EN) + es/blog/fijar-precios-con-datos-100-ingredientes-2026/index.html (ES). It now has 6 sections: (0) "The meat order has a buying season", (1) postures 37 lock/19 cushion/7 float/37 withhold + names the 7 floats + a worked beef-tenderloin card, (2) trim tax on the edible pound + a cut-by-cut table, (3) "The swap that mirrors doesn't hedge" (94% co-moved), (4) "Don't reprint on a spike — median 77 days".
- STUDY / field report (byline The Muntin Desk): cost-index/menu-pricing/study/index.html (EN) + es/cost-index/menu-pricing/study/index.html (ES). SOURCE JSON: data/cost-research-study.json {en:{abstract,contribution,sections[],methods,limitations}, es:{...}}. Edit the JSON reasoning but the live HTML is what ships (both are kept in sync by hand).
- ENGINE = source of truth for EVERY number: scripts/lib/cost-research.mjs exports pricingCards(repoRoot) -> {cards:[{en,es,cat,bucket,bandPct,coverage,yieldPct,trimTax,cheapMonth,savePct,worthTiming,timingReason,swap}], counts, total}. Co-movement/duration: scripts/lib/cost-events-analysis.mjs -> loadEventsData(repoRoot), companyStat(events), durationSummary(events), flatEvents(data); raw events in data/cost-index-events.json (data.items[slug].events, each event has fields you should inspect).
- HOW TO VERIFY A NUMBER: run from repo root, e.g.:  node --input-type=module -e "import {pricingCards} from './scripts/lib/cost-research.mjs'; const {cards,counts}=pricingCards(process.cwd()); console.log(counts); console.log(cards.find(c=>c.en==='Beef tenderloin'))"  . Known truths: companyStat -> {total:432, alone:25, withCompany:407, up:393, down:39, pct:94} (94% CO-MOVED, 6% idiosyncratic). yields file has 118 rows; ingredient-depth 134; research-references.json 61 studies; the study cites 36.`;

const HONESTY = `ABSOLUTE FACT GATE (the site's CI rejects violations; treat as inviolable):
- Every NUMBER must be VERIFIED against the engine (show the command you ran + its output) OR explicitly labeled illustrative in the prose. Invent nothing, including spelled-out numbers.
- DESCRIPTIVE, never a FORECAST. CO-OCCURRENCE, never CAUSE. A wholesale REFERENCE, never the operator's delivered/invoice price.
- Never claim the work is peer-reviewed / controlled / statistically significant, and never describe a method the code does NOT run (the seasonal gate is a within-month dispersion rule, NOT a seasonal-trend decomposition; the co-movement test is directed top-companion k/n>=0.5 same-category, NOT a demand-system/elasticity estimate).
- Bio: Don Goldstein is FOH at ONE brand (Tacombi), two locations (Bethesda + Arlington). Never "two restaurants".
- No shop-floor scene-setting (lunch push, pre-shift, "on a Tuesday", the line). Banned words (hard fail): disrupt, leverage, utilize, unlock, seamless, robust, game-changer, revolutionary, empower, supercharge, elevate(verb), curated(hype), delve, dive in, ever-evolving, cutting-edge, in today's world, at the end of the day.`;

const AREAS = [
  {
    key: 'study-honesty',
    title: 'Deepen the study\u0027s disclosed limitations + a confidence-tier rebalance',
    brief: `The field report\u0027s Limitations section is good but does NOT disclose the real soft spots a sharp methodologist finds, and its emphasis is inverted relative to evidence strength. Do TWO things:
(1) LIMITATIONS EXPANSION: read data/cost-research-study.json (en.limitations, es.limitations) and the engine, and add honest disclosures the current text omits: (a) SMALL PER-INGREDIENT n — compute the actual average number of price events per ingredient (flatEvents / distinct slugs, and note the topN cap in data/cost-index-events.json) so the per-ingredient co-movement + duration reads rest on ~N events each; (b) the thresholds are CHOSEN, not validated (find the actual constants in cost-research.mjs: band cutoffs lockMaxHalfWidth/cushion/float, k/n>=0.5, TIMING_MIN_SAVE, baseWindow weeks, floorPct — list the real values); (c) the reads are IN-SAMPLE / no out-of-sample check; (d) survivorship (only ingredients with enough committed history are scored). Keep every existing honest disclosure. Write the NEW full limitations prose EN + ES (extend, do not delete).
(2) CONFIDENCE TIERS: propose a short, plain "how sure are we, layer by layer" paragraph for the study that marks the ROCK-SOLID findings (trim tax = textbook 1/yield; shock-duration median cleanly matched to Bils-Klenow/Nakamura-Steinsson) apart from the DIRECTIONAL ones (per-ingredient co-movement + per-ingredient seasonal windows, small n). EN + ES. This is a differentiator for an honesty-branded piece, not a weakness.`,
  },
  {
    key: 'per-ingredient-duration',
    title: 'Per-ingredient shock-clearance time (replace/augment the pooled 77 days honestly)',
    brief: `The dispatch\u0027s "median cleared in 77 days" is a POPULATION median pooled across ~100 commodities. Investigate whether the engine can honestly give a PER-INGREDIENT clearance time. Inspect data/cost-index-events.json event objects (what duration/weeks field exists) and durationSummary in cost-events-analysis.mjs. Then decide, honestly:
- IF per-ingredient duration is computable with enough events to be non-noisy: compute it for the worked-card ingredient (Beef tenderloin) and 2-3 others, WITH each ingredient\u0027s event count n, and draft a short dispatch edit (section 4 or the worked card) that shows the ingredient\u0027s own clearance time WITH its n disclosed.
- IF per-ingredient n is too small to be honest (likely ~5-6 events): DO NOT fabricate a per-ingredient number. Instead draft a one-sentence honest disclosure to add to section 4 that the 77 days is pooled across all ingredients (IQR 50-105, n=432 episodes) and a given ingredient can sit in the tail. Recommend which path.
Show the exact engine commands + outputs. Every number verified.`,
  },
  {
    key: 'ecosystem-links',
    title: 'Wire the piece into the ecosystem (glossary autolinks + a real \u0022check my math\u0022 link)',
    brief: `The dispatch + study are islands. Two jobs:
(1) GLOSSARY LINKS: list the glossary terms that ACTUALLY EXIST (run: ls glossary/ ) and match the dispatch\u0027s vocabulary — candidates: as-purchased/edible-portion (AP/EP), yield, trim, margin, food-cost, cover, wholesale, menu, cross-price-elasticity, price-elasticity. For each term that exists AND appears in the dispatch/study, give {glossarySlug, glossaryUrl (/glossary/<slug>/), the exact anchor phrase as it appears in blog/menu-pricing-grounded-100-ingredients-2026/index.html, locale}. Only real, resolvable URLs; verify each directory exists. First-mention only, do not over-link.
(2) CHECK-MY-MATH LINK: the piece says "check my math" and ships CC-BY data. Find the actual downloadable dataset files (look for cost-index/menu-pricing.json / .csv) and the study\u0027s methods, and draft a short block/sentence + link giving a skeptic a one-click path to the exact dataset + how each number is computed. Verify the files exist (ls). EN + ES.`,
  },
];

const GROUND = { type: 'object', additionalProperties: false, required: ['area', 'feasible', 'verified', 'spec', 'risks'], properties: {
  area: { type: 'string' },
  feasible: { type: 'boolean', description: 'is this improvement honestly achievable as briefed?' },
  verified: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['fact', 'command', 'output'], properties: { fact: { type: 'string' }, command: { type: 'string', description: 'the exact shell/node command run' }, output: { type: 'string', description: 'its actual output (trimmed)' } } }, description: 'every number/claim this change will rely on, each proven by a command+output' },
  spec: { type: 'string', description: 'concrete plan: what changes, on which surface(s), where' },
  risks: { type: 'array', items: { type: 'string' } },
} };

const BUILD = { type: 'object', additionalProperties: false, required: ['area', 'summary', 'content', 'numbersUsed'], properties: {
  area: { type: 'string' },
  summary: { type: 'string' },
  content: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['surface', 'locale', 'purpose', 'placement', 'text'], properties: {
    surface: { type: 'string', enum: ['dispatch', 'study'] },
    locale: { type: 'string', enum: ['en', 'es'] },
    purpose: { type: 'string' },
    placement: { type: 'string', description: 'human-readable: which section, after/before what existing text (quote a unique existing anchor phrase)' },
    text: { type: 'string', description: 'the exact prose or HTML block to insert, ready to apply' },
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
  { key: 'numbers', instr: 'RE-RUN THE ENGINE YOURSELF for every number in the build. Default: a number is WRONG until the engine confirms it. Report engineConfirms per number with the command you ran.' },
  { key: 'honesty', instr: 'Apply the fact gate line by line: any forecast, any causation from co-occurrence, any wholesale-framed-as-delivered-price, any peer-reviewed/controlled/significant claim, any method the code does not run, any bio drift, any banned word, any unlabeled non-verified number. Default to finding a violation; only pass if clean.' },
  { key: 'consistency', instr: 'Read the ACTUAL dispatch + study files. Does the new content contradict anything already there (e.g. category-vs-ingredient numbers, the corrected 94% co-moved framing, the protein both-sides framing)? Is it in the right voice (Don Goldstein for dispatch, Muntin Desk for study)? Is it non-redundant and genuinely useful to a busy independent operator?' },
];

phase('Ground');
const results = await pipeline(
  AREAS,
  (area) => agent(
    `${CTX}\n\n${HONESTY}\n\nGROUND this improvement. ${area.title}.\n${area.brief}\n\nActually run the engine and read the files. Return only claims you PROVED with a command+output. If the honest version of this change is different from the brief (e.g. a number is too noisy to publish), say so in spec/risks and set feasible accordingly.`,
    { label: `ground:${area.key}`, phase: 'Ground', schema: GROUND, effort: 'high' },
  ).then((g) => ({ area, g })),
  ({ area, g }) => agent(
    `${CTX}\n\n${HONESTY}\n\nBUILD the ready-to-apply content for: ${area.title}.\nGrounded ONLY in these verified facts (do not introduce any number not proven here):\n${JSON.stringify(g.verified, null, 1)}\nPlan: ${g.spec}\n\nWrite the exact prose/HTML to insert, EN and ES, for each surface. For placement, quote a unique existing anchor phrase from the real file. Voice: Don Goldstein (dispatch) / The Muntin Desk (study), plain and operator-to-operator. Keep it tight — no filler, no repetition of what the piece already says. If feasible=false for part of it, return only the honest subset.`,
    { label: `build:${area.key}`, phase: 'Build', schema: BUILD, effort: 'high' },
  ).then((b) => ({ area, g, b })),
  ({ area, g, b }) => parallel(
    LENSES.map((lens) => () => agent(
      `${CTX}\n\n${HONESTY}\n\nADVERSARIALLY VERIFY this proposed change to the menu-pricing piece, through the ${lens.key.toUpperCase()} lens. ${lens.instr}\n\nPROPOSED CONTENT:\n${JSON.stringify(b.content, null, 1)}\n\nNUMBERS THE BUILD CLAIMS TO HAVE VERIFIED:\n${JSON.stringify(b.numbersUsed, null, 1)}\n\npass=true only if this lens finds nothing disqualifying. List every problem with a quote + why + a concrete required fix.`,
      { label: `verify:${area.key}:${lens.key}`, phase: 'Verify', schema: VERDICT, effort: 'high' },
    )),
  ).then((verdicts) => ({ area: area.key, title: area.title, ground: g, build: b, verdicts })),
);

phase('Design');
const APPROACHES = [
  'Single-price override: the operator types ONE delivered price for one ingredient; the card recomputes the posture/band framed as "vs your number", never stored, never our claim.',
  'Invoice-line paste: paste a few "item, $/unit" lines; the tool maps each to its wholesale-reference read and shows the gap (your delivered vs the reference trend), per line.',
  'Personal-baseline overlay: the operator enters 3-4 past prices for one ingredient over time; the tool computes THEIR own band and cheapest-month tendency from their data, alongside the wholesale read.',
];
const design = await (async () => {
  const drafts = await parallel(APPROACHES.map((ap, i) => () => agent(
    `${CTX}\n\n${HONESTY}\n\nDESIGN the highest-ceiling improvement: let an operator bring their OWN delivered price into the menu-pricing instrument (/cost-index/menu-pricing/), which today reads only public wholesale reference. Approach ${i + 1}: ${ap}\n\nProduce a concrete design: the exact UI/interaction, what it computes, how the HONESTY POSTURE stays intact (their number is their input, never our claim or a stored/published figure; still descriptive, still not a forecast), the data/engine it needs, gate/privacy considerations, and a rough build size. Be specific enough to implement.`,
    { label: `design:approach-${i + 1}`, phase: 'Design', schema: { type: 'object', additionalProperties: false, required: ['approach', 'interaction', 'computes', 'honesty', 'needs', 'buildSize', 'operatorValue'], properties: { approach: { type: 'string' }, interaction: { type: 'string' }, computes: { type: 'string' }, honesty: { type: 'string' }, needs: { type: 'string' }, buildSize: { type: 'string' }, operatorValue: { type: 'string' } } }, effort: 'high' },
  )));
  const judged = await agent(
    `${CTX}\n\nYou are the design lead. Judge these 3 approaches for bringing the operator\u0027s own delivered price into the menu-pricing instrument, on: honesty-preservation (the site\u0027s non-negotiable), operator value, and build cost. Pick a recommended design (or a synthesis grafting the best of each), and give a crisp implementation sketch + the single biggest risk.\n\nAPPROACHES:\n${JSON.stringify(drafts.filter(Boolean), null, 1)}`,
    { label: 'design:judge', phase: 'Design', schema: { type: 'object', additionalProperties: false, required: ['recommended', 'why', 'sketch', 'biggestRisk'], properties: { recommended: { type: 'string' }, why: { type: 'string' }, sketch: { type: 'string' }, biggestRisk: { type: 'string' } } }, effort: 'high' },
  );
  return { drafts: drafts.filter(Boolean), judged };
})();

return { areas: results, design };
