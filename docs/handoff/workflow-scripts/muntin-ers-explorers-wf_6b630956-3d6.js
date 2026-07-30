export const meta = {
  name: 'muntin-ers-explorers',
  description: 'Build 3 WCAG-AA-accessible walk-through explorers for the ERS chain datasets (per-capita availability, meat price chain, food dollar), then adversarially audit + perfect each',
  phases: [
    { title: 'Standard', detail: 'shared design system + accessibility + data-access + archetype grammar' },
    { title: 'Dream', detail: 'dataviz-virtuoso + data-scientist + information-designer dream each explorer' },
    { title: 'Build', detail: 'one bespoke explorer per dataset (general-purpose agents)' },
    { title: 'Audit', detail: 'adversarial WCAG + honesty + design audit per explorer' },
    { title: 'Perfect', detail: 'apply every blocking fix' },
  ],
}

const DIR = '/tmp/claude-0/-home-user/e5df842e-7cf1-50b1-b408-948fda2c4153/scratchpad/explorers'
const REF = '/tmp/claude-0/-home-user/e5df842e-7cf1-50b1-b408-948fda2c4153/scratchpad/imports-explorer.html'

const LEDGER = `HONESTY (binding, per dataset): descriptive of the tracked record, NEVER a forecast; wholesale/market band is a market-DIRECTION reference, never a delivered/retail price; import & export figures are nominal VALUE, never volume; farm price is FARM-GATE, a distinct chain point, never the wholesale reference; import reliance is an apparent-consumption PROXY (a cross-point ratio); per-capita availability is a supply-side PROXY for consumption, never a measured intake, never a price; the meat-chain RETAIL value is national-average GROCERY retail, never a delivered/menu/invoice price; the food-dollar split is a NATIONAL macro statistic, never a per-ingredient claim; energy/crop-condition are coincident BACKDROPS, never per-ingredient drivers; co-occurrence is NEVER cause; null degrades by ABSENCE (never padded).`

