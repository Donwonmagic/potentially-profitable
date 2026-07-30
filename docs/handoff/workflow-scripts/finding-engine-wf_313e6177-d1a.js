export const meta = {
  name: 'finding-engine',
  description: 'FunSearch-style discovery engine over muntin.digital data: generate hypotheses, verify by execution against real files, adversarially kill, keep only survivors',
  phases: [
    { title: 'Method', detail: 'how frontier labs actually orchestrate agents for discovery' },
    { title: 'Recon', detail: 'exact schemas so hypotheses can be written as code' },
    { title: 'Generate', detail: 'six diverse lenses propose candidate findings' },
    { title: 'Execute', detail: 'each hypothesis computed against real data — the un-foolable verifier' },
    { title: 'Kill', detail: 'four-lens adversarial panel per surviving finding' },
    { title: 'Deepen', detail: 'second-round hypotheses seeded by strongest survivors' },
    { title: 'Synthesize', detail: 'rank, write up, author the reusable harness' },
  ],
}

const REPO = '/home/user/potentially-profitable'
const SCRATCH = '/tmp/claude-0/-home-user/e5df842e-7cf1-50b1-b408-948fda2c4153/scratchpad'

const CONTEXT = `muntin.digital is a one-person, product-only restaurant cost-intelligence company run by Don Goldstein (full-time FOH manager at Tacombi, Bethesda MD + Arlington VA). Static site, no server, no CMS. It publishes the Cost Index (a weekly of-record read on wholesale food costs), free operator tools, and open CC0/CC-BY datasets at /open/.

THE HONESTY CONTRACT IS ABSOLUTE AND NON-NEGOTIABLE:
- Public wholesale levels are NEVER delivered price. A read is against each ingredient's OWN baseline window.
- Co-occurrence, NEVER cause. Detected price events x cited registries are shown as shared timing only.
- Trade figures are nominal VALUE, never volume, never supply.
- No forecasts. Ever. Descriptive of the tracked record only.
- Every number/date/name must trace to a source (data/sourced-claims.json) or be labeled illustrative.
- The instrument DECLINES to publish a read it cannot stand behind (37 of 100 ingredients were "withhold").
Any finding that violates these is dead on arrival, no matter how interesting.`

const HYPO_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    lens: { type: 'string' },
    hypotheses: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          claim: { type: 'string', description: 'the candidate finding, stated as a falsifiable empirical claim with a placeholder for the number' },
          whyItMatters: { type: 'string', description: 'what real decision or belief this changes for an independent restaurant operator' },
          whyNovel: { type: 'string', description: 'why this is unlikely to already be published anywhere' },
          testSpec: { type: 'string', description: 'EXACT computation: which files, which fields, which join, which statistic. Must be precise enough that another agent can code it without guessing.' },
          killCondition: { type: 'string', description: 'what computed result would FALSIFY this claim' },
          datasets: { type: 'array', items: { type: 'string' } },
        },
        required: ['claim', 'whyItMatters', 'whyNovel', 'testSpec', 'killCondition', 'datasets'],
      },
    },
  },
  required: ['lens', 'hypotheses'],
}

const EXEC_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    claim: { type: 'string' },
    outcome: { type: 'string', enum: ['confirmed', 'refuted', 'partial', 'uncomputable'] },
    measuredResult: { type: 'string', description: 'the ACTUAL numbers you computed, precisely stated. Not an estimate. Not a guess.' },
    revisedClaim: { type: 'string', description: 'the claim rewritten to match what the data actually shows, with real numbers substituted' },
    provenance: { type: 'string', description: 'exact files + fields + n (sample size) used' },
    code: { type: 'string', description: 'the script you actually ran (trimmed to the essential computation)' },
    caveats: { type: 'string', description: 'sample size limits, missing data, what this does NOT show' },
    surprisingness: { type: 'integer', minimum: 1, maximum: 5, description: '1=everyone already assumes this, 5=genuinely counterintuitive' },
  },
  required: ['claim', 'outcome', 'measuredResult', 'revisedClaim', 'provenance', 'code', 'caveats', 'surprisingness'],
}

