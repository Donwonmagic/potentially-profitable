#!/usr/bin/env node
/**
 * Readiness register builder — turn 15 validator reports into a machine-readable
 * three-way split, and emit data/readiness-register.json.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * Fifteen domain specialists validated the plan. Thirteen returned NOT_READY,
 * two READY_WITH_GAPS, and between them they wrote 131 gaps of which 44 are
 * marked BLOCKING. Those gaps are prose in fifteen markdown files. Prose cannot
 * be closed, cannot be counted, and cannot be deduplicated, so a loop pointed at
 * it runs forever — which is exactly how this company accumulated 5,005 lines of
 * planning corpus at a 26% close rate.
 *
 * The validators were also PROMPTED to find gaps ("a validator who finds nothing
 * has not validated anything"). A gap-seeking agent always finds a gap. So the
 * register's job is not to preserve all 131 findings; it is to sort them:
 *
 *   verifiable — a command can prove it closed. The command is written down here.
 *                Only this class enters the readiness loop.
 *   decision   — no command can evaluate the closing artifact's CONTENT. It needs
 *                a founder call, a signature, counsel or a customer. It routes OUT
 *                of the loop to a decision list and is never worked by an agent.
 *   opinion    — a judgement with no falsifier and no decision behind it.
 *                Recorded, discarded, and NOT carried forward.
 *
 * The line between verifiable and decision is deliberately drawn at "can a command
 * prove it CLOSED", not at "can an agent do the work". `docs/legal/entity.json`
 * must be filled in by the founder from an SDAT lookup — but its existence, its
 * shape and its agreement with six shipped files are all checkable, so it is
 * verifiable + founderOnly. "What is the differentiator now that the synchronized
 * second Tuesday is dead" is a sentence no command can judge, so it is a decision.
 * `founderOnly` is what rate-limits the loop: agent throughput is free, founder
 * capacity is 13-26 h/month, and a loop that closes agent items faster than the
 * founder can absorb decisions is manufacturing review debt.
 *
 * WHAT IS RETIRED BY THIS FILE
 *
 * The fifteen validate-*.md reports stop being a work source the moment this
 * register exists. They remain as narrative evidence (each record cites its
 * file:line) and must not be re-read for open work. Adding a gap means adding a
 * record here with a class; it does not mean appending to a report.
 *
 * Usage:
 *   node scripts/build-readiness-register.mjs           # write the register
 *   node scripts/build-readiness-register.mjs --check   # fail if it would change
 *   node scripts/build-readiness-register.mjs --self-test
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'readiness-register.json');
const BONES = 'docs/handoff/bones';

const SF = 'storefront';
const PR = 'product';

/** shorthand: a verify command that runs in the storefront repo */
const s = (cmd) => ({ cwd: SF, cmd });
/** shorthand: a verify command that runs in the product repo */
const p = (cmd) => ({ cwd: PR, cmd });

/**
 * THE RECORDS.
 *
 * One record per gap the validators wrote, in report order. `severity` is what
 * the validator marked, never re-graded — re-grading a validator's severity is
 * how a bar erodes. `class` and `status` are this file's judgement, and every
 * `refuted` carries the evidence that refutes it.
 */