const SETS = [
  { id: 'availability', title: 'The American Plate — a century of what one person eats', archetype: 'per-capita ranked cross-section + century-long per-commodity trend',
    source: 'cost-index/ers-food-availability.json (items[]: slug, commodity, percap_lbs, latest_year, span, series[[year, lbs]]) — the derived reads (CC-BY). Raw tidy file: data/ers-food-availability.jsonl (CC0, USDA ERS, {group,commodity,year,attribute,value}). Per-capita food availability, lbs/person/yr, back to 1909/1970 depending on group. VISUAL-DEPTH: make the reader feel INSIDE a century of the American plate — a walkable, cutting-edge feel (scroll/layered reveals, a spatial sense of the long timeline, live hover/crosshair), WCAG-AA + prefers-reduced-motion-safe, never gratuitous. AEO/SEO: ship schema.org (Dataset + a caveat-baked FAQPage), semantic headings, extraction-safe citable phrasing, meta/OG.',
    show: '71 foods ranked by lbs/person/yr (bananas 27, beef 56, broilers 67, tomatoes 19, avocado 8), each a long per-commodity trend showing how the American plate shifted over a century. A supply-side PROXY for consumption (ERS: production + imports − exports − loss), NEVER a measured intake, NEVER a price; commodity-level, so a variety/cut carries its parent figure. The VOLUME companion to the value-based reliance read.',
    download: 'https://muntin.digital/data/ers-food-availability.jsonl (CC0, USDA ERS) + https://muntin.digital/cost-index/ers-food-availability.json (CC-BY, Muntin)' },
  { id: 'meat-chain', title: 'The Cut and the Chain — farm to wholesale to retail', archetype: 'a walkable 3-rung price chain + the spread waterfall',
    source: 'cost-index/meat-price-chain.json (proteins[]: chain{net_farm_value, wholesale_value, retail_value, farm_to_wholesale_spread, wholesale_to_retail_spread}, downstream_markup_share, series{net_farm_value, wholesale_value, retail_value}) — derived CC-BY. Raw: data/ers-meat-price-spreads.jsonl (CC0, USDA ERS, monthly 1970-2025). Cents per pound of retail equivalent. VISUAL-DEPTH: render the CHAIN as a literal WALK you descend — net farm → wholesale → retail — with the spreads sized so the eye SEES how small farm→wholesale is and how large wholesale→retail is; layered reveal, live hover on the 55-year series. WCAG-AA + reduced-motion-safe. AEO/SEO: schema.org Dataset + FAQPage (caveat-baked), semantic headings, citable phrasing.',
    show: 'Beef, pork, broiler as a farm→wholesale→retail walk. The AHA (downstream_markup_share): 94% of beef’s farm-to-retail spread and 82% of pork’s is wholesale→retail — DOWNSTREAM of where a kitchen buys, so an operator buying near wholesale sits far below the consumer retail figure. Retail is national-average GROCERY retail per ERS, NEVER a delivered, wholesale-invoice, or menu price; a documented spread, never a forecast. The literal Source→Market→Plate.',
    download: 'https://muntin.digital/data/ers-meat-price-spreads.jsonl (CC0, USDA ERS) + https://muntin.digital/cost-index/meat-price-chain.json (CC-BY, Muntin)' },
  { id: 'food-dollar', title: 'The Food Dollar — where 100 cents go', archetype: 'a 100-cent chain split (stack/waterfall) + the farm-share-over-time line',
    source: 'cost-index/food-dollar.json (farm_share_cents, chain_split[{component, cents}] summing to 100, farm_share_series[[year, cents]], chain_split_series) — derived CC-BY. Raw: data/ers-food-dollar.jsonl (CC0, USDA ERS Food Dollar Series, 1993-2023). VISUAL-DEPTH: make the reader feel they are watching a single dollar split apart across the marketing chain — a 100-cent stack/waterfall the eye can walk, plus the farm-share line falling over 30 years; layered reveal, live hover. WCAG-AA + reduced-motion-safe. AEO/SEO: schema.org Dataset + FAQPage (caveat-baked "of every US food dollar, ~16 cents reaches the farm"), semantic headings, citable phrasing.',
    show: 'Of every 2023 US food dollar, 15.9¢ reaches the farm; the rest is the marketing chain — foodservices 31.5, retail 14.7, processing 13.2, wholesale 11.4, farm production 9.1, energy 4.3… summing to 100, with a 31-year farm-share trend. A NATIONAL macro statistic — never a per-ingredient claim, never the operator’s own cost structure, never a forecast. The sitewide macro bookend to the per-protein meat chain: the markup is real, documented, and mostly downstream of the farm.',
    download: 'https://muntin.digital/data/ers-food-dollar.jsonl (CC0, USDA ERS) + https://muntin.digital/cost-index/food-dollar.json (CC-BY, Muntin)' },
]

phase('Standard')
const spec = await agent(
  `You are the design-systems + accessibility lead for muntin.digital's open-data explorers. Produce ONE shared standard that every dataset explorer must follow, so the whole set reads as one system and is flawlessly accessible. Ground it in the muntin brand and the working REFERENCE explorer at ${REF} (READ it first — warm-paper/teal palette, serif-display + sans + mono, both light+dark themes via prefers-color-scheme + [data-theme], self-contained inline CSS/JS, deep-linkable). ${LEDGER}
Deliver: (1) css_tokens — the exact shared CSS custom-property block + base element rules (light + dark, theme-aware) every explorer inlines, as lines of CSS; (2) a11y_rules — a hard WCAG 2.1 AA+ checklist tuned for DATA explorers (semantic landmarks + headings; full keyboard operability incl. the combobox/sort/filter; visible focus; SVG charts with role=img + descriptive aria-label/title AND a screen-reader text/table alternative so no insight is chart-only; a real <table> no-JS fallback; prefers-reduced-motion; 4.5:1 contrast in BOTH themes; touch targets >=44px; live-region announcements on filter/select; never color-alone); (3) data_access_rules — every explorer must surface the dataset's DOWNLOAD (with its exact CC0/CC-BY badge), a one-line schema/field description, the source agency + provenance, a link to /cost-index/open-data-catalog.json, deep-links per item, and honest labels on every number; (4) archetype_grammar — the walk-through layout + interaction pattern for each archetype (ranked cross-section, per-commodity century-long time-series, walkable 3-rung price chain, 100-cent stack/waterfall); (5) honesty_ledger — the per-number honesty labels. Keep each array to concise one-line entries.`,
  { label: 'standard', phase: 'Standard', effort: 'high', schema: { type: 'object', additionalProperties: false, required: ['css_tokens', 'a11y_rules', 'data_access_rules', 'archetype_grammar', 'honesty_ledger'], properties: {
    css_tokens: { type: 'array', items: { type: 'string' } },
    a11y_rules: { type: 'array', items: { type: 'string' } },
    data_access_rules: { type: 'array', items: { type: 'string' } },
    archetype_grammar: { type: 'array', items: { type: 'string' } },
    honesty_ledger: { type: 'array', items: { type: 'string' } },
  } } })

