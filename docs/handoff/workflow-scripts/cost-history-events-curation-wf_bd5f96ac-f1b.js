export const meta = {
  name: 'cost-history-events-curation',
  description: 'Curate a fact-gated registry of documented 2001-2026 food-commodity market events (with real citations, mapped to the Muntin ingredient catalog) to annotate the 25-year price archive — research, adversarially source-verify, then synthesize a reviewable draft',
  phases: [
    { title: 'Research', detail: '7 commodity-domain researchers gather documented, cited market events' },
    { title: 'Verify', detail: 'adversarial per-event source verification — fetch + confirm or reject' },
    { title: 'Synthesize', detail: 'merge verified survivors into a fact-gated registry draft' },
  ],
}

const CATALOG = 'acorn-squash, apple, artichoke, asparagus, avocado, banana, basil, beef-tenderloin, beet, bell-pepper, blueberry, bok-choy, broccoli, brussels-sprouts, butter, butter-lettuce, butternut-squash, button-mushroom, cabbage, cantaloupe, carrot, cauliflower, celery, cheddar-cheese, cherry-tomato, chicken-breast, chicken-thigh, cilantro, clams, collard-greens, corn-on-the-cob, cucumber, daikon, dill, eggplant, eggs, garlic, ginger, grapefruit, green-beans, green-leaf-lettuce, green-onion, ground-beef, habanero-pepper, iceberg-lettuce, jalapeno, kale, leek, lemon, lime, mint, napa-cabbage, octopus, okra, onion, oregano, parsley, pear, pineapple, poblano-pepper, pork-belly, pork-loin, pork-shoulder, pumpkin, raspberry, red-leaf-lettuce, red-onion, red-potato, ribeye, romaine-lettuce, rosemary, russet-potato, rutabaga, salmon-fillet, salmon-skin-on-fillet, scallops, serrano-pepper, short-rib, shrimp, shrimp-head-on, shrimp-pd, snow-peas, spinach, squid, striploin, sweet-potato, tarragon, thyme, tomato, tuna-loin, vegetable-oil, watermelon, whole-chicken, whole-crab, whole-halibut, whole-lobster, whole-salmon, whole-trout, whole-turkey, yellow-squash, zucchini'

const CONTEXT = `CONTEXT — muntin.digital is publishing a 25-year US wholesale food-price archive (2001-2026, 102 ingredients) as an open-data hub. A new "historical events" layer will annotate the archive: for a documented market event, show WHICH catalog ingredients moved in that window and by how much. THE HONESTY RULE IS ABSOLUTE: this is temporal CO-OCCURRENCE, never causation. You describe what was DOCUMENTED happening in a time window; you NEVER assert that an event caused a price to move, and you NEVER make any forward/predictive claim. The site's fact-gate rejects any number/date/event that is not backed by a real, citable published source.
INGREDIENT CATALOG (map events to these exact slugs): ${CATALOG}.
CITATION STANDARD — only credible published sources: USDA ERS / NASS / AMS / APHIS, BLS, NOAA Fisheries, FAO, EIA, peer-reviewed literature, or major wire/outlets (Reuters, AP, WSJ, NYT, Bloomberg, The Packer). Government primary sources strongly preferred. Every event needs at least one real URL you have actually consulted. DO NOT invent events, dates, or sources — a fabricated citation is the worst possible failure here.
DESCRIPTIONS — factual and neutral ("A highly pathogenic avian influenza outbreak led to the depopulation of ~X million egg-laying hens across the US" [cited]). NOT "which is why egg prices spiked." State the documented supply/production event; let the price data (added later) speak for itself.
TOOLS — use WebSearch and WebFetch to find and confirm real, documented events and their sources.`

const RESEARCH = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'short event name, e.g. "Avian influenza outbreak (2022)"' },
          startDate: { type: 'string', description: 'ISO YYYY-MM or YYYY-MM-DD' },
          endDate: { type: 'string', description: 'ISO YYYY-MM or YYYY-MM-DD' },
          affectedSlugs: { type: 'array', items: { type: 'string' }, description: 'catalog slugs plausibly involved (supply/production terms, NOT a price-causation claim)' },
          whatHappened: { type: 'string', description: 'factual, neutral, cited-able description of the documented supply/production event — no price-causation language' },
          sources: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' }, year: { type: 'integer' } }, required: ['url', 'publisher'] } },
        },
        required: ['label', 'startDate', 'endDate', 'affectedSlugs', 'whatHappened', 'sources'],
      },
    },
  },
  required: ['domain', 'events'],
}

