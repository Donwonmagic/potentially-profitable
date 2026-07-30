export const meta = {
  name: 'food-science-grounding',
  description: 'Find + verify peer-reviewed food-science studies grounding each layer, each with a plain kitchen translation',
  phases: [{ title: 'Find' }, { title: 'Verify' }],
}

const INTEGRITY = `CITATION-INTEGRITY RULE (highest stakes — a fabricated citation sinks a research-branded page): ONLY real, published, findable peer-reviewed food-science works (Meat Science, Journal of Food Science, J. Agric. Food Chem., Postharvest Biology & Technology, LWT, Food Chemistry, university extension science, etc.). Every citation MUST resolve to a DOI or stable record. Use web search/fetch to confirm it EXISTS and that authors/year/title/venue and the FINDING are accurate. Never overstate. If you cannot verify, OMIT it. A missing citation is fine; an invented or bent one is catastrophic.`;
const TRANSLATE = `TRANSLATION MANDATE: the audience is a working independent restaurant operator, not a scientist. For each study give BOTH: (a) plainFinding — the science stated accurately but in plain words; (b) kitchenTranslation — what it means on their line, in terms they relate to (a buy, a prep step, a storage choice, a yield they can feel on an invoice). Concrete, not abstract. No jargon without a plain gloss.`;

const STUDY = { type: 'object', additionalProperties: false,
  required: ['plainFinding', 'kitchenTranslation', 'authors', 'year', 'title', 'venue', 'identifier', 'groundsLayer', 'confidence'],
  properties: {
    plainFinding: { type: 'string' }, kitchenTranslation: { type: 'string' },
    authors: { type: 'string' }, year: { type: 'integer' }, title: { type: 'string' }, venue: { type: 'string' },
    identifier: { type: 'string', description: 'DOI or stable URL that resolves' },
    groundsLayer: { type: 'string', description: 'cooked-yield | trim-tax | shelf-life | storage | freezing | substitution | juice-yield | peak-season | safety' },
    confidence: { type: 'string', enum: ['high', 'med', 'low'] },
  } };
const FIND_SCHEMA = { type: 'object', additionalProperties: false, required: ['studies'], properties: { studies: { type: 'array', items: STUDY } } };
const VER_SCHEMA = { type: 'object', additionalProperties: false, required: ['studies', 'rejected', 'summary'],
  properties: {
    studies: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['plainFinding', 'kitchenTranslation', 'authors', 'year', 'title', 'venue', 'identifier', 'groundsLayer', 'verifiedVia', 'confidence'], properties: {
      plainFinding: { type: 'string' }, kitchenTranslation: { type: 'string' }, authors: { type: 'string' }, year: { type: 'integer' }, title: { type: 'string' }, venue: { type: 'string' }, identifier: { type: 'string' }, groundsLayer: { type: 'string' }, verifiedVia: { type: 'string' }, confidence: { type: 'string', enum: ['high', 'med', 'low'] } } } },
    rejected: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' },
  } };

