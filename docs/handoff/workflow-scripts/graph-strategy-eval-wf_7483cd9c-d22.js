export const meta = {
  name: 'graph-strategy-eval',
  description: 'Fact-check two viral X posts on knowledge graphs + agent graphs, then design honest applications for muntin.digital',
  phases: [
    { title: 'Verify', detail: 'fact-check the viral claims + map the real state of the art' },
    { title: 'Ground', detail: 'inventory what the repo already has' },
    { title: 'Design', detail: 'three independent application proposals' },
    { title: 'Adversarial', detail: 'try to refute each proposal' },
    { title: 'Synthesize', detail: 'integrated recommendation' },
  ],
}

const REPO = '/home/user/potentially-profitable'

const POST1 = `POST 1 — @Sprytixl (49 likes, 5.9K views), verbatim:
"ANTHROPIC'S LEAD ENGINEER WON A $1.2M BONUS FOR A SYSTEM THAT TURNS ANY DATA CHAOS INTO A GRAPH IN 8 STEPS
raw chaos in - self-updating graph out - and the agent gets +42% productivity from day one
Load -> Extract -> Graph -> Index -> Query -> Memory -> Swarm -> Update
eight steps, one pipeline, graph grows while you sleep
documents, code, Slack - everything into one stream through Claude Code - nothing gets lost
Fable 5 + Opus 5 extracts entity relationships - Neo4j builds a live structure - zero duplicates
three types of search in one answer - vectors, keywords and graph - merged ranking gives accuracy no RAG delivers alone
a nightly agent pulls new data and updates the graph automatically - the system gets smarter while you sleep
bookmark and paste into Claude Code - a $1.2M system now free"
Attached diagram titled "Graph Engineering AI Workflow — raw chaos in -> self-updating knowledge graph out - powered by agents", badges "Fable 5", "Opus 5", panels "1. Ingest everything (Claude Code, unstructured, MCP connectors; docs/code/Slack -> one pipeline)", "2. Entity extraction (Fable 5, NER, triples, structured output; text -> Fable 5 -> A->rel->B triple)".`

const POST2 = `POST 2 — @0xCodila (3K likes, 740K views), verbatim:
"Google just released free 1-hour course on building agentic knowledge Graphs from 0% to 100%:
10% -> 4:01 - how to build a GraphRAG agent
30% -> 15:00 - Graph Engineering explanation
55% -> 30:00 - Agentic search Engineering
80% -> 35:48 - Graph Engineering practice
100% -> 47:06 - self-improving ag[ents]"
It quote-tweets the same author's own post: "Graph Engineering: build 1000+ agent loops in one window, from one prompt (full course)" / "THE Loop Engineering's successor and the workflow that runs your agents 10x wider... Most people who build a multi-step agent [end] up with a straight line". Its image contrasts "LOOP: one at a time - slow" (serial chain of agents) against "PARALLEL GRAPH: 1 prompt -> fan-out to many agents -> 1 answer, up to 1000".`

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string', enum: ['supported', 'partly-supported', 'unsupported', 'fabricated-or-unfounded', 'unverifiable'] },
          evidence: { type: 'string', description: 'what you actually found, with sources/URLs where possible' },
          whatIsActuallyTrue: { type: 'string' },
        },
        required: ['claim', 'verdict', 'evidence', 'whatIsActuallyTrue'],
      },
    },
    realTechniques: { type: 'array', items: { type: 'string' }, description: 'techniques from the post that ARE genuinely sound, stated precisely' },
    bottomLine: { type: 'string' },
  },
  required: ['findings', 'realTechniques', 'bottomLine'],
}

const INVENTORY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    assets: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          whatItIs: { type: 'string' },
          relevanceToGraph: { type: 'string' },
        },
        required: ['name', 'path', 'whatItIs', 'relevanceToGraph'],
      },
    },
    keyFindings: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' }, description: 'hard constraints any new work must respect' },
    summary: { type: 'string' },
  },
  required: ['assets', 'keyFindings', 'constraints', 'summary'],
}