const KILL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    lensName: { type: 'string' },
    verdict: { type: 'string', enum: ['kill', 'survives-weakened', 'survives'] },
    reasoning: { type: 'string' },
    fatalProblem: { type: 'string', description: 'empty string if none' },
    requiredCaveat: { type: 'string', description: 'caveat that MUST accompany publication, empty if none' },
  },
  required: ['lensName', 'verdict', 'reasoning', 'fatalProblem', 'requiredCaveat'],
}

// ============ PHASE 1: METHOD — how the frontier actually does discovery ============
phase('Method')
log('Researching how frontier labs orchestrate agents for genuine discovery (not summarization)...')

const METHOD_TASKS = [
  {
    label: 'method:verifier-search',
    prompt: `Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28 — search, do not rely on training data.

Research the class of AI systems that have produced GENUINELY NEW knowledge (not summaries): DeepMind FunSearch (cap set problem, bin packing), AlphaEvolve, AlphaTensor, and any 2025-2026 successors.

Answer precisely:
1. What is the SHARED architectural property that makes these produce real discoveries rather than plausible-sounding text? Be specific about the generate-and-verify loop.
2. What role does the automatic evaluator play, and why can't it be fooled by a persuasive LLM?
3. How is the search space structured so that novelty is even possible? (islands, evolutionary population, program space vs text space)
4. What fraction of generated candidates survive verification in these systems? Any published numbers on yield?
5. What are the necessary conditions for this pattern to transfer to a NEW domain (e.g. empirical analysis of open economic/agricultural data)? What must be true of the domain?
6. What is the known failure mode when the verifier is weak or is itself an LLM?

Return concrete, sourced findings. This determines the architecture of a discovery system, so precision matters more than breadth.`,
  },
  {
    label: 'method:multi-agent-practice',
    prompt: `Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28 — search for current practice.

Research how leading AI researchers and practitioners ACTUALLY orchestrate multi-agent systems in 2026, with emphasis on what is measured rather than claimed:
1. Anthropic's published multi-agent research system (orchestrator-worker, parallel subagents) — what did they measure about when parallelism helps vs hurts? Token cost multipliers? Task types where it wins?
2. Google's AI Co-Scientist and similar hypothesis-generation multi-agent systems — architecture (generate/reflect/rank/evolve/meta-review tournaments), and any evidence of validated novel results.
3. Sakana AI Scientist and its critiques — what specifically went wrong, and why did reviewers call the output shallow?
4. Claude Code / Agent SDK power-user patterns among researchers: subagents, parallel worktrees, hooks, headless orchestration, verification loops. What do the most sophisticated users actually do differently?
5. The measured failure modes of naive fan-out: context fragmentation, redundant work, conflicting conclusions, cost blowup, and the "everything looks confirmed" problem.

Be concrete and sourced. Distinguish measured results from vendor marketing.`,
  },
  {
    label: 'method:slop-taxonomy',
    prompt: `Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28.

Research what specifically makes LLM-generated "insight" degenerate into slop, and what countermeasures are evidence-backed:
1. Why do LLMs generate plausible-but-unfalsifiable claims when asked for insights? What is the failure mechanism?
2. Evidence on LLM statistical reasoning errors in data analysis: p-hacking, multiple comparisons without correction, spurious correlation, survivorship bias, Simpson's paradox, confusing value with volume, base-rate neglect.
3. What review/verification protocols measurably reduce this? (executable verification, pre-registration of the kill condition, adversarial critique, requiring provenance, forcing a negative-result path)
4. The multiple-comparisons problem specifically for a system that generates MANY hypotheses and tests them all against one dataset: what correction is appropriate, and how do serious empirical shops handle it?
5. How can a system tell a genuinely surprising finding from an artifact of the data pipeline?

This is the anti-slop spec. Be rigorous and give concrete, implementable rules.`,
  },
  {
    label: 'method:originality-standard',
    prompt: `Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28.

Research what makes an empirical finding ORIGINAL and CITABLE in adjacent fields (data journalism, agricultural economics, food systems research, open-data publishing):
1. How do serious outlets/researchers establish that a finding is new? What prior-art search is expected?
2. What is the publication standard for a finding derived from public government data? (USDA ERS/NASS, BLS, Census trade, FDA enforcement, NOAA)
3. Who currently publishes analysis of US food-cost data for FOOD-SERVICE operators specifically, and what do they cover? (USDA ERS Food Price Outlook, Technomic, Datassential, CoBank, Circana, NRA, restaurant trade press.) What are the KNOWN GAPS in what's publicly available to independent operators?
4. What kinds of findings about food cost would be genuinely new to the public record vs already routinely reported?
5. Are there any published open datasets that already join ingredient-level wholesale prices to edible yield, seasonality, origin concentration, and recall history? Search hard — this determines whether the joined spine is actually unique.
6. What makes a NEGATIVE result (e.g. "the public record cannot answer X for these N ingredients") publishable and valuable?

This defines the novelty bar. Be specific about who publishes what today.`,
  },
]

