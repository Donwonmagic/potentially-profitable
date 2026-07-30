export const meta = {
  name: 'seo-aeo-surfaces',
  description: 'Per-surface SEO + AEO (answer-engine / AI-Overview) + easy-citation audit for the Muntin open-data surfaces, synthesized into one prioritized discoverability + citability implementation plan',
  phases: [
    { title: 'Audit', detail: 'one specialist per surface + a cross-cutting citations lens' },
    { title: 'Synthesize', detail: 'prioritized SEO/AEO/citation implementation plan' },
  ],
}

const OUT = {
  type: 'object',
  properties: {
    surface: { type: 'string' },
    seo: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, why: { type: 'string' }, effort: { type: 'string', enum: ['S', 'M', 'L'] } }, required: ['item', 'why'] } },
    aeo: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, why: { type: 'string' }, liftableFact: { type: 'string', description: 'the exact fact an answer engine should be able to lift + cite' }, effort: { type: 'string', enum: ['S', 'M', 'L'] } }, required: ['item', 'why'] } },
    structuredData: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', description: 'schema.org type' }, spec: { type: 'string' } }, required: ['type', 'spec'] } },
    citations: { type: 'array', items: { type: 'string', description: 'how to make THIS surface trivially citable by a human, journalist, or LLM' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['surface', 'seo', 'aeo', 'structuredData'],
}

const PLAN = {
  type: 'object',
  properties: {
    thesis: { type: 'string' },
    quickWins: { type: 'array', items: { type: 'string' } },
    phases: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, initiatives: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, deliverable: { type: 'string' }, effort: { type: 'string' } }, required: ['title', 'deliverable'] } } }, required: ['name', 'initiatives'] } },
    citationKit: { type: 'string', description: 'the concrete "make citations easy" deliverable across all surfaces' },
    structuredDataMap: { type: 'array', items: { type: 'object', properties: { surface: { type: 'string' }, schemaTypes: { type: 'string' } }, required: ['surface', 'schemaTypes'] } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['thesis', 'quickWins', 'phases', 'citationKit'],
}

const CONTEXT = `CONTEXT — muntin.digital is a static (HTML + build scripts, no framework) restaurant cost-intelligence site pivoting to a data company + open-source library. Surfaces: /open (the new data-hub front door), the per-ingredient data page (/cost-index/<slug>/, ~164 EN+ES pages), /cost-index/how-honest/ (the calibration scorecard — renders the audit: 76.7% band coverage, direction 50.5% vs 50.2% baseline = chance), Cost Pulse (/tools/cost-pulse/, the lock-or-float instrument), and the Cost Index catalog (/cost-index/). It sits on a 25-year open corpus (102 ingredients, 86,846 weekly prints, 2001-2026, USDA AMS/LMR, FRED, BLS, NOAA), CC0 raw + CC-BY derived.
GOAL — maximize BOTH classic SEO (organic ranking) AND AEO (answer-engine optimization: Google AI Overviews, ChatGPT/Perplexity/Claude citation, Google Dataset Search), AND make the data TRIVIALLY CITABLE by a human, journalist, or LLM. The honest frame is an AEO ASSET: an answer engine should learn to cite "the source that publishes what it didn't earn" — the null-result and coverage numbers are liftable, trustworthy facts. But NOTE THE HONESTY CONSTRAINT: liftable/structured fields must state magnitude/spread/coverage/position, NEVER a price direction or forecast (the site is REMOVING its old JSON-LD trend:"up" direction node). EN+ES parity is a hard requirement (hreflang).
EXISTING PATTERNS to ground in (read them): per-page JSON-LD graphs (grep build-cost-index-pages.mjs, the mockups' schema), data/feed-llm.json + any llms.txt, sitemap generation, hreflang/locale-parity gates, meta descriptions capped ~155 chars, the design mockups' od-cite / od-download / Dataset markup. Do not invent files that exist — grep first.
YOUR JOB — for your assigned surface, return concrete, buildable SEO + AEO + citation optimizations: real title/meta/heading structure, the exact schema.org types + key properties, the specific liftable facts an answer engine should extract and cite, internal-linking/canonical/hreflang, and how to make the surface one-click citable. Be specific and honest (no direction in liftable fields).`