const VERDICT = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    verified: { type: 'boolean', description: 'true ONLY if a fetched credible source confirms the event and its window' },
    verdict: { type: 'string', description: 'what the fetched sources actually confirm or refute' },
    correctedStart: { type: 'string' },
    correctedEnd: { type: 'string' },
    keptSources: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' } }, required: ['url', 'publisher'] } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['label', 'verified', 'verdict'],
}

const REGISTRY = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'kebab-case, e.g. avian-influenza-2022' },
          label: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          affectedSlugs: { type: 'array', items: { type: 'string' } },
          whatHappened: { type: 'string' },
          sources: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' } }, required: ['url', 'publisher'] } },
        },
        required: ['id', 'label', 'startDate', 'endDate', 'affectedSlugs', 'whatHappened', 'sources'],
      },
    },
    rejected: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, reason: { type: 'string' } }, required: ['label', 'reason'] } },
    notesForOwner: { type: 'array', items: { type: 'string' } },
  },
  required: ['events'],
}

const DOMAINS = [
  { key: 'poultry-eggs', brief: `POULTRY & EGGS (chicken-breast, chicken-thigh, whole-chicken, whole-turkey, eggs). Focus: the 2014-15 and 2022-2024 highly-pathogenic avian influenza outbreaks (APHIS depopulation figures), any Newcastle/other poultry events, feed-cost-driven production shifts. Cite APHIS/USDA primarily.` },
  { key: 'beef-pork', brief: `BEEF & PORK (ribeye, striploin, short-rib, beef-tenderloin, ground-beef, pork-belly, pork-loin, pork-shoulder). Focus: 2014 record cattle prices + herd contraction after the 2011-2012 drought, 2013-14 porcine epidemic diarrhea (PEDv) in hogs, 2020 COVID meatpacking-plant closures, African swine fever's global hog effects. Cite USDA ERS/NASS.` },
  { key: 'grains-oils-dairy', brief: `GRAINS, OILS & DAIRY (vegetable-oil, butter, cheddar-cheese). Focus: the 2007-08 global food-price crisis, 2012 US Corn Belt drought, 2022 Russia-Ukraine disruption to grains/vegetable oils, notable dairy/butter supply events. Cite USDA ERS, FAO, EIA.` },
  { key: 'produce-leafy', brief: `LEAFY & BRASSICA PRODUCE (iceberg-lettuce, romaine-lettuce, green/red/butter-lettuce, spinach, kale, collard-greens, broccoli, cauliflower, cabbage, napa-cabbage, bok-choy, brussels-sprouts, celery). Focus: California/Arizona drought years, the 2022 Salinas Valley lettuce INSV/impatiens-necrotic-spot-virus crop failure, major freezes. Cite USDA/The Packer/CA Dept of Food & Ag. NOTE: keep to SUPPLY/PRODUCTION events, not consumer recalls.` },
  { key: 'produce-fruit-veg', brief: `FRUIT, ALLIUMS, ROOTS, PEPPERS, TOMATOES (avocado, lemon, lime, banana, apple, pear, pineapple, grapefruit, melon, berries, onion, red-onion, garlic, ginger, potatoes, tomato, cherry-tomato, peppers, squashes, cucumber, eggplant, carrots, beet). Focus: Mexican avocado/lime supply disruptions, Florida/California citrus freezes & citrus greening, notable onion/tomato/potato supply events. Cite USDA/The Packer/wire.` },
  { key: 'seafood', brief: `SEAFOOD (shrimp, shrimp-head-on, shrimp-pd, salmon-fillet, salmon-skin-on-fillet, whole-salmon, tuna-loin, whole-halibut, whole-crab, whole-lobster, scallops, clams, squid, octopus, whole-trout). Focus: the 2013-14 early-mortality-syndrome (EMS) shrimp disease collapse in Asia, Chilean salmon ISA/algal-bloom events, Alaska crab fishery closures (2022 snow crab), import/tariff disruptions. Cite NOAA Fisheries, FAO, wire.` },
  { key: 'macro', brief: `MACRO / CROSS-CUTTING events that moved MANY commodities at once: the 2007-08 food-price crisis, the 2020 COVID-19 supply-chain shock (foodservice collapse, processing bottlenecks), the 2021-2022 broad food inflation surge, the 2022 Russia-Ukraine war's fuel/fertilizer/grain effects. Map each to the broad set of catalog slugs credibly documented as affected. Cite USDA ERS, BLS CPI/PPI, FAO Food Price Index.` },
]