const method = (await parallel(METHOD_TASKS.map((t) => () =>
  agent(t.prompt, { label: t.label, phase: 'Method', schema: {
    type: 'object', additionalProperties: false,
    properties: {
      keyFindings: { type: 'array', items: { type: 'string' } },
      implementableRules: { type: 'array', items: { type: 'string' }, description: 'concrete rules this discovery system should adopt' },
      sources: { type: 'array', items: { type: 'string' } },
      bottomLine: { type: 'string' },
    },
    required: ['keyFindings', 'implementableRules', 'sources', 'bottomLine'],
  } })
))).filter(Boolean)

const methodDigest = JSON.stringify(method)
log(`Method research complete (${method.length}/4). Anti-slop rules extracted.`)

// ============ PHASE 2: RECON — exact schemas ============
phase('Recon')
log('Reading the actual datasets for exact schemas, join keys, and row counts...')

const RECON_TASKS = [
  { key: 'price', prompt: `Focus on the PRICE / INDEX / POSTURE spine. Read these files in ${REPO} and report EXACT structure: data/cost-index.json, data/cost-index-editions.json, data/cost-lockfloat.json, data/cost-anomaly-log.json, data/cost-index-events.json, data/seasonality.json, cost-index/lockfloat.json, cost-index/anomaly-log.csv, cost-index/week-*.csv (one example).` },
  { key: 'physical', prompt: `Focus on YIELDS / SEASONALITY / PHYSICAL properties. Read these files in ${REPO} and report EXACT structure: data/ingredient-yields.json or equivalent, cost-index/ingredient-yields.* , cost-index/seasonality.* , and any file carrying edible_yield_pct / trim_tax / cooked_yield / cheapest_month / save_pct. Find them by globbing data/ and cost-index/.` },
  { key: 'trade', prompt: `Focus on TRADE / ORIGIN / RELIANCE. Read these files in ${REPO} and report EXACT structure: data/ingredient-state-record.json, cost-index/ingredient-state-record.csv, and anything carrying us_import_value_usd / us_export_value_usd / import_reliance_pct / import_source_concentration / import_source_hhi / import_top_sources / import_peak_months / import_hs6. Also the /open/origins/, /open/imports/, /open/exports/ backing data.` },
  { key: 'events', prompt: `Focus on RECALLS / EVENTS / THE WITHHOLD SET. Read in ${REPO}: the recalls open-data (cost-index/recalls*.json/csv or data/recalls*), data/cost-index-events.json, cost-index/events.json, and determine exactly which ingredients are "withhold" posture and WHY (what field encodes the reason — no-series vs too-wide-band). Also read cost-index/open-data-catalog.json for the full dataset inventory.` },
  { key: 'corpus', prompt: `Focus on the EDITORIAL / CLAIM corpus. Read in ${REPO}: data/sourced-claims.json (structure + how many claims), data/research-references.json, data/cost-research-study.json, data/cost-index-drivers.json, data/library-tags.json. Report what claims and citations already exist so we do not "discover" something already published on the site.` },
]