const PROPOSAL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    lens: { type: 'string' },
    thesis: { type: 'string' },
    proposals: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          what: { type: 'string' },
          why: { type: 'string', description: 'why this specifically serves muntin.digital and a genuinely better world' },
          how: { type: 'string', description: 'concrete first increment, naming real files/scripts/data in the repo' },
          effort: { type: 'string', enum: ['hours', 'days', 'weeks'] },
          novelty: { type: 'string', description: 'what makes this NOT a me-too build' },
          risk: { type: 'string' },
        },
        required: ['title', 'what', 'why', 'how', 'effort', 'novelty', 'risk'],
      },
    },
  },
  required: ['lens', 'thesis', 'proposals'],
}

const CRITIQUE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          survives: { type: 'boolean' },
          fatalFlaw: { type: 'string', description: 'empty string if none' },
          honestyRisk: { type: 'string', description: 'how this could violate co-occurrence-never-cause or the fact gate' },
          funnelFit: { type: 'string', enum: ['on-funnel', 'adjacent', 'off-funnel'] },
          revisedForm: { type: 'string', description: 'the strongest surviving version, or why nothing survives' },
        },
        required: ['title', 'survives', 'fatalFlaw', 'honestyRisk', 'funnelFit', 'revisedForm'],
      },
    },
  },
  required: ['verdicts'],
}

// ---------- PHASE 1: VERIFY (barrier — synthesis needs the whole factual picture) ----------
phase('Verify')
log('Fact-checking the viral claims and mapping the real state of the art...')