phase('Research')
const research = await parallel(DOMAINS.map((d) => () =>
  agent(`${CONTEXT}\n\n=== YOUR DOMAIN ===\n${d.brief}\n\nReturn every well-documented, citable event in this domain across 2001-2026. Prefer fewer, rock-solid, government-sourced events over many shaky ones. Every event MUST have at least one real source URL you actually consulted.`,
    { label: `research:${d.key}`, phase: 'Research', schema: RESEARCH })
))
const raw = research.filter(Boolean).flatMap((r) => (r.events || []).map((e) => Object.assign({ domain: r.domain }, e)))

// Light dedupe: same start-year + overlapping label keywords → merge slugs + sources, keep the fuller description.
function sig(e) {
  const yr = String(e.startDate || '').slice(0, 4)
  const kw = String(e.label || '').toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 3).slice(0, 2).sort().join('-')
  return yr + '|' + kw
}
const bySig = new Map()
for (const e of raw) {
  const k = sig(e)
  if (!bySig.has(k)) { bySig.set(k, e); continue }
  const cur = bySig.get(k)
  cur.affectedSlugs = Array.from(new Set([...(cur.affectedSlugs || []), ...(e.affectedSlugs || [])]))
  cur.sources = [...(cur.sources || []), ...(e.sources || [])]
  if (String(e.whatHappened || '').length > String(cur.whatHappened || '').length) cur.whatHappened = e.whatHappened
}
const candidates = Array.from(bySig.values()).slice(0, 40)
log(`Research: ${raw.length} raw events → ${candidates.length} deduped candidates for verification.`)

phase('Verify')
const verdicts = await parallel(candidates.map((e) => () =>
  agent(`${CONTEXT}\n\n=== VERIFY THIS CANDIDATE EVENT ===\n${JSON.stringify(e)}\n\nAdversarially verify it. FETCH each source URL (WebFetch); run a WebSearch if a source is dead or thin. Confirm: (1) the event is real and happened, (2) the start/end window is right (correct it if the sources say otherwise), (3) the publisher/source is credible and actually supports the claim, (4) the affectedSlugs are genuinely documented as involved. Set verified:true ONLY if at least one fetched credible source stands the event up. If you cannot confirm it from a real fetched source, set verified:false and say why. Return only the sources you actually confirmed.`,
    { label: `verify:${(e.label || '').slice(0, 24)}`, phase: 'Verify', schema: VERDICT })
    .then((v) => (v ? Object.assign({}, e, { _verdict: v }) : null))
))
const kept = verdicts.filter(Boolean).filter((e) => e._verdict && e._verdict.verified)
log(`Verify: ${kept.length}/${candidates.length} candidates survived adversarial source-verification.`)

phase('Synthesize')
const registry = await agent(
  `${CONTEXT}\n\n=== TASK ===\nBelow are the events that survived adversarial source-verification (each carries a _verdict with confirmed sources + any corrected window). Merge them into ONE clean, fact-gated registry draft: assign kebab-case ids; apply any corrected dates from the verdict; keep ONLY the confirmed sources; ensure every event has >=1 credible source and a neutral, non-causal whatHappened; drop or fold near-duplicates; sort by startDate. Note for the owner anything thin, any event where sources disagreed, and any catalog slugs that were claimed but weakly supported. This registry will be data-grounded (matched to the actual 25-year price swings) and fact-gate reviewed before it ships, so flag anything that needs a second look.\n\n=== VERIFIED EVENTS (JSON) ===\n${JSON.stringify(kept)}`,
  { label: 'synthesize:registry', phase: 'Synthesize', schema: REGISTRY, effort: 'high' }
)

return { rawEvents: raw.length, candidates: candidates.length, verified: kept.length, registry }