const recon = (await parallel(RECON_TASKS.map((t) => () =>
  agent(`You are doing data reconnaissance in a READ-ONLY capacity. Do NOT modify any file in ${REPO}.

${t.prompt}

For EVERY dataset you touch, report with total precision:
- exact file path
- top-level JSON shape (object keyed by what? array of what?)
- the exact field names and their types, including nested structures
- row/record COUNT (actually count them, do not estimate)
- the join key (usually an ingredient slug) and whether it is consistent across files
- which fields are MEASURED (from a public source) vs DERIVED (computed by Muntin) vs ABSENT/null for many rows, with the null rate
- units and their traps (nominal USD? value not volume? weekly? monthly?)
- any field whose meaning is non-obvious — read the _doc field or the generating script in scripts/ to find out

Your output will be used by other agents to WRITE CODE against these files without seeing them. Precision is the entire value. If a file does not exist, say so explicitly and glob to find the real name.`,
    { label: `recon:${t.key}`, phase: 'Recon', schema: {
      type: 'object', additionalProperties: false,
      properties: {
        datasets: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
          path: { type: 'string' }, shape: { type: 'string' }, fields: { type: 'string' },
          count: { type: 'string' }, joinKey: { type: 'string' }, nullRates: { type: 'string' },
          unitsAndTraps: { type: 'string' },
        }, required: ['path', 'shape', 'fields', 'count', 'joinKey', 'nullRates', 'unitsAndTraps'] } },
        joinableOpportunities: { type: 'array', items: { type: 'string' }, description: 'cross-dataset joins that are possible but not currently done anywhere on the site' },
        summary: { type: 'string' },
      },
      required: ['datasets', 'joinableOpportunities', 'summary'],
    } })
))).filter(Boolean)

const reconDigest = JSON.stringify(recon)
log(`Recon complete (${recon.length}/5). Schemas captured.`)

// ============ PHASE 3: GENERATE — six diverse lenses ============
phase('Generate')
log('Six diverse lenses generating falsifiable candidate findings...')

const LENSES = [
  { key: 'cross-join', prompt: `LENS: CROSS-DATASET JOIN. Find claims that are ONLY visible when two or more datasets are joined and that nobody has joined before. The site currently publishes each dataset largely on its own. Example shape (do not just reuse it): does an ingredient's EFFECTIVE cost volatility per USABLE pound (price volatility x trim multiplier) rank differently from its raw wholesale volatility? Look for joins between price/posture, yield, seasonality, trade origin, and recalls.` },
  { key: 'negative-space', prompt: `LENS: NEGATIVE SPACE / THE LIMITS OF THE PUBLIC RECORD. The instrument WITHHOLDS a read on a large share of ingredients. That absence is itself a finding nobody publishes because nobody is incentivized to. Generate claims about what the US public price record structurally CANNOT tell an independent operator: which food categories are dark, why (no series vs too-wide band), whether the dark set is systematically different (more perishable? more imported? more concentrated in origin?), and what an operator should do about a dark ingredient.` },
  { key: 'operator-decision', prompt: `LENS: THE OPERATOR'S ACTUAL DECISION. Don works restaurant floors. Generate claims that would change a REAL decision: what to lock vs float, when to reprint a menu, which substitution actually hedges, which ingredient's "cheap season" is worth buying into, where yield discipline beats price shopping. The test of a good hypothesis here: a chef reading it would change what they do Monday.` },
  { key: 'structural-risk', prompt: `LENS: STRUCTURAL FRAGILITY. Generate claims about hidden dependency and concentration: ingredients whose cheap season depends on a single source country; categories where import reliance and source concentration compound; where a documented recall record co-occurs with high source concentration; which ingredients are simultaneously high-trim, high-volatility, and single-sourced. Frame everything as documented structure and co-occurrence, NEVER as prediction or causation.` },
  { key: 'temporal', prompt: `LENS: TIME AND EPISODES. Generate claims about the SHAPE of price episodes rather than levels: how long large moves take to clear, whether episodes cluster, whether posture (lock/cushion/float/withhold) is stable or churns, whether the seasonal signal is strengthening or weakening across the record, whether co-movement is episode-specific or persistent. Use the anomaly log, events, and editions spine.` },
  { key: 'contrarian', prompt: `LENS: FOLKLORE VS DATA. The restaurant industry runs on widely-repeated beliefs. Generate claims that TEST industry folklore against this data and could contradict it. Examples of the genre (find your own): "buy in season and you save", "diversify your suppliers", "cheaper substitute = savings", "commodity prices drive menu prices", "food cost percentage is the number that matters". Each hypothesis must be falsifiable against the actual datasets — if the data cannot test the folklore, that is itself a negative-space finding.` },
]

