export const meta = {
  name: 'cost-index-action-layer-map',
  description: 'Map the live Cost Index / Cost Pulse action layer against the remaining stats-audit charter findings — precise render sites, live-vs-dormant, current EN/ES copy, guarding gates, and the minimal honest fix per finding',
  phases: [{ title: 'Map', detail: 'one investigator per charter finding, reading the real code' }],
};

const REPO = '/home/user/potentially-profitable';

const SPEC = {
  type: 'object',
  additionalProperties: false,
  required: ['finding', 'liveOrDormant', 'renderSites', 'guardGates', 'honestFix', 'risk'],
  properties: {
    finding: { type: 'string', description: 'the charter finding id + one-line restatement' },
    liveOrDormant: { type: 'string', enum: ['live', 'dormant', 'partial'], description: 'does this actually render to a user today?' },
    renderSites: {
      type: 'array',
      description: 'every place this is surfaced or computed; empty if dormant',
      items: {
        type: 'object', additionalProperties: false,
        required: ['file', 'line', 'whatItAsserts'],
        properties: {
          file: { type: 'string' }, line: { type: 'integer' },
          whatItAsserts: { type: 'string', description: 'the claim/verb the code emits' },
          currentCopyEN: { type: 'string' }, currentCopyES: { type: 'string' },
        },
      },
    },
    guardGates: { type: 'array', items: { type: 'string' }, description: 'check-*.mjs gates that would fail if the copy/logic changes' },
    honestFix: { type: 'string', description: 'the precise, minimal change to make this defensible per the charter — reference exact files/functions' },
    proposedCopyEN: { type: 'string', description: 'exact replacement copy if this is a wording fix; else empty' },
    proposedCopyES: { type: 'string', description: 'exact ES mirror; else empty' },
    dependencies: { type: 'string', description: 'other findings/files this fix touches or must stay coherent with' },
    risk: { type: 'string', description: 'what could break; any locale-parity / gate / no-fetch concerns' },
  },
};

const COMMON = `You are a senior engineer + statistician auditing the muntin.digital storefront at ${REPO}.
This is a static site (HTML + inline CSS + pure-JS shared modules in tools/_shared/ + ~70 build/check scripts in scripts/). The Cost Index renders per-ingredient pages via scripts/build-cost-index-pages.mjs and the client renderer tools/_shared/cost-index-ui.js; the "Cost Pulse" tool is tools/cost-pulse/index.html. A stats-audit charter (2026-07) requires that any claim converting a MEASUREMENT into a forward VERB be gated, cited, or withheld. The conformal coverage number and the beef-series duplication and the Vendor Benchmark's own regime/spike verbs were ALREADY fixed in a prior commit; do NOT re-map those. Read the REAL code (Read/Grep/Bash), cite exact file:line, and distinguish what actually renders to a user (live) from dead/dormant modules. Quote the current EN and ES copy verbatim where it is user-facing. For the honest fix, follow the charter's defensible wording and prefer the existing withhold machinery. Return ONLY the structured spec.`;