const specText = [
  '=== SHARED CSS TOKENS (inline these) ===', ...spec.css_tokens,
  '=== WCAG-AA RULES (all mandatory) ===', ...spec.a11y_rules,
  '=== DATA-ACCESS RULES ===', ...spec.data_access_rules,
  '=== ARCHETYPE GRAMMAR ===', ...spec.archetype_grammar,
  '=== HONESTY LEDGER ===', ...spec.honesty_ledger,
].join('\n').slice(0, 8000)

const BUILD_SCHEMA = { type: 'object', additionalProperties: false, required: ['id', 'built', 'a11y_self_check'], properties: {
  id: { type: 'string' }, built: { type: 'boolean' }, rows_embedded: { type: 'number' },
  a11y_self_check: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } },
} }
const AUDIT_SCHEMA = { type: 'object', additionalProperties: false, required: ['id', 'verdict', 'blocking', 'improvements'], properties: {
  id: { type: 'string' }, verdict: { type: 'string', description: 'PASS or FIX' }, a11y_grade: { type: 'string' },
  blocking: { type: 'array', items: { type: 'string' } }, improvements: { type: 'array', items: { type: 'string' } },
} }
const FIX_SCHEMA = { type: 'object', additionalProperties: false, required: ['id', 'fixed'], properties: {
  id: { type: 'string' }, fixed: { type: 'array', items: { type: 'string' } }, remaining: { type: 'array', items: { type: 'string' } },
} }
const DREAM_SCHEMA = { type: 'object', additionalProperties: false, required: ['signature_viz', 'hidden_insights', 'walkthrough_moment'], properties: {
  signature_viz: { type: 'array', items: { type: 'string' } },
  hidden_insights: { type: 'array', items: { type: 'string' } },
  walkthrough_moment: { type: 'array', items: { type: 'string' } },
  stretch_ideas: { type: 'array', items: { type: 'string' } },
} }

