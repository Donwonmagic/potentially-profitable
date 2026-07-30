export const meta = {
  name: 'literature-grounding',
  description: 'Find + adversarially verify real published studies that ground each layer of the menu-pricing study',
  phases: [{ title: 'Find' }, { title: 'Verify' }],
}

const INTEGRITY = `CITATION-INTEGRITY RULE (highest stakes on this site — a fabricated citation would sink a research-branded page): ONLY real, published, findable works. Every citation MUST resolve to a stable identifier (DOI, JSTOR/NBER/journal URL, or an official report URL). Use web search/fetch to confirm the work EXISTS and that authors, year, title, venue, and the FINDING are accurate. Characterize findings precisely — never overstate. Where a popular claim is commonly MIS-cited (e.g. "90% of restaurants fail in year one"), surface the CORRECT finding and flag the myth. If you cannot verify a work exists and says what you claim, OMIT it. A missing citation is fine; an invented or bent one is catastrophic. No prices, no forecasts.`;

const STUDY = { type: 'object', additionalProperties: false,
  required: ['finding', 'authors', 'year', 'title', 'venue', 'identifier', 'groundsLayer', 'groundsHow', 'mythCorrected', 'confidence'],
  properties: {
    finding: { type: 'string', description: 'the study\'s key finding, one precise sentence' },
    authors: { type: 'string' }, year: { type: 'integer' }, title: { type: 'string' }, venue: { type: 'string', description: 'journal / publisher / report body' },
    identifier: { type: 'string', description: 'DOI or stable URL that resolves to this work' },
    groundsLayer: { type: 'string', description: 'which playbook layer it grounds: posture | trim-tax | bands | seasonal-window | substitution | trim-to-value | why-it-matters | menu-costs' },
    groundsHow: { type: 'string', description: 'one sentence: how our original analysis stands on / extends this finding' },
    mythCorrected: { type: ['string', 'null'], description: 'if this corrects a commonly mis-cited claim, name the myth; else null' },
    confidence: { type: 'string', enum: ['high', 'med', 'low'] },
  } };
const FIND_SCHEMA = { type: 'object', additionalProperties: false, required: ['studies'], properties: { studies: { type: 'array', items: STUDY } } };
const VER_SCHEMA = { type: 'object', additionalProperties: false, required: ['studies', 'rejected', 'summary'],
  properties: {
    studies: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['finding', 'authors', 'year', 'title', 'venue', 'identifier', 'groundsLayer', 'groundsHow', 'mythCorrected', 'verifiedVia', 'confidence'], properties: {
      finding: { type: 'string' }, authors: { type: 'string' }, year: { type: 'integer' }, title: { type: 'string' }, venue: { type: 'string' }, identifier: { type: 'string' }, groundsLayer: { type: 'string' }, groundsHow: { type: 'string' }, mythCorrected: { type: ['string', 'null'] }, verifiedVia: { type: 'string', description: 'the record/URL you confirmed it against' }, confidence: { type: 'string', enum: ['high', 'med', 'low'] } } } },
    rejected: { type: 'array', items: { type: 'string' }, description: 'works cut, with why (not found / misattributed / overstated)' },
    summary: { type: 'string' },
  } };