const FINDINGS = [
  { key: 'C3-verbs', prompt: `FINDING C3/C6 — the spike/structural/easing VERB LADDER on the live Cost Index pages. tools/_shared/cost-verdict.js maps a spike classification to an action verb ("Consider re-pricing", "renegotiate", "hold", "watch"). Trace exactly where these verbs are SURFACED to users: the per-ingredient cost-index pages (scripts/build-cost-index-pages.mjs), the cost-index-ui.js client renderer, and/or the cost-pulse tool. For each render site quote the current EN/ES copy. The charter verdict: DO-NOT-SHIP the imperatives; keep the labels only as PAST-TENSE DESCRIPTIONS of the recent path (a walk-forward backtest on the shipped data shows "structural" mean-reverts, spike vs structural are indistinguishable, and "easing" bounces up). Propose the exact honest description copy (EN+ES) to replace each imperative, mirroring the demotion already done in tools/vendor-benchmark/vendor-benchmark.js (spikeStructural/spikeSpike/spikeEasing strings). Identify which check-*.mjs gates guard this (e.g. check-pressure-honesty, check-cost-index-*, banned-words, locale-parity).` },
  { key: 'C4-regime', prompt: `FINDING C4 — the Pettitt regime "market stepped up around {date}" claim. tools/_shared/cost-anomaly.js pettitt() + scripts/build-cost-anomaly-log.mjs produce data/cost-anomaly-log.json (38 "significant regime breaks"). Determine whether this regime/"step" claim is SURFACED to users anywhere on the live cost-index pages, the cost-index-ui.js renderer, or the cost-pulse tool — or whether the anomaly log is a build-only research artifact that ships to no page (the check-all comment claims "ships to no page"). VERIFY by grepping for consumers of cost-anomaly-log.json and of MuntinAnomaly/pettitt across tools/ and scripts/ that emit HTML. If any user-facing surface asserts a discrete "step"/"stepped up"/"regime", quote it (EN+ES) and propose the honest fix (gate off, or reword to "has been drifting up/down"), matching the Vendor Benchmark's regime gate-off. If it is genuinely dormant/build-only, say so with evidence and note whether the internal log should carry an honesty caveat.` },
  { key: 'C5-feedgrain', prompt: `FINDING C5/HIGH-4 — the "feed-grain (Corn, Soybeans) tends to move before protein prices — an association, as of {date}" claim, the ONLY cross-ingredient claim actually shipped. It is a STATIC editorial map (data/cost-index.js drivers[].leads / DRIVERS kind:'feed-grain'), rendered by scripts/build-cost-index-pages.mjs and tools/_shared/cost-index-ui.js — NOT computed from on-device data, and the named driver series (corn/soybeans/diesel feed) are not even in the shipped history. Find every exact render site and quote the current EN/ES copy. The charter fix: reframe as a CITED external fact (USDA ERS feed-cost-to-livestock biological lag) inside a <details class="cite"> drawer, and DELETE "an association" + the "as of {date}" badge that imply on-device measurement. Check data/sourced-claims.json for an existing USDA ERS citation to reference, or specify the citation to add. Identify guarding gates (check-cost-index-drivers, check-fabrications, check-cost-index-sources).` },
  { key: 'C5-leadlag', prompt: `FINDING C5 — the lead-lag module tools/_shared/cost-leadlag.js (bestLag/framing, "X has tended to move before Y"). The audit says it is DORMANT (no build script or HTML wires it up) and correlates raw price LEVELS (spurious-regression trap). VERIFY definitively: grep every consumer of MuntinLeadLag / cost-leadlag across the whole repo (tools/, scripts/, *.html) and confirm nothing surfaces it. If dormant, the honest action is to keep it dormant and add a header/guard comment; report whether any test or build imports it. If it IS wired anywhere, treat as live and specify the withhold. Also confirm the cointegration gate (cost-cointegration.js / check-bridge-cointegration.mjs) is the SHIP-as-is honest half and surfaces zero live dollar bridges.` },
  { key: 'CRIT5-multiplicity', prompt: `FINDING CRIT-5 — pipeline multiplicity. Across ~81 ingredients the Cost Index runs, per item, a forecast + change-point + spike classifier + percentile and emits BUY/WAIT/HOLD/RENEGOTIATE/re-price with NO family-wise or false-discovery control; on a vol-matched noise null ~99.5% of ingredients get at least one non-HOLD verb. The team's own docs/cost-index-methodology-hardening.md §9 prescribes Benjamini-Yekutieli + per-item null gate. Map the ACTUAL live pipeline: which per-item verbs render on the cost-index pages / cost-pulse today (after the C3/C4 fixes are applied), and where a per-item null gate (block-bootstrap or vol-matched random-walk of that same series, beat at a corrected threshold) + a panel-level BY correction would insert. Point to the exact function(s) in cost-verdict.js / buy-or-ride.js / build-cost-index-pages.mjs / cost-index-ui.js. Note grep results for any existing FDR/BY/multiplicity code (pressure-calibrate.js governs a DIFFERENT layer). Propose the minimal, shippable gating design and whether it should default to HOLD/WITHHOLD.` },
  { key: 'HIGH2-seam', prompt: `FINDING HIGH-2 — the live-level "seam". tools/_shared/market-window.js compute()/seriesForKey appends the live composite level (assessment.level.medianCents, a national LMR blend) as a new endpoint on the deep (regional) series when it is newer, and that spliced series feeds conformalNext (C1), the spike classifier (C3), and Pettitt (C4). Measured single-step seam jumps are large basis-mismatch discontinuities (e.g. corn-on-the-cob +60%, +17% beef-tenderloin). Read market-window.js precisely (the augment block ~lines 260-285 and seriesForKey ~90-105), and also how tools/_shared/cost-index-ui.js (~1080-1086) augments. Specify the exact honest fix: only augment when the live source == the deep-series source AND |seam%| < k× the series' rolling step; otherwise compute the forward math (conformal/spike/pettitt) on the UN-augmented series and use the live point only for "where the price is now". Give the precise guard to add and which callers must switch to the un-augmented series. Note colocated tests (market-window.test.mjs) that must stay green + parity with any Ledger port.` },
  { key: 'C2-3year', prompt: `FINDING C2 — "near a 3-year high/low" / percentile framing. The audit found the CODE (tools/_shared/cost-index-format.js percentileLine) is actually honest — it says "higher than B of its last N weekly reads" over a ~26-week spark, NOT "3-year" — but any UI/marketing that renders "3-year high/low" over-reaches, and the docstring claims percentile "separates expensive from rising" (backwards). Grep for "3-year"/"3 year"/"3-yr"/"3 yr"/"three-year" (EN) and "3 años"/"tres años" (ES) across tools/, cost-index pages, cost-pulse, and any generator, and find any place a ~6-month statistic is labeled "3-year", or a percentile/lock verb is coupled to range position. Quote current copy. Propose honest replacements (name the true window; no coupled lock/buy verb; add a seasonality hedge for seasonal produce using the already-present seasonalNormals). Fix the misleading docstring in cost-index-format.js. List guarding gates.` },
  { key: 'provenance-receipt', prompt: `FINDING HIGH-1 (provenance) — blanket "Drawn from 3 years of weekly USDA wholesale reads" receipts. In tools/vendor-benchmark/vendor-benchmark.js the string receiptDepthDeep asserts "3 years of weekly USDA wholesale reads" for every deep item, but the shipped deep series are heterogeneous: 4 beef items are MONTHLY (now 2 remain after dedup: ribeye, ground-beef), and eggs spans ~1.4 years not 3. Find every place a blanket cadence/span receipt is asserted (vendor-benchmark.js, build-cost-index-pages.mjs, cost-index-ui.js). Propose deriving the receipt per item from the actual data — real cadence (weekly/monthly), real span (first→last date), true source — e.g. "Drawn from {N} {weekly|monthly} USDA reads, {firstDate}–{lastDate}". Quote current EN/ES copy and give exact replacements. Note that the conformal lookback should be in TIME units not fixed row counts (already partly handled). List guarding gates + locale parity.` },
];

const specs = await parallel(FINDINGS.map((f) => () =>
  agent(`${COMMON}\n\n=== YOUR ASSIGNED FINDING ===\n${f.prompt}`, {
    label: `map:${f.key}`, phase: 'Map', schema: SPEC,
  }).then((s) => (s ? { ...s, _key: f.key } : null))
));

return { specs: specs.filter(Boolean) };