const generated = (await parallel(LENSES.map((lens) => () =>
  agent(`You are a research hypothesis generator for a discovery system built on the FunSearch principle: an LLM proposes, and EXECUTABLE CODE against real data decides. Your hypotheses will be handed to agents who will write and run code against the actual files. They will not see the data first. So your testSpec must be precise enough to code from.

${CONTEXT}

METHOD RESEARCH — the anti-slop rules this system must obey (read the implementableRules carefully and follow them):
${methodDigest}

EXACT DATA SCHEMAS available to you (file paths, fields, counts, null rates, unit traps):
${reconDigest}

${lens.prompt}

Generate 5-7 hypotheses. HARD REQUIREMENTS:
- Each must be FALSIFIABLE: state the killCondition — what computed result would prove it wrong. A hypothesis that cannot fail is slop; do not submit it.
- Each testSpec must name REAL files and REAL fields from the schemas above, the exact join, and the exact statistic. Assume the executor is competent but blind.
- Respect unit traps: trade figures are nominal VALUE not volume; wholesale is not delivered price; no forecasts.
- Prefer hypotheses where you genuinely do not know the answer. If you can confidently predict the result, it is not a discovery — it is a lookup.
- whyNovel must be honest. If a claim is probably already known in the trade, say so and skip it.
- Beware multiple comparisons: prefer hypotheses with a pre-stated direction over "scan everything for anything significant".
- A hypothesis whose honest answer is "the public data cannot determine this" is VALUABLE — mark it and explain what that absence means.

Do not pad. Five sharp falsifiable hypotheses beat seven vague ones.`,
    { label: `gen:${lens.key}`, phase: 'Generate', schema: HYPO_SCHEMA })
))).filter(Boolean)

// dedupe + cap in plain code (no agent needed)
const seen = new Set()
const pool = []
for (const g of generated) {
  for (const h of (g.hypotheses || [])) {
    const key = String(h.claim || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).slice(0, 12).join(' ')
    if (!key || seen.has(key)) continue
    seen.add(key)
    pool.push({ ...h, lens: g.lens })
  }
}
log(`Generated ${pool.length} unique falsifiable hypotheses across ${generated.length} lenses. Sending all to executable verification.`)

// ============ PHASE 4+5: EXECUTE -> KILL (pipeline, no barrier) ============
phase('Execute')