const SURFACES = [
  { key: 'open-hub', brief: `/open — the data-hub FRONT DOOR. Own: the hub's title/meta/H1, schema.org DataCatalog (+ WebSite/Organization sitelinks-search), the "two lines" positioning for brand queries, internal-linking hub-and-spoke to all datasets, and making /open the canonical entity Google + LLMs resolve for "restaurant wholesale food price data / open food price dataset". Liftable facts: the corpus size, span, sources, license.` },
  { key: 'data-page', brief: `Per-ingredient DATA PAGE (/cost-index/<slug>/). The highest-volume, highest-intent surface ("<ingredient> wholesale price"). Own: title/meta/H1 patterns per ingredient, schema.org Dataset (temporalCoverage 2001-2026, distribution=CSV/JSON, license, variableMeasured as MAGNITUDE range not trend), the honest liftable answer to "what is the wholesale price of X / is X expensive right now" (a RANGE + position + coverage, never up/down), FAQPage, breadcrumb, and internal links to the tool + how-honest. This is where the demoted direction node must be replaced by a citable range fact.` },
  { key: 'how-honest', brief: `/cost-index/how-honest/ — the CALIBRATION SCORECARD. The AEO trust anchor. Own: how to make the null-result and coverage numbers the liftable, citable "proof" facts (schema.org Dataset for the audit data itself + Article/analysis markup), the title/meta that wins "how accurate is X price index / does price forecasting work", and turning "we publish what we didn't earn" into the E-E-A-T signal answer engines reward. The audit is itself open data — mark it as such.` },
  { key: 'cost-pulse', brief: `Cost Pulse (/tools/cost-pulse/) — the lock-or-float instrument. Own: SoftwareApplication/WebApplication schema, the query space ("should I lock in food prices / which ingredient prices are stable", "restaurant food cost tool"), how the honest lock/cushion/float read is a liftable answer, HowTo/FAQ markup for the decision jobs, and internal links binding it into /open as a pillar. No direction claims in any liftable field.` },
  { key: 'catalog-sitewide', brief: `The Cost Index CATALOG (/cost-index/) + SITE-WIDE discoverability infrastructure. Own: the catalog ItemList/CollectionPage schema, XML sitemaps (including a data sitemap of every series/download URL for Google Dataset Search), robots.txt, hreflang cluster integrity across EN+ES, canonical strategy, and the crawl/index architecture so 164 data pages + downloads are all discoverable. Confirm what sitemap/robots infra already exists before proposing.` },
  { key: 'citations-aeo', brief: `CROSS-CUTTING: MAKE CITATIONS TRIVIALLY EASY + answer-engine citation. This is the owner's explicit priority. Own: a universal "cite this data" kit (copy-ready APA / MLA / Chicago / BibTeX / RIS strings, auto-filled from series metadata with a device-local accessed-date, no fetch), schema.org Dataset + citation/creativeWorkStatus + sameAs, a DOI-vs-permalink strategy for a citable canonical, an llms.txt / feed-llm.json update so LLMs discover the citable surfaces and the preferred citation string, and the "how to cite" affordance placement. Design HOW an LLM ends up writing "according to the Muntin Restaurant Cost Index...". Make the credit string one click for a human and one fetch for a machine.` },
]

phase('Audit')
const audits = await parallel(SURFACES.map((s) => () =>
  agent(`${CONTEXT}\n\n=== YOUR SURFACE ===\n${s.brief}`, { label: `audit:${s.key}`, phase: 'Audit', schema: OUT })
))
const got = audits.filter(Boolean)
log(`Audit complete: ${got.length}/${SURFACES.length} surfaces.`)

phase('Synthesize')
const plan = await agent(
  `${CONTEXT}\n\n=== TASK ===\nMerge the per-surface SEO/AEO/citation audits below into ONE prioritized implementation plan. De-duplicate; sequence by leverage; keep the honesty constraint (no direction in any liftable/structured field). Call out the QUICK WINS, the concrete "make citations easy" kit that spans every surface (the owner's explicit priority), a surface→schema.org-types map, and the risks. Be concrete enough to build from.\n\n=== PER-SURFACE AUDITS (JSON) ===\n${JSON.stringify(got)}`,
  { label: 'synthesize:plan', phase: 'Synthesize', schema: PLAN, effort: 'high' }
)

return { surfaces: got.length, plan }
