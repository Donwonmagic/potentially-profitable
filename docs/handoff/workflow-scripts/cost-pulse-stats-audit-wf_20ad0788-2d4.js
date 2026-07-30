export const meta = {
  name: 'cost-pulse-stats-audit',
  description: 'A dedicated statistical-rigor audit: expert statisticians + data scientists adversarially validate the forecasting/regime/classification math the forward-timing Cost Pulse relies on — reading the real module code and re-running the math against the shipped data',
  phases: [
    { title: 'Audit', detail: '8 method experts each pressure-test one statistical foundation, empirically' },
    { title: 'Referee', detail: 'a chief statistician reconciles findings into per-claim verdicts + a remediation list' },
  ],
}

const ROOT = '/home/user/potentially-profitable'

const CONTEXT = `
YOU ARE A SENIOR STATISTICIAN / DATA SCIENTIST auditing the math behind a
reimagined free tool for independent restaurant operators. The tool ("Cost Pulse,
forward timing") makes FORWARD-LOOKING claims about wholesale ingredient prices,
built entirely on shipped, on-device data and a set of pure JS statistical
modules. Its whole value proposition — and its honesty moat — rests on these
claims being statistically DEFENSIBLE and HONESTLY COMMUNICATED. Your job is
rigor, not enthusiasm: find where the math is wrong, over-claimed, or an artifact,
and say exactly how to fix or reword it.

THE CONCRETE CLAIMS THE TOOL MAKES (audit these specific statements):
  C1. "Its next move should stay within ±X% — a range that's been right Y% of the
      time (Z readings)."  [a conformal prediction interval + its walk-forward coverage]
  C2. "Near a 3-year high/low" and a where-it-sits bar at the Nth percentile of the
      3-year range → used to justify "LOCK" (buy now) or "RENEGOTIATE".
  C3. "That market move has held / ran up then pulled back / has been easing"
      [spike-vs-structural-vs-easing classification of the recent window].
  C4. "The whole market stepped up around {date} — a market-wide step, not just
      your vendor" [a dated regime break].
  C5. Cross-ingredient claims (if surfaced): "beef and X move together" / lead-lag.
  C6. A per-ingredient BUY/WAIT/HOLD/RENEGOTIATE verb derived from the above.
  C7. Confidence tiers (high/medium/low) and the decision to WITHHOLD on thin data.

THE ACTUAL CODE + DATA (read, and RUN node experiments against it — do not reason
in the abstract; re-run the math and report empirical results):
- ${ROOT}/tools/_shared/cost-conformal.js  (+ cost-conformal.test.mjs) — the interval + coverage backtest
- ${ROOT}/tools/_shared/cost-anomaly.js    (+ .test.mjs) — Pettitt change-point + Hampel
- ${ROOT}/tools/_shared/cost-spike.js      (+ .test.mjs) — spike/structural/easing thresholds
- ${ROOT}/tools/_shared/cost-leadlag.js, cost-cointegration.js (+ tests) — cross-ingredient
- ${ROOT}/tools/_shared/cost-index-format.js — thenVsNow, percentileLine, vsLastYear
- ${ROOT}/tools/_shared/{cost-confidence.js,cost-confidence-score.js,cost-staleness.js} — the confidence machinery
- ${ROOT}/tools/_shared/{composite-price.js,cost-index-sources.js} — how sources are blended
- ${ROOT}/data/cost-index.js (window.MUNTIN_COST_INDEX: 81 ingredients, assessment.history[]) and
  ${ROOT}/data/cost-index-history.js (window.MUNTIN_COST_INDEX_HISTORY: ~39 keys, ~3yr weekly [date,cents]).
  Load with: node -e 'global.window={};require("./data/cost-index.js");require("./data/cost-index-history.js");...'
  (run from ${ROOT}).

HOW TO RUN THE MATH: require the modules in Node and feed them the real series.
Example: const CONF=require("./tools/_shared/cost-conformal.js"); CONF.conformalNext(values,{calibrate:true}).
Re-run backtests yourself, across MANY items, and report the empirical distribution — not one cherry-picked case.

WHAT HONESTY MEANS HERE (the bar): a claim is only shippable if a skeptical
statistician would sign it. Coverage claims must be out-of-sample / walk-forward
with NO leakage. Small-sample coverage (e.g. ribeye n=27) must be caveated or
withheld. Percentile-of-history must not mislead on a trending/non-stationary
series. Any signal chosen from 81 candidates must survive multiple-testing scrutiny.
Wholesale ≠ delivered. The tool must WITHHOLD rather than over-claim. If the honest
version of a claim is weaker, state the wording we CAN defend.

Be specific, empirical, and severity-ranked. Cite files, line numbers, and the
node experiment you ran. This is an adversarial audit — assume the claims are
wrong until the data shows otherwise.`