const executed = await pipeline(
  pool,
  (h, _orig, i) => agent(
    `You are the VERIFIER in a discovery system. Your job is to COMPUTE, not to opine. An LLM proposed a hypothesis; you find out what the data actually says. You have no loyalty to the hypothesis.

${CONTEXT}

DATA SCHEMAS (paths, fields, counts, traps):
${reconDigest}

HYPOTHESIS TO TEST:
${JSON.stringify(h)}

YOUR PROCEDURE — follow it exactly:
1. Write a real script (node or python) in ${SCRATCH} that loads the REAL files from ${REPO} and computes the statistic in testSpec. Never modify anything in ${REPO} — read only.
2. RUN IT. Look at the actual output. If it errors, fix it and re-run. If a file or field does not exist, glob/grep to find the truth rather than assuming.
3. Report the ACTUAL NUMBERS. Never estimate, never fabricate, never "approximately" a number you did not compute. If you could not compute it, outcome is "uncomputable" and you say exactly why.
4. Check the killCondition honestly. If the data refutes the hypothesis, report outcome "refuted" — that is a SUCCESS of the system, not a failure. Refutations are valuable.
5. Rewrite the claim to match what the data actually shows, with the real numbers in it (revisedClaim).
6. State sample size (n) and the null rate of every field you used. If n is small, say so loudly.
7. Sanity-check for artifacts: is this result an artifact of how the dataset was built, a units confusion (value vs volume), a survivorship effect (only ingredients with enough history are in the set), or a definitional tautology? If it might be, say so in caveats.
8. Rate surprisingness honestly. Most true things are boring. A 5 means you were genuinely surprised by the number.

Anti-slop rules from method research — obey them:
${methodDigest}

Return the ACTUAL measured result. A precise "refuted, here is the real number" is worth far more than a vague confirmation.`,
    { label: `exec:${String(h.lens || 'x')}-${i}`, phase: 'Execute', schema: EXEC_SCHEMA }
  ),
  (result, h) => {
    if (!result) return null
    if (result.outcome === 'uncomputable' && !/cannot|absent|missing|no series|dark/i.test(String(result.measuredResult || ''))) return { hypothesis: h, execution: result, kills: [], dropped: 'uncomputable-uninteresting' }
    const LENSES_KILL = [
      { n: 'statistical', p: `Attack the STATISTICS. Sample size, multiple comparisons across the many hypotheses this system tested, spurious correlation, survivorship bias (only ingredients with sufficient price history are in the set), Simpson's paradox, base rates, whether the effect size is meaningful or trivially small, whether the comparison is fair. Is this result distinguishable from noise?` },
      { n: 'alternative-explanation', p: `Attack the INTERPRETATION. Propose the most plausible BORING explanation for this result: an artifact of how the dataset was constructed, a definitional tautology (the metric contains the thing it "predicts"), a units confusion (nominal value vs volume, wholesale vs delivered), a selection effect from the source agency's methodology, or a mechanical consequence of an earlier Muntin derivation step. If a boring explanation fits as well as the interesting one, this must be killed or heavily caveated.` },
      { n: 'honesty-contract', p: `Attack the HONESTY. Does this assert causation from co-occurrence? Does it turn nominal trade VALUE into a supply/volume claim? Does it imply a forecast or a prediction? Does it treat a public wholesale level as a delivered price? Does it name a number that could not be traced to a source file? Does it imply the instrument knows something it declined to publish? Any of these is an automatic kill unless the claim can be restated to remove it.` },
      { n: 'prior-art', p: `Attack the NOVELTY. Use WebSearch (load via ToolSearch) to check whether this finding is already published — by USDA ERS, BLS, academic literature, trade press (Restaurant Business, Nation's Restaurant News), Technomic/Datassential/Circana/CoBank marketing, or general food-systems research. If it is already well known, this is NOT a discovery and must be killed as a finding (it may still be useful as context). Report what you actually found and where.` },
    ]
    return parallel(LENSES_KILL.map((L) => () =>
      agent(`You are a hostile reviewer on a discovery system's kill panel. Your default is that this finding is WRONG or UNORIGINAL. The system's value depends on you killing weak findings — a false positive that reaches publication damages a brand built entirely on verified provenance.

${CONTEXT}

THE FINDING (already computed against real data):
${JSON.stringify(result)}

ORIGINAL HYPOTHESIS + TEST SPEC:
${JSON.stringify(h)}

YOUR ASSIGNED LENS: ${L.n}
${L.p}

Be specific and technical. Cite the actual numbers and the actual provenance in your reasoning. If the finding genuinely survives your lens, say so plainly — do not manufacture objections. But when in doubt, kill: default to "kill" if you are uncertain whether the problem is fatal. State any caveat that MUST accompany publication.`,
        { label: `kill:${L.n}`, phase: 'Kill', schema: KILL_SCHEMA })
    )).then((kills) => ({ hypothesis: h, execution: result, kills: (kills || []).filter(Boolean) }))
  }
)

const reviewed = executed.filter(Boolean).filter((r) => r && r.execution && !r.dropped)
// COVERAGE GUARD (re-applied 2026-07-30 after a container rollback silently reverted it).
// agent() returns null on failure and `.filter(Boolean)` drops it, so a hypothesis whose 4
// lenses were dispatched but 3 CRASHED arrived here with k.length===1, killed===0 and was
// scored CLEAN. That is how the 2026-07-28 run reported 3 "survivors" while 97 of its 216
// agents had died on a quota. A verifier that did not run is not a verifier that passed.
const KILL_LENS_COUNT = 4
const covered = (r) => (r.kills || []).length >= KILL_LENS_COUNT
const uncovered = reviewed.filter((r) => !covered(r))
const survivors = reviewed.filter((r) => covered(r) && (r.kills || []).filter((x) => x.verdict === 'kill').length === 0)
const weakened = reviewed.filter((r) => covered(r) && (r.kills || []).filter((x) => x.verdict === 'kill').length === 1)
if (uncovered.length) log(`WARNING: ${uncovered.length} hypothesis/es have INCOMPLETE adversarial coverage — not survivors, must not be published as verified.`)
log(`Verification complete. ${reviewed.length} computed, ${survivors.length} survived the full kill panel unscathed, ${weakened.length} survived with one kill (weakened).`)

// ============ PHASE 6: DEEPEN — second round seeded by survivors ============
phase('Deepen')