const results = await pipeline(SETS,
  (s) => agent(
    `You are a small panel dreaming TOGETHER: a world-class DATA-VISUALIZATION designer (channel Tufte, Bertin, and the best contemporary interactive work), a DATA SCIENTIST (find the non-obvious signal that is actually IN this data), and an INFORMATION DESIGNER (narrative + the memorable walk). Dream the most ambitious YET HONEST + ACCESSIBLE public explorer for one Muntin open dataset — the one that makes people say "this is the definitive way to see this."
DATASET: ${s.title} (id ${s.id}) — ${s.archetype}
DATA (read the real source; look at its ACTUAL shape/ranges/patterns before dreaming): ${s.source}
${LEDGER}
Dream GROUNDED in what the data actually contains (no fabricated numbers, no forecast, honest labels; everything must be buildable as accessible inline SVG + vanilla JS with NO external libraries): signature_viz (the hero visualization form(s), beyond the obvious chart), hidden_insights (REAL non-obvious patterns you actually saw in the data, worth surfacing), walkthrough_moment (the single "aha" beat of the guided walk), stretch_ideas (ambitious extras that stay honest + WCAG-AA). Concise, concrete entries.`,
    { label: `dream:${s.id}`, phase: 'Dream', effort: 'high', schema: DREAM_SCHEMA }),
  (dream, s) => agent(
    `You are building the PERFECT, fully accessible, self-contained "walk through the data" explorer that realizes the DREAM below. Working dir is the muntin.digital repo.
DATASET: ${s.title}  (id: ${s.id})
ARCHETYPE: ${s.archetype}
DATA SOURCE (read it, extract a COMPACT embed): ${s.source}
WHAT TO SHOW: ${s.show}
DOWNLOAD to surface: ${s.download}

THE DREAM TO REALIZE (build this vision — grounded in the real data, honest, and fully accessible):
- signature viz: ${(dream.signature_viz || []).join(' | ')}
- surface these REAL insights: ${(dream.hidden_insights || []).join(' | ')}
- the walk-through aha: ${(dream.walkthrough_moment || []).join(' | ')}
- stretch (only if it stays honest + WCAG-AA): ${(dream.stretch_ideas || []).slice(0, 4).join(' | ')}

FOLLOW THIS SHARED STANDARD EXACTLY (design system + WCAG-AA + data-access + honesty), so this explorer matches the other 10 in the set:
${specText}

STEPS: (1) Read the source file(s) with Bash/node and extract a compact JSON embed (only the fields you render). (2) Read the reference explorer at ${REF} for the craft + a11y bar. (3) Write a COMPLETE, SELF-CONTAINED HTML file to EXACTLY ${DIR}/${s.id}.html — inline CSS (the shared tokens, both themes) + inline JS (vanilla, no framework, no external fetch — embed the data in a <script type="application/json">), a browsable overview + a per-item walk-through detail, hoverable/keyboard-operable charts as inline SVG with role=img + aria-label + a screen-reader/table alternative, a no-JS <table> fallback, prefers-reduced-motion, deep-links via hash, the CC0/CC-BY badge + download link + schema note + catalog link, schema.org Dataset + a caveat-baked FAQPage JSON-LD, and honest labels on every number. Start the file with a <title>; do NOT include <html>/<head>/<body> wrappers (a harness adds them). (4) Verify it parses (node --check won't work on HTML — instead sanity-check your JSON embed parses and the file is written).
Return a short report. Do NOT return the HTML itself — write it to the file.`,
    { agentType: 'general-purpose', label: `build:${s.id}`, phase: 'Build', effort: 'high', schema: BUILD_SCHEMA }),
  (b, s) => (b && b.built) ? agent(
    `You are a hard ADVERSARIAL auditor (WCAG 2.1 AA accessibility expert + data-honesty auditor + design critic). Read the explorer file ${DIR}/${s.id}.html in full and TRY TO BREAK IT.
Check every a11y rule: keyboard operability of all controls, visible focus, SVG charts have role=img + a real text/table alternative (no insight chart-only), color contrast >=4.5:1 in BOTH light and dark, no color-alone encoding, semantic landmarks/headings, reduced-motion, touch targets, live-region announcements, a no-JS table fallback. Check honesty: ${LEDGER} — quote any number that reads as a forecast, a delivered/retail price where forbidden, volume-not-value, a driver, a per-ingredient claim from a national macro stat, or cause-from-co-occurrence. Check data-access: download link + correct CC0/CC-BY badge + schema + catalog link + deep-links + schema.org present. Check craft: does the "walk through" actually work, is it beautiful, does it match the shared system.
Return verdict PASS (ship-ready) or FIX, with a concrete blocking[] list (must-fix: a11y violations, honesty breaches, broken interactions) and improvements[] (nits). Be specific + quote lines. Default to finding real problems.`,
    { agentType: 'general-purpose', label: `audit:${s.id}`, phase: 'Audit', effort: 'high', schema: AUDIT_SCHEMA }) : null,
  (a, s) => (a && a.verdict === 'FIX' && a.blocking && a.blocking.length) ? agent(
    `Apply fixes to the explorer at ${DIR}/${s.id}.html. Read it, then edit IN PLACE to resolve every BLOCKING issue below (and the improvements if quick), preserving the design system + self-contained structure. Re-verify the JSON embed still parses and the file is coherent.
BLOCKING (must fix): ${(a.blocking || []).join(' | ')}
IMPROVEMENTS (do if quick): ${(a.improvements || []).slice(0, 6).join(' | ')}
${LEDGER}
Return what you fixed and anything still remaining.`,
    { agentType: 'general-purpose', label: `fix:${s.id}`, phase: 'Perfect', effort: 'high', schema: FIX_SCHEMA }) : a,
)

return { spec_summary: { a11y_rules: spec.a11y_rules.length, tokens: spec.css_tokens.length }, results: results.filter(Boolean) }