phase('Audit')

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    lens: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          claim: { type: 'string', description: 'the specific claim/method/statement being judged (reference C1..C7 where apt)' },
          verdict: { type: 'string', enum: ['sound', 'sound-with-caveat', 'questionable', 'unsound'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          critique: { type: 'string', description: 'the precise statistical issue' },
          evidence: { type: 'string', description: 'file:line and/or the node experiment you ran + its empirical result' },
          fix: { type: 'string', description: 'concrete remediation: a math fix, a gate, a caveat, or a reworded claim' },
          honestClaim: { type: 'string', description: 'if the current claim over-reaches, the exact wording we CAN defend' },
        },
        required: ['claim', 'verdict', 'severity', 'critique', 'fix'],
      },
    },
    overallAssessment: { type: 'string', description: '3-5 sentences: is this foundation shippable, and what is the single biggest risk?' },
  },
  required: ['lens', 'findings', 'overallAssessment'],
}

const AUDITORS = [
  { key: 'conformal', lens: 'CONFORMAL PREDICTION & COVERAGE VALIDITY (claim C1). Audit cost-conformal.js. Is the split/EnbPI-style interval valid and distribution-free as claimed? Is the walk-forward coverage a true out-of-sample backtest with NO leakage (does calibrate= re-fit on the same data it reports coverage for)? Is "the 80% band covered 79%" a legitimate conditional-coverage statement? Re-run conformalNext across ALL deep-history items; report the empirical coverage distribution and where nTested is too small (e.g. ribeye n=27) for the % to mean anything. Does the ±% expressed as a symmetric band misrepresent asymmetric ("rockets-and-feathers") moves? What is the honest minimum n and the honest wording?' },
  { key: 'changepoint', lens: 'CHANGE-POINT / REGIME-BREAK (claim C4). Audit cost-anomaly.js Pettitt + how the tool uses it on a recent window. Is Pettitt applied correctly (single-change-point assumption; the pApprox = 2*exp(-6K^2/(n^3+n^2)) approximation; the significance threshold)? Running it on a RECENT 30-pt window vs the full series — is that valid, or does it guarantee a "significant" break by construction? Multiple testing: if you run it on 81 ingredients, how many false "market stepped up" breaks appear by chance? Re-run across items and report. When is dating a break defensible?' },
  { key: 'classifier', lens: 'SPIKE / STRUCTURAL / EASING CLASSIFIER (claims C3, C6). Audit cost-spike.js. Are the thresholds (material 8%, persist 4wk, retrace 1/3, recent 8) defensible or arbitrary/over-fit? Is there ANY backtest that these labels predict what actually happened next (do "spike" items actually revert; do "structural" persist)? Re-run classify across items and, using the history, check whether the label’s implied prediction held out-of-sample. Is the verb ladder (spike→WAIT, easing→RENEGOTIATE, near-high→LOCK) statistically justified or just a plausible story?' },
  { key: 'stationarity', lens: 'PERCENTILE / STATIONARITY / "NEAR A 3-YR LOW → LOCK" (claim C2). Is percentile-of-3yr-history a valid signal on a NON-STATIONARY (trending/inflationary) series? On a downtrend, everything is "near a 3-yr low" and "lock now" would be wrong (it keeps falling). Test: for items the tool would call "near a low → LOCK", did price actually rise afterward, or keep falling? Re-run empirically. Is mean-reversion assumed without evidence? What is the honest framing of percentile position?' },
  { key: 'crossitem', lens: 'LEAD-LAG / COINTEGRATION / CROSS-INGREDIENT (claim C5). Audit cost-leadlag.js and cost-cointegration.js. Spurious-correlation and multiple-comparison risk: with ~39 series you get ~700 pairs — how many "move together" / "X leads Y" appear by chance? Are the cointegration tests (which?) valid at these sample sizes? Is any causal or predictive language defensible? Re-run and report which cross-item claims, if any, survive a multiple-testing correction. Recommend the honest bar for surfacing any cross-item signal.' },
  { key: 'multiplicity', lens: 'MULTIPLE TESTING / GARDEN OF FORKING PATHS (spans C1-C6). The tool scans 81 ingredients and, per item, runs a forecast + change-point + classifier + percentile, then picks the "movers" and the buy/wait calls. Quantify the multiplicity: across all items and tests, how many "actionable" signals would appear on PURE NOISE / a random-walk null? Simulate: generate random-walk series matched to the real volatility, run the whole pipeline, and count false LOCK/WAIT/RENEGOTIATE/regime-break calls. What false-discovery rate is the tool implicitly running, and what correction / withhold rule brings it honest?' },
  { key: 'dataquality', lens: 'DATA QUALITY / MEASUREMENT / PROVENANCE (underlies everything). Audit the series themselves + how they are blended (composite-price.js, cost-index-sources.js, cost-staleness.js). Wholesale vs delivered; mixing USDA-LMR with regional AMS markets; basis mixing; the augmentation of the series with the live level at generatedAt; staleness; gaps; the 2-element deep-history rows (pre-blended, no per-row source). Do these compromise the forecasts? Are the histories clean and dense enough per item to forecast at all? Which items have data too poor to make ANY forward claim (and does the tool correctly withhold them)?' },
  { key: 'communication', lens: 'UNCERTAINTY COMMUNICATION & HONEST WORDING (spans all). Judge how uncertainty is STATED, not just computed. Is "a range that\'s been right 82% of the time" a fair statement of walk-forward coverage to a layperson, or does it imply more certainty than a conditional interval warrants? Are the confidence tiers (cost-confidence*.js) mapped honestly to what withholds? Does the buy/hold verb convey false precision (a "call" from a probabilistic edge)? Propose the exact honest phrasings + the mandatory caveats (wholesale≠delivered; small-sample; not advice), and the WITHHOLD rules that keep every on-screen claim defensible.' },
]