const strongest = survivors.concat(weakened).slice(0, 8)
let deepened = []
if (strongest.length) {
  log(`Seeding a second discovery round from the ${strongest.length} strongest survivors...`)
  const deepHypos = await agent(
    `You are extending a discovery system. Round one produced these VERIFIED findings (each already computed against real data and survived an adversarial kill panel):

${JSON.stringify(strongest)}

DATA SCHEMAS:
${reconDigest}

${CONTEXT}

Now generate 6 SECOND-ORDER hypotheses that only become askable BECAUSE of these results. Not variations — genuine follow-ons. Look for:
- A mechanism implied by a first-round result that can itself be tested descriptively.
- An interaction between two separate first-round findings.
- A boundary condition: where does the first-round result stop holding, and can that boundary be measured?
- A composite metric that the first-round results justify constructing (and that nobody publishes).
- The strongest remaining negative-space question these results expose.

Same hard requirements: falsifiable, precise testSpec naming real files/fields, explicit killCondition, honest whyNovel. Prefer questions where you genuinely cannot predict the answer.`,
    { label: 'deepen:generate', phase: 'Deepen', schema: HYPO_SCHEMA }
  )

  const deepPool = ((deepHypos && deepHypos.hypotheses) || []).map((h) => ({ ...h, lens: 'second-order' }))
  log(`Round two: ${deepPool.length} second-order hypotheses. Verifying by execution...`)

  deepened = (await pipeline(
    deepPool,
    (h, _o, i) => agent(
      `You are the VERIFIER. Compute, do not opine. Write a real script in ${SCRATCH}, run it against the REAL files in ${REPO} (read-only), and report ACTUAL numbers.

${CONTEXT}

DATA SCHEMAS:
${reconDigest}

SECOND-ORDER HYPOTHESIS:
${JSON.stringify(h)}

Follow the same discipline: run real code, report real numbers, check the killCondition honestly, report "refuted" when the data says so, state n and null rates, flag artifacts and units traps, rate surprisingness honestly. Never report a number you did not compute.`,
      { label: `exec2:${i}`, phase: 'Deepen', schema: EXEC_SCHEMA }
    ),
    (result, h) => {
      if (!result) return null
      return parallel([
        { n: 'statistical-and-artifact', p: 'Attack statistics AND artifact-hood together: sample size, multiple comparisons, survivorship, and whether this is a mechanical consequence of an earlier derivation or a definitional tautology.' },
        { n: 'honesty-and-novelty', p: 'Attack honesty (causation from co-occurrence, value-as-volume, implied forecast, untraceable number) AND novelty (use WebSearch via ToolSearch to check prior art).' },
      ].map((L) => () =>
        agent(`Hostile reviewer on a discovery kill panel. Default: this finding is wrong or unoriginal.

${CONTEXT}

FINDING: ${JSON.stringify(result)}
HYPOTHESIS: ${JSON.stringify(h)}

LENS: ${L.n} — ${L.p}

Be specific, cite the actual numbers. Kill when uncertain. State any mandatory caveat.`,
          { label: `kill2:${L.n}`, phase: 'Deepen', schema: KILL_SCHEMA })
      )).then((kills) => ({ hypothesis: h, execution: result, kills: (kills || []).filter(Boolean), round: 2 }))
    }
  )).filter(Boolean)
}

const DEEP_LENS_COUNT = 2
const deepUncovered = deepened.filter((r) => (r.kills || []).length < DEEP_LENS_COUNT)
const deepSurvivors = deepened.filter((r) => (r.kills || []).length >= DEEP_LENS_COUNT && !(r.kills || []).some((k) => k.verdict === 'kill'))
log(`Round two: ${deepSurvivors.length} second-order findings survived.`)

// ============ PHASE 7: SYNTHESIZE ============
phase('Synthesize')

const allSurvivors = survivors.concat(weakened).concat(deepSurvivors)
const refuted = reviewed.filter((r) => r.execution && r.execution.outcome === 'refuted')
const uncomputable = reviewed.filter((r) => r.execution && r.execution.outcome === 'uncomputable')