const VERIFY_TASKS = [
  {
    label: 'verify:bonus-claims',
    prompt: `You are a fact-checker. Use WebSearch/WebFetch (load them via ToolSearch first) aggressively. Today is 2026-07-28.

${POST1}

Investigate these specific claims:
1. "Anthropic's lead engineer won a $1.2M bonus" for a knowledge-graph system. Is there ANY primary source? Anthropic press, engineering blog, credible reporting?
2. "+42% productivity from day one" — is there any study or source behind this number?
3. "a $1.2M system now free" — is this a real released system, or a generic architecture diagram?
4. Are "Fable 5" and "Opus 5" real Claude models, and do the capabilities claimed (NER/triple extraction, structured output) match reality?
5. Characterize the GENRE of this post: is this a known engagement-farming pattern on X (fabricated authority + round dollar figure + "bookmark this")? Search for the account and similar posts.

Be rigorous about the difference between "I could not find a source" and "this is false". Also identify which parts of the pipeline (Load/Extract/Graph/Index/Query/Memory/Swarm/Update) describe genuinely sound engineering regardless of the fake framing.`,
  },
  {
    label: 'verify:google-course',
    prompt: `You are a fact-checker. Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28.

${POST2}

Investigate:
1. Did Google actually release a free ~1-hour course on building agentic knowledge graphs recently? Find the REAL artifact (YouTube, Google Cloud Skills Boost, Kaggle, DeepLearning.AI co-productions). Give the actual URL and title if it exists.
2. What is its actual curriculum? Summarize what it genuinely teaches about GraphRAG agents, agentic search, and self-improving agents.
3. Is "Graph Engineering" an established technical term, or a coinage by this account/infoproduct marketing? Is "Loop Engineering" real?
4. The "build 1000+ agent loops in one window, from one prompt" claim — what is actually being sold/taught here, and is it substantive?
5. Assess the account's genre too (educational aggregator? infoproduct funnel?).

Distinguish clearly: the underlying Google/industry material (likely real and useful) vs the influencer packaging around it.`,
  },
  {
    label: 'verify:kg-sota',
    prompt: `You are a research analyst. Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28; your training cutoff is earlier, so SEARCH for current state.

Map the genuine state of the art for KNOWLEDGE GRAPHS AS AGENT MEMORY / GraphRAG as of mid-2026:
1. Does GraphRAG actually beat vector RAG, and on WHICH query types? Find real benchmarks/evals (Microsoft GraphRAG, LightRAG, HippoRAG, GraphReader, etc.). Where does it NOT help?
2. Hybrid retrieval: vector + BM25/keyword + graph traversal with merged ranking (reciprocal rank fusion). Is "three types of search merged" genuinely better, and what's the evidence?
3. Entity/relation extraction with LLMs: quality, hallucinated edges, entity resolution / dedup. What is the actual error rate and how do serious systems control it? Is "zero duplicates" plausible?
4. Storage choices in 2026: Neo4j vs Kuzu vs Memgraph vs DuckDB/PGQ vs plain SQLite/Postgres+pgvector. What does a ONE-PERSON, static-site, no-server operation realistically run? What's free/embedded/file-based?
5. Incremental/nightly graph updates: real patterns and real failure modes (drift, edge explosion, stale entities).
6. The honest limits: when is a knowledge graph over-engineering vs. a plain relational join?

Be concrete and cite sources. Flag hype where you see it.`,
  },
  {
    label: 'verify:agent-graph-sota',
    prompt: `You are a research analyst. Use WebSearch/WebFetch (load via ToolSearch first). Today is 2026-07-28; SEARCH for current state rather than relying on training data.

Map the genuine state of the art for PARALLEL/GRAPH AGENT ORCHESTRATION as of mid-2026:
1. The post's core claim: serial "loop" agents are slow; a parallel graph fanning out from one prompt to up to 1000 agents is 10x wider/better. What is actually true? Find real evidence on parallel multi-agent orchestration (Anthropic's multi-agent research system writeup, OpenAI Swarm/Agents SDK, LangGraph, CrewAI, AutoGen).
2. Where does massive fan-out ACTUALLY fail? Token cost, coordination overhead, context fragmentation, conflicting edits, verification burden, diminishing returns. Find measured numbers if they exist.
3. What orchestration patterns genuinely work: map-reduce fan-out, pipelines without barriers, judge panels, adversarial verification, loop-until-dry discovery, worktree isolation for parallel file edits.
4. What does Claude Code / the Claude Agent SDK actually provide today for this (subagents, background tasks, workflow orchestration, worktrees, hooks)? Be precise about real capability.
5. For a ONE-PERSON operation: what is the realistic sweet spot for agent parallelism, and what governance (gates, tests, review) must exist for it to be safe rather than a fast way to ship errors?

Cite sources. Separate marketing from measured results.`,
  },
]

const verified = (await parallel(VERIFY_TASKS.map((t) => () =>
  agent(t.prompt, { label: t.label, phase: 'Verify', schema: VERDICT_SCHEMA })
))).filter(Boolean)

log(`Verify complete: ${verified.length}/4 lanes returned.`)

// ---------- PHASE 2: GROUND (barrier — designers need the full repo picture) ----------
phase('Ground')
log('Inventorying what muntin.digital already has...')