const THEMES = [
  { key: 'meat-science', label: 'Meat science: cooking loss, water-holding, collagen',
    ask: 'Cooking loss / water-holding capacity vs temperature, collagen solubilization to gelatin in slow moist heat (why tough cuts braise tender), protein denaturation, dry-aging moisture loss. Grounds cooked-yield/shrink and why the braise loses more than the raw trim.' },
  { key: 'postharvest', label: 'Post-harvest produce physiology',
    ask: 'Respiration rate, ethylene production vs sensitivity (climacteric fruit; ethylene cross-contamination), transpiration/water loss and wilting, chilling injury (why tomatoes/bananas hate the fridge). Grounds shelf-life, storage method, and produce trim loss.' },
  { key: 'freezing', label: 'Freezing & cold-chain science',
    ask: 'Ice-crystal formation vs freezing rate, thaw drip/purge loss, freezer burn/quality decline over time, blanching before freezing. Grounds freezer hold-life and the purge that erodes a frozen cut\'s effective yield.' },
  { key: 'flavor-sensory', label: 'Flavor & sensory chemistry',
    ask: 'Characteristic aroma compounds (e.g. the aldehydes defining cilantro; citrus aroma oils concentrated in peel/flavedo vs juice), Maillard/browning, why a substitute is never a perfect flavor match. Grounds substitution quality and juice/garnish-yield reality.' },
  { key: 'fabrication-yield', label: 'Fabrication & edible-yield science',
    ask: 'Peer-reviewed / extension cutting-yield and dress-out studies for meat, poultry, and seafood, and edible-portion (EP/AP) determination. Grounds the trim-tax layer with science beyond a single book value.' },
  { key: 'starch-legume', label: 'Starch & legume hydration science',
    ask: 'Water absorption / cooked-weight ratios and starch gelatinization for rice, dried beans, and whole grains; soaking effects. Grounds the cooked-yield (>1, they swell) for the new staple ingredients.' },
  { key: 'produce-quality', label: 'Produce quality & seasonality science',
    ask: 'How eating quality (sugar/acid, texture, nutrient density) varies by season, cultivar, and growing region/harvest maturity. Grounds the peak-quality-season layer (best-eating months, distinct from cheapest).' },
  { key: 'safety-spoilage', label: 'Food safety & spoilage microbiology',
    ask: 'Spoilage kinetics and safe refrigerated shelf-life limits, temperature danger zone, why storage temperature sets hold-life. Grounds shelf-life honesty and storage guidance (safety, not just quality).' },
];

const dj = (o) => JSON.stringify(o);

phase('Find');
const results = await pipeline(
  THEMES,
  (t) => agent(
    `You are a food scientist writing for restaurant operators. Find 2-4 REAL peer-reviewed food-science works that ground this theme, and translate each for a working operator.
THEME: ${t.label}
WHAT IT GROUNDS: ${t.ask}
Use web search/fetch to find and CONFIRM each work (DOI/stable record). For each: plainFinding (the science, accurate but plain), kitchenTranslation (what it means on their line), full attribution, resolvable identifier, and which layer it grounds.

${INTEGRITY}
${TRANSLATE}

Return only works you have confirmed exist and say what you claim.`,
    { label: `find:${t.key}`, phase: 'Find', agentType: 'general-purpose', schema: FIND_SCHEMA },
  ).then((r) => ({ theme: t.key, studies: (r && r.studies) || [] })),
  (r) => {
    if (!r || !r.studies.length) return { theme: r ? r.theme : '?', studies: [], rejected: [], summary: 'none' };
    return agent(
      `You are an ADVERSARIAL citation + accuracy auditor. Default REJECT. For EACH work: independently verify via web that (1) it EXISTS and the identifier resolves; (2) authors/year/title/venue are exactly right; (3) plainFinding faithfully represents the paper without overstatement; (4) kitchenTranslation is a TRUE consequence of the finding, not a leap. Adjust small errors; REJECT (into "rejected") anything unresolvable, misattributed, overstated, or whose kitchen translation overreaches the science. Add verifiedVia.

${INTEGRITY}
${TRANSLATE}

WORKS (theme ${r.theme}):
${dj(r.studies)}

Return verified works + rejected list + one-line summary.`,
      { label: `verify:${r.theme}`, phase: 'Verify', agentType: 'general-purpose', schema: VER_SCHEMA },
    ).then((v) => ({ theme: r.theme, studies: (v && v.studies) || [], rejected: (v && v.rejected) || [], summary: v ? v.summary : '' }));
  },
);

const themes = results.filter(Boolean);
const all = themes.flatMap((t) => (t.studies || []).map((s) => ({ ...s, theme: t.theme })));
return {
  themeCount: themes.length,
  verifiedStudies: all.length,
  byLayer: all.reduce((o, s) => { o[s.groundsLayer] = (o[s.groundsLayer] || 0) + 1; return o; }, {}),
  rejected: themes.flatMap((t) => t.rejected),
  studies: all,
};