const writeup = await agent(
  `You are the chief scientist writing up the results of a discovery run for Don Goldstein (muntin.digital).

He asked for genuinely original, powerful insight — new things made, not information reproduced. He explicitly does not want slop. This system was built on the FunSearch principle: LLMs proposed hypotheses, executable code against his real data decided, and an adversarial panel tried to kill each survivor.

${CONTEXT}

METHOD RESEARCH (how frontier labs get real discoveries, and the anti-slop rules):
${methodDigest}

FINDINGS THAT SURVIVED THE KILL PANEL (with measured numbers, provenance, caveats, and the panel's verdicts):
${JSON.stringify(allSurvivors)}

HYPOTHESES THE DATA REFUTED (these matter — they are corrections to plausible beliefs):
${JSON.stringify(refuted.map((r) => ({ claim: r.hypothesis.claim, measured: r.execution.measuredResult, revised: r.execution.revisedClaim })))}

QUESTIONS THE PUBLIC DATA COULD NOT ANSWER (negative space — potentially the most publishable material):
${JSON.stringify(uncomputable.map((r) => ({ claim: r.hypothesis.claim, why: r.execution.measuredResult })))}

Write the definitive report. Requirements:
1. LEAD WITH THE STRONGEST ACTUAL FINDING — the specific number, what it means, and why it is new. Not a preamble. Not a framework. The finding.
2. Rank every surviving finding by (originality x decision-relevance x robustness). For each: the claim with real numbers, the provenance (file + field + n), the mandatory caveat from the kill panel, and one sentence on what an operator does differently because of it.
3. Report the REFUTATIONS honestly and prominently. "This widely-assumed thing is not true in the tracked record, here is the number" is often the most valuable output.
4. Report the NEGATIVE SPACE as a first-class result: what the US public price record structurally cannot tell an independent operator, and why that absence matters.
5. Be brutally honest about strength. If a finding is thin, say it is thin. If the run produced less than hoped, say that plainly — a small number of real findings beats a long list of plausible ones. Do NOT inflate.
6. Say explicitly which findings are PUBLISHABLE under the honesty contract as-is, which need restatement, and which must not be published.
7. Close with what the SYSTEM itself revealed: what this discovery architecture did well, where it was weak, and the highest-value next iteration.

Write in clear, precise prose with real numbers throughout. No hype, no padding, no "in today's fast-paced world". This is a scientific report for a rigorous reader who will fact-check you.`,
  { label: 'synthesize:report', phase: 'Synthesize', effort: 'high' }
)

const harness = await agent(
  `Author a reusable discovery harness for this repo, as a FILE WRITTEN TO ${SCRATCH}/discover-findings.mjs (do NOT write into ${REPO} — the operator will review and land it himself).

Context: this run generated hypotheses, verified them by executing code against real data, and killed the weak ones. The valuable part is that it is REPEATABLE — the data refreshes weekly, so findings should be re-checkable and new ones surfaceable.

DATA SCHEMAS: ${reconDigest}
SURVIVING FINDINGS (these become the regression suite): ${JSON.stringify(allSurvivors.map((s) => ({ claim: s.execution.revisedClaim, provenance: s.execution.provenance, code: s.execution.code })))}

Write a single self-contained node ESM script that:
1. Encodes each surviving finding as a named CHECK: a pure function that recomputes the finding's statistic from the real files and returns the current value.
2. Runs all checks and prints a table: finding name, value at discovery, value now, delta, and whether the finding still HOLDS (with an explicit tolerance per finding).
3. Supports --json for machine output and --check to exit non-zero if a published finding no longer holds (so a published claim can never silently go stale — this matches the repo's existing gate conventions).
4. Carries per-finding provenance (source file + fields + n) in the output, matching the repo's provenance discipline.
5. Uses ONLY node builtins (fs, path, url) — no dependencies. Match the style of the repo's existing scripts/check-*.mjs (shebang, block comment header explaining the WHY, --self-test if practical).

Read 2-3 existing scripts in ${REPO}/scripts/ (e.g. check-open-lane-honesty.mjs, build-ingredient-state-record.mjs) first to match conventions exactly. Then write the file and RUN it to confirm it executes without error against the real data. Report the file path and the actual output.`,
  { label: 'author:harness', phase: 'Synthesize', effort: 'high' }
)

return {
  counts: {
    hypothesesGenerated: pool.length,
    computed: reviewed.length,
    uncoveredNotVerified: uncovered.length,
    survivedClean: survivors.length,
    survivedWeakened: weakened.length,
    refuted: refuted.length,
    uncomputable: uncomputable.length,
    secondOrderSurvivors: deepSurvivors.length,
  },
  method,
  survivors: allSurvivors,
  refuted,
  uncomputable,
  writeup,
  harness,
}