const THEMES = [
  { key: 'menu-costs', label: 'Menu-cost theory & price stickiness',
    ask: 'The macroeconomics of why firms hold prices sticky through cost shocks (Mankiw 1985 "menu costs"; sticky-price / price-adjustment-cost literature; how long firms wait to reprice). Grounds our print-vs-float posture and the 77-day median-shock-duration "don\'t reprint on day one" finding.' },
  { key: 'menu-eng-psych', label: 'Menu engineering & menu-pricing psychology',
    ask: 'Menu engineering (Kasavana & Smith) and hospitality menu-pricing psychology (Cornell studies: price formatting/framing, anchoring, decoy effects, dropping currency symbols, e.g. Kimes/Yang). Grounds how a posture verdict becomes a printed price.' },
  { key: 'yield-cost', label: 'Yield / edible-portion food-cost control',
    ask: 'Foodservice cost control: as-purchased vs edible-portion (AP/EP) yield, yield tests, the USDA Food Buying Guide basis for yields. Grounds the trim-tax (1 / edible yield) layer.' },
  { key: 'price-transmission', label: 'Farm-to-retail price transmission & volatility',
    ask: 'Agricultural economics of farm-to-wholesale-to-retail price transmission, asymmetric pass-through ("rockets and feathers"), and food price volatility. Grounds our wholesale-reference bands and the "wholesale is not what you pay" honesty.' },
  { key: 'seasonality', label: 'Seasonality of food/commodity prices',
    ask: 'Documented seasonal price patterns in produce and commodities, and how seasonality is estimated. Grounds our seasonal-window layer and the noise gate that separates a real season from scatter.' },
  { key: 'substitution', label: 'Substitution & cross-price elasticity',
    ask: 'Consumer/food demand theory: substitution, cross-price elasticity, demand systems (AIDS), and how co-movement differs from substitutability. Grounds our substitution finder (a culinary swap that co-moves does not hedge).' },
  { key: 'food-waste', label: 'Food-waste economics & recovery ROI',
    ask: 'The economics of restaurant food waste and the business case for reducing it (Champions 12.3 / WRAP "The Business Case for Reducing Food Loss and Waste"; ReFED). Grounds the trim-to-value layer with a real ROI figure.' },
  { key: 'restaurant-econ', label: 'Restaurant margins & mortality',
    ask: 'Peer-reviewed restaurant survival/mortality (H.G. Parsa et al.) correcting the "90% fail in year one" myth, and thin-margin structure of independent restaurants. Grounds why per-ingredient cost discipline matters. FLAG the myth vs the real number.' },
];

const dj = (o) => JSON.stringify(o);

phase('Find');
const results = await pipeline(
  THEMES,
  (t) => agent(
    `You are a research librarian + domain economist. Find 2-4 REAL, published, seminal-or-authoritative works that ground this theme, for a practitioner research study on restaurant menu pricing.
THEME: ${t.label}
WHAT IT MUST GROUND: ${t.ask}
Use web search/fetch to find and CONFIRM each work (DOI/stable URL). Prefer foundational + peer-reviewed; official reports (USDA, WRAP, Champions 12.3, NRA) are fine when authoritative. For each: the precise finding, full attribution, a resolvable identifier, which of our layers it grounds and how we stand on it, and whether it corrects a mis-cited myth.

${INTEGRITY}

Return only works you have confirmed exist and say what you claim. Quality and verifiability over quantity.`,
    { label: `find:${t.key}`, phase: 'Find', agentType: 'general-purpose', schema: FIND_SCHEMA },
  ).then((r) => ({ theme: t.key, studies: (r && r.studies) || [] })),
  (r) => {
    if (!r || !r.studies.length) return { theme: r ? r.theme : '?', studies: [], rejected: [], summary: 'none found' };
    return agent(
      `You are an ADVERSARIAL citation auditor. Your DEFAULT is to REJECT. For EACH work below, independently verify via web search/fetch: (1) it EXISTS and the identifier resolves; (2) authors, year, title, venue are exactly right; (3) it genuinely supports the claimed finding without overstatement; (4) any mythCorrected claim is accurate. Fix small attribution errors (adjust); REJECT and list in "rejected" anything you cannot resolve to a real record or that is overstated/misattributed. Add verifiedVia (the record you confirmed against). A fabricated or bent citation is the worst possible outcome — when in doubt, reject.

${INTEGRITY}

WORKS (theme ${r.theme}):
${dj(r.studies)}

Return only the verified works + the rejected list + a one-line summary.`,
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
  mythsCorrected: all.filter((s) => s.mythCorrected).map((s) => s.mythCorrected),
  rejected: themes.flatMap((t) => t.rejected),
  studies: all,
};