const GROUND_TASKS = [
  {
    label: 'ground:data-spine',
    prompt: `Explore the repository at ${REPO} (read-only; do NOT modify anything).

You are inventorying the STRUCTURED DATA SPINE to answer: does a latent knowledge graph already exist here?

Look at: data/*.json (especially ingredient-state-record.json, cost-index.json, cost-index-events.json, seasonality.json, cost-anomaly-log.json, cost-lockfloat.json, sourced-claims.json, research-references.json, i18n-slug-map.json, library-tags.json, tools.json, article-audio.json), cost-index/*.json and *.csv (the public CC0/CC-BY downloads, open-data-catalog.json), and the /open/ explorer surfaces.

Report:
- What ENTITIES already exist (ingredients, commodities, countries, HS6 codes, recall events, price events, seasons, articles, glossary terms, sources/citations, tools, sheets).
- What RELATIONSHIPS are already encoded, and WHERE (which file, which field). e.g. ingredient -> import source country, ingredient -> co-mover ingredient, ingredient -> recall event, article -> cited source, term -> article.
- How many entities/rows roughly, per dataset.
- Which relationships are MEASURED vs INFERRED vs merely CO-OCCURRING.
- Whether anything already functions as a graph (join keys, slugs as stable IDs, cross-references).
- What is NOT connected today that plausibly could be.

Be concrete: name real files and real fields. This is the raw material assessment.`,
  },
  {
    label: 'ground:labor-method',
    prompt: `Explore the repository at ${REPO} (read-only; do NOT modify anything).

You are inventorying HOW WORK ACTUALLY GETS DONE here, to find the labor bottleneck for a one-person company.

Read: CLAUDE.md, docs/handoff/strategic-council-board.md, docs/editorial/decisions/ADR-*.md (skim titles + the recent ones), the scripts/ directory (count and categorize: build-*, inject-*, check-*), scripts/check-all.mjs, wrangler.jsonc build command, .github/workflows/*.yml.

Report:
- The documented METHOD (CLAUDE.md describes "ground -> build -> audit -> iterate, convening expert-panel sub-agents / workflows at the forks and adversarially verifying"). How mature is this already? Is the operator already doing "graph engineering" of agents?
- The gate architecture: how many check-* scripts, what they enforce, and the "engine-behind-pages" hazard.
- Where the REAL bottlenecks are for a one-person shop: what is slow, repetitive, or fragile? (e.g. injector/gate interaction, ES translation parity, editorial writing, data refresh, verification.)
- What is automated already vs still manual (note: the live data fetch runs on the operator's Mac; the container has no keys/network for it).
- Honest assessment: where would MORE agent parallelism actually help, and where would it just generate more to review?

Name real files. Be specific about counts.`,
  },
  {
    label: 'ground:honesty-architecture',
    prompt: `Explore the repository at ${REPO} (read-only; do NOT modify anything).

You are inventorying the HONESTY / EPISTEMIC ARCHITECTURE — the constraints any new system must respect.

Read: CLAUDE.md (editorial canons, fact gate), docs/fact-check.md, data/sourced-claims.json (structure), scripts/check-fabrications.mjs, scripts/check-open-lane-honesty.mjs, scripts/lib/co-occurrence-patterns.mjs, scripts/check-cost-index-events.mjs, and the ADRs — especially ADR-011 (notable price events / co-occurrence never cause), ADR-013 (NASS/Census/EIA public-domain data policy), ADR-014, ADR-015 (open-data explore surfaces, CC0/CC-BY split), ADR-019 if present.

Report:
- The exact honesty rules: what may and may not be asserted. Quote the key contract language.
- The CC0 (raw US-gov passthrough) vs CC-BY (Muntin compiled) licensing split and why it matters for anything published.
- How "co-occurrence, never cause" is mechanically enforced (which regexes, which gates).
- The fact gate: every number/date/name must be registered, cited, or labeled illustrative.
- THE CENTRAL TENSION TO ANALYZE: an LLM-extracted knowledge graph asserts RELATIONSHIPS between entities. That is epistemically a machine for manufacturing unverified claims. Spell out precisely which kinds of graph edges would be legal under this architecture and which would be forbidden. Give concrete examples of a legal edge and an illegal edge using real ingredients/datasets from this repo.
- What a graph would have to carry per-edge (provenance, source, retrievedAt, measured-vs-inferred flag) to be publishable here.

This is the constraint spec. Be rigorous and quote real code/canon.`,
  },
]

const grounded = (await parallel(GROUND_TASKS.map((t) => () =>
  agent(t.prompt, { label: t.label, phase: 'Ground', schema: INVENTORY_SCHEMA })
))).filter(Boolean)

log(`Ground complete: ${grounded.length}/3 lanes returned.`)

const factDigest = JSON.stringify(verified)
const repoDigest = JSON.stringify(grounded)

// ---------- PHASE 3+4: DESIGN -> ADVERSARIAL (pipeline, no barrier) ----------
phase('Design')
log('Three independent design lenses, each adversarially critiqued as it lands...')