export const RECORDS = [
  // ── strategy ──────────────────────────────────────────────────────────────
  {
    id: 'R-001', domain: 'strategy', severity: 'BLOCKING', source: `${BONES}/validate-strategy.md:9`,
    claim: 'The 84-87% straight-through figure is measured on one mature org; the cold-start rate for a fresh org with zero prior confirmations has never been measured, and every commercial number is priced off it.',
    evidence: 'services/extract/VENDOR-TEMPLATE-KEY.md:203-236 (84.1%, n=490) vs :17-27 (24% pre-maturation); trust key is (org,vendor,layout_hash) promoting at 3-4 confirmations.',
    class: 'verifiable', status: 'queued', queueItem: 'Q-084',
    verify: p("node -e 'const fs=require(\"fs\");if(!fs.existsSync(\"docs/correctness/cold-start-reconcile.json\"))throw new Error(\"docs/correctness/cold-start-reconcile.json missing — cold-start has never been measured\");const r=require(\"./docs/correctness/cold-start-reconcile.json\");if(typeof r.coldStartFirstPassPct!==\"number\")throw new Error(\"no coldStartFirstPassPct\");if(typeof r.matureFirstPassPct!==\"number\")throw new Error(\"cold-start number must be stated SEPARATELY from the mature number\")'"),
    note: 'Q-084 exists but its verify is `test -f` only — it would close on an empty file. The command here asserts both numbers are present and distinct.',
  },
  {
    id: 'R-002', domain: 'strategy', severity: 'BLOCKING', source: `${BONES}/validate-strategy.md:12`,
    claim: 'CP-60 and CP-90 hinge on deskMinutesPerClose, which is instrumented nowhere in either repo.',
    evidence: 'data/queue.json:1613 and :1662 are the only occurrences; recursive grep for deskMinutes|desk_minutes|close_minutes across the product repo returns nothing (re-verified 2026-08-07).',
    class: 'verifiable', status: 'queued', queueItem: 'Q-085',
    alsoFoundBy: ['monetization', 'ops-capacity', 'finance-runway', 'customer-growth'],
    verify: p("node -e 'const{execSync}=require(\"child_process\");let out=\"\";try{out=execSync(\"grep -rl deskMinutesPerClose apps/api/src 2>/dev/null\").toString().trim()}catch(e){}if(!out)throw new Error(\"deskMinutesPerClose appears in no product source file — two of three kill criteria cannot fire\")'"),
  },
  {
    id: 'R-003', domain: 'strategy', severity: 'BLOCKING', source: `${BONES}/validate-strategy.md:15`,
    claim: 'The stated differentiator (a fixed monthly close date) was found disqualifying and killed; nothing replaces it, and ADR-030:75 still asserts it.',
    evidence: 'ADR-030:75; board-service-delivery.md:35 and board-completeness.md:26 kill the synchronized second Tuesday as 51-102% of founder capacity in one week.',
    class: 'decision', status: 'queued', queueItem: 'Q-086',
    decidesWhat: 'One sentence: what the differentiator is now. No command can judge whether a differentiator is any good — Q-086 proves this by verifying with `grep -qi "differentiator" ADR-03*.md`, which any sentence satisfies.',
    routesTo: 'founder',
    unblocks: ['R-077', 'R-004'],
  },
  {
    id: 'R-004', domain: 'strategy', severity: 'MAJOR', source: `${BONES}/validate-strategy.md:18`,
    claim: 'No competitive-response analysis anywhere in the plan — no item, checkpoint or ADR names an incumbent.',
    evidence: 'MarginEdge occurs once in data/queue.json (inside Q-086, added after this report) and zero times in ADR-030/031/032/033.',
    class: 'opinion', status: 'discarded',
    discardReason: 'No falsifier. "Have a view on incumbent response" cannot be proved closed by any command, and the strategy of record is explicitly non-venture with ~40 locations ever, so speed-of-response is not a variable the plan can act on. The one actionable residue — six /vs/ pages carrying 78-day-stale competitor facts — is R-005, which has a command.',
  },
  {
    id: 'R-005', domain: 'strategy', severity: 'MAJOR', source: `${BONES}/validate-strategy.md:21`,
    claim: 'The product repo ships 37 marketing pages including six indexed /vs/ comparison pages that position Muntin as a subset of the incumbent, and surface-disposition.json dispositions zero of them.',
    evidence: 'apps/web/app/(marketing)/vs/marginedge/page.tsx:56 lastFactCheckedISO 2026-05-21; data/surface-disposition.json contains zero references to apps/web (re-verified 2026-08-07).',
    class: 'verifiable', status: 'queued', queueItem: 'Q-087',
    verify: p("node -e 'const fs=require(\"fs\");const f=\"docs/contracts/marketing-disposition.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const d=JSON.parse(fs.readFileSync(f,\"utf8\"));const{execSync}=require(\"child_process\");const routes=execSync(\"find apps/web/app/\\\\(marketing\\\\) -name page.tsx\").toString().trim().split(\"\\n\").filter(Boolean);const missing=routes.filter(r=>!d.pages||!d.pages[r]);if(missing.length)throw new Error(missing.length+\" marketing routes undispositioned\")'"),
    note: "Q-087's own verify command is syntax-broken (nested double quotes inside node -e \"...\" — the same ReferenceError class as R-040) and can never pass. Confirmed by execution 2026-08-07.",
  },
  {
    id: 'R-006', domain: 'strategy', severity: 'MAJOR', source: `${BONES}/validate-strategy.md:24`,
    claim: 'The ICP is defined by a vendor mix whose defining members are the corpus\'s worst-performing and partly irrelevant to a food-cost close (cintas 54.3%, staples 37.5%, cozzini_bros 20.8%).',
    evidence: 'VENDOR-TEMPLATE-KEY.md:213-224; apps/api/src/lib/inventory-purchases-store.ts has no food/non-food predicate.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether the ICP is stated on a vendor set that carries the 84-87%, or the claim is narrowed. A linen invoice is currently ordinary input to a FOOD-cost statement; whether that is acceptable is a product-definition call.',
    routesTo: 'founder',
    alsoFoundBy: ['engineering', 'product-truth'],
  },
  {
    id: 'R-007', domain: 'strategy', severity: 'MAJOR', source: `${BONES}/validate-strategy.md:27`,
    claim: 'Q-041 budgets six founder-hours for eight qualification conversations and zero hours for producing the eight names. No item in the queue sources a prospect.',
    evidence: 'Q-041 founderHours 6, blockedBy Q-030/Q-031/Q-010 — all internal artifacts. Queue-wide: outreach 0, network 0, referral 0, prospect 1 (in an unrelated title).',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['monetization', 'marketing-seo', 'customer-growth'],
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/handoff/receipts/prospects.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const r=JSON.parse(fs.readFileSync(f,\"utf8\"));const rows=r.prospects||r;if(!Array.isArray(rows)||rows.length<20)throw new Error(\"need >=20 named prospects, have \"+(rows.length||0));const need=[\"name\",\"locations\",\"activeVendorCount\",\"sourcedVia\",\"conflictScreen\"];for(const x of rows)for(const k of need)if(x[k]===undefined||x[k]===null)throw new Error(\"prospect missing \"+k);const pass=rows.filter(x=>x.conflictScreen===\"pass\");if(pass.length<12)throw new Error(\"need >=12 conflictScreen pass, have \"+pass.length);const named=rows.filter(x=>x.sourcedVia&&x.sourcedVia!==\"cold\");if(named.length<12)throw new Error(\"need >=12 with a named introduction path, have \"+named.length)'"),
    note: 'THE canonical acquisition gap. Four validators found it independently and the board called it DISQUALIFYING. The founder must supply the names; the file\'s shape and thresholds are mechanical.',
  },
  {
    id: 'R-008', domain: 'strategy', severity: 'MODERATE', source: `${BONES}/validate-strategy.md:30`,
    claim: 'The cross-tenant community template pool — the only asset with declining marginal cost — is absent from the plan, and ADR-031 may foreclose its supply side by association.',
    evidence: 'migrations 0013/0056/0057, services/extract/community_pool.py, EXTRACT_COMMUNITY_POOL default-ON with per-org opt-in default OFF. Queue grep for "community pool" returns 0.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether ADR-031 forecloses the contribution path as well as the submitter lane. A one-way door being walked through without being named.',
    routesTo: 'founder',
  },
  {
    id: 'R-009', domain: 'strategy', severity: 'MINOR', source: `${BONES}/validate-strategy.md:33`,
    claim: 'The capacity block cites an ADR filename that does not exist, and two queue items attribute the no-billing-code decision to ADR-027 instead of ADR-030.',
    evidence: 'data/queue.json:1499 ofRecord "ADR-030-the-ninety-days-and-its-falsifiers.md"; on disk it is ADR-030-one-price-... and ADR-033-the-ninety-days-.... Mis-citations at :319 and :958 (re-verified 2026-08-07).',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['legal-ip'],
    verify: s("node -e 'const fs=require(\"fs\");const raw=fs.readFileSync(\"data/queue.json\",\"utf8\");const q=JSON.parse(raw);const bad=[];const refs=raw.match(/docs\\/editorial\\/decisions\\/ADR-[0-9]{3}-[A-Za-z0-9-]+\\.md/g)||[];for(const r of new Set(refs))if(!fs.existsSync(r))bad.push(r);if(bad.length)throw new Error(\"queue cites missing ADR files: \"+bad.join(\", \"));const items=JSON.stringify(q.items);if(/ADR-027 records that|by ADR-027/.test(items))throw new Error(\"pricing decision still attributed to ADR-027; it is ADR-030\")'"),
  },

  // ── monetization ──────────────────────────────────────────────────────────
  {
    id: 'R-010', domain: 'monetization', severity: 'BLOCKING', source: `${BONES}/validate-monetization.md:9`,
    claim: '"First dollar" is defined as an invoice SENT, not cash received. No artifact in the plan has a field for money arriving.',
    evidence: "Q-042 verify: if(!i.sentOn||!(i.amountUsd>0)) — no paid field. Queue grep for paidOn/received/net-30/collect returns 0 (re-verified 2026-08-07).",
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['finance-runway', 'customer-growth'],
    verify: s("node -e 'const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-042\");const v=(i.verify&&i.verify.cmd)||\"\";const d=i.doneWhen||\"\";if(!/paidOn/.test(v)||!/amountReceivedUsd|paidUsd/.test(v))throw new Error(\"Q-042 verify still tests issuance, not receipt\");if(!/paidOn/.test(d))throw new Error(\"Q-042 doneWhen does not require a payment\")'"),
  },
  {
    id: 'R-011', domain: 'monetization', severity: 'BLOCKING', source: `${BONES}/validate-monetization.md:12`,
    claim: 'There is no legal instrument to sell the $600 close under — no engagement letter, no entity confirmation, no counsel, no E&O — and no queue item creates one.',
    evidence: 'data/queue.json contains zero occurrences of counsel, entity, LLC, engagement letter, insurance, E&O, W-9 (re-verified 2026-08-07). terms.html:423 still describes a retired web-design studio.',
    class: 'decision', status: 'open',
    decidesWhat: 'Engage counsel, confirm or form the entity, bind E&O. Real dollars ($2,500-9,000 counsel setup, $1,200-4,800/yr E&O) against a plan with no cash budget.',
    routesTo: 'founder',
    alsoFoundBy: ['legal-ip', 'finance-runway', 'security', 'privacy-compliance'],
    unblocks: ['R-065', 'R-070'],
    note: 'THE canonical legal-instrument gap. Five validators found it. It is the single largest cluster in the register.',
  },
  {
    id: 'R-012', domain: 'monetization', severity: 'BLOCKING', source: `${BONES}/validate-monetization.md:15`,
    claim: 'No mechanism produces the eight qualified conversations Q-041 requires, and the employment question that gates the only warm channel is not the question Q-002 asks.',
    evidence: 'Q-002 doneWhen declares a data basis (consent to PROCESS invoices), not permission to SELL a competing service to DMV independents.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-007',
    note: 'The sourcing half duplicates R-007. The outside-activity half is R-013, split out because it is a different question with a different owner.',
  },
  {
    id: 'R-013', domain: 'monetization', severity: 'BLOCKING', source: `${BONES}/validate-monetization.md:15`,
    claim: 'Nothing asks whether the founder\'s Tacombi employment permits selling a paid food-cost service to DMV independents. If the answer is no, the beachhead, the specimen and the channel die simultaneously.',
    evidence: 'Q-002 scopes to INGESTION/storage/retention/publication. board-completeness.md names this the one binary fact that "simultaneously gates the specimen close, the buyer definition, and the only realistic first-ten channel."',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['marketing-seo'],
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/legal/outside-activity.md\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const t=fs.readFileSync(f,\"utf8\");for(const k of [\"answeredOn:\",\"outsideActivityPermitted:\"])if(!t.includes(k))throw new Error(\"missing \"+k);if(!/outsideActivityPermitted:\\s*(true|false|declined)/.test(t))throw new Error(\"no dated written answer recorded\")'"),
    note: 'Costs zero marginal founder-hours — Q-002 is already a scheduled conversation with the same employer in M1. The cheapest kill-or-proceed signal in the whole register.',
  },
  {
    id: 'R-014', domain: 'monetization', severity: 'BLOCKING', source: `${BONES}/validate-monetization.md:18`,
    claim: 'The day-90 deliverable is arithmetically unreachable: measured time-to-first-correct-close is ~60-75 days against customers signed inside M3, and the queue contains no onboarding at all.',
    evidence: 'buildCountSheet (apps/api/src/routes/inventory.ts:295-330) builds rows only from purchases inside the window; template_store.py:100 needs four confirmations. Queue grep for onboard/ramp/support/SLA returns 0.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether the term starts at signature or at the FIRST DELIVERED CLOSE, and whether months 0-1 are a named unbilled ramp. A commercial term, not a task.',
    routesTo: 'founder',
    alsoFoundBy: ['customer-growth', 'ops-capacity'],
    unblocks: ['R-131'],
  },
  {
    id: 'R-015', domain: 'monetization', severity: 'MAJOR', source: `${BONES}/validate-monetization.md:21`,
    claim: "M3's acquisition budget (8 founder-hours) is below the plan's own most optimistic financial case, and unlike M1 it has no declared drop order.",
    evidence: 'capacity.floorPlan.dropOrderToReach13h covers M1 only. finance-model.json FAST case implies 9-12h for the same outcome; BASE roughly 26h.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const fp=q.capacity&&q.capacity.floorPlan||{};const keys=Object.keys(fp).join(\" \");if(!/M2/.test(keys)||!/M3/.test(keys))throw new Error(\"floorPlan still declares a drop order for M1 only: \"+keys)'"),
  },
  {
    id: 'R-016', domain: 'monetization', severity: 'MAJOR', source: `${BONES}/validate-monetization.md:24`,
    claim: 'Two of six kill criteria test deskMinutesPerClose, produced by a close object that does not exist.',
    evidence: 'PeriodSnapshot (apps/api/src/lib/inventory-period-store.ts:14-38) has no signature, close date, delivered_at, version or supersedes.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-002',
  },
  {
    id: 'R-132', domain: 'monetization', severity: 'MAJOR', source: `${BONES}/validate-monetization.md:27`,
    claim: 'The revenue ceiling and the renewal price are inconsistent inside the decision of record: 40 × $6,000 = $240,000 against a published $288K ARR ceiling, and the 16.7% prepay discount is never named as a discount.',
    evidence: 'ADR-030:86 and :122; finance-model.md §0 states the $48,000/yr overstatement explicitly.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-123',
    note: 'Registered out of numeric order because it was found on the second pass — ids are stable identifiers, not a sequence.',
  },
  {
    id: 'R-017', domain: 'monetization', severity: 'MODERATE', source: `${BONES}/validate-monetization.md:30`,
    claim: 'Nothing exists past day 90: no month-two delivery, no renewal, no restatement policy, no cohort-two trigger — and the maintenance suspension expires in the same month the first recurring obligation begins.',
    evidence: 'Last checkpoint is CP-90 dueOn 2026-11-06; capacity.windows ends at M3. "renew" appears in one item; "second cohort" in none.',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['finance-runway', 'ops-capacity', 'content-editorial', 'customer-growth'],
    verify: s("node -e 'const q=require(\"./data/queue.json\");const cp=(q.checkpoints||[]).find(c=>/CP-1[0-9]{2}/.test(c.id));if(!cp)throw new Error(\"no CP-120 (or later) checkpoint exists\");const k=JSON.stringify(cp.killIf||[]);if(!/paid|collect|churn|retain/i.test(k))throw new Error(\"CP-120 has no kill criterion on collection or churn\")'"),
  },

  // ── product-truth ─────────────────────────────────────────────────────────
  {
    id: 'R-018', domain: 'product-truth', severity: 'BLOCKING', source: `${BONES}/validate-product-truth.md:9`,
    claim: 'An agent-run exception desk means a language model reads customer invoice content, falsifying the flagship claim on 91+ storefront pages, three copy.ts strings, the sub-processor list and the ROPA. The entire remedy is one clause in Q-072\'s `why`.',
    evidence: 'apps/web/lib/copy.ts:3082/3888/4067 (3 hits confirmed 2026-08-07); docs/sub-processors.md:43; docs/ropa.md:68. Queue grep for Anthropic/sub-processors/DPIA/dpa.md returns 0.',
    class: 'decision', status: 'open',
    decidesWhat: 'Fork (i) DISCLOSE — list the LLM provider, start the 30-day clock, replace every unqualified claim with a scoped one. Fork (ii) CONFINE — prove by gate that no invoice VALUE reaches a session, and the absolute claim stands. The fork is a founder call; everything downstream is mechanical once it is made.',
    routesTo: 'founder',
    alsoFoundBy: ['security', 'privacy-compliance', 'legal-ip', 'engineering'],
    unblocks: ['R-058', 'R-059', 'R-060', 'R-051'],
    note: 'THE canonical claim gap. Five validators found it; the board called it disqualifying and wrote "Do not ship the verdict\'s version, which is (i) with only (ii)\'s disclosures". It blocks four verifiable items and both Q-072 and Q-042.',
  },
  {
    id: 'R-019', domain: 'product-truth', severity: 'BLOCKING', source: `${BONES}/validate-product-truth.md:12`,
    claim: 'Q-072 publishes /close/\'s guarantees before the four defects that make them untrue are fixed. Q-030 is blocked on all four; Q-072 is blocked on none of them.',
    evidence: 'Q-072.blockedBy = ["Q-001","Q-005","Q-010"] (re-verified 2026-08-07). Q-020/021/022/024 are all window M2, same window as Q-072.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-072\");const b=i.blockedBy||[];const need=[\"Q-020\",\"Q-021\",\"Q-022\",\"Q-024\"];const miss=need.filter(n=>!b.includes(n));if(miss.length)throw new Error(\"Q-072 not blocked on the defects it publishes over: \"+miss.join(\", \"))'"),
    note: 'Two lines of JSON. The cheapest blocking item in the register.',
  },
  {
    id: 'R-020', domain: 'product-truth', severity: 'MAJOR', source: `${BONES}/validate-product-truth.md:15`,
    claim: "Q-011's verify runs in the storefront repo only, so the withdrawn $19 rate, the 2026-11-13 GA date and the three-months-free term stay shipped to every product user.",
    evidence: 'Q-011.verify cwd "storefront" with --grep-absent; apps/web/lib/copy.ts still contains "three months free", "2026-11-13" and "$19 a month" (re-verified 2026-08-07).',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");let bad=[];for(const f of [\"apps/web/lib/copy.ts\",\"apps/web/lib/copy.es.ts\"]){const t=fs.readFileSync(f,\"utf8\");for(const s of [\"three months free\",\"2026-11-13\",\"$19 a month\"])if(t.includes(s))bad.push(f+\": \"+s)}if(bad.length)throw new Error(\"withdrawn commercial terms still shipped: \"+bad.join(\" | \"))'"),
    note: 'copy.es.ts is already clean (0 hits, re-verified). Only copy.ts still carries all three.',
  },
  {
    id: 'R-021', domain: 'product-truth', severity: 'MAJOR', source: `${BONES}/validate-product-truth.md:18`,
    claim: 'The registered claim ledger_founding_offer_2026 — cited on 48 surfaces and containing "for as long as they stay" — is retracted by the plan with no item to amend it.',
    evidence: 'data/sourced-claims.json:567-568; used_in = 48 entries; 6 storefront HTML files still contain "$19 a month".',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const c=require(\"./data/sourced-claims.json\");const k=\"ledger_founding_offer_2026\";const find=(o)=>{for(const v of Object.values(o||{})){if(v&&typeof v===\"object\"){if(v[k])return v[k];const r=find(v);if(r)return r}}return null};const e=find(c)||c[k];if(!e)throw new Error(k+\" not found\");const t=JSON.stringify(e);if(!/retract|superseded|withdrawn/i.test(t))throw new Error(k+\" carries no dated retraction\");const{execSync}=require(\"child_process\");const n=execSync(\"grep -rl \\\"$19 a month\\\" --include=*.html . | wc -l\").toString().trim();if(n!==\"0\")throw new Error(n+\" storefront pages still render $19 a month\")'"),
  },
  {
    id: 'R-022', domain: 'product-truth', severity: 'MAJOR', source: `${BONES}/validate-product-truth.md:18`,
    claim: 'Whether anyone already on the founding list is honored at $19 is undecided, and nobody has read the list (listFounding() has no callers).',
    evidence: 'Q-040 evidence records "listFounding() has no callers". How many people are on the founding list is UNVERIFIED from this container.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether a dated, publicly cited, founder-confirmed promise with an explicit permanence clause is honored for whoever already accepted it, and how they are told.',
    routesTo: 'founder',
  },
  {
    id: 'R-023', domain: 'product-truth', severity: 'MAJOR', source: `${BONES}/validate-product-truth.md:21`,
    claim: 'docs/marketing-claims.md — the claimed-vs-shipped registry — appears zero times in the plan, while the plan adds five new headline claims and dissolves the backing of an existing one.',
    evidence: 'grep marketing-claims data/queue.json = 0 (re-verified 2026-08-07). The registry\'s own closing rule: "when you add a new headline claim anywhere, add its row here."',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"docs/marketing-claims.md\",\"utf8\");const need=[\"closed month\",\"600\",\"exception desk\",\"specimen close\",\"limits register\"];const miss=need.filter(n=>!t.toLowerCase().includes(n.toLowerCase()));if(miss.length)throw new Error(\"registry has no row for: \"+miss.join(\", \"))'"),
  },
  {
    id: 'R-024', domain: 'product-truth', severity: 'MAJOR', source: `${BONES}/validate-product-truth.md:24`,
    claim: 'Q-010 makes a live customer-facing string false — "We do not raise the price quietly. The number on the page is the number." — and no gate in either repo contains that string.',
    evidence: 'apps/web/lib/copy.ts:4072 in the negativeProof "What we do not do" block, rendered under the comparison grid.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"apps/web/lib/copy.ts\",\"utf8\");if(t.includes(\"The number on the page is the number\"))throw new Error(\"negativeProof still promises a posted price Q-010 removes\")'"),
  },
  {
    id: 'R-025', domain: 'product-truth', severity: 'MODERATE', source: `${BONES}/validate-product-truth.md:27`,
    claim: 'A known-false retention claim ("Files auto-delete after {retention}"), self-catalogued 53 days ago as live exposure #2, appears in no queue item and no honesty-debt entry. The reaper is disabled in prod.',
    evidence: 'apps/web/lib/copy.ts:1969 (re-verified 2026-08-07); apps/api/src/index.ts:672 emits retention_reaper.skipped.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"apps/web/lib/copy.ts\",\"utf8\");if(/Files auto-delete after \\{retention\\}/.test(t))throw new Error(\"residencyBodyTemplate still promises automatic deletion the reaper does not perform\")'"),
    note: 'Under a hand-invoiced $600 close with a DPA, a false present-tense data-deletion statement is the one claim class carrying direct regulatory and contractual exposure.',
  },
  {
    id: 'R-026', domain: 'product-truth', severity: 'MODERATE', source: `${BONES}/validate-product-truth.md:30`,
    claim: 'All 14 honesty-debt items are Cost Index or storefront-publishing debts. The mechanism the plan is proudest of is not aimed at the surface where the false claims actually are.',
    evidence: 'HD-01..HD-14 re-verified 2026-08-07: 14 items, all storefront/Index.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const h=require(\"./docs/handoff/honesty-debt/honesty-debt.json\");const prod=h.items.filter(i=>/apps\\/web\\/lib\\/copy|docs\\/marketing-claims\\.md|docs\\/sub-processors\\.md|docs\\/ropa\\.md/.test(JSON.stringify(i)));if(prod.length<1)throw new Error(\"all \"+h.items.length+\" honesty-debt items are storefront/Index debts — the ledger names no product-claim artifact\")'"),
  },
  {
    id: 'R-027', domain: 'product-truth', severity: 'MODERATE', source: `${BONES}/validate-product-truth.md:33`,
    claim: '"84-87% straight-through" is load-bearing for the price, the margin and the desk sizing, and is registered in sourced-claims.json nowhere — while Q-041 carries no claims constraint.',
    evidence: 'grep for 84-87|straight-through in data/sourced-claims.json = 0. phase-f-board.json:247,:280 find the aggregate includes linen, knife and office routes.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['strategy', 'engineering'],
    verify: s("node -e 'const c=JSON.stringify(require(\"./data/sourced-claims.json\"));const q=require(\"./data/queue.json\");const hasClaim=/84\\.1%|84-87|straight-through/.test(c);const i=q.items.find(x=>x.id===\"Q-041\");const guards=/claims|capability number|stated/i.test(JSON.stringify(i));if(!hasClaim&&!guards)throw new Error(\"the straight-through rate is registered nowhere AND Q-041 records no capability number stated in the call\")'"),
  },
  {
    id: 'R-133', domain: 'product-truth', severity: 'MODERATE', source: `${BONES}/validate-product-truth.md:36`,
    claim: '"Your month closes on the second Tuesday" — the headline positioning promise — exists only in the verdict, with no queue item, no ADR, no doneWhen and no gate that could catch it. Nothing in the plan can detect an unbacked delivery-date promise.',
    evidence: 'grep "second Tuesday": phase-d-verdict.json = 1, data/queue.json = 0 at the time of the report. Re-verified 2026-08-07: it now appears once, inside Q-086, which was added after this report.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-003',
    note: 'Registered out of numeric order because it was found on the second pass. check-fabrications.mjs is a numbers-and-bio gate, not a delivery-promise gate — the residue R-003 does not cover is that no gate can catch an unbacked date promise arriving as prose on /close/.',
  },
  {
    id: 'R-028', domain: 'product-truth', severity: 'MINOR', source: `${BONES}/validate-product-truth.md:39`,
    claim: "Q-073's rationale states a falsehood about the company's architecture — that analytics is a third-party request — which its own published sub-processor list contradicts.",
    evidence: 'assets/p.js is self-hosted Plausible CE served first-party; docs/sub-processors.md:69 states no data leaves the Fly instance.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-073\");if(/third-party request/.test(i.why||\"\"))throw new Error(\"Q-073 why still calls self-hosted first-party analytics a third-party request\")'"),
  },

  // ── engineering ───────────────────────────────────────────────────────────
  {
    id: 'R-029', domain: 'engineering', severity: 'BLOCKING', source: `${BONES}/validate-engineering.md:9`,
    claim: 'The sold deliverable has no producer. No code path in either repo renders a close statement; the plan\'s only close artifact is a hand-built storefront marketing page.',
    evidence: 'grep for monthlyClose|signedClose|closeStatement across apps/api/src, apps/web/app, packages returns ZERO files (re-verified 2026-08-07). Q-042 requires a statementUrl.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['design-ux'],
    verify: p("node -e 'const{execSync}=require(\"child_process\");let out=\"\";try{out=execSync(\"grep -rl closeStatement apps/api/src apps/web/app 2>/dev/null\").toString().trim()}catch(e){}if(!out)throw new Error(\"no close-statement renderer exists\");const fs=require(\"fs\");const{execSync:x}=require(\"child_process\");let t=\"\";try{t=x(\"grep -rl \\\"re-rendering the same closed period\\\" apps/api 2>/dev/null\").toString().trim()}catch(e){}if(!t)throw new Error(\"no byte-identical re-render test pins the statement\")'"),
    note: 'THE canonical deliverable gap. Q-042 — the day-90 proof point — has a doneWhen that cannot be satisfied because the URL it demands points at nothing.',
  },
  {
    id: 'R-030', domain: 'engineering', severity: 'BLOCKING', source: `${BONES}/validate-engineering.md:12`,
    claim: "CP-30's kill criterion reads dollarSurvivalPct, which is undefined, uncomputable and hand-typed into a receipts directory that does not exist.",
    evidence: 'grep for dollarSurvivalPct|founder-walk across the product repo returns nothing. Q-001\'s verify only checks the four keys are non-null.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const{execSync}=require(\"child_process\");let out=\"\";try{out=execSync(\"grep -rl dollarSurvivalPct scripts apps 2>/dev/null\").toString().trim()}catch(e){}if(!out)throw new Error(\"no script computes dollarSurvivalPct — the CP-30 kill metric is hand-typed\")'"),
  },
  {
    id: 'R-031', domain: 'engineering', severity: 'BLOCKING', source: `${BONES}/validate-engineering.md:15`,
    claim: 'The two Fly Python services the ingest path depends on have no working deploy path: deploy.yml carries four echo "TODO" stubs and the one deploy script is a hard exit 1.',
    evidence: '.github/workflows/deploy.yml:78-90 — 4 TODO(B-priv-6) stubs confirmed by count 2026-08-07; scripts/deploy-docling-ephemeral.sh:24-56 carries a DO NOT RUN banner.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\".github/workflows/deploy.yml\",\"utf8\");const n=(t.match(/TODO\\(B-priv-6\\)/g)||[]).length;if(n>0)throw new Error(n+\" stubbed flyctl deploy steps remain — the engine version the founder walk measures is unrecorded\")'"),
  },
  {
    id: 'R-032', domain: 'engineering', severity: 'MAJOR', source: `${BONES}/validate-engineering.md:18`,
    claim: 'EXTRACT_VENDOR_TRUST_ACTIVE — a measured 24% → ~62% first-pass lever — is switched off, appears zero times in the queue, and gates the very number CP-30 kills on.',
    evidence: 'services/extract/main.py:120 activates only on the literal "1". Queue grep for VENDOR_TRUST returns 0 (re-verified 2026-08-07). cli/vendor_trust_shadow.py already exists to make the decision cheaply.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: p("node -e 'const fs=require(\"fs\");const f=\"docs/correctness/vendor-trust-shadow.json\";if(!fs.existsSync(f))throw new Error(f+\" missing — the shadow report has not been run\");const r=JSON.parse(fs.readFileSync(f,\"utf8\"));if(!r.perVendor||!r.decidedMode)throw new Error(\"report carries no per-vendor agreement rate or no recorded enable decision\")'"),
    note: 'With the flag off, every vendor in the founder\'s month is cold-start and CP-30 can end the quarter on a config decision rather than a defect.',
  },
  {
    id: 'R-033', domain: 'engineering', severity: 'MAJOR', source: `${BONES}/validate-engineering.md:21`,
    claim: 'The vendor mix the strategy is sold on is the engine\'s worst-measured segment; 84-87% is a pool yield, not a corpus rate, and no vendor field classifies food vs non-food.',
    evidence: 'VENDOR-TEMPLATE-KEY.md:203-236; grep "services/extract" data/queue.json = 0.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-006',
  },
  {
    id: 'R-034', domain: 'engineering', severity: 'MAJOR', source: `${BONES}/validate-engineering.md:24`,
    claim: 'The exception desk is load-bearing for the whole margin story, is unbuilt and unqueued, and the seam it would write through (templates-store.ts) is a Sprint-0 stub.',
    evidence: 'apps/api/src/lib/templates-store.ts:63 — "Sprint-0 stub. Returns empty for reads + null for retire". Rules are applied in Python against a store apps/api cannot reach.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-018',
    note: 'The architecture half is inseparable from the claim fork: fork (ii) CONFINE requires the boundary to be enforced in code, which is the same build.',
  },
  {
    id: 'R-035', domain: 'engineering', severity: 'MAJOR', source: `${BONES}/validate-engineering.md:27`,
    claim: 'The storefront received a full disposition ledger and a budget gate; the product code — 63 API routes, 54 page routes, 6 app shells, ~93k LOC — received neither.',
    evidence: 'find for *disposition* in the product repo returns nothing (re-verified 2026-08-07).',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");if(!fs.existsSync(\"docs/contracts/product-disposition.json\"))throw new Error(\"docs/contracts/product-disposition.json missing — 63 API routes, 54 page routes and 6 shells are undispositioned\");const d=require(\"./docs/contracts/product-disposition.json\");const{execSync}=require(\"child_process\");const routes=execSync(\"ls apps/api/src/routes/*.ts\").toString().trim().split(\"\\n\");const miss=routes.filter(r=>!d.entries||!d.entries[r]);if(miss.length)throw new Error(miss.length+\" API routes undispositioned\")'"),
  },
  {
    id: 'R-036', domain: 'engineering', severity: 'MODERATE', source: `${BONES}/validate-engineering.md:30`,
    claim: 'Three shadow crypto implementations (Rust, Swift, TypeScript) and four secondary shells are maintained parity-locked for zero users, with no survival decision in the plan.',
    evidence: 'apps/desktop (Tauri), apps/ios (Swift MuntinLedgerCore), apps/mobile (Capacitor + 4 Kotlin plugins), apps/email-worker. Queue grep returns 0 matches.',
    class: 'decision', status: 'open',
    decidesWhat: 'Keep or retire four shells and two native crypto ports. A hand-delivered monthly close for 1-3 location independents needs a browser and an email client.',
    routesTo: 'founder',
  },
  {
    id: 'R-037', domain: 'engineering', severity: 'MODERATE', source: `${BONES}/validate-engineering.md:33`,
    claim: 'Schema truth is split across two migration roots with overlapping ordinals, and only one is applied by CI.',
    evidence: 'scripts/db-verify.sh:31 applies infra/postgres/migrations (59 files); apps/api/migrations holds 30 more including a duplicated ordinal 0027, applied by nothing.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const a=fs.existsSync(\"apps/api/migrations\")?fs.readdirSync(\"apps/api/migrations\").filter(f=>f.endsWith(\".sql\")):[];if(a.length)throw new Error(a.length+\" SQL files in apps/api/migrations are applied by no workflow — one migration root or a gate that says which\")'"),
  },
  {
    id: 'R-038', domain: 'engineering', severity: 'MODERATE', source: `${BONES}/validate-engineering.md:36`,
    claim: "The plan's own correctness eval is 4-of-17 green, and the four correctness queue items verify with a vitest name filter rather than against the corpus — so all four can close without flipping a single eval case.",
    evidence: 'apps/api/tests/fixtures/close-corpus/cases.json — 4 green, 6 red, 7 pending. Q-020/021/022/024 verify with `vitest run -t "purchases leg"` and similar.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const bad=[];for(const id of [\"Q-020\",\"Q-021\",\"Q-022\",\"Q-024\"]){const i=q.items.find(x=>x.id===id);if(!i)continue;const c=(i.verify&&i.verify.cmd)||\"\";if(!/close-corpus|P-0|P-1|D-07|G-07/.test(c))bad.push(id)}if(bad.length)throw new Error(bad.join(\", \")+\" still verify by test-name filter, not by flipping a named corpus case\")'"),
    note: 'The plan built the missing correctness eval and then routed its own verification around it.',
  },

  // ── ci-integrity ──────────────────────────────────────────────────────────
  {
    id: 'R-039', domain: 'ci-integrity', severity: 'BLOCKING', source: `${BONES}/validate-ci-integrity.md:9`,
    claim: "check-queue.mjs — the plan's central instrument — exits 2 in every mode because Q-004 carries status \"closed\", which is not in the enum. The session-start hook swallows it with 2>/dev/null || true.",
    evidence: 'Re-verified 2026-08-07: --brief exits 2, --self-test exits 2. Q-004.status === "closed"; STATUSES = ready|claimed|blocked|done at scripts/check-queue.mjs:96.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['ops-capacity', 'design-ux'],
    verify: s("node scripts/check-queue.mjs --self-test && node -e 'const{spawnSync}=require(\"child_process\");for(const m of [\"--brief\",\"--budget\",\"--checkpoints\",\"--render\"]){const r=spawnSync(\"node\",[\"scripts/check-queue.mjs\",m],{encoding:\"utf8\"});if(r.status===2)throw new Error(m+\" exits 2 — the queue is malformed\")}'"),
    note: 'THE highest-leverage item in the register: ~20 agent-minutes, and until it is fixed --budget cannot sum the hours, --checkpoints cannot fire, and every session-start hook in both repos delivers silence.',
  },
  {
    id: 'R-040', domain: 'ci-integrity', severity: 'BLOCKING', source: `${BONES}/validate-ci-integrity.md:12`,
    claim: 'All ten checkpoint mustBeTrue verify commands fail with a shell-quoting ReferenceError, not with "not closed". The kill criteria will fire red on 2026-09-06 whether or not the work was done.',
    evidence: 'Executed all 10 on 2026-08-07: 10/10 SYNTAX-BROKEN (ReferenceError). The commands embed const need=["Q-002", …] inside a double-quoted node -e, so bash strips the inner quotes.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const{spawnSync}=require(\"child_process\");const q=require(\"./data/queue.json\");let broken=[];for(const cp of q.checkpoints||[])for(const m of cp.mustBeTrue||[]){const r=spawnSync(\"bash\",[\"-c\",m.verify.cmd],{encoding:\"utf8\"});if(/ReferenceError|SyntaxError/.test(r.stderr||\"\"))broken.push(cp.id)}if(broken.length)throw new Error(broken.length+\" checkpoint assertions are SYNTAX-BROKEN: \"+broken.join(\", \"))'"),
    note: 'A falsifier that always fires is not a falsifier. Two of these criteria are supposed to end the strategy.',
  },
  {
    id: 'R-041', domain: 'ci-integrity', severity: 'BLOCKING', source: `${BONES}/validate-ci-integrity.md:15`,
    claim: 'The plan turned a previously-green WIRED deploy gate red: check-removed-slugs.mjs exits 1 on data/link-graph.json, a plan artifact, and Q-005 ("Green the deploy") will close green on a red deploy.',
    evidence: 'Re-verified 2026-08-07: check-removed-slugs exits 1; check-all reports 319 of 328 passed. It is wired at scripts/check-all.mjs:156 and runs inside wrangler.jsonc build.command.',
    class: 'verifiable', status: 'open',
    verify: s('node scripts/check-removed-slugs.mjs'),
    note: 'check-all is 319/328 today, not the 320/328 the plan records — the deploy got worse, not better.',
  },
  {
    id: 'R-042', domain: 'ci-integrity', severity: 'MAJOR', source: `${BONES}/validate-ci-integrity.md:18`,
    claim: 'audit-gate-teeth.mjs can only judge 27% of the gate corpus (96 of 132 are NO-JSON-INPUT because inputsOf() matches only data/*.json), and HD-14 will read PAID with 96 gates never measured.',
    evidence: 'The committed snapshot records 128 gates / 94 NO-JSON-INPUT (re-verified 2026-08-07). NEVER_MUTATE additionally excludes the three highest-stakes files.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const a=require(\"./data/gate-teeth-audit.json\");if(!a.coverage||typeof a.coverage.judgeable!==\"number\"||typeof a.coverage.unjudgeable!==\"number\")throw new Error(\"gate-teeth audit publishes no coverage block — PAID cannot be distinguished from UNMEASURED\");const h=require(\"./docs/handoff/honesty-debt/honesty-debt.json\");const hd=h.items.find(i=>i.id===\"HD-14\");if(hd&&!/out of scope|unjudgeable|NO-JSON-INPUT/i.test(JSON.stringify(hd)))throw new Error(\"HD-14 does not name the unmeasured gates as out of scope\")'"),
  },
  {
    id: 'R-043', domain: 'ci-integrity', severity: 'MAJOR', source: `${BONES}/validate-ci-integrity.md:21`,
    claim: "HD-14's proof is a hand-editable static snapshot that had already drifted the same day it was written, and nothing regenerates it.",
    evidence: 'Committed snapshot: 128 gates, NO-TEETH 24, ALREADY-RED 2 (re-verified 2026-08-07). The CI validator\'s live run hours later: 132 gates, NO-TEETH 25, ALREADY-RED 3. audit-gate-teeth is named audit-* so check-gate-coverage cannot see it at all.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const h=require(\"./docs/handoff/honesty-debt/honesty-debt.json\");const hd=h.items.find(i=>i.id===\"HD-14\");const c=JSON.stringify(hd&&hd.check||\"\");if(/gate-teeth-audit\\.json/.test(c)&&!/audit-gate-teeth/.test(c))throw new Error(\"HD-14 still closes by reading a hand-editable snapshot rather than by re-running the instrument\")'"),
  },
  {
    id: 'R-044', domain: 'ci-integrity', severity: 'MAJOR', source: `${BONES}/validate-ci-integrity.md:24`,
    claim: 'No one-in-one-out budget for gates — the one corpus that is growing. Documents have a budget, surfaces have one, contract rules have a hard cap of 8. The plan added 7 check scripts and retires none.',
    evidence: 'check-gate-coverage reports 134 check scripts, 127 wired. Grepping data/queue.json for any item that retires a gate returns nothing.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/contracts/gate-budget.json\";if(!fs.existsSync(f))throw new Error(\"no gate budget declared\");const b=JSON.parse(fs.readFileSync(f,\"utf8\"));if(typeof b.wiredCeiling!==\"number\")throw new Error(\"gate budget declares no ceiling\");const src=fs.readFileSync(\"scripts/check-gate-coverage.mjs\",\"utf8\");if(!src.includes(\"gate-budget.json\"))throw new Error(\"the meta-gate does not enforce the budget\")'"),
    note: 'Demonstrated teeth are 8 of 132. The response was to add 7 more gates.',
  },
  {
    id: 'R-045', domain: 'ci-integrity', severity: 'MODERATE', source: `${BONES}/validate-ci-integrity.md:27`,
    claim: 'The UNWIRED registry cites queue items Q-070 and Q-071 for the working-set retirement; the actual items are Q-080 and Q-081.',
    evidence: 'scripts/check-gate-coverage.mjs:126 (re-verified 2026-08-07). Q-070 is the taxonomy migration; Q-071 is two pillar essays.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-104',
  },
  {
    id: 'R-046', domain: 'ci-integrity', severity: 'MODERATE', source: `${BONES}/validate-ci-integrity.md:30`,
    claim: 'QUEUE.md is stale, disagrees with queue.json about the plan\'s own founder-hours, and cannot be re-rendered because --render exits 2.',
    evidence: 'QUEUE.md:161 lists Q-004 as open at 3h; queue.json has it closed at founderHours 0.',
    class: 'verifiable', status: 'open', blockedBy: ['R-039'],
    verify: s("node scripts/check-queue.mjs --render && node -e 'const{execSync}=require(\"child_process\");const d=execSync(\"git diff --stat -- docs/handoff/QUEUE.md\").toString().trim();if(d)throw new Error(\"QUEUE.md was stale — re-rendering changed it\")'"),
  },
  {
    id: 'R-047', domain: 'ci-integrity', severity: 'MODERATE', source: `${BONES}/validate-ci-integrity.md:33`,
    claim: "Q-004's verify proves check-all is idempotent in isolation, not that the deploy is — it was closed REFUTED without testing the ~75 mutating builders that run before check-all in build.command.",
    evidence: 'Q-004 closed with a controlled-experiment note on a clean tree.',
    class: 'opinion', status: 'discarded',
    discardReason: 'No falsifier available here: the container cannot run wrangler build.command, so "the deploy is idempotent" cannot be proved or disproved by any command this loop can execute. The concrete residue — the deploy is red — is R-041, which has a command that runs today.',
  },
  {
    id: 'R-048', domain: 'ci-integrity', severity: 'MODERATE', source: `${BONES}/validate-ci-integrity.md:36`,
    claim: 'check-surface-disposition.mjs ships with no --self-test and is not in Q-060\'s honesty-gate list, yet it decides which of 1,327 pages get noindexed or deleted.',
    evidence: 'Six of the seven new gates carry --self-test; this one does not. It is also ALREADY-RED, so audit-gate-teeth cannot judge it either.',
    class: 'verifiable', status: 'open',
    verify: s('node scripts/check-surface-disposition.mjs --self-test'),
  },

  // ── security ──────────────────────────────────────────────────────────────
  {
    id: 'R-049', domain: 'security', severity: 'BLOCKING', source: `${BONES}/validate-security.md:9`,
    claim: 'The agent workforce is an undisclosed sub-processor of customer invoice content, and no-llm-ci.sh — a source-import scan over git ls-files — cannot see an agent session reading the seven committed invoice fixtures.',
    evidence: 'ledger/index.html:612; ai/index.html:460; 93 storefront pages contain "language model". docs/sub-processors.md lists 11 providers, none an LLM.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-018',
  },
  {
    id: 'R-050', domain: 'security', severity: 'BLOCKING', source: `${BONES}/validate-security.md:12`,
    claim: "No item names how a customer's month of invoices reaches Muntin, so intake defaults outside every control the architecture is marketed on (tenant broker, DEK-per-document, audit chain, retention reaper).",
    evidence: "Q-042's verify checks only that statementUrl is truthy — no authentication requirement. The in-product email lane exists but no item routes a customer to it.",
    class: 'decision', status: 'open',
    decidesWhat: 'Which single channel a customer\'s month arrives by. If it is the founder\'s personal mailbox — the natural behaviour for a hand-delivered service — the DPA\'s own description of where Customer Data lives becomes inaccurate.',
    routesTo: 'founder',
    unblocks: ['R-052'],
  },
  {
    id: 'R-051', domain: 'security', severity: 'BLOCKING', source: `${BONES}/validate-security.md:15`,
    claim: "The DPA's 72-hour and 24-hour notification clocks and the incident-response runbook are conditioned on \"paid GA\" and \"first day of paid beta\" — the exact milestone ADR-030 withdrew with no replacement — while M3 puts three paying locations under contract.",
    evidence: 'docs/dpa.md:225-235; runbooks/incident-response.md:15,:22-25. Empirical capability: the warrant canary ran 89 days lapsed; ~3 of 31 maintenance-hours due were paid in the 30 days to 2026-08-07.',
    class: 'decision', status: 'open',
    decidesWhat: 'What first-response SLA one person working full-time front-of-house can actually promise, and whether the DPA is amended to match or the promise is met. A 24-hour contractual clock with no pager provisioned is a breach measured in hours.',
    routesTo: 'founder',
  },
  {
    id: 'R-052', domain: 'security', severity: 'MAJOR', source: `${BONES}/validate-security.md:18`,
    claim: 'Security carries zero of the queue items. The untrusted-input quarantine its own designer sequenced BEFORE the Issue-fed consumer was dropped, and the destructive `git checkout -- .` lines are still live — while Q-051 stands up the consumer and Q-053 proposes a cross-repo PAT.',
    evidence: 'Re-verified 2026-08-07: scripts/check-untrusted-inputs.mjs does not exist; 5 occurrences of `git checkout -- .` across 3 storefront workflows; 0 in the product repo. Queue grep for untrusted/quarantine/blast returns 0.',
    class: 'verifiable', status: 'open',
    verify: s("node scripts/check-untrusted-inputs.mjs && node -e 'const{execSync}=require(\"child_process\");let n=\"0\";try{n=execSync(\"grep -rl \\\"git checkout -- .\\\" .github/workflows/ | wc -l\").toString().trim()}catch(e){}if(n!==\"0\")throw new Error(n+\" workflows still discard the working tree destructively\")'"),
  },
  {
    id: 'R-053', domain: 'security', severity: 'MAJOR', source: `${BONES}/validate-security.md:21`,
    claim: "Operational-promise enforcement scored 1/3 in June and no item moves it. Q-013's suspension instrument is written from six obligations that include no security duty at all.",
    evidence: 'docs/security/posture-scorecard.md dim 10 = 1; routes/posture.ts:142-159 reports retention_seconds decoupled from the reaper — "a genuine theater surface". grep reaper data/queue.json = 0.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/handoff/maintenance-suspension.md\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const t=fs.readFileSync(f,\"utf8\");const need=[\"key rotation\",\"sub-processor\",\"retention\",\"notification\"];const miss=need.filter(n=>!t.toLowerCase().includes(n));if(miss.length)throw new Error(\"suspension instrument has no row for: \"+miss.join(\", \"));if(/retention[^\\n]*suspend/i.test(t))throw new Error(\"a security duty is dispositioned suspend\")'"),
  },
  {
    id: 'R-054', domain: 'security', severity: 'MAJOR', source: `${BONES}/validate-security.md:24`,
    claim: 'Key custody is a single point of failure: no rotation has ever been executed, no escrow exists, and no queue item creates a successor path.',
    evidence: 'runbooks/key-rotation.md:3-7 calls the 90-day cadence mandatory and the table reads "Last rotation: Not yet executed". Q-017 founderOnly: credentials only he holds.',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['ops-capacity'],
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"runbooks/key-rotation.md\",\"utf8\");if(/Not yet executed/.test(t))throw new Error(\"no key rotation has ever been executed\");if(!/escrow/i.test(t))throw new Error(\"no successor-access procedure names where the escrow lives\")'"),
  },
  {
    id: 'R-055', domain: 'security', severity: 'MODERATE', source: `${BONES}/validate-security.md:27`,
    claim: "Q-002 cures the wrong disclosure: its declared scope covers ingestion, storage, retention and publication, and omits onward disclosure to a processor — which is the disclosure that has already occurred.",
    evidence: 'The seven fixtures sit in a repository agent sessions read as context, i.e. disclosure to a recipient absent from docs/sub-processors.md.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether the employer authorization Q-002 obtains names the recipient. An authorization that never names the recipient is not consent to that recipient, and everything downstream depends on Q-002 holding.',
    routesTo: 'founder', blockedByDecision: 'R-018',
  },
  {
    id: 'R-056', domain: 'security', severity: 'MODERATE', source: `${BONES}/validate-security.md:30`,
    claim: 'No confirmed entity and no insurance — the two backstops that make an incident survivable — while M3 collects money.',
    evidence: 'terms.html:423 asserts a Maryland LLC (re-verified 2026-08-07); the cyber-insurance question was filed for counsel 88 days ago; grep -i insurance data/queue.json returns 0.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-011',
  },

  // ── privacy-compliance ────────────────────────────────────────────────────
  {
    id: 'R-057', domain: 'privacy-compliance', severity: 'BLOCKING', source: `${BONES}/validate-privacy-compliance.md:9`,
    claim: 'The exception desk makes Anthropic a sub-processor of Customer Data and no queue item discloses it; the fix is one clause on one page — literally the remedy the board named as insufficient.',
    evidence: 'Zero of the queue items reference dpa.md, ropa.md, sub-processors.md or dpia (re-verified 2026-08-07). docs/ropa.md:68 — "No LLM provider is in the customer-data path".',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-018',
  },
  {
    id: 'R-058', domain: 'privacy-compliance', severity: 'BLOCKING', source: `${BONES}/validate-privacy-compliance.md:12`,
    claim: 'No slot anywhere in the 90-day calendar for the 30-day sub-processor notice clock the company bound itself to, and Q-042 signs three locations inside M3.',
    evidence: 'docs/sub-processors.md:22-24 — "Once paying customers exist, any further sub-processor addition restarts the full 30-day clock with no founder override available."',
    class: 'verifiable', status: 'open', blockedByDecision: 'R-018',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"docs/sub-processors.md\",\"utf8\");const m=t.match(/noticeStartedOn:\\s*(\\d{4}-\\d{2}-\\d{2})/);if(!m)throw new Error(\"no dated sub-processor notice has been started\");const d=new Date(m[1]);const days=(Date.now()-d.getTime())/86400000;if(days<30)throw new Error(\"the 30-day clock has \"+Math.ceil(30-days)+\" days left to run\")'"),
    note: 'Only applies if R-018 resolves to fork (i) DISCLOSE. If fork (ii) CONFINE is taken there is no clock and this record closes as not-applicable.',
  },
  {
    id: 'R-059', domain: 'privacy-compliance', severity: 'BLOCKING', source: `${BONES}/validate-privacy-compliance.md:15`,
    claim: 'no-llm-ci.sh is cited as the proof of a claim it cannot test. It gates code imports; the exception desk is an out-of-band session, so the gate stays green while the claim becomes false.',
    evidence: 'scripts/no-llm-ci.sh:6-8 scopes itself to "no module in this repo imports an LLM SDK"; docs/marketing-claims.md:12,26 cites it as evidence for a claim about DATA.',
    class: 'verifiable', status: 'open', blockedByDecision: 'R-018',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"docs/marketing-claims.md\",\"utf8\");const lines=t.split(\"\\n\");for(let i=0;i<lines.length;i++){if(/no-llm-ci\\.sh/.test(lines[i])&&/language model reads your invoices|No language model reads/i.test(lines[i]))throw new Error(\"line \"+(i+1)+\" still cites a code-import scanner as evidence for a claim about data\")}'"),
  },
  {
    id: 'R-060', domain: 'privacy-compliance', severity: 'BLOCKING', source: `${BONES}/validate-privacy-compliance.md:18`,
    claim: 'The DPA and ROPA describe self-serve software with the customer\'s operator in the loop; the plan sells a statement Muntin produces and signs. That processing activity has no ROPA entry, no legal basis, no retention entry and no DPIA material-change log line.',
    evidence: 'docs/ropa.md:17-32 scopes to four activities, none "produce a monthly close"; docs/dpa.md:286-289 §12 with a 90-day advance-notice commitment at :307-313; DPIA review log has one entry, "Pending counsel review".',
    class: 'verifiable', status: 'open', blockedByDecision: 'R-018',
    verify: p("node -e 'const fs=require(\"fs\");const r=fs.readFileSync(\"docs/ropa.md\",\"utf8\");if(!/A5/.test(r)||!/close/i.test(r.split(\"A5\")[1]||\"\"))throw new Error(\"ROPA has no activity for producing a monthly close\");const d=fs.readFileSync(\"docs/dpia-invoice-extraction.md\",\"utf8\");const dates=(d.match(/20\\d\\d-\\d\\d-\\d\\d/g)||[]).filter(x=>x>\"2026-08-01\");if(!dates.length)throw new Error(\"DPIA review log carries no material-change entry after the strategy change\")'"),
  },
  {
    id: 'R-061', domain: 'privacy-compliance', severity: 'MAJOR', source: `${BONES}/validate-privacy-compliance.md:21`,
    claim: 'The published retention design (24-hour default on raw invoice files) is incompatible with reproducing a number Muntin stands behind, and no item reconciles them.',
    evidence: 'docs/ropa.md:66 — raw invoice files default 24 hours after extraction — against audit-log entries at 7 years. /close/ (Q-072) requires no retention statement.',
    class: 'decision', status: 'open',
    decidesWhat: 'How long Muntin keeps the documents behind a number it signs. A retention period is a commercial commitment: either a challenged close cannot be reproduced, or the minimization promise on the privacy pages becomes false.',
    routesTo: 'founder',
  },
  {
    id: 'R-062', domain: 'privacy-compliance', severity: 'MAJOR', source: `${BONES}/validate-privacy-compliance.md:24`,
    claim: 'Real third-party vendor identity — street address, phone, fax and order email — sits unredacted in an MIT-licensed repo, and Q-002 cannot cure it because the consenting party is the employer, not the vendor.',
    evidence: 'Re-verified 2026-08-07: services/extract/tests/golden/real_fixtures/fresco_lineitems.json contains 2 hits for the address and the order email.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const d=\"services/extract/tests/golden/real_fixtures\";const bad=[];for(const f of fs.readdirSync(d)){const t=fs.readFileSync(d+\"/\"+f,\"utf8\");if(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/.test(t))bad.push(f+\" (email)\");if(/\\b\\d{3,5} [A-Z][A-Z ]{3,} (RD|ST|AVE|BLVD)\\b/.test(t))bad.push(f+\" (street address)\")}if(bad.length)throw new Error(\"unredacted third-party identity in committed fixtures: \"+bad.join(\", \"))'"),
    note: 'Publishing the specimen (Q-030) is precisely the act that makes an outsider go look at the repo.',
  },
  {
    id: 'R-063', domain: 'privacy-compliance', severity: 'MAJOR', source: `${BONES}/validate-privacy-compliance.md:27`,
    claim: 'check-subprocessor-freshness.mjs cannot distinguish "pre-disclosed, not yet on" from "turned on, paperwork unsigned" — the precise posture an urgently-added exception desk would be in. Two live sub-processors are classified planned and skipped.',
    evidence: 'scripts/check-subprocessor-freshness.mjs:137-140,:150; rows 7 and 8 (Intuit, Xero) are "activated; DPA pending signature" since 2026-05-25.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/check-subprocessor-freshness.mjs\",\"utf8\");if(!/activatedDpaPending|activated.{0,40}pending/i.test(t))throw new Error(\"the freshness gate still folds Activated-DPA-pending into Planned and skips it\")'"),
  },
  {
    id: 'R-064', domain: 'privacy-compliance', severity: 'MODERATE', source: `${BONES}/validate-privacy-compliance.md:30`,
    claim: 'No queue item, no founder-hour and no checkpoint funds the counsel review the brief calls a decision of record.',
    evidence: 'Grepping all items for counsel|attorney|entity|LLC|insurance|licen returns only two incidental hits. ADR-033\'s budget table has no legal line.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-011',
  },

  // ── legal-ip ──────────────────────────────────────────────────────────────
  {
    id: 'R-065', domain: 'legal-ip', severity: 'BLOCKING', source: `${BONES}/validate-legal-ip.md:9`,
    claim: 'No queue item confirms the legal entity, and the plan requires signing customers out of it. The entity is three different things in three files.',
    evidence: 'terms.html:423 "a Maryland LLC" (re-verified 2026-08-07); Muntin-Invoice-Decoder/docs/tos.md:135 Delaware as home state; LICENSE:3 "Muntin Digital LLC"; legal-counsel-kickoff.md:353 still asks for "confirmation an entity EXISTS".',
    class: 'verifiable', status: 'open', founderOnly: true, blockedByDecision: 'R-011',
    alsoFoundBy: ['monetization', 'finance-runway', 'security'],
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/legal/entity.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const e=JSON.parse(fs.readFileSync(f,\"utf8\"));for(const k of [\"name\",\"type\",\"stateOfFormation\",\"formedOn\",\"goodStandingVerifiedOn\"])if(!e[k])throw new Error(\"entity.json missing \"+k);const t=fs.readFileSync(\"terms.html\",\"utf8\");if(!t.includes(e.stateOfFormation))throw new Error(\"terms.html names a different state than entity.json\")'"),
    note: 'A signature and an invoice must name a party. The fix is an afternoon; the plan gives it zero hours.',
  },
  {
    id: 'R-066', domain: 'legal-ip', severity: 'BLOCKING', source: `${BONES}/validate-legal-ip.md:12`,
    claim: 'The plan engages no counsel and the founder budget is 100% consumed at the floor, so there is no room to. Two binary Phase-0 questions can each void the plan and neither is asked.',
    evidence: 'counsel 0, attorney 0, legal advice 0 across queue.json and ADR-030/033. 39.25h planned against 39h at the floor.',
    class: 'verifiable', status: 'open', founderOnly: true, blockedByDecision: 'R-011',
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/legal/counsel-answers.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const a=JSON.parse(fs.readFileSync(f,\"utf8\"));const rows=a.answers||a;if(!Array.isArray(rows)||rows.length<2)throw new Error(\"need both Phase-0 answers, have \"+(rows.length||0));for(const r of rows)for(const k of [\"question\",\"answeredBy\",\"date\",\"answer\",\"constrains\"])if(!r[k])throw new Error(\"answer missing \"+k)'"),
    note: 'The two questions: (a) is a dated signed statement of inventory valuation prepared for a fee by a non-CPA a "report" under Md. Bus. Occ. & Prof. Title 2; (b) does the Tacombi employment agreement assign inventions. Both can void the strategy; both are cheaper than any item currently in M1.',
  },
  {
    id: 'R-067', domain: 'legal-ip', severity: 'BLOCKING', source: `${BONES}/validate-legal-ip.md:15`,
    claim: 'The attest-adjacent vocabulary ("signed", "statement", 31 occurrences of "signed" in the queue) was carried into the decisions of record unchanged, freezing the risky words into an ADR the company refuses to relitigate.',
    evidence: 'ADR-030:11,:49,:72,:87; data/queue.json#strategy.verdict. board-regulatory.md recommends banning signed/opinion/attest/certify/assurance/audit/workpaper of the deliverable; no queue item implements it and no gate detects the words.',
    class: 'decision', status: 'open', blockedBy: ['R-066'],
    decidesWhat: 'The deliverable\'s vocabulary, which must be settled BEFORE counsel is asked or the answer is about the wrong artifact. Downstream of R-066\'s answer (a), and a gate can enforce the wording only once the wording exists.',
    routesTo: 'founder',
  },
  {
    id: 'R-068', domain: 'legal-ip', severity: 'BLOCKING', source: `${BONES}/validate-legal-ip.md:18`,
    claim: 'The agent-run exception desk is answered with one prose clause against an absolute claim published 93 times. "Produces rules, never numbers" is about model OUTPUT; the published claim is about model INPUT.',
    evidence: '93 storefront HTML files contain "language model"; copy.ts:3082/3888/4067.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-018',
  },
  {
    id: 'R-069', domain: 'legal-ip', severity: 'MAJOR', source: `${BONES}/validate-legal-ip.md:21`,
    claim: 'There is no contract. Q-042 proves "signed" with a JSON file, and no engagement letter, third-party-reliance limit or limitations section exists.',
    evidence: 'Q-042 verify reads first-revenue.json and checks monthlyUsd===600. surface-disposition._toBuild lists eight pages, none an engagement-letter surface.',
    class: 'verifiable', status: 'open', founderOnly: true, blockedByDecision: 'R-011',
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/legal/engagement-letter.md\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const t=fs.readFileSync(f,\"utf8\");const need=[\"not an audit\",\"third-party\",\"limitation of liability\",\"client responsibilities\"];const miss=need.filter(n=>!t.toLowerCase().includes(n));if(miss.length)throw new Error(\"engagement letter missing: \"+miss.join(\", \"));const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-042\");if(!/engagementLetterSignedOn/.test(JSON.stringify(i)))throw new Error(\"Q-042 does not require a signed engagement letter per location\")'"),
  },
  {
    id: 'R-070', domain: 'legal-ip', severity: 'MAJOR', source: `${BONES}/validate-legal-ip.md:24`,
    claim: 'Q-002 covers the specimen fixtures only. The invention-assignment question, the 15-month 919-invoice corpus, and vendor confidentiality are all outside it.',
    evidence: 'Queue contains zero occurrences of invention, moonlighting, non-compete, work for hire, or vendor confidentiality. 124 storefront pages name Tacombi.',
    class: 'decision', status: 'open', blockedBy: ['R-066'],
    decidesWhat: 'Whether the extraction engine, the templates and the corpus are the founder\'s to sell. This is the question an acquirer, an investor or the employer\'s counsel asks first, and it is downstream of R-066 answer (b).',
    routesTo: 'founder',
  },
  {
    id: 'R-071', domain: 'legal-ip', severity: 'MODERATE', source: `${BONES}/validate-legal-ip.md:27`,
    claim: 'The open-data licensing gate validates a rights STRING, not provenance, and four IMF series are staged in the catalog — third-party-copyrighted values one promotion away from landing under a CC0 label.',
    evidence: 'scripts/check-open-data-catalog.mjs:36-37; data/cost-index-sources.json stages PSALMUSDM, PSHRIUSDM, PMAIZMTUSDM, PSMEAUSDM with type "imf".',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/check-open-data-catalog.mjs\",\"utf8\");if(!/sourceIsUSFederalWork/.test(t))throw new Error(\"the catalog gate still validates a rights string, not provenance\");const src=require(\"./data/cost-index-sources.json\");const bad=[];const walk=(o)=>{if(!o||typeof o!==\"object\")return;if(o.type===\"imf\"&&o.verified)bad.push(o.id||o.series||\"?\");for(const v of Object.values(o))walk(v)};walk(src);if(bad.length)throw new Error(\"non-federal series live under a CC0 label: \"+bad.join(\", \"))'"),
    note: 'The cheapest honesty repair in the domain and the one the plan\'s own mutation-testing doctrine was built to catch.',
  },
  {
    id: 'R-072', domain: 'legal-ip', severity: 'MODERATE', source: `${BONES}/validate-legal-ip.md:30`,
    claim: 'None of the paperwork that must exist before a hand-invoice goes out is scheduled: E&O, sales/use tax determination across three DMV jurisdictions, or product-facing terms.',
    evidence: 'queue: insur 0, E&O 0, sales tax 0. Removing billing code removed the only tax calculation the company had.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-011',
  },

  // ── marketing-seo ─────────────────────────────────────────────────────────
  {
    id: 'R-073', domain: 'marketing-seo', severity: 'BLOCKING', source: `${BONES}/validate-marketing-seo.md:9`,
    claim: 'No item produces the eight prospects Q-041 is measured against. The plan records a conversation quota and never builds the thing that produces conversations.',
    evidence: 'outreach 0, network 0, cold 0, intro 0. Q-041\'s 6 founder-hours is exactly 8 × 45min of talk time with zero hours for sourcing.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-007',
  },
  {
    id: 'R-074', domain: 'marketing-seo', severity: 'BLOCKING', source: `${BONES}/validate-marketing-seo.md:12`,
    claim: "CP-90's kill criteria both presuppose that eight conversations happened, so the most likely failure — the pipeline never fills — reds a checkpoint with no decision rule attached.",
    evidence: 'CP-90 killIf[0] tests ">= 8 qualified conversations and 0 signed"; killIf[1] tests "fewer than 2 of 8"; killIf[2] requires 3+ signed. If three conversations occur, none evaluates.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['customer-growth'],
    verify: s("node -e 'const q=require(\"./data/queue.json\");const cp=(q.checkpoints||[]).find(c=>c.id===\"CP-90\");const k=JSON.stringify(cp.killIf||[]);if(!/fewer than 8|less than 8|<\\s*8/.test(k))throw new Error(\"CP-90 has no kill criterion for the empty-pipeline case\")'"),
    note: 'The plan cannot distinguish "the buyer said no" from "I never reached a buyer" — two failures with opposite remedies. One JSON entry.',
  },
  {
    id: 'R-075', domain: 'marketing-seo', severity: 'BLOCKING', source: `${BONES}/validate-marketing-seo.md:15`,
    claim: 'The employer question is scoped to DATA and never to SELLING.',
    evidence: 'Q-002 doneWhen has no outside-activity, non-solicit or duty-of-loyalty scope.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-013',
  },
  {
    id: 'R-076', domain: 'marketing-seo', severity: 'MAJOR', source: `${BONES}/validate-marketing-seo.md:18`,
    claim: "ADR-014 promises a channel-attribution measurement that Q-041's contract does not collect, so the decision to reopen the bookkeeper channel degrades to the hunch the ADR was written to prevent.",
    evidence: 'ADR-014:113-116; Q-041 verify iterates [date, locations, vendorCount, hasBroadliner, objection, outcome] — no origin key.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-041\");const t=JSON.stringify(i);if(!/origin/.test(t))throw new Error(\"Q-041 records no conversation origin, so ADR-014 §5 cannot be decided with data\")'"),
    note: 'One word in doneWhen and one key in the verify loop.',
  },
  {
    id: 'R-077', domain: 'marketing-seo', severity: 'MAJOR', source: `${BONES}/validate-marketing-seo.md:21`,
    claim: '/try — a built, hardened, anonymous "read your own invoice" surface — is named nowhere in the plan and linked from zero of 1,327 storefront pages, while Q-032 budgets a fresh 6h build of a weaker falsifier.',
    evidence: 'apps/web/app/(marketing)/try exists (re-verified 2026-08-07). Queue contains "/try" 0 times; storefront grep for muntin.digital/try returns 0.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const{execSync}=require(\"child_process\");let n=\"0\";try{n=execSync(\"grep -rl \\\"/try\\\" --include=*.html . | wc -l\").toString().trim()}catch(e){}if(n===\"0\")throw new Error(\"/try is reachable from zero storefront pages\")'"),
    note: 'An owner who uploads his own specialty vendor\'s invoice and sees it reconcile IS a qualified lead. The surface self-screens on exactly the vendor-mix predicate Q-041 asks about. Re-scoping ADR-007\'s un-gate criterion is a separate decision (R-078).',
  },
  {
    id: 'R-078', domain: 'marketing-seo', severity: 'MAJOR', source: `${BONES}/validate-marketing-seo.md:24`,
    claim: "Nothing makes /close/ reachable, and the site's most common product CTA points at a hostname the product repo does not declare as the app.",
    evidence: 'Re-verified 2026-08-07: 547 occurrences of ledger.muntin.digital across 405 storefront HTML files; the product CLAUDE.md declares app.muntin.digital. Q-072 doneWhen has no reachability requirement.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const{execSync}=require(\"child_process\");let n=\"0\";try{n=execSync(\"grep -rl ledger.muntin.digital --include=*.html . | wc -l\").toString().trim()}catch(e){}if(n!==\"0\")throw new Error(n+\" storefront pages point at a hostname neither repo routes\");const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-072\");if(!/nav|linked from|reachab/i.test(i.doneWhen||\"\"))throw new Error(\"/close/ still ships with no reachability requirement\")'"),
  },
  {
    id: 'R-079', domain: 'marketing-seo', severity: 'MODERATE', source: `${BONES}/validate-marketing-seo.md:27`,
    claim: "For roughly 90 days the site's only live capture surface writes into a store with no reader, and this is absent from the honesty-debt register.",
    evidence: 'action="/api/waitlist" on 4 files; listFounding() has no callers in the product repo. Q-040 removes the forms but is LOW/M3/blocked.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const{execSync}=require(\"child_process\");let n=\"0\";try{n=execSync(\"grep -rl \\\"action=\\\\\\\"/api/waitlist\\\\\\\"\\\" --include=*.html . | wc -l\").toString().trim()}catch(e){}if(n!==\"0\")throw new Error(n+\" pages still capture addresses into a store with no reader\")'"),
  },
  {
    id: 'R-080', domain: 'marketing-seo', severity: 'MODERATE', source: `${BONES}/validate-marketing-seo.md:30`,
    claim: 'The funnel has no defined measure and the maintained storefront has no defined funnel role, so "right-sized" cannot currently be evaluated. 406 pages stay maintained for a business capped at ~40 customers.',
    evidence: '"qualified application" appears once in the whole queue, inside a `why`. No checkpoint measures applications. Q-073\'s doneWhen is a cap only.',
    class: 'decision', status: 'open',
    decidesWhat: 'What the funnel measures, given ADR-025 says the storefront\'s job is qualification and its measure is qualified applications. Until that number is named, no page\'s maintenance can be justified or cut on funnel grounds.',
    routesTo: 'founder',
  },

  // ── content-editorial ─────────────────────────────────────────────────────
  {
    id: 'R-081', domain: 'content-editorial', severity: 'BLOCKING', source: `${BONES}/validate-content-editorial.md:9`,
    claim: 'The maintained corpus is publishing a stale number today — /about/ prints a Cost Index read stamped 2026-07-21 against data whose newest print is 2026-07-27 — and CP-30 can pass green over it.',
    evidence: 'Re-verified 2026-08-07: `node scripts/inject-about-cost-read.mjs --check` exits 1, "would update 2 file(s)". Both pages are keep / R1-audit-file. No HD entry covers injected numbers drifting on maintained pages.',
    class: 'verifiable', status: 'open',
    verify: s('node scripts/inject-about-cost-read.mjs --check'),
    note: 'The single cheapest live falsehood in the register: one command, one builder run, fails today. The page a bookkeeper opens to decide whether the operator is real.',
  },
  {
    id: 'R-082', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:12`,
    claim: 'Freezing releases maintenance but does not un-publish: 469 indexed, unmaintained pages carrying 286,754 words are indistinguishable from the 406 maintained ones, with no dated "not re-verified" disclosure and no gate requiring one.',
    evidence: 'All 469 freeze pages have equity.indexable true; 244 carry a dead product CTA; only 1 HTML file sitewide contains any "no longer maintained" string.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const d=require(\"./data/surface-disposition.json\");const fs=require(\"fs\");const pages=Object.values(d.pages||{}).filter(v=>v.disposition===\"freeze\"&&v.filePath);if(pages.length<400)throw new Error(\"expected ~469 freeze pages, found \"+pages.length+\" — the scan is not seeing the corpus\");let checked=0,missing=0;for(const p of pages){if(!fs.existsSync(p.filePath))continue;checked++;if(!/not re-verified|no longer maintained/i.test(fs.readFileSync(p.filePath,\"utf8\")))missing++}if(checked<400)throw new Error(\"only \"+checked+\" freeze pages were readable — refusing to pass on a scan that saw almost nothing\");if(missing)throw new Error(missing+\" of \"+checked+\" frozen pages carry no dated not-re-verified disclosure\")'"),
  },
  {
    id: 'R-083', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:15`,
    claim: 'The glossary is 100% frozen and it is the definitional layer directly under the maintained corpus. cost-index/methodology (keep, factGate true) links to 11 frozen terms.',
    evidence: '344 glossary pages: 201 freeze-noindex, 143 freeze, ZERO keep; 229,130 words, 0 cite drawers, 6,039 inbound editorial links.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const d=require(\"./data/surface-disposition.json\");const fs=require(\"fs\");const byRoute={};for(const v of Object.values(d.pages||{}))byRoute[v.route]=v;const t=fs.readFileSync(\"cost-index/methodology/index.html\",\"utf8\");const links=[...new Set((t.match(/\\/glossary\\/[a-z0-9-]+\\//g)||[]))];if(links.length<5)throw new Error(\"found only \"+links.length+\" glossary links — the scan is wrong, not the site\");const unknown=links.filter(l=>!byRoute[l]);if(unknown.length)throw new Error(unknown.length+\" linked glossary routes are absent from the disposition manifest: \"+unknown.slice(0,3).join(\", \"));const frozen=links.filter(l=>byRoute[l].disposition!==\"keep\");if(frozen.length)throw new Error(frozen.length+\" of \"+links.length+\" glossary terms linked from a keep page are frozen: \"+frozen.slice(0,5).join(\", \"))'"),
  },
  {
    id: 'R-084', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:18`,
    claim: 'ADR-032 §3 places a live copy correction outside the queue by name ("a same-day change, not a queue item to age") and names only the Spanish half. The identical English 24-hour-callback promises are still shipped.',
    evidence: 'Re-verified 2026-08-07: copy.es.ts contains "respondemos en 24" ×2; copy.ts contains "call within 24 hours" ×1.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");const bad=[];for(const f of [\"apps/web/lib/copy.ts\",\"apps/web/lib/copy.es.ts\"]){const t=fs.readFileSync(f,\"utf8\");if(/within 24 hours|en 24 horas/i.test(t))bad.push(f)}if(bad.length)throw new Error(\"a one-person company still promises a 24-hour reply in: \"+bad.join(\", \"))'"),
    note: 'The one instruction in the plan deliberately exempted from the mechanism the plan was built to be.',
  },
  {
    id: 'R-085', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:21`,
    claim: 'The cadence pause (Q-015) is scoped to indexed pages, but the "first Tuesday" promise is a contract in email code, in a test that ASSERTS it, and in a generated archive lede that is already false.',
    evidence: 'src/lib/templates.js:1430-1438 ("This line is the contract"); templates.es.js:1124; scripts/test-email-templates.mjs:402 asserts the promise; build-cost-index-archive.mjs:37.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-015\");if(!/cadence contract|templates\\.js|test-email-templates/.test(JSON.stringify(i)))throw new Error(\"Q-015 still scopes the pause to indexed pages only — the email contract, its test and the archive lede are outside it\");const files=[\"src/lib/templates.js\",\"src/lib/templates.es.js\",\"scripts/build-cost-index-archive.mjs\",\"scripts/build-cost-index-pages.mjs\"];const bad=files.filter(f=>fs.existsSync(f)&&/first Tuesday|One email a month/i.test(fs.readFileSync(f,\"utf8\")));if(bad.length)throw new Error(\"the cadence promise still ships in: \"+bad.join(\", \"))'"),
    note: 'Fail-closed by design: the scope defect is the gap, so this stays open whichever fork Q-015 takes. A command that exits 0 because a precondition is unmet is a vacuous pass.',
  },
  {
    id: 'R-086', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:24`,
    claim: 'Q-006 is first in the floor-plan cut list, and it is the only item defending the freshness of 306 of the 406 maintained pages.',
    evidence: 'capacity.floorPlan.dropOrderToReach13h[0] cuts Q-006 for −0.5h. Cost Index is 306 of 406 keep pages (75%).',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether the first cut in the drop order should be the item defending three-quarters of the maintained corpus during the exact window two CPAs review the artifact priced off that basis. The drop order is a founder decision already recorded; changing it is another.',
    routesTo: 'founder',
  },
  {
    id: 'R-087', domain: 'content-editorial', severity: 'MAJOR', source: `${BONES}/validate-content-editorial.md:27`,
    claim: 'No day-91 editorial disposition, and the suspension expires the same day the delivery load arrives.',
    evidence: 'Q-013 suspends the ~53 h/month calendar for M1-M3; capacity.windows.M3 ends 2026-11-06, which is also CP-90\'s dueOn.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-107',
  },
  {
    id: 'R-088', domain: 'content-editorial', severity: 'MODERATE', source: `${BONES}/validate-content-editorial.md:30`,
    claim: "ADR-032's audio-alt scoping is prose the gate does not implement, and Q-071 re-imposes an ES obligation ADR-032 released.",
    evidence: 'ADR-032:74-77 scopes the ≥80-char rule to pages with rendered tracks; check-article-graphics.mjs never reads data/article-audio.json and enforces DATA_AUDIO_ALT_MIN at :622 on every content figure.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/check-article-graphics.mjs\",\"utf8\");if(!t.includes(\"article-audio.json\"))throw new Error(\"rule 3 still applies the narration floor to pages with no rendered track, against ADR-032:74-77\")'"),
  },

  // ── data-moat ─────────────────────────────────────────────────────────────
  {
    id: 'R-089', domain: 'data-moat', severity: 'BLOCKING', source: `${BONES}/validate-data-moat.md:9`,
    claim: 'The plan never states what the Cost Index is FOR, so nothing scopes it. There is no item to shrink, retire or re-scope it, and ADR-021\'s retirement machinery has never once fired.',
    evidence: 'Re-verified 2026-08-07: data/cost-index-retired.json has 0 retired keys. The product consumes 24 slugs; the other 76 feed no product path. Health: 20 medium / 62 low / 18 directional, highEligible 0.',
    class: 'decision', status: 'open',
    decidesWhat: 'The Index\'s single job in one sentence, and the scope that follows. The board measured it at 42-47% of the company\'s total obligation with zero revenue mechanism. The default outcome is "maintain 100 badly".',
    routesTo: 'founder',
    unblocks: ['R-092'],
    alsoFoundBy: ['marketing-seo'],
  },
  {
    id: 'R-090', domain: 'data-moat', severity: 'BLOCKING', source: `${BONES}/validate-data-moat.md:12`,
    claim: 'The flagship published composite is not reproducible from its own inputs: basket.pct is byte-identical to contributors[0].pct, recomputing from the file\'s own live trends gives the opposite sign, and no gate recomputes it.',
    evidence: 'Re-verified 2026-08-07: basket.pct === contributors[0].pct === -0.005322241098086206; basket.asOf 2026-06-01 against _lastReviewed 2026-08-05. Published as "−0.5%" under a CC0 DataCatalog JSON-LD.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const c=require(\"./data/cost-index.json\");if(c.basket.pct===c.basket.contributors[0].pct)throw new Error(\"basket.pct is byte-identical to the first contributor — not a weighted mean\");const fs=require(\"fs\");if(!fs.existsSync(\"scripts/check-cost-index-basket.mjs\"))throw new Error(\"no gate recomputes the published basket\")'"),
    note: 'A skeptic who downloads the CC0 file the site invites him to download cannot reproduce the headline and gets the opposite sign. For this company that is the most expensive possible thing to be wrong about.',
  },
  {
    id: 'R-091', domain: 'data-moat', severity: 'BLOCKING', source: `${BONES}/validate-data-moat.md:15`,
    claim: 'ADR-033 §4 names two hard dates and omits the largest: the 120-day cliff drops 17 ingredients on ~2026-09-29 and another on 2026-10-06 — CP-60\'s own due date — removing 3 of 16 basket contributors carrying 19% of declared weight during the specimen-close and CPA-review window.',
    evidence: 'Re-verified 2026-08-07: check-cost-index-series-freshness reports 74 of 100 fresh, 16 unexpected + 10 known-latent, with a cohort at "cliff in 53d".',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const a=fs.readFileSync(\"docs/editorial/decisions/ADR-033-the-ninety-days-and-its-falsifiers.md\",\"utf8\");const miss=[\"2026-09-19\",\"2026-09-29\",\"2026-10-06\"].filter(d=>!a.includes(d));if(miss.length)throw new Error(\"ADR-033 §4 still omits the cliff dates: \"+miss.join(\", \"));const q=require(\"./data/queue.json\");const cp=(q.checkpoints||[]).find(c=>c.id===\"CP-60\");if(!/POINT_STALE|cliff|series-freshness/i.test(JSON.stringify(cp.mustBeTrue||[])))throw new Error(\"CP-60 carries no assertion that no published series sits inside 30 days of its cliff\");const{spawnSync}=require(\"child_process\");const r=spawnSync(\"node\",[\"scripts/check-cost-index-series-freshness.mjs\"],{encoding:\"utf8\"});const out=(r.stdout||\"\")+(r.stderr||\"\");const near=(out.match(/cliff in (\\d+)d/g)||[]).map(x=>parseInt(x.match(/\\d+/)[0],10)).filter(d=>d<30);if(near.length)throw new Error(near.length+\" published series sit inside 30 days of their staleness cliff\")'"),
  },
  {
    id: 'R-092', domain: 'data-moat', severity: 'MAJOR', source: `${BONES}/validate-data-moat.md:18`,
    claim: 'ADR-032 retains "the 306 Cost Index pages stay fresh" as the one surviving ratchet on the premise that their cadence is automated not founder-paid, which the freshness gate falsifies on 26 of 100 series — and Q-013 suspends the founder work that premise depends on.',
    evidence: 'ADR-032:110-112; 10 of the 26 frozen series are labelled by the gate itself as a standing source-or-retire DECISION. es/cost-index has 0 series.json files and no corrections directory (re-verified 2026-08-07).',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-089',
  },
  {
    id: 'R-093', domain: 'data-moat', severity: 'MAJOR', source: `${BONES}/validate-data-moat.md:21`,
    claim: 'The single question that determines whether the Index has any product function — does a CPA accept a disclosed public market index as a management estimate — is buried behind a seven-item dependency chain and scheduled after every hour of Index work.',
    evidence: 'Q-031 blockedBy Q-030; Q-030 blockedBy seven items. Its answer is a CP-60 kill criterion. Nothing in that chain is technically required to ASK it.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/handoff/receipts/cpa-review.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const r=JSON.parse(fs.readFileSync(f,\"utf8\"));const rows=r.reviews||r;if(!Array.isArray(rows)||!rows.length)throw new Error(\"no reviewer answer recorded\");const ok=rows.some(x=>x.reviewer&&x.date&&typeof x.marketPriorAcceptable===\"boolean\");if(!ok)throw new Error(\"no named reviewer has answered marketPriorAcceptable with a date\")'"),
    note: 'A 45-minute call whose "no" would delete the Index\'s last product function, scheduled after the correctness fixes, the deploy, the specimen close and every Index repair hour.',
  },
  {
    id: 'R-094', domain: 'data-moat', severity: 'MAJOR', source: `${BONES}/validate-data-moat.md:24`,
    claim: 'The CC0 dataset publishes 97.6% of its observations with no source, on a site whose absolute rule is that every number carries a citation — caused by one token (source: null) in the reconstructed loop.',
    evidence: '83,695 of 85,715 published series rows with empty source, from scripts/build-cost-index-pages.mjs:1319. Queue and honesty-debt both contain no entry for it.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/build-cost-index-pages.mjs\",\"utf8\");if(/source:\\s*null/.test(t))throw new Error(\"the reconstructed loop still writes source: null over rows that carry a real source\")'"),
    note: 'The one-token fix is the cheapest honesty repair in the domain and is in neither the queue nor the honesty ledger.',
  },
  {
    id: 'R-095', domain: 'data-moat', severity: 'MODERATE', source: `${BONES}/validate-data-moat.md:27`,
    claim: "The refresh workflow rebuilds three derived files and then discards them with `git checkout -- .`, so the bot can push a state its own deploy gate rejects — a standing red-deploy generator for a CLASS of files that keeps being cleared by hand, one file at a time.",
    evidence: '.github/workflows/cost-index-refresh.yml:99,:110,:114 rebuild; the git add allowlist at :302-311 omits all three; :313 discards. Three hand-clear commits on data/cost-index-picker.js.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-052',
    note: 'Same three lines, same three workflows. R-052 removes them for a security reason; removing them also closes this.',
  },
  {
    id: 'R-096', domain: 'data-moat', severity: 'MODERATE', source: `${BONES}/validate-data-moat.md:30`,
    claim: "Q-007 — a HIGH P0 item on CP-30's mustBeTrue list — has a doneWhen depending on /cost-index/corrections/, a surface that does not exist and was deliberately pulled, while its verify checks only the ledger DATA. It can close while its own stated doneWhen is false.",
    evidence: 'Re-verified 2026-08-07: cost-index/corrections does not exist. HD-12 note records it was pulled the day it landed.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-007\");if(/corrections\\//.test(i.doneWhen||\"\")&&!fs.existsSync(\"cost-index/corrections/index.html\"))throw new Error(\"Q-007 doneWhen names a surface that does not exist, and its verify cannot see it\")'"),
  },

  // ── design-ux ─────────────────────────────────────────────────────────────
  {
    id: 'R-097', domain: 'design-ux', severity: 'BLOCKING', source: `${BONES}/validate-design-ux.md:9`,
    claim: 'The artifact the company sells has no designed form, no route and no owner. Nothing renders a dated statement of food cost.',
    evidence: '63 route files in apps/api/src/routes, none a close/statement route. Q-030\'s verify script check-specimen-close.mjs does not exist on disk (re-verified 2026-08-07).',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-029',
  },
  {
    id: 'R-098', domain: 'design-ux', severity: 'BLOCKING', source: `${BONES}/validate-design-ux.md:12`,
    claim: 'No verify command in the entire plan inspects a rendered surface. Q-021 promises the uncounted exclusion is "disclosed on the close" and Q-024 that the shortfall is "named on the close"; both verify with an API unit test.',
    evidence: 'Q-020/021/022/024 all verify with `vitest run -t "…"` in cwd product. The product CLAUDE.md states plainly there is no browser in this container.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const{execSync}=require(\"child_process\");let out=\"\";try{out=execSync(\"grep -rl closeStatement apps/web/app 2>/dev/null\").toString().trim()}catch(e){}if(!out)throw new Error(\"no rendered close surface exists to test\");let t=\"\";try{t=execSync(\"grep -rlE \\\"toBeInTheDocument|toHaveTextContent\\\" apps/web/app --include=*close*.test.tsx 2>/dev/null\").toString().trim()}catch(e){}if(!t)throw new Error(\"no component test asserts a disclosure string in the RENDERED close statement\")'"),
    note: 'The four correctness fixes can close green, CP-60 can pass, and the printed statement can still omit every disclosure they added.',
  },
  {
    id: 'R-099', domain: 'design-ux', severity: 'MAJOR', source: `${BONES}/validate-design-ux.md:15`,
    claim: "Zero founder-hours across all three windows go to design, render-checking or UX review, and the plan's own design loop names render-checking as the step that makes it compound.",
    evidence: 'M1 14.5h, M2 8.75h, M3 8.5h — not one hour is design. docs/design/loop-charter.md step (4) is RENDER; the agent has no browser and the founder has no allocated minute.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/handoff/receipts/render-check.json\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const r=JSON.parse(fs.readFileSync(f,\"utf8\"));const rows=r.checks||r;if(!Array.isArray(rows)||rows.length<1)throw new Error(\"no founder render check recorded\");for(const x of rows)for(const k of [\"window\",\"date\",\"device\",\"surface\",\"whatBroke\"])if(x[k]===undefined)throw new Error(\"render check missing \"+k)'"),
  },
  {
    id: 'R-100', domain: 'design-ux', severity: 'MAJOR', source: `${BONES}/validate-design-ux.md:18`,
    claim: 'The one UX measurement the plan collects — countMinutes — has no threshold, so it cannot fail. The count is the product\'s only manual input and therefore its entire UX surface.',
    evidence: 'CP-30.killIf sets criteria on dollarSurvivalPct, the authorization basis and legsFooted. countMinutes and needsReviewRows carry no criterion at all.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const q=require(\"./data/queue.json\");const cp=(q.checkpoints||[]).find(c=>c.id===\"CP-30\");const k=JSON.stringify(cp.killIf||[]);if(!/countMinutes/.test(k))throw new Error(\"CP-30 has no kill criterion on countMinutes — the only UX number the plan collects cannot fail\")'"),
  },
  {
    id: 'R-101', domain: 'design-ux', severity: 'MAJOR', source: `${BONES}/validate-design-ux.md:21`,
    claim: 'The redesign lands into design gates that cannot hold it: check-contrast.mjs hardcodes the palette so a new spine is fixed by editing the gate, and the product\'s only blocking pixel gate has a 2-PNG baseline that cannot be re-seeded in this container.',
    evidence: 'scripts/check-contrast.mjs lines 27-36 duplicate the token values; visual-regression.yml is blocking with two snapshots; check-css-drift.mjs is UNWIRED at 505 drift issues.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/check-contrast.mjs\",\"utf8\");if(!t.includes(\"assets/site.css\")||/const T\\s*=\\s*\\{\\s*light/.test(t))throw new Error(\"check-contrast still duplicates the palette instead of deriving it from assets/site.css\")'"),
  },
  {
    id: 'R-102', domain: 'design-ux', severity: 'MAJOR', source: `${BONES}/validate-design-ux.md:24`,
    claim: 'The plan builds eight new public surfaces — including the entire acquisition path — with no accessibility requirement in any doneWhen, and the only a11y automation covers 2 of 1,327 pages non-blocking.',
    evidence: 'Grepping data/queue.json for accessib|a11y|contrast|WCAG|screen reader returns zero matches (re-verified 2026-08-07). window-a11y.yml is continue-on-error and its paths filter excludes all eight new routes.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const fs=require(\"fs\");const y=fs.readFileSync(\".github/workflows/window-a11y.yml\",\"utf8\");const d=require(\"./data/surface-disposition.json\");const toBuild=d._toBuild||[];const miss=toBuild.filter(r=>!y.includes(String(r).replace(/^\\//,\"\").replace(/\\/$/,\"\")));if(miss.length)throw new Error(miss.length+\" new public routes are outside the a11y gate: \"+miss.slice(0,4).join(\", \"))'"),
  },
  {
    id: 'R-103', domain: 'design-ux', severity: 'MAJOR', source: `${BONES}/validate-design-ux.md:27`,
    claim: "/close/apply/ — the plan's sole answer to \"no acquisition mechanism for the first ten customers\" — is LOW priority, M3, blocked, 0.5 founder-hours, with a doneWhen containing no error state, confirmation, decline path or mobile behaviour.",
    evidence: 'Q-040 doneWhen is entirely structural; its verify is a grep for the absence of the old form. Its own founderOnly note says "Who gets told no is a founder call."',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const i=q.items.find(x=>x.id===\"Q-040\");const d=i.doneWhen||\"\";if(!/decline/i.test(d)||!/error state/i.test(d))throw new Error(\"Q-040 still ships the funnel with no designed decline or error state\")'"),
    note: 'At forty customers ever, every rejected application is a reputation event.',
  },
  {
    id: 'R-104', domain: 'design-ux', severity: 'MODERATE', source: `${BONES}/validate-design-ux.md:30`,
    claim: 'The working-set and retirement contracts move the design reference pack out under queue IDs that do not exist. 22+ `why` fields cite Q-070/Q-071; the actual items are Q-080/Q-081.',
    evidence: 'Re-verified 2026-08-07: docs/contracts/working-set.json contains 17 "ARCHIVE PENDING (Q-071)" and 1 "RETIREMENT PENDING (Q-070)"; retirement-2026-08-07.json#executedBy repeats it; check-gate-coverage.mjs:126 repeats it again.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['ci-integrity'],
    verify: s("node -e 'const fs=require(\"fs\");const files=[\"docs/contracts/working-set.json\",\"docs/contracts/retirement-2026-08-07.json\",\"scripts/check-gate-coverage.mjs\"];const bad=[];for(const f of files){const t=fs.readFileSync(f,\"utf8\");if(/PENDING \\(Q-07[01]\\)|Q-070 \\(board\\)|Q-070 and Q-071 do the work/.test(t))bad.push(f)}if(bad.length)throw new Error(\"contracts still cite the wrong queue IDs (Q-070/Q-071 instead of Q-080/Q-081): \"+bad.join(\", \"))'"),
    note: 'Closing Q-070 or Q-071 will not execute the retirement, and a session running --done on Q-080 finds no contract that names it.',
  },
  {
    id: 'R-105', domain: 'design-ux', severity: 'MODERATE', source: `${BONES}/validate-design-ux.md:33`,
    claim: 'The product has no in-app language control and no persisted locale, and the parity test cited as the guarantee does not exist — while the count is often performed by the Spanish-dominant half of the house.',
    evidence: 'LOCALE_SWITCHER_LABELS is imported by exactly one file, a marketing nav. Locale is not persisted anywhere. apps/web/__tests__/i18n.test.ts does not exist.',
    class: 'verifiable', status: 'open',
    verify: p("node -e 'const fs=require(\"fs\");if(!fs.existsSync(\"apps/web/__tests__/i18n.test.ts\"))throw new Error(\"the parity test cited by apps/web/lib/i18n.ts:38 as the guarantee does not exist\")'"),
    note: 'ADR-032 released the STOREFRONT ES ratchet. The plan silently treats that as also settling the product\'s ES surface, which it does not.',
  },

  // ── ops-capacity ──────────────────────────────────────────────────────────
  {
    id: 'R-106', domain: 'ops-capacity', severity: 'BLOCKING', source: `${BONES}/validate-ops-capacity.md:9`,
    claim: 'The plan consumes 100.6% of the founder-hour floor it claims to be sized against (39.25h against 39h), and the denominator itself is one unmeasured prose line dated 2026-07-05 against a measured realized rate of 0.10.',
    evidence: 'M1 17.0h, M2 11.25h, M3 11.0h. capacity.realizedRate = 0.10 is recorded and used only to justify Q-013, never to discount any window.',
    class: 'verifiable', status: 'open', blockedBy: ['R-039'],
    verify: s('node scripts/check-queue.mjs --budget'),
    note: 'Cannot even be measured today: --budget exits 2 because of R-039.',
  },
  {
    id: 'R-107', domain: 'ops-capacity', severity: 'BLOCKING', source: `${BONES}/validate-ops-capacity.md:12`,
    claim: 'Day 91 is an unpriced cliff: Q-013\'s suspension of the ~53h/month calendar expires 2026-11-06, the same day the plan ends and the same window three locations sign a recurring close obligation.',
    evidence: 'ADR-033 (243 lines) contains zero occurrences of resume, recurring, steady, M4 or day 91.',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['content-editorial', 'monetization', 'finance-runway', 'customer-growth'],
    verify: s("node -e 'const fs=require(\"fs\");const f=\"docs/handoff/obligation-budget.md\";if(!fs.existsSync(f))throw new Error(f+\" missing\");const t=fs.readFileSync(f,\"utf8\");const m=t.match(/totalStandingHoursPerMonth:\\s*([0-9.]+)/);if(!m)throw new Error(\"no total standing-obligation figure stated\");if(parseFloat(m[1])>13)throw new Error(\"day-91 standing obligation is \"+m[1]+\"h against a 13h floor\")'"),
    note: 'THE canonical day-91 gap. Five validators found it. On 2026-11-07 the founder faces the resumed calendar plus three recurring closes plus support plus onboarding against 13-26h.',
  },
  {
    id: 'R-108', domain: 'ops-capacity', severity: 'BLOCKING', source: `${BONES}/validate-ops-capacity.md:15`,
    claim: 'deskMinutesPerClose is the input to two of six kill criteria and nothing in either repo produces it.',
    evidence: 'Both criteria are decidedBy: measurement. Q-030\'s doneWhen does not mention it.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-002',
  },
  {
    id: 'R-109', domain: 'ops-capacity', severity: 'MAJOR', source: `${BONES}/validate-ops-capacity.md:18`,
    claim: 'Founder review overhead is priced as a flat 2.5h/month constant while agent output varies 3x across windows — M2 alone puts 37 agent-hours, including all five correctness fixes to the arithmetic being sold, through 2.5h of review.',
    evidence: 'capacity.reviewOverheadPerMonth = 2.5h. board-execution-feasibility.md:42 records the founder already merging "with three reds accepted".',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const r=q.capacity&&q.capacity.reviewOverheadPerMonth;if(!r||typeof r.minutesPerItem!==\"number\")throw new Error(\"review overhead is still a flat constant, not minutes-per-item x item count\")'"),
  },
  {
    id: 'R-110', domain: 'ops-capacity', severity: 'MAJOR', source: `${BONES}/validate-ops-capacity.md:21`,
    claim: 'Five queue verify commands name scripts that do not exist — including one item in whatIsNeverDropped — so doing the work cannot close the item.',
    evidence: 'Re-verified 2026-08-07: check-specimen-close.mjs, check-limits-register.mjs, check-pack-check-tool.mjs, build-refusals-page.mjs, build-freshness-page.mjs all MISSING; Q-014 names check-cost-index-snapshot-freshness.mjs where the file is check-cost-index-snapshot-fresh.mjs.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['design-ux', 'finance-runway', 'customer-growth'],
    verify: s("node -e 'const fs=require(\"fs\");const q=require(\"./data/queue.json\");const roots={storefront:\".\",product:\"../Muntin-Invoice-Decoder\"};const bad=[];for(const i of q.items){const v=i.verify;if(!v||!v.cmd)continue;const root=roots[v.cwd]||\".\";for(const m of v.cmd.match(/(scripts\\/[A-Za-z0-9._-]+\\.(mjs|sh))/g)||[]){if(!fs.existsSync(root+\"/\"+m))bad.push(i.id+\" -> \"+m)}}if(bad.length)throw new Error(bad.length+\" verify commands name a script that does not exist: \"+bad.join(\", \"))'"),
    note: '--done refuses to close on a failing verify, so founder hours are spent and the item stays open. The most mechanical repair in the register.',
  },
  {
    id: 'R-111', domain: 'ops-capacity', severity: 'MAJOR', source: `${BONES}/validate-ops-capacity.md:24`,
    claim: 'The queue gate — the single mechanism enforcing the budget, the checkpoints and the kill criteria — does not execute today, and the hook hides it with 2>/dev/null || true.',
    evidence: 'Re-verified 2026-08-07: exits 2 in every mode.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-039',
  },
  {
    id: 'R-112', domain: 'ops-capacity', severity: 'MODERATE', source: `${BONES}/validate-ops-capacity.md:27`,
    claim: 'Acquisition and onboarding hours are priced only for the conversation itself, not for sourcing, screening, or the 60-75 day path to a first correct close.',
    evidence: 'Q-041 = 6 founderHours for 8 qualified conversations; Q-042 = 2h for three signings plus a delivered close plus an invoice, with no onboarding line.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-014',
  },
  {
    id: 'R-113', domain: 'ops-capacity', severity: 'MODERATE', source: `${BONES}/validate-ops-capacity.md:30`,
    claim: 'Bus factor is not addressed by a single queue item, and CP-90 success is the event that makes it customer-facing: three restaurants paying, their encrypted archive one lost 2FA device from permanent destruction, drill never executed.',
    evidence: 'succession 0, continuity 0, insurance 0, CODEOWNERS 0 (re-verified 2026-08-07). runbooks/backup-restore-drill.md:65-67 — "if the KMS key is lost, ciphertext is unrecoverable".',
    class: 'verifiable', status: 'open', founderOnly: true,
    alsoFoundBy: ['security'],
    verify: p("node -e 'const fs=require(\"fs\");if(!fs.existsSync(\"docs/continuity.md\"))throw new Error(\"docs/continuity.md missing — no named reachable second human, no sealed credential inventory\");const t=fs.readFileSync(\"runbooks/backup-restore-drill.md\",\"utf8\");if(!/executedOn:\\s*20\\d\\d-\\d\\d-\\d\\d/.test(t))throw new Error(\"the restore drill has never been executed\")'"),
  },
  {
    id: 'R-114', domain: 'ops-capacity', severity: 'MODERATE', source: `${BONES}/validate-ops-capacity.md:33`,
    claim: 'The floor drop-order buys 4h of which 2h is choosing the optimistic end of an estimate for a task never performed, and no kill criterion anywhere tests whether the founder delivered the hours — the binding constraint is the only thing in the plan with no falsifier.',
    evidence: 'floorPlan: Q-006 (−0.5), Q-009 (−0.5), Q-010 (−1.0), then "Q-001 lands at its 4h lower bound rather than the 6h ceiling". Every one of the six kill criteria tests the product, the reviewer or the buyer.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const q=require(\"./data/queue.json\");const cp=(q.checkpoints||[]).find(c=>c.id===\"CP-30\");const k=JSON.stringify(cp.killIf||[]);if(!/founder-hours\\.json|founderHoursDelivered|hours actually delivered/i.test(k))throw new Error(\"no checkpoint has a kill criterion on founder hours actually delivered\")'"),
    note: 'Rewritten from a critique of an estimate into the falsifier the critique implies. The estimate itself has no falsifier until M1 is run; the capacity criterion does.',
  },
  {
    id: 'R-115', domain: 'ops-capacity', severity: 'MINOR', source: `${BONES}/validate-ops-capacity.md:36`,
    claim: "The plan-of-record's own summary block still states the scope the capacity cut removed — strategy.phases.P3 says \"ten locations\" while capacity.cuts and Q-042 say three.",
    evidence: 'data/queue.json#strategy.phases.P3.',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const q=require(\"./data/queue.json\");const p3=JSON.stringify((q.strategy&&q.strategy.phases&&q.strategy.phases.P3)||\"\");if(/ten locations/i.test(p3))throw new Error(\"strategy.phases.P3 still sizes M3 against ten locations\")'"),
  },

  // ── finance-runway ────────────────────────────────────────────────────────
  {
    id: 'R-116', domain: 'finance-runway', severity: 'BLOCKING', source: `${BONES}/validate-finance-runway.md:9`,
    claim: 'The plan has an hours budget with teeth and no money budget at all. Nothing declares what the founder can spend at zero revenue, and nothing fails when the plan exceeds it — against ~$9,341 cumulative cash out by 2026-10.',
    evidence: 'grep for cashUsd|dollars|usd in scripts/check-queue.mjs returns nothing; no item carries a cost.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const q=require(\"./data/queue.json\");const c=q.capacity&&q.capacity.cashBudget;if(!c||typeof c.monthlyUsd!==\"number\")throw new Error(\"no cash budget declared\");const fs=require(\"fs\");const t=fs.readFileSync(\"scripts/check-queue.mjs\",\"utf8\");if(!t.includes(\"cashBudget\"))throw new Error(\"the queue gate does not enforce the cash budget\")'"),
    note: 'When it runs short it will be absorbed the way the 53h/month calendar was absorbed — by silent non-payment — and the failure mode there is a lapsed Fly or Neon bill taking the product down mid-pilot.',
  },
  {
    id: 'R-117', domain: 'finance-runway', severity: 'BLOCKING', source: `${BONES}/validate-finance-runway.md:12`,
    claim: 'No item for E&O, counsel or entity confirmation, while the day-60 deliverable is a public specimen close and the day-90 deliverable is a SIGNED statement of food cost with an invoice attached.',
    evidence: 'Q-042 blockedBy ["Q-041"] only. terms.html:423 Maryland vs docs/tos.md:135 Delaware; docs/tos.md:99 tells the customer not to rely on the thing being sold.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-011',
  },
  {
    id: 'R-118', domain: 'finance-runway', severity: 'BLOCKING', source: `${BONES}/validate-finance-runway.md:15`,
    claim: 'deskMinutesPerClose — the single parameter the value of the business ranges 1,000x on ($224/yr to $280,002/yr at the service ceiling) — is still not scheduled to be measured.',
    evidence: 'Q-001 records four numbers and desk minutes is not among them; CP-60\'s producer script does not exist.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-002',
  },
  {
    id: 'R-119', domain: 'finance-runway', severity: 'MAJOR', source: `${BONES}/validate-finance-runway.md:18`,
    claim: 'The strategy states "~40 locations ever" while the plan explicitly sizes capacity against the 13h floor, at which the model\'s own BASE parameters serve roughly ten locations. Those are not the same business.',
    evidence: 'data/queue.json:23; capacity.founderHoursPerMonth.planAgainst = "floor". finance-model.md §2 computes 19.8 at 20h/month and 3.6 in SLOW.',
    class: 'verifiable', status: 'open', blockedBy: ['R-002'],
    verify: s("node -e 'const q=require(\"./data/queue.json\");const v=JSON.stringify(q.strategy&&q.strategy.verdict||\"\");if(/~?40 locations/.test(v)&&!/servable|min\\(/.test(v))throw new Error(\"the cohort ceiling is still stated as the number 40 rather than as a function of measured desk minutes\")'"),
  },
  {
    id: 'R-120', domain: 'finance-runway', severity: 'MAJOR', source: `${BONES}/validate-finance-runway.md:21`,
    claim: 'All three checkpoints expire before the cash risk the strategy was redesigned around actually arrives: the first invoice goes out inside M3 and the recurring charges land December, January and February — the measured trough.',
    evidence: 'CP-90 dueOn 2026-11-06. No CP-120 or CP-150; no killIf keys on churn, collection or renewal.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-017',
  },
  {
    id: 'R-121', domain: 'finance-runway', severity: 'MAJOR', source: `${BONES}/validate-finance-runway.md:24`,
    claim: 'CP-90 is labelled "the first dollar" but no verify command anywhere tests that a dollar arrived.',
    evidence: 'Q-042 asserts sentOn and amountUsd — issuance, not receipt. CP-90 killIf tests outcome === "signed", not paid.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-010',
  },
  {
    id: 'R-122', domain: 'finance-runway', severity: 'MODERATE', source: `${BONES}/validate-finance-runway.md:27`,
    claim: "The agent workforce is the plan's entire non-founder labor supply and the exception desk's COGS, and it has no cost line, no budget, and no item asking the founder what it costs.",
    evidence: '491 of 584 product commits authored by Claude; neither repo holds a subscription, invoice or API-spend record. /about/cost publishes ten cost rows and omits it.',
    class: 'verifiable', status: 'open', founderOnly: true,
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"about/cost/index.html\",\"utf8\");if(!/agent|model|token|workforce/i.test(t))throw new Error(\"the page whose whole purpose is publishing what things cost omits the agent workforce\")'"),
  },
  {
    id: 'R-123', domain: 'finance-runway', severity: 'MODERATE', source: `${BONES}/validate-finance-runway.md:30`,
    claim: 'The stated ceiling is two different numbers — 40 × $6,000 = $240K against a published $288K ARR ceiling, a 16.7% prepay discount never named as a discount — and neither reaches the ambition of record.',
    evidence: 'ADR-030:86 and :122; finance-model.md §0 states the $48,000/yr overstatement explicitly.',
    class: 'verifiable', status: 'open',
    alsoFoundBy: ['monetization'],
    verify: s("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"docs/editorial/decisions/ADR-030-one-price-one-cohort-no-billing-code.md\",\"utf8\");const has288=/288K|\\$288,000/.test(t);const has6000=/\\$6,000/.test(t);if(has288&&has6000&&!/discount/i.test(t))throw new Error(\"ADR-030 states a $288K ceiling alongside a $6,000 annual term (=$240K) and never names the 16.7% prepay discount\")'"),
  },

  // ── customer-growth ───────────────────────────────────────────────────────
  {
    id: 'R-124', domain: 'customer-growth', severity: 'BLOCKING', source: `${BONES}/validate-customer-growth.md:9`,
    claim: "There is no source of applicants, and the company's own warm network — three named DMV independents already in sourced-claims.json — is referenced zero times.",
    evidence: 'data/sourced-claims.json:634-637 names The Irish Inn at Glen Echo, Nobu DC and Kapnos Kouzina. queue.json references them 0 times.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-007',
    note: 'This record adds the one thing the other four sourcing findings missed: the warm list already exists in a fact-gated file. R-007\'s verify requires sourcedVia on every row, which is where those names go.',
  },
  {
    id: 'R-125', domain: 'customer-growth', severity: 'BLOCKING', source: `${BONES}/validate-customer-growth.md:12`,
    claim: "Q-042's day-90 proof point requires an invoice SENT, not a dollar RECEIVED, and nothing anywhere defines a payment, a churn event or a cancellation term.",
    evidence: 'churn and cancel appear 0 times in queue items. docs/tos.md:66-69 still governs a different product with a per-doc quota and an annual pro-rated refund.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-010',
    note: 'The churn-definition half is R-130.',
  },
  {
    id: 'R-126', domain: 'customer-growth', severity: 'BLOCKING', source: `${BONES}/validate-customer-growth.md:15`,
    claim: 'The signature and the first correct close cannot both land inside M3, and the customer pays through a 60-75 day void that ends in the measured January cash trough. Q-042\'s doneWhen does not require the close to belong to a signed location, so the loophole is open.',
    evidence: 'capacity.cuts moved the PRICE out of the Jan-Feb trough (Census MARTS medians Jan 0.913 / Feb 0.917) and left the first DELIVERABLE in it.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-014',
  },
  {
    id: 'R-127', domain: 'customer-growth', severity: 'MAJOR', source: `${BONES}/validate-customer-growth.md:18`,
    claim: 'deskMinutesPerClose decides the cohort ceiling in two of nine kill criteria and nothing writes it; Q-030\'s verify command does not exist on disk.',
    evidence: 'The string appears exactly twice in data/queue.json, both inside checkpoints.',
    class: 'duplicate', status: 'duplicate', duplicateOf: 'R-002',
  },
  {
    id: 'R-128', domain: 'customer-growth', severity: 'MAJOR', source: `${BONES}/validate-customer-growth.md:21`,
    claim: "The product's own confidence ladder stamps every close that uses the labor-saving mechanism as 'medium' or worse, and no item reconciles a permanently qualified statement with a $600 audit-shaped price.",
    evidence: 'apps/api/src/lib/inventory-reconcile.ts:294-312 — confidence is "high" only when estimatedCount === 0 and valuedShare === 1. ADR-009 sets estimated = valuationSource !== "invoice", so the mechanism that shrinks the count is the mechanism that downgrades the label.',
    class: 'decision', status: 'open',
    decidesWhat: 'Whether a statement the vendor\'s own machine labels qualified is sellable at $600, and how that is said at signature rather than discovered at renewal. CP-60 tests whether a CPA accepts the market prior; nothing tests whether the paying operator accepts the label.',
    routesTo: 'founder',
    note: 'Found by exactly one validator and unaddressed anywhere else in the corpus. The register\'s single highest-value non-duplicate decision.',
  },
  {
    id: 'R-129', domain: 'customer-growth', severity: 'MAJOR', source: `${BONES}/validate-customer-growth.md:24`,
    claim: 'There is no second month. No close slot, no count-due mechanic, no support promise, no restatement path — and PeriodSnapshot has no version or supersedes, so every signed close is provisional with no mechanism to say so.',
    evidence: 'apps/api/src/lib/inventory-period-store.ts:14-38. "restatement" appears 0 times in the queue. Credit memos structurally arrive after the close date.',
    class: 'verifiable', status: 'open', blockedByDecision: 'R-014',
    verify: p("node -e 'const fs=require(\"fs\");const t=fs.readFileSync(\"apps/api/src/lib/inventory-period-store.ts\",\"utf8\");const need=[\"supersedes\",\"version\",\"delivered_at\"];const miss=need.filter(n=>!t.includes(n));if(miss.length)throw new Error(\"PeriodSnapshot cannot express a restatement — missing: \"+miss.join(\", \"))'"),
  },
  {
    id: 'R-130', domain: 'customer-growth', severity: 'MODERATE', source: `${BONES}/validate-customer-growth.md:27`,
    claim: "The one retention mechanic already built, measured and honest — cost-watch-impact.ts, which computes the incremental dollar a caught price hike saved off the operator's own reviewed purchases — is dark. Its own header states 'The email never prints it.'",
    evidence: 'cost-watch and digest appear 0 times in data/queue.json (re-verified 2026-08-07). The engine is pure, materiality-floored at $25/week, fail-closed and forecast-free.',
    class: 'verifiable', status: 'open', blockedBy: ['R-029'],
    verify: p("node -e 'const{execSync}=require(\"child_process\");let out=\"\";try{out=execSync(\"grep -rl cost-watch-impact apps/web apps/api/src/routes 2>/dev/null\").toString().trim()}catch(e){}if(!out)throw new Error(\"the dollar the product already computes is rendered nowhere a customer sees\")'"),
    note: 'The answer to "what did I get for $600 in a quiet month" exists in the codebase, is fact-gated, and is shown to nobody.',
  },
  {
    id: 'R-131', domain: 'customer-growth', severity: 'MODERATE', source: `${BONES}/validate-customer-growth.md:30`,
    claim: "The company's only retention document describes the business that was killed — a return-VISITOR strategy for a traffic model ADR-032 released — and it survives the retirement classified `reference` rather than `archive`.",
    evidence: 'Re-verified 2026-08-07: docs/contracts/working-set.json classifies docs/handoff/retention-strategy.md as set "reference" with why "ARCHIVE PENDING (Q-071)" — itself citing the wrong queue ID (see R-104).',
    class: 'verifiable', status: 'open',
    verify: s("node -e 'const w=require(\"./docs/contracts/working-set.json\");const find=(o)=>{for(const [k,v] of Object.entries(o||{})){if(k.includes(\"retention-strategy\"))return v;if(v&&typeof v===\"object\"){const r=find(v);if(r)return r}}return null};const e=find(w);if(!e)throw new Error(\"retention-strategy.md not classified\");if(e.set!==\"archive\")throw new Error(\"retention-strategy.md is still set:\"+e.set+\" — a coherent answer for a company that no longer exists\")'"),
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function build(records = RECORDS) {
  const byClass = { verifiable: 0, decision: 0, opinion: 0 };
  const byStatus = {};
  const byDomain = {};
  const blocking = records.filter((r) => r.severity === 'BLOCKING');
  const blockingSplit = { verifiable: 0, decision: 0, opinion: 0, duplicate: 0 };

  for (const r of records) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byDomain[r.domain] = (byDomain[r.domain] || 0) + 1;
    if (r.class !== 'duplicate') byClass[r.class] = (byClass[r.class] || 0) + 1;
  }
  for (const r of blocking) {
    if (r.status === 'duplicate') blockingSplit.duplicate++;
    else blockingSplit[r.class]++;
  }

  const loop = records.filter(
    (r) => r.class === 'verifiable' && r.status !== 'duplicate' && r.status !== 'refuted',
  );

  return {
    _generatedBy: 'scripts/build-readiness-register.mjs',
    generatedAt: '2026-08-07',
    _what:
      'Every gap the 15 domain validators wrote, split three ways. Only class:verifiable ' +
      'enters the readiness loop; class:decision routes to the founder; class:opinion is ' +
      'discarded and NOT carried forward. This file RETIRES docs/handoff/bones/validate-*.md ' +
      'as a work source — those reports remain as cited evidence only.',
    _classes: {
      verifiable:
        'A command can prove it CLOSED. The command is in verify.cmd and exits 0 only when ' +
        'the gap is gone. founderOnly:true marks the ones a founder must supply input for — ' +
        'those are what rate-limit the loop, because agent throughput is free and founder ' +
        'capacity is 13-26 h/month.',
      decision:
        'No command can evaluate the closing artifact\'s CONTENT. Needs a founder call, a ' +
        'signature, counsel, or a customer. Routes OUT of the loop. An agent may draft, but ' +
        'the loop never counts it as closable work.',
      opinion:
        'A judgement with no falsifier and no decision behind it. Recorded with a discard ' +
        'reason so the discard is a decision rather than an omission, and not carried forward.',
    },
    source: {
      reports: [...new Set(records.map((r) => r.source.split(':')[0]))].sort(),
      reportCount: 15,
      verdicts: { NOT_READY: 13, READY_WITH_GAPS: 2 },
      // Distinct gap bullets in the reports, not record count: a gap whose
      // verifiable half and founder-decision half have different owners is
      // registered twice against the same source line.
      extractedGaps: new Set(records.map((r) => r.source)).size,
      blockingGaps: new Set(blocking.map((r) => r.source)).size,
      records: records.length,
      splitGaps:
        records.length - new Set(records.map((r) => r.source)).size,
    },
    summary: {
      byClass,
      byStatus,
      byDomain,
      blockingSplit,
      loopSize: loop.length,
      founderOnlyInLoop: loop.filter((r) => r.founderOnly).length,
      agentOnlyInLoop: loop.filter((r) => !r.founderOnly).length,
      duplicatesCollapsed: records.filter((r) => r.status === 'duplicate').length,
      decisionsRoutedOut: records.filter((r) => r.class === 'decision').length,
      opinionsDiscarded: records.filter((r) => r.class === 'opinion').length,
    },
    items: records,
  };
}

function selfTest() {
  const a = [];
  const t = (name, fn) => {
    try {
      fn();
      a.push(['ok', name]);
    } catch (e) {
      a.push(['FAIL', name + ' — ' + e.message]);
    }
  };
  const ids = new Set(RECORDS.map((r) => r.id));

  t('every record has the required fields', () => {
    for (const r of RECORDS)
      for (const k of ['id', 'domain', 'severity', 'source', 'claim', 'evidence', 'class', 'status'])
        if (!r[k]) throw new Error(r.id + ' missing ' + k);
  });
  t('ids are unique, well-formed, and cover the range with no holes', () => {
    if (ids.size !== RECORDS.length) throw new Error('duplicate ids');
    const nums = RECORDS.map((r) => {
      if (!/^R-\d{3}$/.test(r.id)) throw new Error('malformed id ' + r.id);
      return Number(r.id.slice(2));
    }).sort((x, y) => x - y);
    for (let i = 0; i < nums.length; i++)
      if (nums[i] !== i + 1) throw new Error('hole in the id range at R-' + String(i + 1).padStart(3, '0'));
  });
  t('class is one of exactly three values', () => {
    for (const r of RECORDS)
      if (!['verifiable', 'decision', 'opinion', 'duplicate'].includes(r.class))
        throw new Error(r.id + ' has class ' + r.class);
  });
  t('every non-duplicate verifiable record carries a runnable-looking command', () => {
    for (const r of RECORDS)
      if (r.class === 'verifiable' && r.status !== 'duplicate') {
        if (!r.verify || !r.verify.cmd) throw new Error(r.id + ' verifiable with no command');
        if (!['storefront', 'product'].includes(r.verify.cwd))
          throw new Error(r.id + ' bad cwd');
      }
  });
  t('no decision carries a verify command', () => {
    for (const r of RECORDS)
      if (r.class === 'decision' && r.verify)
        throw new Error(r.id + ' is a decision with a verify command — pick one');
  });
  t('every decision names what is decided and who decides', () => {
    for (const r of RECORDS)
      if (r.class === 'decision' && (!r.decidesWhat || !r.routesTo))
        throw new Error(r.id + ' decision without decidesWhat/routesTo');
  });
  t('every opinion is discarded with a stated reason', () => {
    for (const r of RECORDS)
      if (r.class === 'opinion' && (!r.discardReason || r.status !== 'discarded'))
        throw new Error(r.id + ' opinion not properly discarded');
  });
  t('every duplicate resolves to a non-duplicate canonical', () => {
    for (const r of RECORDS)
      if (r.status === 'duplicate') {
        if (!ids.has(r.duplicateOf)) throw new Error(r.id + ' points at unknown ' + r.duplicateOf);
        const c = RECORDS.find((x) => x.id === r.duplicateOf);
        if (c.status === 'duplicate') throw new Error(r.id + ' points at another duplicate');
      }
  });
  t('every blockedBy / blockedByDecision / unblocks id resolves', () => {
    for (const r of RECORDS)
      for (const k of ['blockedBy', 'unblocks'])
        for (const x of r[k] || []) if (!ids.has(x)) throw new Error(r.id + '.' + k + ' -> ' + x);
    for (const r of RECORDS)
      if (r.blockedByDecision && !ids.has(r.blockedByDecision))
        throw new Error(r.id + '.blockedByDecision -> ' + r.blockedByDecision);
  });
  t('blockedByDecision always points at a decision', () => {
    for (const r of RECORDS)
      if (r.blockedByDecision) {
        const d = RECORDS.find((x) => x.id === r.blockedByDecision);
        if (d.class !== 'decision')
          throw new Error(r.id + ' is blocked by ' + d.id + ' which is not a decision');
      }
  });
  t('the extracted counts match what the reports actually contain', () => {
    // The reports carry 131 gap bullets, 44 of them BLOCKING (counted by
    // `grep -c '^- \*\*\[BLOCKING\]'` over the 15 files, 2026-08-07). A gap may
    // be registered as more than one record when its verifiable half and its
    // founder-decision half have different owners, so records >= gaps and the
    // assertion is on DISTINCT source lines, never on record count.
    const b = build();
    if (b.source.extractedGaps !== 131)
      throw new Error('expected 131 distinct extracted gaps, got ' + b.source.extractedGaps);
    if (b.source.blockingGaps !== 44)
      throw new Error('expected 44 distinct BLOCKING gaps, got ' + b.source.blockingGaps);
  });
  t('a split record shares its source line with its sibling', () => {
    const bySource = {};
    for (const r of RECORDS) (bySource[r.source] ||= []).push(r);
    for (const [src, rs] of Object.entries(bySource))
      if (rs.length > 1) {
        const classes = new Set(rs.map((r) => (r.status === 'duplicate' ? 'duplicate' : r.class)));
        if (classes.size < 2)
          throw new Error(src + ' is registered ' + rs.length + ' times with no class difference');
      }
  });
  t('every cited report file exists on disk', () => {
    for (const f of new Set(RECORDS.map((r) => r.source.split(':')[0])))
      if (!fs.existsSync(path.join(REPO, f))) throw new Error('missing ' + f);
  });
  t('severity is never re-graded away from the validator vocabulary', () => {
    for (const r of RECORDS)
      if (!['BLOCKING', 'MAJOR', 'MODERATE', 'MINOR'].includes(r.severity))
        throw new Error(r.id + ' severity ' + r.severity);
  });

  for (const [s, n] of a) console.log((s === 'ok' ? '  ok  ' : '  FAIL ') + n);
  const failed = a.filter(([s]) => s === 'FAIL').length;
  console.log(`\nbuild-readiness-register --self-test: ${a.length - failed}/${a.length} assertions passed`);
  return failed === 0 ? 0 : 1;
}

const argv = process.argv.slice(2);
if (argv.includes('--self-test')) process.exit(selfTest());

const json = JSON.stringify(build(), null, 2) + '\n';
if (argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== json) {
    console.error('data/readiness-register.json is stale — run node scripts/build-readiness-register.mjs');
    process.exit(1);
  }
  console.log('readiness register: up to date');
  process.exit(0);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, json);
const b = build();
console.log(
  `readiness register: ${b.source.extractedGaps} gaps (${b.source.blockingGaps} BLOCKING) → ` +
    `${b.summary.byClass.verifiable} verifiable, ${b.summary.byClass.decision} decisions, ` +
    `${b.summary.byClass.opinion} opinions, ${b.summary.duplicatesCollapsed} duplicates collapsed`,
);