const audits = await parallel(AUDITORS.map((a) => () =>
  agent(`${CONTEXT}\n\nYOUR AUDIT LENS: ${a.lens}\n\nRead the relevant code AND run node experiments against the real shipped data — report empirical results, not abstract reasoning. Return the structured findings, severity-ranked, with the honest wording for any over-claim.`,
    { label: `audit:${a.key}`, phase: 'Audit', schema: FINDING_SCHEMA, effort: 'high' })
))

const auditDigest = AUDITORS.map((a, i) => {
  const r = audits[i];
  if (!r) return `## ${a.key}: (no result)`;
  const fl = (r.findings || []).map((f) =>
    `- [${f.severity}/${f.verdict}] ${f.claim}\n    critique: ${f.critique}\n    evidence: ${f.evidence || '(none)'}\n    fix: ${f.fix}${f.honestClaim ? `\n    honest wording: ${f.honestClaim}` : ''}`).join('\n');
  return `## Auditor: ${a.key}\nOVERALL: ${r.overallAssessment}\n${fl}`;
}).join('\n\n');

phase('Referee')

const referee = await agent(
  `${CONTEXT}\n\nYou are the CHIEF STATISTICIAN refereeing an 8-expert adversarial audit of the forward-timing Cost Pulse. Reconcile the findings (including disagreements) into a decisive, implementation-ready verdict.\n\nAUDIT FINDINGS:\n${auditDigest}\n\nProduce a Markdown report with:\n1. VERDICT-AT-A-GLANCE: for each claim C1..C7, one of SHIP / SHIP-WITH-CAVEAT / FIX-FIRST / DO-NOT-SHIP, plus the one-line reason.\n2. The CRITICAL & HIGH findings, consolidated and de-duplicated, each with the concrete remediation (a math fix, a gate/withhold rule, or a reworded claim).\n3. A "STATISTICAL HONESTY CHARTER" for the tool: the mandatory withhold rules (minimum n, confidence floors, multiple-testing/FDR control, stationarity guard), the exact defensible wording for each on-screen claim, and the mandatory caveats.\n4. What is genuinely a MOAT here (statistically defensible and rare) vs. what is a plausible-but-indefensible story to cut.\n5. A prioritized methodology-remediation checklist to do BEFORE any of this ships.\nBe decisive and specific. A claim only ships if you would personally sign it.`,
  { label: 'referee:synthesis', phase: 'Referee', effort: 'high' }
)

return {
  auditorLenses: AUDITORS.map((a) => a.key),
  audits: audits,
  refereeVerdict: referee,
}