const LENSES = [
  {
    key: 'product',
    prompt: `LENS: THE PRODUCT / PUBLIC-GOOD LENS.

Question: should muntin.digital build a knowledge graph as a PUBLISHED ARTIFACT — a CC-BY open-data graph of the food-cost world (ingredients, commodities, origin countries, trade flows, recalls, seasonality windows, yields, price events, cited sources) — and if so, what exactly?

Think about what would be genuinely NEW in the world: nobody has published an open, honest, provenance-carrying graph connecting what a restaurant buys to the public record behind it. Independent operators can't afford Technomic/Nielsen. What would a free, citable, machine-readable graph unlock for them and for researchers/LLMs?

Consider: graph as a downloadable artifact (JSON-LD? RDF? Neo4j dump? simple edge-list CSV?), schema.org alignment, per-edge provenance, an /open/graph/ explorer surface, being the substrate that AI assistants cite. Consider that the site is STATIC (no server, Cloudflare Workers), so any query layer must be client-side or precomputed.`,
  },
  {
    key: 'labor',
    prompt: `LENS: THE LABOR / ONE-PERSON-COMPANY LENS.

Question: how should the agent-orchestration ideas (post 2's "parallel graph instead of serial loop", plus post 1's "nightly agent that updates while you sleep") change how this ONE PERSON actually works?

The operator is a full-time restaurant FOH manager who runs this company on the side. His scarcest resource is his own attention, not compute. He already uses expert-panel sub-agents and workflows at decision forks (documented in CLAUDE.md).

Think about: what should be fanned out in parallel vs kept serial; what a nightly/scheduled agent could genuinely own (the repo has GitHub Actions cron + a Routines/scheduled-trigger capability); where verification must gate agent output (the repo already has ~150 check-* scripts — that IS the safety net that makes parallelism safe); ES translation parity as an embarrassingly-parallel task; the "engine-behind-pages" hazard as a reason NOT to let agents regenerate freely.

Be concrete about which existing repo tasks map to which orchestration pattern.`,
  },
  {
    key: 'moat',
    prompt: `LENS: THE DIFFERENTIATION / "BETTER WORLD" LENS.

Question: given that thousands of people are about to paste these same viral pipelines into Claude Code, what should muntin.digital do that is DEFENSIBLE and actually improves the world, rather than me-too?

Consider the asymmetry: the commodity part is the pipeline (anyone can run entity extraction into Neo4j). The scarce part is (a) verified, provenance-carrying DATA, (b) an enforced honesty contract, (c) domain judgment from someone actually running restaurant floors. Argue what the real moat is.

Also consider the meta-lesson: post 1 is itself a fabrication wrapped around real technique — invented authority, invented percentage. muntin.digital's whole brand is the ANTIDOTE to that. Is there a product/editorial opportunity in being the verifiable-provenance alternative in an era of confidently-asserted machine claims? Think about: signed/verifiable claims, "how do you know that?" as a first-class UI affordance, being the source LLMs can safely cite, an epistemic standard others could adopt.

Be ambitious but concrete. What would genuinely make things better for independent restaurant operators?`,
  },
]

const designed = await pipeline(
  LENSES,
  (lens) => agent(
    `You are a strategist for muntin.digital, a one-person, product-only restaurant-cost-intelligence company (the Cost Index, free operator tools, open CC-BY/CC0 datasets) run by Don Goldstein, a full-time FOH manager at Tacombi. Static site, no server, no CMS, ephemeral build container.

Here is the VERIFIED FACT BASE about the two viral X posts and the real state of the art (treat the verdicts as authoritative; do NOT repeat debunked claims as if true):
${factDigest}

Here is the GROUNDED INVENTORY of what the repo actually contains, including the hard honesty constraints:
${repoDigest}

${lens.prompt}

Rules: propose 2-4 concrete things. Every proposal must name real files/datasets/scripts from the inventory. Respect the honesty contract absolutely (co-occurrence never cause; every number sourced; no forecasts). Respect CLAUDE.md's funnel discipline (cost-intelligence funnel only; do NOT propose reinvesting in the frozen course or retired services). Prefer the smallest first increment that proves the idea. Be honest about what is NOT worth doing.`,
    { label: `design:${lens.key}`, phase: 'Design', schema: PROPOSAL_SCHEMA }
  ),
  (proposal, lens) => proposal ? agent(
    `You are a hostile reviewer. Your default is that each proposal below is a bad idea. Try to REFUTE each one.

CONTEXT — the honesty architecture and repo constraints these must satisfy:
${repoDigest}

VERIFIED FACT BASE (do not let a proposal rest on a debunked claim):
${factDigest}

PROPOSALS (lens: ${lens.key}):
${JSON.stringify(proposal)}

For each proposal, attack it on:
1. HONESTY: does it manufacture an unverified relationship? Would an LLM-extracted edge assert causation the data cannot support? Would it violate "co-occurrence, never cause" or the fact gate? Could it launder a value figure into a volume/supply claim?
2. FUNNEL: is this actually on the cost-intelligence funnel, or a shiny distraction CLAUDE.md would call a prune candidate?
3. FEASIBILITY: static site, no server, ephemeral container with no API keys/network for live data, one part-time person. Does it need infrastructure that doesn't exist? Does it add a maintenance burden that will rot?
4. NECESSITY: would a plain relational join / existing dataset do the same job without a graph? Is the graph over-engineering?
5. NOVELTY: is it actually new, or a me-too build that thousands will ship this month?

Be specific and harsh. But if a proposal genuinely survives, say so and state its strongest revised form. Set survives=false when the fatal flaw is unfixable.`,
    { label: `refute:${lens.key}`, phase: 'Adversarial', schema: CRITIQUE_SCHEMA }
  ).then((crit) => ({ lens: lens.key, proposal, critique: crit })) : null
)

const reviewed = designed.filter(Boolean)
log(`Design+critique complete for ${reviewed.length} lenses.`)

// ---------- PHASE 5: SYNTHESIZE ----------
phase('Synthesize')

const synthesis = await agent(
  `You are the chief strategist writing the final recommendation for Don Goldstein (muntin.digital).

He asked: "evaluate how to use the strategies mentioned in these popular X posts to remain at the cutting edge of these technologies to reimagine a better world."

THE TWO POSTS:
${POST1}

${POST2}

VERIFIED FACT BASE (authoritative — the truth about what these posts claim):
${factDigest}

REPO INVENTORY + HONESTY CONSTRAINTS:
${repoDigest}

PROPOSALS WITH HOSTILE CRITIQUES (only surviving/revised forms should be recommended):
${JSON.stringify(reviewed)}

Write the definitive synthesis. It must:
1. SEPARATE SIGNAL FROM NOISE — state plainly which claims in the posts are fabricated/unfounded and which techniques are genuinely sound. Do not be coy; do not repeat a debunked number.
2. Name the ONE structural insight that connects both posts (hint: post 1 = the graph as ARTIFACT/product; post 2 = the graph as PROCESS/labor). Say what that means for a one-person company.
3. Give a RANKED, concrete recommendation set: what to do first, second, third, and explicitly what NOT to do. Each item names real files/datasets from the repo, states the first increment, and the honesty guardrail it needs.
4. Be honest where the answer is "you're already doing this" — if the operator's existing method already embodies the good part of the advice, say so and say what the genuine next increment is.
5. Address "reimagine a better world" seriously and specifically: what would materially improve for independent restaurant operators, and what is the epistemic stake in an era of confidently-asserted machine claims.
6. Flag the genuine forks where the operator must decide, rather than deciding for him.

Return well-structured markdown prose. Be rigorous, specific, and non-sycophantic. Kill weak ideas out loud. Length: thorough but no padding.`,
  { label: 'synthesize', phase: 'Synthesize', effort: 'high' }
)

return { verified, grounded, reviewed, synthesis }
